// src/scripts/seedData.js
const mongoose = require('mongoose');
const { Patient, Service, User, ServiceRecord } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Limpiar las colecciones existentes
        await Promise.all([
            Patient.deleteMany({}),
            Service.deleteMany({}),
            User.deleteMany({}),
            ServiceRecord.deleteMany({})
        ]);

        // Crear usuario administrador
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            username: 'admin',
            password: hashedPassword,
            fullName: 'Administrador Sistema',
            role: 'admin'
        });

        // Crear pacientes de prueba
        const patients = await Patient.create([
            {
                documentType: "CC",
                documentNumber: "123456789",
                fullName: "Juan Pérez",
                birthDate: "1990-01-15",
                municipality: "Bogotá",
                department: "Cundinamarca",
                regimen: "Contributivo"
            },
            {
                documentType: "CC",
                documentNumber: "987654321",
                fullName: "María López",
                birthDate: "1985-05-20",
                municipality: "Medellín",
                department: "Antioquia",
                regimen: "Subsidiado"
            }
        ]);

        // Crear servicios de prueba
        const services = await Service.create([
            {
                cupsCode: "890201",
                description: "Consulta de medicina general",
                rates: [{
                    value: 35000,
                    startDate: new Date(),
                }]
            },
            {
                cupsCode: "890301",
                description: "Consulta de medicina especializada",
                rates: [{
                    value: 70000,
                    startDate: new Date(),
                }]
            },
            {
                cupsCode: "881302",
                description: "Terapia física integral",
                rates: [{
                    value: 45000,
                    startDate: new Date(),
                }]
            },
            {
                cupsCode: "903841",
                description: "Hemograma IV",
                rates: [{
                    value: 25000,
                    startDate: new Date(),
                }]
            }
        ]);

        // Crear múltiples registros de servicios para María López
        const serviceRecords = await ServiceRecord.create([
            {
                patientId: patients[1]._id, // María López
                serviceDate: new Date('2025-01-15'),
                cupsCode: "890301",
                description: "Consulta de medicina especializada",
                value: 70000,
                status: "pendiente",
                createdBy: admin._id
            },
            {
                patientId: patients[1]._id, // María López
                serviceDate: new Date('2025-01-15'),
                cupsCode: "903841",
                description: "Hemograma IV",
                value: 25000,
                status: "pendiente",
                createdBy: admin._id
            },
            {
                patientId: patients[1]._id, // María López
                serviceDate: new Date('2025-01-14'),
                cupsCode: "881302",
                description: "Terapia física integral",
                value: 45000,
                status: "pendiente",
                createdBy: admin._id
            },
            {
                patientId: patients[1]._id, // María López
                serviceDate: new Date('2025-01-10'),
                cupsCode: "890201",
                description: "Consulta de medicina general",
                value: 35000,
                status: "pendiente",
                createdBy: admin._id
            },
            // Servicios para Juan Pérez
            {
                patientId: patients[0]._id, // Juan Pérez
                serviceDate: new Date('2025-01-15'),
                cupsCode: "890201",
                description: "Consulta de medicina general",
                value: 35000,
                status: "pendiente",
                createdBy: admin._id
            }
        ]);

        console.log('==== Datos de prueba creados exitosamente ====');
        console.log(`Usuarios creados: ${await User.countDocuments()}`);
        console.log(`Pacientes creados: ${await Patient.countDocuments()}`);
        console.log(`Servicios creados: ${await Service.countDocuments()}`);
        console.log(`Registros de servicios creados: ${await ServiceRecord.countDocuments()}`);
        console.log('\nCredenciales de administrador:');
        console.log('Usuario: admin');
        console.log('Contraseña: admin123');

    } catch (error) {
        console.error('Error al crear datos de prueba:', error);
    } finally {
        await mongoose.disconnect();
    }
};

seedData();