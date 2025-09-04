#!/usr/bin/env node
/**
 * Script para configurar autenticación en MongoDB
 * Ejecutar como administrador de MongoDB
 */

const { MongoClient } = require('mongodb');

async function setupMongoAuth() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        console.log('Conectado a MongoDB');
        
        const adminDb = client.db('admin');
        const facturacionDb = client.db('facturacion');
        
        // Crear usuario administrador si no existe
        try {
            await adminDb.command({
                createUser: "admin",
                pwd: "ADMIN_PASSWORD_CHANGE_THIS",
                roles: [
                    { role: "root", db: "admin" }
                ]
            });
            console.log('✅ Usuario admin creado');
        } catch (error) {
            if (error.codeName === 'DuplicateKey') {
                console.log('ℹ️  Usuario admin ya existe');
            } else {
                console.error('❌ Error creando admin:', error.message);
            }
        }
        
        // Crear usuario específico para la aplicación
        try {
            await adminDb.command({
                createUser: "facturacion_user",
                pwd: "FACTURACION_PASSWORD_CHANGE_THIS",
                roles: [
                    { role: "readWrite", db: "facturacion" }
                ]
            });
            console.log('✅ Usuario facturacion_user creado');
        } catch (error) {
            if (error.codeName === 'DuplicateKey') {
                console.log('ℹ️  Usuario facturacion_user ya existe');
            } else {
                console.error('❌ Error creando usuario app:', error.message);
            }
        }
        
        // Crear índices de seguridad
        await facturacionDb.collection('users').createIndex(
            { username: 1 }, 
            { unique: true, background: true }
        );
        
        await facturacionDb.collection('users').createIndex(
            { email: 1 }, 
            { unique: true, background: true }
        );
        
        console.log('✅ Índices de seguridad creados');
        
        console.log(`
🔐 CONFIGURACIÓN MONGODB COMPLETADA

Pasos siguientes:
1. Cambiar las contraseñas por defecto
2. Habilitar autenticación en mongod.conf:
   security:
     authorization: enabled
3. Reiniciar MongoDB
4. Actualizar MONGODB_URI en .env.production

Ejemplo de URI:
mongodb://facturacion_user:TU_PASSWORD@localhost:27017/facturacion?authSource=admin
        `);
        
    } catch (error) {
        console.error('❌ Error en configuración:', error);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    setupMongoAuth();
}

module.exports = { setupMongoAuth };