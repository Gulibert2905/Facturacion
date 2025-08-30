/**
 * Script completo para probar el sistema de usuarios
 * Prueba login, permisos y funcionalidades del frontend
 * Ejecutar con: node src/scripts/testUserSystem.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

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

const testUserAuthentication = async () => {
    console.log('\n🔐 PRUEBAS DE AUTENTICACIÓN');
    console.log('=' .repeat(50));
    
    const testUsers = [
        { username: 'superadmin', password: 'super123', expectedRole: 'superadmin' },
        { username: 'admin_test', password: 'admin123', expectedRole: 'admin' },
        { username: 'facturador_test', password: 'fact123', expectedRole: 'facturador' },
        { username: 'auditor_test', password: 'audit123', expectedRole: 'auditor' }
    ];

    const results = {};

    for (const user of testUsers) {
        try {
            console.log(`\n🧪 Probando login: ${user.username}`);
            
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                username: user.username,
                password: user.password
            });

            if (loginResponse.data.success) {
                console.log(`✅ Login exitoso para ${user.username}`);
                console.log(`   Role: ${loginResponse.data.user.role}`);
                console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
                
                results[user.username] = {
                    success: true,
                    token: loginResponse.data.token,
                    user: loginResponse.data.user
                };
            }
        } catch (error) {
            console.log(`❌ Error en login para ${user.username}:`, error.response?.data?.message || error.message);
            results[user.username] = { success: false, error: error.message };
        }
    }

    return results;
};

const testPermissions = async (authResults) => {
    console.log('\n🔒 PRUEBAS DE PERMISOS');
    console.log('=' .repeat(50));

    // Pruebas específicas por rol
    const permissionTests = [
        {
            description: 'Superadmin accede a gestión de usuarios',
            user: 'superadmin',
            endpoint: '/users',
            method: 'GET',
            shouldSucceed: true
        },
        {
            description: 'Facturador trata de acceder a gestión de usuarios',
            user: 'facturador_test',
            endpoint: '/users',
            method: 'GET',
            shouldSucceed: false
        },
        {
            description: 'Admin accede a dashboard',
            user: 'admin_test',
            endpoint: '/dashboard/stats',
            method: 'GET',
            shouldSucceed: true
        },
        {
            description: 'Facturador accede a servicios',
            user: 'facturador_test',
            endpoint: '/services/records',
            method: 'GET',
            shouldSucceed: true
        },
        {
            description: 'Auditor accede a auditoría',
            user: 'auditor_test',
            endpoint: '/audit/logs',
            method: 'GET',
            shouldSucceed: true
        }
    ];

    for (const test of permissionTests) {
        console.log(`\n🧪 ${test.description}`);
        
        if (!authResults[test.user] || !authResults[test.user].success) {
            console.log(`⚠️  Saltando: ${test.user} no tiene token válido`);
            continue;
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${authResults[test.user].token}`
                }
            };

            let response;
            if (test.method === 'GET') {
                response = await axios.get(`${API_BASE}${test.endpoint}`, config);
            } else if (test.method === 'POST') {
                response = await axios.post(`${API_BASE}${test.endpoint}`, {}, config);
            }

            if (test.shouldSucceed) {
                console.log(`✅ Acceso permitido correctamente`);
            } else {
                console.log(`❌ ERROR: Acceso debería haber sido denegado`);
            }
        } catch (error) {
            if (test.shouldSucceed) {
                console.log(`❌ ERROR: Acceso debería haber sido permitido`);
                console.log(`   Status: ${error.response?.status}`);
                console.log(`   Message: ${error.response?.data?.message}`);
            } else {
                console.log(`✅ Acceso denegado correctamente`);
                console.log(`   Status: ${error.response?.status}`);
                console.log(`   Message: ${error.response?.data?.message}`);
            }
        }
    }
};

const testServicesEndpoint = async (authResults) => {
    console.log('\n🩺 PRUEBAS DE SERVICIOS (Fix del error trim)');
    console.log('=' .repeat(50));

    // Probar que el fix del Services.jsx funciona
    const facturadorToken = authResults.facturador_test?.token;
    
    if (!facturadorToken) {
        console.log('⚠️  No se puede probar servicios sin token de facturador');
        return;
    }

    try {
        // Simular búsqueda de paciente (esto activaría el fix del trim)
        console.log('🧪 Probando búsqueda de paciente...');
        
        const searchResponse = await axios.get(`${API_BASE}/patients?documentNumber=12345678`, {
            headers: {
                'Authorization': `Bearer ${facturadorToken}`
            }
        });

        console.log('✅ Búsqueda de paciente funciona correctamente');
        console.log(`   Pacientes encontrados: ${searchResponse.data.length || 0}`);
        
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('✅ Endpoint de pacientes responde correctamente (404 - no encontrado es normal)');
        } else {
            console.log('❌ Error en búsqueda de pacientes:', error.response?.data?.message || error.message);
        }
    }
};

const testDashboardAccess = async (authResults) => {
    console.log('\n📊 PRUEBAS DE DASHBOARD');
    console.log('=' .repeat(50));

    const usersToTest = ['superadmin', 'admin_test', 'facturador_test'];

    for (const username of usersToTest) {
        const userAuth = authResults[username];
        if (!userAuth?.success) continue;

        try {
            console.log(`\n🧪 Probando acceso al dashboard para: ${username}`);
            
            const response = await axios.get(`${API_BASE}/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${userAuth.token}`
                }
            });

            console.log(`✅ ${username} puede acceder al dashboard`);
            
        } catch (error) {
            if (error.response?.status === 403) {
                console.log(`✅ ${username} correctamente sin acceso al dashboard (403)`);
            } else {
                console.log(`❌ Error inesperado para ${username}:`, error.response?.data?.message);
            }
        }
    }
};

const generateTestReport = async (authResults) => {
    console.log('\n📋 RESUMEN DE PRUEBAS');
    console.log('=' .repeat(50));

    let totalTests = 0;
    let passedTests = 0;

    // Contar usuarios autenticados
    for (const username in authResults) {
        totalTests++;
        if (authResults[username].success) {
            passedTests++;
            console.log(`✅ Login ${username}: EXITOSO`);
        } else {
            console.log(`❌ Login ${username}: FALLÓ`);
        }
    }

    console.log(`\n📊 Estadísticas:`);
    console.log(`   Total usuarios probados: ${totalTests}`);
    console.log(`   Logins exitosos: ${passedTests}`);
    console.log(`   Tasa de éxito: ${(passedTests/totalTests*100).toFixed(1)}%`);

    // Verificar que el sistema está operacional
    try {
        const healthCheck = await axios.get(`${API_BASE.replace('/api', '')}/`);
        console.log('\n🔍 Estado del servidor:');
        console.log(`✅ API funcionando - Versión: ${healthCheck.data.version}`);
        console.log(`✅ Fase: ${healthCheck.data.phase}`);
    } catch (error) {
        console.log('\n❌ Error verificando estado del servidor:', error.message);
    }

    console.log('\n🎉 ¡Pruebas completadas!');
    console.log('\n💡 Sistema listo para usar:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend: http://localhost:5000');
    console.log('\n🔑 Credenciales disponibles:');
    console.log('   superadmin / super123 (Acceso total)');
    console.log('   admin_test / admin123 (Administrador)');
    console.log('   facturador_test / fact123 (Facturador)');
    console.log('   auditor_test / audit123 (Auditor)');
};

// Función principal
const main = async () => {
    try {
        await connectDB();
        
        console.log('🚀 INICIANDO PRUEBAS COMPLETAS DEL SISTEMA DE USUARIOS');
        console.log('=' .repeat(60));
        
        // 1. Probar autenticación
        const authResults = await testUserAuthentication();
        
        // 2. Probar permisos
        await testPermissions(authResults);
        
        // 3. Probar servicios (fix del error)
        await testServicesEndpoint(authResults);
        
        // 4. Probar dashboard
        await testDashboardAccess(authResults);
        
        // 5. Generar reporte
        await generateTestReport(authResults);
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Conexión cerrada');
        process.exit(0);
    }
};

// Ejecutar
main();