/**
 * Script para migrar usuarios existentes al nuevo esquema
 * Ejecutar con: node src/scripts/migrateUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => {
        console.error('❌ Error conectando a MongoDB:', err);
        process.exit(1);
    });

// Definir el esquema antiguo
const oldUserSchema = new mongoose.Schema({
    username: String,
    password: String,
    fullName: String,
    role: String,
    active: Boolean
}, { timestamps: true });

const OldUser = mongoose.model('OldUser', oldUserSchema, 'users');

// Importar nuevo modelo
const { User } = require('../models/User');

const migrateUsers = async () => {
    try {
        console.log('🔄 Iniciando migración de usuarios...\n');

        // Obtener usuarios existentes
        const oldUsers = await OldUser.find({});
        console.log(`📊 Encontrados ${oldUsers.length} usuarios para migrar\n`);

        if (oldUsers.length === 0) {
            console.log('ℹ️  No hay usuarios para migrar. Creando usuario admin por defecto...');
            await createDefaultAdmin();
            return;
        }

        // Migrar cada usuario
        for (const oldUser of oldUsers) {
            try {
                // Verificar si ya existe en el nuevo esquema
                const existingUser = await User.findOne({ username: oldUser.username });
                if (existingUser) {
                    console.log(`⚠️  Usuario '${oldUser.username}' ya migrado, saltando...`);
                    continue;
                }

                // Mapear rol antiguo a nuevo
                const roleMapping = {
                    'admin': 'admin',
                    'user': 'facturador'
                };

                // Generar email por defecto si no existe
                const email = `${oldUser.username}@facturacion.local`;

                // Crear nuevo usuario
                const newUserData = {
                    username: oldUser.username.toLowerCase().trim(),
                    email: email,
                    password: oldUser.password, // Ya está hasheado
                    fullName: oldUser.fullName || oldUser.username,
                    role: roleMapping[oldUser.role] || 'facturador',
                    active: oldUser.active !== undefined ? oldUser.active : true,
                    createdAt: oldUser.createdAt || new Date(),
                    updatedAt: oldUser.updatedAt || new Date()
                };

                const newUser = new User(newUserData);
                await newUser.save();

                console.log(`✅ Migrado: ${oldUser.username} -> ${newUser.role}`);
            } catch (error) {
                console.error(`❌ Error migrando usuario '${oldUser.username}':`, error.message);
            }
        }

        // Crear usuario admin por defecto si no existe
        await createDefaultAdmin();

        console.log('\n🎉 Migración completada exitosamente!');
        
        // Mostrar resumen
        await showMigrationSummary();

    } catch (error) {
        console.error('❌ Error en la migración:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Conexión cerrada');
        process.exit(0);
    }
};

const createDefaultAdmin = async () => {
    try {
        // Verificar si ya existe un superadmin
        const existingSuperadmin = await User.findOne({ role: 'superadmin' });
        if (existingSuperadmin) {
            console.log('ℹ️  Ya existe un superadmin, saltando creación...');
            return;
        }

        // Crear contraseña hasheada
        const defaultPassword = 'admin123'; // ⚠️ CAMBIAR EN PRODUCCIÓN
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        const adminUser = new User({
            username: 'superadmin',
            email: 'admin@facturacion.local',
            password: hashedPassword,
            fullName: 'Super Administrador',
            role: 'superadmin',
            department: 'Sistemas',
            active: true
        });

        await adminUser.save();
        
        console.log('\n🔐 Usuario superadmin creado:');
        console.log(`   Username: superadmin`);
        console.log(`   Password: ${defaultPassword}`);
        console.log(`   ⚠️  IMPORTANTE: Cambiar la contraseña después del primer login!`);
        
    } catch (error) {
        console.error('❌ Error creando admin por defecto:', error.message);
    }
};

const showMigrationSummary = async () => {
    try {
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        console.log('\n📈 Resumen de usuarios por rol:');
        usersByRole.forEach(({ _id, count }) => {
            console.log(`   ${_id}: ${count} usuario(s)`);
        });

        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ active: true });
        const inactiveUsers = totalUsers - activeUsers;

        console.log('\n📊 Estadísticas generales:');
        console.log(`   Total usuarios: ${totalUsers}`);
        console.log(`   Activos: ${activeUsers}`);
        console.log(`   Inactivos: ${inactiveUsers}`);

    } catch (error) {
        console.error('❌ Error generando resumen:', error.message);
    }
};

// Ejecutar migración
console.log('🚀 Iniciando script de migración de usuarios...\n');
migrateUsers();