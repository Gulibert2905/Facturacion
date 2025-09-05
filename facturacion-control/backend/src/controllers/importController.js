// src/controllers/importController.js
const ExcelJS = require('exceljs');
const Patient = require('../models/Patient');
const ServiceRecord = require('../models/ServiceRecord');
const City = require('../models/City');

// Generador de plantillas
const generateTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla');

    if (type === 'patients') {
      worksheet.columns = [
        { header: 'tipoDocumento', key: 'tipoDocumento', width: 15 },
        { header: 'numeroDocumento', key: 'numeroDocumento', width: 15 },
        { header: 'primerNombre', key: 'primerNombre', width: 15 },
        { header: 'segundoNombre', key: 'segundoNombre', width: 15 },
        { header: 'primerApellido', key: 'primerApellido', width: 15 },
        { header: 'segundoApellido', key: 'segundoApellido', width: 15 },
        { header: 'fechaNacimiento', key: 'fechaNacimiento', width: 15 },
        { header: 'genero', key: 'genero', width: 15 },
        { header: 'regimen', key: 'regimen', width: 15 },
        { header: 'municipio', key: 'municipio', width: 15 },
        { header: 'ciudadNacimiento', key: 'ciudadNacimiento', width: 20 },
        { header: 'ciudadExpedicion', key: 'ciudadExpedicion', width: 20 }
      ];

      // Datos de ejemplo
      worksheet.addRow({
        tipoDocumento: 'CC',
        numeroDocumento: '1065831001',
        primerNombre: 'Juan',
        segundoNombre: 'Carlos',
        primerApellido: 'Pérez',
        segundoApellido: 'Gómez',
        fechaNacimiento: '1990-01-15',
        genero: "M",
        regimen: 'Contributivo',
        municipio: 'Valledupar',
        ciudadNacimiento: 'Valledupar',
        ciudadExpedicion: 'Valledupar'
      });
    }

    else if (type === 'services') {
      // Definir columnas para servicios
      worksheet.columns = [
        { header: 'numeroDocumento', key: 'numeroDocumento', width: 15 },
        { header: 'tipoDocumento', key: 'tipoDocumento', width: 15 },
        { header: 'primerNombre', key: 'primerNombre', width: 15 },
        { header: 'segundoNombre', key: 'segundoNombre', width: 15 },
        { header: 'primerApellido', key: 'primerApellido', width: 15 },
        { header: 'segundoApellido', key: 'segundoApellido', width: 15 },
        { header: 'fechaNacimiento', key: 'fechaNacimiento', width: 15 },
        { header: 'genero', key: 'genero', width: 10 },
        { header: 'ciudadNacimiento', key: 'ciudadNacimiento', width: 20 },
        { header: 'ciudadExpedicion', key: 'ciudadExpedicion', width: 20 },
        
        // Datos del servicio
        { header: 'fechaServicio', key: 'fechaServicio', width: 15 },
        { header: 'codigoCups', key: 'codigoCups', width: 15 },
        { header: 'descripcion', key: 'descripcion', width: 30 },
        { header: 'valor', key: 'valor', width: 12 }
      ];

      // Agregar datos de ejemplo
      const servicesData = [
        {
          numeroDocumento: '1065831001',
          tipoDocumento: 'CC',
          primerNombre: 'Juan',
          segundoNombre: 'Carlos',
          primerApellido: 'Pérez',
          segundoApellido: 'Gómez',
          fechaNacimiento: '1990-01-15',
          genero: 'M',
          ciudadNacimiento: 'Valledupar',
          ciudadExpedicion: 'Valledupar',
          fechaServicio: '2024-01-15',
          codigoCups: '890201',
          descripcion: 'Consulta medicina general',
          valor: 35000
        },
        {
          numeroDocumento: '1065598462',
          tipoDocumento: 'CC',
          primerNombre: 'Juan',
          segundoNombre: 'Caos',
          primerApellido: 'Pez',
          segundoApellido: 'Góez',
          fechaNacimiento: '1990-01-12',
          genero: 'M',
          ciudadNacimiento: 'Barranquilla',
          ciudadExpedicion: 'Barranquilla',
          fechaServicio: '2024-01-15',
          codigoCups: '890201',
          descripcion: 'Consulta medicina general',
          valor: 35000
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

    else if (type === 'cities') {
      worksheet.columns = [
        { header: 'nombre', key: 'nombre', width: 20 },
        { header: 'departamento', key: 'departamento', width: 20 },
        { header: 'codigo', key: 'codigo', width: 15 }
      ];

      // Datos de ejemplo
      const citiesData = [
        {
          nombre: 'Barranquilla',
          departamento: 'Atlántico',
          codigo: '08001'
        },
        {
          nombre: 'Medellín',
          departamento: 'Antioquia',
          codigo: '05001'
        },
        {
          nombre: 'Bogotá',
          departamento: 'Cundinamarca',
          codigo: '11001'
        }
      ];

      citiesData.forEach(city => {
        worksheet.addRow(city);
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
      numeroDocumento: { $in: data.map(p => p.numeroDocumento) }
    });

    // Crear un Set de documentos existentes para búsqueda rápida
    const existingDocumentNumbers = new Set(existingDocuments.map(p => p.numeroDocumento));

    // Filtrar datos nuevos vs duplicados
    const newData = [];
    data.forEach(patient => {
      if (existingDocumentNumbers.has(patient.numeroDocumento)) {
        results.duplicates.push({
          numeroDocumento: patient.numeroDocumento,
          name: `${patient.primerNombre} ${patient.primerApellido}`
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
        let valor = 0;
        if (service.valor) {
          if (typeof service.valor === 'string') {
            // Remover puntos y convertir a número
            const cleanValue = service.valor.replace(/\./g, '').replace(',', '.');
            valor = Number(cleanValue);
          } else {
            valor = Number(service.valor);
          }
          
          if (isNaN(valor)) {
            valor = 0;
          }
        }
        
        // Validar la fecha del servicio
        let fechaServicio;
        try {
          fechaServicio = new Date(service.fechaServicio);
          if (isNaN(fechaServicio.getTime())) {
            throw new Error('Fecha de servicio inválida');
          }
        } catch (dateError) {
          throw new Error(`Fecha de servicio inválida: ${service.fechaServicio}`);
        }

        // Buscar o crear paciente
        let patient = await Patient.findOne({ numeroDocumento: service.numeroDocumento });
        
        if (!patient && service.tipoDocumento) {
          // Crear nuevo paciente si no existe
          patient = await Patient.create({
            tipoDocumento: service.tipoDocumento,
            numeroDocumento: service.numeroDocumento,
            primerNombre: service.primerNombre || 'Paciente',
            segundoNombre: service.segundoNombre || '',
            primerApellido: service.primerApellido || 'Sin Apellido',
            segundoApellido: service.segundoApellido || '',
            fechaNacimiento: service.fechaNacimiento ? new Date(service.fechaNacimiento) : null,
            genero: service.genero || '',
            ciudadNacimiento: service.ciudadNacimiento || '',
            ciudadExpedicion: service.ciudadExpedicion || '',
            activo: true
          });
          
          results.patientsCreated.push({
            numeroDocumento: patient.numeroDocumento,
            name: patient.nombreCompleto
          });
        }

        if (!patient) {
          throw new Error(`No se encontró el paciente con documento ${service.numeroDocumento} y no se proporcionaron datos suficientes para crearlo`);
        }

        // Preparar datos del servicio - sin contractId ni company
        const serviceData = {
          pacienteId: patient._id,
          numeroDocumento: service.numeroDocumento,
          codigoCups: service.codigoCups,
          fechaServicio: fechaServicio,
          descripcion: service.descripcion || '',
          valor: valor,
          // Estos campos se asignarán durante la prefacturación
          company: null,
          contractId: null
        };

        // Verificar duplicado (mismo paciente, cups y fecha sin contrato asignado)
        const existingService = await ServiceRecord.findOne({
          pacienteId: patient._id,
          codigoCups: serviceData.codigoCups,
          fechaServicio: fechaServicio,
          contratoId: null
        });

        if (existingService) {
          results.duplicates.push({
            numeroDocumento: serviceData.numeroDocumento,
            codigoCups: serviceData.codigoCups,
            fechaServicio: serviceData.fechaServicio
          });
        } else {
          const newService = await ServiceRecord.create(serviceData);
          results.success.push({
            numeroDocumento: newService.numeroDocumento,
            codigoCups: newService.codigoCups,
            fechaServicio: newService.fechaServicio
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

// Importación de ciudades
const importCities = async (req, res) => {
  try {
    const { data } = req.body;
    const results = {
      success: [],
      duplicates: [],
      errors: []
    };

    for (const cityData of data) {
      try {
        // Validar datos requeridos
        if (!cityData.nombre || !cityData.departamento) {
          results.errors.push({
            data: cityData,
            error: 'Nombre y departamento son campos requeridos'
          });
          continue;
        }

        // Verificar si la ciudad ya existe
        const existingCity = await City.findOne({ 
          nombre: cityData.nombre.trim(),
          departamento: cityData.departamento.trim()
        });

        if (existingCity) {
          results.duplicates.push({
            nombre: cityData.nombre,
            departamento: cityData.departamento
          });
          continue;
        }

        // Crear nueva ciudad
        const newCity = await City.create({
          nombre: cityData.nombre.trim(),
          departamento: cityData.departamento.trim(),
          codigo: cityData.codigo ? cityData.codigo.trim() : undefined
        });

        results.success.push({
          nombre: newCity.nombre,
          departamento: newCity.departamento,
          codigo: newCity.codigo
        });

      } catch (error) {
        results.errors.push({
          data: cityData,
          error: error.message
        });
      }
    }

    const message = [];
    if (results.success.length > 0) {
      message.push(`${results.success.length} ciudades importadas exitosamente.`);
    }
    
    if (results.duplicates.length > 0) {
      message.push(`${results.duplicates.length} ciudades ya existían en el sistema.`);
    }
    
    if (results.errors.length > 0) {
      message.push(`${results.errors.length} ciudades tuvieron errores durante la importación.`);
    }

    res.json({ 
      message: message.join(' '),
      details: results
    });

  } catch (error) {
    console.error('Error en importación de ciudades:', error);
    res.status(400).json({ 
      message: 'Error en la importación de ciudades',
      error: error.message,
      details: error
    });
  }
};

module.exports = {
  generateTemplate,
  importPatients,
  importServices,
  importCities
};