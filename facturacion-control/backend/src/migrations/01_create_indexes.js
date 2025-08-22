// migrations/01_create_indexes.js
const mongoose = require('mongoose');
require('dotenv').config();

// Modelos que necesitan índices
const Patient = require('../src/models/Patient');
const ServiceRecord = require('../src/models/ServiceRecord');
const PreBill = require('../src/models/PreBill');

async function createIndexes() {
  console.log('Iniciando creación de índices...');

  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    // Crear índices para Pacientes
    console.log('Creando índices para Pacientes...');
    await Patient.collection.createIndex({ documentNumber: 1 }, { unique: true });
    await Patient.collection.createIndex({ documentType: 1 });
    await Patient.collection.createIndex({ fullName: 1 });
    await Patient.collection.createIndex({ regimen: 1 });
    await Patient.collection.createIndex({ municipality: 1 });
    await Patient.collection.createIndex({ active: 1 });

    // Crear índices para Registros de Servicios
    console.log('Creando índices para Servicios...');
    await ServiceRecord.collection.createIndex({ patientId: 1 });
    await ServiceRecord.collection.createIndex({ documentNumber: 1 });
    await ServiceRecord.collection.createIndex({ serviceDate: 1 });
    await ServiceRecord.collection.createIndex({ cupsCode: 1 });
    await ServiceRecord.collection.createIndex({ status: 1 });
    await ServiceRecord.collection.createIndex({ contractId: 1 });
    await ServiceRecord.collection.createIndex({ companyId: 1 });

    // Índices compuestos para búsquedas comunes
    await ServiceRecord.collection.createIndex({ 
      patientId: 1, serviceDate: 1, cupsCode: 1 
    });
    await ServiceRecord.collection.createIndex({ 
      companyId: 1, contractId: 1, serviceDate: 1 
    });

    // Crear índices para PreFacturas
    console.log('Creando índices para PreFacturas...');
    await PreBill.collection.createIndex({ patientId: 1 });
    await PreBill.collection.createIndex({ companyId: 1 });
    await PreBill.collection.createIndex({ contractId: 1 });
    await PreBill.collection.createIndex({ createdAt: 1 });
    await PreBill.collection.createIndex({ status: 1 });
    await PreBill.collection.createIndex({ 'services.serviceId': 1 });

    console.log('Índices creados correctamente');
  } catch (error) {
    console.error('Error creando índices:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

// Ejecutar la función
createIndexes();