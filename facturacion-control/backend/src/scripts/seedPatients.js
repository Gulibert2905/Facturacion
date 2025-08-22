// scripts/seedPatients.js
const mongoose = require('mongoose');
const Patient = require('../models/Patient');

const seedPatients = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/facturacion');
    
    await Patient.deleteMany({});

    const patients = await Patient.create([
      {
        documentType: "CC",
        documentNumber: "123456789",
        firstName: "Juan",
        secondName: "Carlos",
        firstLastName: "Pérez",
        secondLastName: "Gómez",
        fullName: "Juan Carlos Pérez Gómez", // Agregado fullName
        birthDate: new Date("1990-01-15"),
        gender: "M",
        municipality: "Bogotá",
        department: "Cundinamarca",
        regimen: "Contributivo",
        eps: "NUEVA EPS",
        zone: "U"
      },
      {
        documentType: "CC",
        documentNumber: "987654321",
        firstName: "María",
        secondName: "Isabel",
        firstLastName: "López",
        secondLastName: "Rodríguez",
        fullName: "María Isabel López Rodríguez", // Agregado fullName
        birthDate: new Date("1985-05-20"),
        gender: "F",
        municipality: "Medellín",
        department: "Antioquia",
        regimen: "Subsidiado",
        eps: "SURA EPS",
        zone: "U"
      },
      {
        documentType: "CC",
        documentNumber: "456789123",
        firstName: "Ana",
        secondName: "Lucía",
        firstLastName: "García",
        secondLastName: "Martínez",
        fullName: "Ana Lucía García Martínez", // Agregado fullName
        birthDate: new Date("1995-08-10"),
        gender: "F",
        municipality: "Cali",
        department: "Valle",
        regimen: "Contributivo",
        eps: "SANITAS",
        zone: "U"
      },
      {
        documentType: "CC",
        documentNumber: "789123456",
        firstName: "Pedro",
        secondName: "Antonio",
        firstLastName: "Ramírez",
        secondLastName: "Vargas",
        fullName: "Pedro Antonio Ramírez Vargas", // Agregado fullName
        birthDate: new Date("1988-03-25"),
        gender: "M",
        municipality: "Barranquilla",
        department: "Atlántico",
        regimen: "Subsidiado",
        eps: "MUTUAL SER",
        zone: "U"
      },
      {
        documentType: "CC",
        documentNumber: "321654987",
        firstName: "Laura",
        secondName: "Valentina",
        firstLastName: "Torres",
        secondLastName: "Herrera",
        fullName: "Laura Valentina Torres Herrera", // Agregado fullName
        birthDate: new Date("1992-11-30"),
        gender: "F",
        municipality: "Cartagena",
        department: "Bolívar",
        regimen: "Contributivo",
        eps: "COOMEVA",
        zone: "U"
      }
    ]);

    console.log('==== Pacientes de prueba creados exitosamente ====');
    console.log(`Número de pacientes creados: ${patients.length}`);
    patients.forEach(patient => {
      console.log(`- ${patient.fullName} (${patient.documentNumber})`);
    });

  } catch (error) {
    console.error('Error al crear pacientes:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedPatients();