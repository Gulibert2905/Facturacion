const mongoose = require('mongoose');
const Company = require('../models/Company');
const Contract = require('../models/Contract');

const cleanAndSeed = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/facturacion');
    
    // Limpiar datos existentes
    console.log('Eliminando datos existentes...');
    await Company.deleteMany({});
    await Contract.deleteMany({});

    // Crear empresas
    console.log('Creando nuevas empresas...');
    const companies = await Company.create([
      {
        name: 'TRINITARIA IPS',
        nit: '901236862',
        code: 'TRIPS',
        status: 'active'
      },
      {
        name: 'CEMEDIC IPS',
        nit: '900222222',
        code: 'CIPS',
        status: 'active'
      },
      {
        name: 'UT CEMEDIC ESPECIALISTAS',
        nit: '900333333',
        code: 'UTCE',
        status: 'active'
      },
      {
        name: 'SAC AMBULANCIAS',
        nit: '900444444',
        code: 'SACA',
        status: 'active'
      },
      {
        name: 'LABORATORIO MARIA JOSE',
        nit: '901469144',
        code: 'LMJ',
        status: 'active'
      },
      {
        name: 'UT TRANSPORTE CEMEDIC',
        nit: '900666666',
        code: 'UTC',
        status: 'active'
      }
    ]);

    // Crear contratos
    console.log('Creando nuevos contratos...');
    await Contract.create([
      {
        name: 'EVENTO SUBSIDIADO 2024',
        company: companies[0]._id,
        type: 'MEDICINA',
        validFrom: new Date('2024-01-01'),
        status: 'active'
      },
      {
        name: 'CAPITA SUBSIDIADO 2024',
        company: companies[0]._id,
        type: 'MEDICINA',
        validFrom: new Date('2024-01-01'),
        status: 'active'
      },
      {
        name: 'EVENTO CONTRIBUTIVO 2024',
        company: companies[1]._id,
        type: 'MEDICINA',
        validFrom: new Date('2024-01-01'),
        status: 'active'
      },
      {
        name: 'CAPITA CONTRIBUTIVO 2024',
        company: companies[2]._id,
        type: 'ODONTOLOGIA',
        validFrom: new Date('2024-01-01'),
        status: 'active'
      },
      {
        name: 'LABORATORIO SUBSIDIADO',
        company: companies[4]._id,
        type: 'LABORATORIO',
        validFrom: new Date('2024-01-01'),
        status: 'active'
      },
      {
        name: 'TRANSPORTE SUBSIDIADO',
        company: companies[5]._id,
        type: 'MEDICINA',
        validFrom: new Date('2024-01-01'),
        status: 'active'
      }
    ]);

    console.log('Verificando datos creados...');
    const companyCount = await Company.countDocuments();
    const contractCount = await Contract.countDocuments();
    
    console.log(`Empresas creadas: ${companyCount}`);
    console.log(`Contratos creados: ${contractCount}`);
    
    console.log('Proceso completado exitosamente');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

cleanAndSeed();