// test-auth.js - Script para crear usuario de prueba y validar autenticación
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar modelo de usuario
const { User } = require('./src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/facturacion';

async function createTestUser() {
  try {
    // Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe el usuario de prueba
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('⚠️  Usuario admin ya existe, actualizando...');
      
      // Actualizar con nueva contraseña segura
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('Admin123!@#', salt);
      
      existingUser.password = hashedPassword;
      existingUser.email = 'admin@facturacion.test';
      existingUser.fullName = 'Administrador del Sistema';
      existingUser.role = 'superadmin';
      existingUser.active = true;
      existingUser.loginAttempts = 0;
      existingUser.lockedUntil = null;
      
      await existingUser.save();
      console.log('✅ Usuario admin actualizado');
    } else {
      // Crear nuevo usuario de prueba
      console.log('Creando usuario de prueba...');
      
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('Admin123!@#', salt);

      const testUser = new User({
        username: 'admin',
        email: 'admin@facturacion.test',
        password: hashedPassword,
        fullName: 'Administrador del Sistema',
        role: 'superadmin',
        active: true,
        department: 'Sistemas',
        phone: '+57 300 123 4567'
      });

      await testUser.save();
      console.log('✅ Usuario de prueba creado exitosamente');
    }

    // Crear usuario facturador también
    const facturadorExists = await User.findOne({ username: 'facturador1' });
    if (!facturadorExists) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('Factura123!@#', salt);

      const facturador = new User({
        username: 'facturador1',
        email: 'facturador@facturacion.test',
        password: hashedPassword,
        fullName: 'Usuario Facturador',
        role: 'facturador',
        active: true,
        department: 'Facturación',
        phone: '+57 300 987 6543'
      });

      await facturador.save();
      console.log('✅ Usuario facturador creado exitosamente');
    }

    console.log('\n📋 USUARIOS DE PRUEBA:');
    console.log('1. Administrador:');
    console.log('   Username: admin');
    console.log('   Password: Admin123!@#');
    console.log('   Email: admin@facturacion.test');
    console.log('   Role: superadmin');
    console.log('');
    console.log('2. Facturador:');
    console.log('   Username: facturador1');
    console.log('   Password: Factura123!@#');
    console.log('   Email: facturador@facturacion.test');
    console.log('   Role: facturador');
    console.log('');
    console.log('🔐 Estas contraseñas cumplen con la nueva política de seguridad:');
    console.log('   - Mínimo 12 caracteres');
    console.log('   - Contienen mayúsculas, minúsculas, números y caracteres especiales');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

async function testLogin() {
  console.log('\n🧪 PROBANDO LOGIN...');
  
  const testCredentials = [
    { username: 'admin', password: 'Admin123!@#' },
    { username: 'facturador1', password: 'Factura123!@#' },
    { username: 'admin', password: 'wrongpassword' } // Debe fallar
  ];

  for (const creds of testCredentials) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(creds)
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Login exitoso para ${creds.username}`);
        console.log(`   Token: ${data.token ? '✅ Generado' : '❌ No generado'}`);
        console.log(`   Usuario: ${data.user?.fullName || 'N/A'}`);
        console.log(`   Role: ${data.user?.role || 'N/A'}`);
      } else {
        console.log(`❌ Login falló para ${creds.username}: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ Error probando ${creds.username}: ${error.message}`);
    }
    console.log('');
  }
}

// Ejecutar script
async function run() {
  console.log('🚀 SCRIPT DE CONFIGURACIÓN Y PRUEBA DE AUTENTICACIÓN');
  console.log('================================================\n');
  
  await createTestUser();
  
  // Esperar un poco para que el servidor procese
  console.log('\n⏳ Esperando 2 segundos antes de probar login...');
  setTimeout(testLogin, 2000);
}

run().catch(console.error);