/**
 * Script para probar el sistema de permisos y búsqueda de pacientes
 * Ejecutar con: node src/scripts/testPermissions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const Patient = require('../models/Patient');

// Conectar a MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
};

// Función para crear usuarios de prueba si no existen
const createTestUsers = async () => {
    console.log('\n🔧 Creando usuarios de prueba...');
    
    const testUsers = [
        {
            username: 'admin_test',
            email: 'admin@test.com',
            password: 'admin123',
            fullName: 'Admin Test',
            role: 'admin',
            department: 'Sistemas'
        },
        {
            username: 'facturador_test',
            email: 'facturador@test.com',
            password: 'fact123',
            fullName: 'Facturador Test',
            role: 'facturador',
            department: 'Facturación'
        },
        {
            username: 'auditor_test',
            email: 'auditor@test.com',
            password: 'audit123',
            fullName: 'Auditor Test',
            role: 'auditor',
            department: 'Auditoría'
        }
    ];

    for (const userData of testUsers) {
        try {
            const existingUser = await User.findOne({ username: userData.username });
            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(userData.password, 12);
                const user = new User({
                    ...userData,
                    password: hashedPassword
                });
                await user.save();
                console.log(`✅ Usuario creado: ${userData.username} (${userData.role})`);
            } else {
                console.log(`ℹ️  Usuario ya existe: ${userData.username}`);
            }
        } catch (error) {
            console.error(`❌ Error creando usuario ${userData.username}:`, error.message);
        }
    }
};

// Función para crear pacientes de prueba si no existen
const createTestPatients = async () => {
    console.log('\n👥 Creando pacientes de prueba...');
    
    const testPatients = [
        {
            documentType: 'CC',
            documentNumber: '12345678',
            firstName: 'Juan',
            firstLastName: 'Pérez',
            secondName: 'Carlos',
            secondLastName: 'González',
            birthDate: new Date('1985-05-15'),
            gender: 'M',
            municipality: 'Bogotá',
            department: 'Cundinamarca',
            regimen: 'Subsidiado',
            eps: 'Salud Total'
        },
        {
            documentType: 'CC',
            documentNumber: '87654321',
            firstName: 'María',
            firstLastName: 'García',
            secondName: 'Elena',
            secondLastName: 'López',
            birthDate: new Date('1990-08-22'),
            gender: 'F',
            municipality: 'Medellín',
            department: 'Antioquia',
            regimen: 'Contributivo',
            eps: 'EPS Sanitas'
        },
        {
            documentType: 'TI',
            documentNumber: '1001234567',
            firstName: 'Ana',
            firstLastName: 'Martínez',
            birthDate: new Date('2010-12-03'),
            gender: 'F',
            municipality: 'Cali',
            department: 'Valle del Cauca',
            regimen: 'Subsidiado',
            eps: 'Nueva EPS'
        }
    ];

    for (const patientData of testPatients) {
        try {
            const existingPatient = await Patient.findOne({ documentNumber: patientData.documentNumber });
            if (!existingPatient) {
                const patient = new Patient(patientData);
                await patient.save();
                console.log(`✅ Paciente creado: ${patient.documentNumber} - ${patient.fullName}`);
            } else {
                console.log(`ℹ️  Paciente ya existe: ${patientData.documentNumber}`);
            }
        } catch (error) {
            console.error(`❌ Error creando paciente ${patientData.documentNumber}:`, error.message);
        }
    }
};

// Función para probar permisos de usuarios
const testUserPermissions = async () => {
    console.log('\n🔐 Probando sistema de permisos...');
    
    try {
        const users = await User.find({});
        
        for (const user of users) {
            console.log(`\n👤 Usuario: ${user.username} (${user.role})`);
            console.log(`📋 Permisos:`);
            
            const permissions = user.getPermissions();
            permissions.forEach(permission => {
                console.log(`   - ${permission.module}: [${permission.actions.join(', ')}]`);
            });
            
            // Probar algunos permisos específicos
            console.log(`🧪 Tests de permisos:`);
            console.log(`   - PATIENTS/READ: ${user.hasPermission('patients', 'read') ? '✅' : '❌'}`);
            console.log(`   - SERVICES/CREATE: ${user.hasPermission('services', 'create') ? '✅' : '❌'}`);
            console.log(`   - USERS/DELETE: ${user.hasPermission('users', 'delete') ? '✅' : '❌'}`);
            console.log(`   - AUDIT/UPDATE: ${user.hasPermission('audit', 'update') ? '✅' : '❌'}`);
        }
        
    } catch (error) {
        console.error('❌ Error probando permisos:', error.message);
    }
};

// Función para probar búsqueda de pacientes
const testPatientSearch = async () => {
    console.log('\n🔍 Probando búsqueda de pacientes...');
    
    try {
        const testDocuments = ['12345678', '87654321', '1001234567', '99999999'];
        
        for (const docNumber of testDocuments) {
            console.log(`\n🔍 Buscando documento: ${docNumber}`);
            
            // Simular diferentes tipos de entrada
            const searchVariations = [
                docNumber,              // Normal
                String(docNumber),      // Como string
                ` ${docNumber} `,       // Con espacios
                parseInt(docNumber) || docNumber, // Como número si es posible
            ];
            
            for (const searchValue of searchVariations) {
                try {
                    // Validar y limpiar igual que en el frontend
                    const cleanDocNumber = searchValue ? String(searchValue).trim() : '';
                    
                    if (!cleanDocNumber || cleanDocNumber === '') {
                        console.log(`   ⚠️  Entrada vacía o inválida: "${searchValue}"`);
                        continue;
                    }
                    
                    const patient = await Patient.findOne({ 
                        documentNumber: cleanDocNumber,
                        active: true 
                    });
                    
                    if (patient) {
                        console.log(`   ✅ Encontrado: ${patient.fullName} (${patient.documentType} ${patient.documentNumber})`);
                    } else {
                        console.log(`   ❌ No encontrado con: "${cleanDocNumber}"`);
                    }
                } catch (error) {
                    console.log(`   💥 Error con entrada "${searchValue}": ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error probando búsqueda:', error.message);
    }
};

// Función para verificar índices de base de datos
const checkDatabaseIndexes = async () => {
    console.log('\n📊 Verificando índices de base de datos...');
    
    try {
        const userIndexes = await User.collection.getIndexes();
        const patientIndexes = await Patient.collection.getIndexes();
        
        console.log('👤 Índices de Usuario:');
        Object.keys(userIndexes).forEach(index => {
            console.log(`   - ${index}: ${JSON.stringify(userIndexes[index])}`);
        });
        
        console.log('\n🏥 Índices de Paciente:');
        Object.keys(patientIndexes).forEach(index => {
            console.log(`   - ${index}: ${JSON.stringify(patientIndexes[index])}`);
        });
        
    } catch (error) {
        console.error('❌ Error verificando índices:', error.message);
    }
};

// Función principal
const runTests = async () => {
    try {
        console.log('🚀 Iniciando pruebas del sistema...\n');
        
        await connectDB();
        await createTestUsers();
        await createTestPatients();
        await testUserPermissions();
        await testPatientSearch();
        await checkDatabaseIndexes();
        
        console.log('\n✅ ¡Todas las pruebas completadas!');
        
        // Mostrar resumen
        const userCount = await User.countDocuments();
        const patientCount = await Patient.countDocuments();
        const activePatients = await Patient.countDocuments({ active: true });
        
        console.log('\n📈 Resumen:');
        console.log(`   👤 Usuarios: ${userCount}`);
        console.log(`   🏥 Pacientes: ${patientCount} (${activePatients} activos)`);
        console.log('\n💡 Próximos pasos:');
        console.log('   1. Ejecutar migración: node src/scripts/migrateUsers.js');
        console.log('   2. Iniciar servidor: npm run dev');
        console.log('   3. Probar endpoints con token JWT');
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Conexión cerrada');
        process.exit(0);
    }
};

// Ejecutar pruebas
runTests();