// scripts/seedPatientServices.js
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const ServiceRecord = require('../models/ServiceRecord');

const seedPatientServices = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/facturacion');
    
    // Limpiar servicios existentes
    await ServiceRecord.deleteMany({});

    // Obtener los pacientes existentes
    const patients = await Patient.find();

    // Crear servicios para cada paciente
    for (const patient of patients) {
      // Crear múltiples servicios por paciente con diferentes fechas
      await ServiceRecord.create([
        {
          patientId: patient._id,
          serviceDate: new Date('2024-01-15'),
          cupsCode: "890201",
          description: "Consulta de medicina general",
          value: 35000,
          status: "pendiente"
        },
        {
          patientId: patient._id,
          serviceDate: new Date('2024-01-15'),
          cupsCode: "903841",
          description: "Hemograma IV",
          value: 25000,
          status: "pendiente"
        },
        {
          patientId: patient._id,
          serviceDate: new Date('2024-01-14'),
          cupsCode: "881302",
          description: "Terapia física integral",
          value: 45000,
          status: "pendiente"
        },
        {
          patientId: patient._id,
          serviceDate: new Date('2024-01-10'),
          cupsCode: "890301",
          description: "Consulta de medicina especializada",
          value: 70000,
          status: "pendiente"
        }
      ]);
    }

    // Verificar servicios creados
    const totalServices = await ServiceRecord.countDocuments();
    const servicesPerPatient = await ServiceRecord.aggregate([
      {
        $group: {
          _id: "$patientId",
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('==== Servicios creados exitosamente ====');
    console.log(`Total de servicios creados: ${totalServices}`);
    console.log('Servicios por paciente:');
    
    for (const services of servicesPerPatient) {
      const patient = await Patient.findById(services._id);
      console.log(`- ${patient.fullName}: ${services.count} servicios`);
    }

  } catch (error) {
    console.error('Error al crear servicios:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedPatientServices();