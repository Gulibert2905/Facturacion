// src/controllers/importController.js
const ExcelJS = require('exceljs');
const Patient = require('../models/Patient');
const ServiceRecord = require('../models/ServiceRecord');

// Generador de plantillas
const generateTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla');

    if (type === 'patients') {
      worksheet.columns = [
        { header: 'documentType', key: 'documentType', width: 15 },
        { header: 'documentNumber', key: 'documentNumber', width: 15 },
        { header: 'firstName', key: 'firstName', width: 15 },
        { header: 'secondName', key: 'secondName', width: 15 },
        { header: 'firstLastName', key: 'firstLastName', width: 15 },
        { header: 'secondLastName', key: 'secondLastName', width: 15 },
        { header: 'birthDate', key: 'birthDate', width: 15 },
        { header: 'gender', key: 'gender', width: 15 },
        { header: 'regimen', key: 'regimen', width: 15 },
        { header: 'municipality', key: 'municipality', width: 15 }
      ];

      // Datos de ejemplo
      worksheet.addRow({
        documentType: 'CC',
        documentNumber: '1065831001',
        firstName: 'Juan',
        secondName: 'Carlos',
        firstLastName: 'Pérez',
        secondLastName: 'Gómez',
        birthDate: '1990-01-15',
        gender: "M",
        regimen: 'Contributivo',
        municipality: 'Valledupar'
      });
    }

    else if (type === 'services') {
      // Definir columnas para servicios
      worksheet.columns = [
        { header: 'documentNumber', key: 'documentNumber', width: 15 },
        { header: 'documentType', key: 'documentType', width: 15 },
        { header: 'firstName', key: 'firstName', width: 15 },
        { header: 'secondName', key: 'secondName', width: 15 },
        { header: 'firstLastName', key: 'firstLastName', width: 15 },
        { header: 'secondLastName', key: 'secondLastName', width: 15 },
        { header: 'birthDate', key: 'birthDate', width: 15 },
        { header: 'gender', key: 'gender', width: 10 },
        
        // Datos del servicio
        { header: 'serviceDate', key: 'serviceDate', width: 15 },
        { header: 'cupsCode', key: 'cupsCode', width: 15 },
        { header: 'description', key: 'description', width: 30 },
        { header: 'value', key: 'value', width: 12 }
      ];

      // Agregar datos de ejemplo
      const servicesData = [
        {
          documentNumber: '1065831001',
          documentType: 'CC',
          firstName: 'Juan',
          secondName: 'Carlos',
          firstLastName: 'Pérez',
          secondLastName: 'Gómez',
          birthDate: '1990-01-15',
          gender: 'M',
          serviceDate: '2024-01-15',
          cupsCode: '890201',
          description: 'Consulta medicina general',
          value: 35000
        },
        {
          documentNumber: '1065598462',
          documentType: 'CC',
          firstName: 'Juan',
          secondName: 'Caos',
          firstLastName: 'Pez',
          secondLastName: 'Góez',
          birthDate: '1990-01-12',
          gender: 'M',
          serviceDate: '2024-01-15',
          cupsCode: '890201',
          description: 'Consulta medicina general',
          value: 35000
        },

      ];

      // Agregar los datos de ejemplo
      servicesData.forEach(service => {
        worksheet.addRow(service);
      });

      // Estilo para encabezados
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Ajustar ancho de columnas
      worksheet.columns.forEach(column => {
        column.width = column.width || 15;
        column.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=plantilla_${type}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error generando plantilla:', error);
    res.status(500).json({ message: error.message });
  }
};

// Importación de pacientes
const importPatients = async (req, res) => {
  try {
    const { data } = req.body;
    const results = {
      success: [],
      duplicates: [],
      errors: []
    };

    // Verificar documentos existentes
    const existingDocuments = await Patient.find({
      documentNumber: { $in: data.map(p => p.documentNumber) }
    });

    // Crear un Set de documentos existentes para búsqueda rápida
    const existingDocumentNumbers = new Set(existingDocuments.map(p => p.documentNumber));

    // Filtrar datos nuevos vs duplicados
    const newData = [];
    data.forEach(patient => {
      if (existingDocumentNumbers.has(patient.documentNumber)) {
        results.duplicates.push({
          documentNumber: patient.documentNumber,
          name: `${patient.firstName} ${patient.firstLastName}`
        });
      } else {
        newData.push(patient);
      }
    });

    // Insertar solo los documentos nuevos
    if (newData.length > 0) {
      const insertedDocs = await Patient.insertMany(newData, { ordered: false });
      results.success = insertedDocs.map(doc => ({
        documentNumber: doc.documentNumber,
        name: doc.fullName
      }));
    }

    // Preparar mensaje de respuesta
    const message = [];
    if (results.success.length > 0) {
      message.push(`${results.success.length} pacientes importados exitosamente.`);
    }
    if (results.duplicates.length > 0) {
      message.push(`${results.duplicates.length} pacientes no fueron importados por ser duplicados.`);
    }

    res.json({ 
      message: message.join(' '),
      details: results
    });

  } catch (error) {
    console.error('Error en importación:', error);
    res.status(400).json({ 
      message: 'Error en la importación',
      error: error.message,
      details: error
    });
  }
};

// Importación de servicios
const importServices = async (req, res) => {
  try {
    const { data } = req.body;
    console.log('Datos recibidos para importación:', data.length, 'servicios');
    
    const results = {
      success: [],
      duplicates: [],
      errors: [],
      patientsCreated: []
    };

    for (const service of data) {
      try {
        // Limpiar y procesar el valor monetario si existe
        let value = 0;
        if (service.value) {
          if (typeof service.value === 'string') {
            // Remover puntos y convertir a número
            const cleanValue = service.value.replace(/\./g, '').replace(',', '.');
            value = Number(cleanValue);
          } else {
            value = Number(service.value);
          }
          
          if (isNaN(value)) {
            value = 0;
          }
        }
        
        // Validar la fecha del servicio
        let serviceDate;
        try {
          serviceDate = new Date(service.serviceDate);
          if (isNaN(serviceDate.getTime())) {
            throw new Error('Fecha de servicio inválida');
          }
        } catch (dateError) {
          throw new Error(`Fecha de servicio inválida: ${service.serviceDate}`);
        }

        // Buscar o crear paciente
        let patient = await Patient.findOne({ documentNumber: service.documentNumber });
        
        if (!patient && service.documentType) {
          // Crear nuevo paciente si no existe
          patient = await Patient.create({
            documentType: service.documentType,
            documentNumber: service.documentNumber,
            firstName: service.firstName || 'Paciente',
            secondName: service.secondName || '',
            firstLastName: service.firstLastName || 'Sin Apellido',
            secondLastName: service.secondLastName || '',
            birthDate: service.birthDate ? new Date(service.birthDate) : null,
            gender: service.gender || '',
            active: true
          });
          
          results.patientsCreated.push({
            documentNumber: patient.documentNumber,
            name: patient.fullName
          });
        }

        if (!patient) {
          throw new Error(`No se encontró el paciente con documento ${service.documentNumber} y no se proporcionaron datos suficientes para crearlo`);
        }

        // Preparar datos del servicio - sin contractId ni company
        const serviceData = {
          patientId: patient._id,
          documentNumber: service.documentNumber,
          cupsCode: service.cupsCode,
          serviceDate: serviceDate,
          description: service.description || '',
          value: value,
          // Estos campos se asignarán durante la prefacturación
          company: null,
          contractId: null
        };

        // Verificar duplicado (mismo paciente, cups y fecha sin contrato asignado)
        const existingService = await ServiceRecord.findOne({
          patientId: patient._id,
          cupsCode: serviceData.cupsCode,
          serviceDate: serviceDate,
          contractId: null
        });

        if (existingService) {
          results.duplicates.push({
            documentNumber: serviceData.documentNumber,
            cupsCode: serviceData.cupsCode,
            serviceDate: serviceData.serviceDate
          });
        } else {
          const newService = await ServiceRecord.create(serviceData);
          results.success.push({
            documentNumber: newService.documentNumber,
            cupsCode: newService.cupsCode,
            serviceDate: newService.serviceDate
          });
        }
      } catch (error) {
        console.error('Error procesando servicio:', error);
        results.errors.push({
          data: service,
          error: error.message
        });
      }
    }

    // Preparar mensaje de respuesta
    const message = [];
    if (results.success.length > 0) {
      message.push(`${results.success.length} servicios importados exitosamente.`);
    }
    if (results.patientsCreated.length > 0) {
      message.push(`${results.patientsCreated.length} pacientes creados automáticamente.`);
    }
    if (results.duplicates.length > 0) {
      message.push(`${results.duplicates.length} servicios no fueron importados por ser duplicados.`);
    }
    if (results.errors.length > 0) {
      message.push(`${results.errors.length} servicios tuvieron errores durante la importación.`);
    }

    res.json({ 
      message: message.join(' '),
      details: results
    });

  } catch (error) {
    console.error('Error en importación general:', error);
    res.status(400).json({ 
      message: 'Error en la importación',
      error: error.message,
      details: error
    });
  }
};

module.exports = {
  generateTemplate,
  importPatients,
  importServices
};