/**
 * Script para crear usuario superadmin
 * Ejecutar con: node src/scripts/createSuperAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');

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

const createSuperAdmin = async () => {
    try {
        console.log('🔧 Creando usuario superadmin...');
        
        // Verificar si ya existe un superadmin
        const existingSuperadmin = await User.findOne({ role: 'superadmin' });
        if (existingSuperadmin) {
            console.log('ℹ️  Ya existe un superadmin:', existingSuperadmin.username);
            console.log('🔐 Probando login...');
            
            // Probar login del superadmin existente
            console.log(`\nDatos del superadmin existente:
   Username: ${existingSuperadmin.username}
   Email: ${existingSuperadmin.email}
   Role: ${existingSuperadmin.role}
   Active: ${existingSuperadmin.active}`);
            
            return existingSuperadmin;
        }
        
        // Crear contraseña hasheada
        const defaultPassword = 'super123'; // Cambiar en producción
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        const superAdmin = new User({
            username: 'superadmin',
            email: 'superadmin@facturacion.com',
            password: hashedPassword,
            fullName: 'Super Administrador',
            role: 'superadmin',
            department: 'Sistemas',
            active: true
        });

        await superAdmin.save();
        
        console.log('✅ Usuario superadmin creado exitosamente!');
        console.log(`\n🔐 Credenciales:
   Username: superadmin
   Password: ${defaultPassword}
   Email: superadmin@facturacion.local
   Role: superadmin
   
⚠️  IMPORTANTE: Cambiar la contraseña después del primer login!`);
        
        return superAdmin;
        
    } catch (error) {
        console.error('❌ Error creando superadmin:', error.message);
        throw error;
    }
};

const testSuperAdminLogin = async () => {
    console.log('\n🧪 Probando login de superadmin...');
    
    try {
        const superAdmin = await User.findOne({ role: 'superadmin' });
        if (!superAdmin) {
            console.log('❌ No se encontró superadmin');
            return;
        }
        
        console.log('✅ Superadmin encontrado');
        console.log('🔐 Permisos del superadmin:');
        
        const permissions = superAdmin.getPermissions();
        permissions.forEach(permission => {
            console.log(`   - ${permission.module}: [${permission.actions.join(', ')}]`);
        });
        
        // Verificar permisos específicos
        console.log('\n🧪 Verificación de permisos:');
        console.log(`   - USERS/CREATE: ${superAdmin.hasPermission('users', 'create') ? '✅' : '❌'}`);
        console.log(`   - USERS/DELETE: ${superAdmin.hasPermission('users', 'delete') ? '✅' : '❌'}`);
        console.log(`   - AUDIT/UPDATE: ${superAdmin.hasPermission('audit', 'update') ? '✅' : '❌'}`);
        
    } catch (error) {
        console.error('❌ Error probando login:', error.message);
    }
};

// Función principal
const main = async () => {
    try {
        await connectDB();
        await createSuperAdmin();
        await testSuperAdminLogin();
        
        console.log('\n🎉 ¡Proceso completado exitosamente!');
        console.log('\n💡 Próximo paso: Probar login con curl:');
        console.log('curl -X POST http://localhost:5000/api/auth/login \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"username": "superadmin", "password": "super123"}\'');
        
    } catch (error) {
        console.error('❌ Error en el proceso:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Conexión cerrada');
        process.exit(0);
    }
};

// Ejecutar
main();