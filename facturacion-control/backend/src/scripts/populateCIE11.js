const mongoose = require('mongoose');
const CIE11 = require('../models/CIE11');
require('dotenv').config();

const sampleCIE11Codes = [
  {
    code: '1A00',
    description: 'Cólera',
    chapter: 'Ciertas enfermedades infecciosas o parasitarias',
    subcategory: 'Infecciones intestinales',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: '8A61.0',
    description: 'Diabetes mellitus tipo 1, sin complicaciones',
    chapter: 'Enfermedades endocrinas, nutricionales o metabólicas',
    subcategory: 'Diabetes mellitus',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: '8A61.1',
    description: 'Diabetes mellitus tipo 1 con complicaciones',
    chapter: 'Enfermedades endocrinas, nutricionales o metabólicas',
    subcategory: 'Diabetes mellitus',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: '5A11',
    description: 'Diabetes mellitus tipo 2',
    chapter: 'Enfermedades endocrinas, nutricionales o metabólicas',
    subcategory: 'Diabetes mellitus',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: 'BA00',
    description: 'Hipertensión esencial',
    chapter: 'Enfermedades del sistema circulatorio',
    subcategory: 'Enfermedades hipertensivas',
    billable: true,
    gender: 'U',
    minAge: 18,
    active: true
  },
  {
    code: 'BA01',
    description: 'Hipertensión secundaria',
    chapter: 'Enfermedades del sistema circulatorio',
    subcategory: 'Enfermedades hipertensivas',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: 'BB40.Z',
    description: 'Infarto agudo del miocardio, sin especificar',
    chapter: 'Enfermedades del sistema circulatorio',
    subcategory: 'Cardiopatía isquémica',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: '1F20',
    description: 'COVID-19, virus identificado',
    chapter: 'Ciertas enfermedades infecciosas o parasitarias',
    subcategory: 'Infecciones virales',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: '1F21',
    description: 'COVID-19, virus no identificado',
    chapter: 'Ciertas enfermedades infecciosas o parasitarias',
    subcategory: 'Infecciones virales',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: 'CA40.Z',
    description: 'Asma bronquial, sin especificar',
    chapter: 'Enfermedades del sistema respiratorio',
    subcategory: 'Enfermedades crónicas de las vías respiratorias inferiores',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: 'KB23',
    description: 'Gastritis crónica',
    chapter: 'Enfermedades del sistema digestivo',
    subcategory: 'Enfermedades del estómago',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: 'MG30.Z',
    description: 'Dorsalgia, sin especificar',
    chapter: 'Enfermedades del sistema musculoesquelético',
    subcategory: 'Dorsalgia',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: '6A70',
    description: 'Trastorno depresivo, episodio único',
    chapter: 'Trastornos mentales, del comportamiento y del neurodesarrollo',
    subcategory: 'Trastornos del estado de ánimo',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: '8B10',
    description: 'Anemia por deficiencia de hierro',
    chapter: 'Enfermedades de la sangre y de los órganos hematopoyéticos',
    subcategory: 'Anemias nutricionales',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: '9A02.Z',
    description: 'Cefalea tensional, sin especificar',
    chapter: 'Enfermedades del sistema nervioso',
    subcategory: 'Cefalea',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: '2A00',
    description: 'Neoplasia maligna del estómago',
    chapter: 'Neoplasias',
    subcategory: 'Neoplasias malignas del aparato digestivo',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: 'LD2B.Z',
    description: 'Dermatitis atópica, sin especificar',
    chapter: 'Enfermedades de la piel',
    subcategory: 'Dermatitis y eczema',
    billable: true,
    gender: 'U',
    active: true
  },
  {
    code: 'GB08.Z',
    description: 'Infección del tracto urinario, sin especificar',
    chapter: 'Enfermedades del sistema genitourinario',
    subcategory: 'Enfermedades del tracto urinario',
    billable: true,
    gender: 'U',
    active: true
  }
];

async function populateCIE11() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');

    console.log('Insertando códigos CIE-11...');
    
    for (const codeData of sampleCIE11Codes) {
      try {
        // Verificar si ya existe
        const existing = await CIE11.findOne({ code: codeData.code });
        
        if (!existing) {
          await CIE11.create(codeData);
          console.log(`✅ Insertado: ${codeData.code} - ${codeData.description}`);
        } else {
          console.log(`⚠️ Ya existe: ${codeData.code}`);
        }
      } catch (error) {
        console.error(`❌ Error insertando ${codeData.code}:`, error.message);
      }
    }

    console.log('🎉 Población de códigos CIE-11 completada');
    
    const count = await CIE11.countDocuments({ active: true });
    console.log(`📊 Total de códigos CIE-11 activos: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateCIE11();