// src/scripts/migrateCompanyAssignments.js
const mongoose = require('mongoose');
const { User } = require('../models/User');
const Company = require('../models/Company');
require('dotenv').config();

const migrateCompanyAssignments = async () => {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener todas las empresas
        const companies = await Company.find({});
        console.log(`📋 Encontradas ${companies.length} empresas`);

        // Obtener todos los usuarios
        const users = await User.find({});
        console.log(`👥 Encontrados ${users.length} usuarios`);

        let migratedCount = 0;

        for (const user of users) {
            let needsUpdate = false;
            const updates = {};

            // Si el usuario no tiene los nuevos campos, configurarlos
            if (user.assignedCompanies === undefined) {
                // Superadmin puede ver todas las empresas
                if (user.role === 'superadmin') {
                    updates.canViewAllCompanies = true;
                    updates.assignedCompanies = [];
                } else {
                    // Para otros usuarios, asignar todas las empresas por defecto
                    // (se puede personalizar después)
                    updates.canViewAllCompanies = false;
                    updates.assignedCompanies = companies.map(c => c._id);
                }
                needsUpdate = true;
            }

            if (user.canViewAllCompanies === undefined) {
                if (user.role === 'superadmin') {
                    updates.canViewAllCompanies = true;
                } else {
                    updates.canViewAllCompanies = false;
                }
                needsUpdate = true;
            }

            if (needsUpdate) {
                await User.updateOne(
                    { _id: user._id },
                    { $set: updates }
                );
                migratedCount++;
                console.log(`✅ Usuario migrado: ${user.username} (${user.role})`);
                
                if (user.role === 'superadmin') {
                    console.log(`   - Configurado para ver todas las empresas`);
                } else {
                    console.log(`   - Asignadas ${updates.assignedCompanies.length} empresas`);
                }
            }
        }

        console.log(`\n🎉 Migración completada:`);
        console.log(`   - Usuarios migrados: ${migratedCount}`);
        console.log(`   - Usuarios sin cambios: ${users.length - migratedCount}`);

        // Mostrar resumen por rol
        const superAdmins = await User.countDocuments({ role: 'superadmin', canViewAllCompanies: true });
        const usersWithCompanies = await User.countDocuments({ 
            role: { $ne: 'superadmin' }, 
            canViewAllCompanies: false 
        });

        console.log(`\n📊 Resumen:`);
        console.log(`   - SuperAdmins con acceso total: ${superAdmins}`);
        console.log(`   - Usuarios con empresas asignadas: ${usersWithCompanies}`);

    } catch (error) {
        console.error('❌ Error en migración:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📴 Desconectado de MongoDB');
        process.exit(0);
    }
};

// Función para limpiar asignaciones (útil para testing)
const resetCompanyAssignments = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        const result = await User.updateMany(
            {},
            { 
                $unset: { 
                    assignedCompanies: "",
                    canViewAllCompanies: ""
                }
            }
        );

        console.log(`🔄 Limpiadas asignaciones de ${result.modifiedCount} usuarios`);
        
    } catch (error) {
        console.error('❌ Error limpiando asignaciones:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📴 Desconectado de MongoDB');
        process.exit(0);
    }
};

// Verificar argumentos de línea de comandos
const action = process.argv[2];

if (action === 'reset') {
    console.log('⚠️  ADVERTENCIA: Esto eliminará todas las asignaciones de empresa');
    resetCompanyAssignments();
} else {
    console.log('🚀 Iniciando migración de asignaciones de empresa...');
    migrateCompanyAssignments();
}