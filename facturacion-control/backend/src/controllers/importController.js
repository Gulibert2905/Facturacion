// src/controllers/importController.js
const ExcelJS = require('exceljs');
const Patient = require('../models/Patient');
const ServiceRecord = require('../models/ServiceRecord');
const City = require('../models/City');
const Doctor = require('../models/Doctor');
const CIE11 = require('../models/CIE11');

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
      worksheet.addRows([
        {
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
        },
        {
          tipoDocumento: 'REGISTRO CIVIL',
          numeroDocumento: '1062819993',
          primerNombre: 'Ana',
          segundoNombre: 'María',
          primerApellido: 'López',
          segundoApellido: 'García',
          fechaNacimiento: '2015-03-20',
          genero: "Femenino",
          regimen: 'Subsidiado',
          municipio: 'Barranquilla',
          ciudadNacimiento: 'Barranquilla',
          ciudadExpedicion: 'Barranquilla'
        },
        {
          tipoDocumento: 'TI',
          numeroDocumento: '1098765432',
          primerNombre: 'Carlos',
          segundoNombre: '',
          primerApellido: 'Martínez',
          segundoApellido: 'Ruiz',
          fechaNacimiento: '2008-07-10',
          genero: "m",
          regimen: 'Contributivo cotizante',
          municipio: 'Medellín',
          ciudadNacimiento: 'Medellín',
          ciudadExpedicion: 'Medellín'
        },
        {
          tipoDocumento: 'Permiso de Protección Temporal',
          numeroDocumento: '2087654321',
          primerNombre: 'María',
          segundoNombre: 'José',
          primerApellido: 'González',
          segundoApellido: 'Pérez',
          fechaNacimiento: '1985-12-15',
          genero: "Femenino",
          regimen: 'Subsidiado',
          municipio: 'Cúcuta',
          ciudadNacimiento: 'Caracas',
          ciudadExpedicion: 'Cúcuta'
        },
        {
          tipoDocumento: 'Certificado de nacido vivo',
          numeroDocumento: '2024001234',
          primerNombre: 'Sofia',
          segundoNombre: '',
          primerApellido: 'Rodríguez',
          segundoApellido: 'López',
          fechaNacimiento: '2024-01-10',
          genero: "F",
          regimen: '',
          municipio: 'Bogotá',
          ciudadNacimiento: 'Bogotá',
          ciudadExpedicion: 'Bogotá'
        }
      ]);
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
        { header: 'descripcion', key: 'descripcion', width: 30 }
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
          descripcion: 'Consulta medicina general'
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
          descripcion: 'Consulta medicina general'
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

    else if (type === 'cie11') {
      worksheet.columns = [
        { header: 'code', key: 'code', width: 12 },
        { header: 'description', key: 'description', width: 50 },
        { header: 'chapter', key: 'chapter', width: 30 },
        { header: 'subcategory', key: 'subcategory', width: 25 },
        { header: 'billable', key: 'billable', width: 10 },
        { header: 'gender', key: 'gender', width: 10 },
        { header: 'minAge', key: 'minAge', width: 10 },
        { header: 'maxAge', key: 'maxAge', width: 10 },
        { header: 'notes', key: 'notes', width: 30 }
      ];

      // Datos de ejemplo con códigos CIE-11 reales
      const exampleData = [
        {
          code: '1A00',
          description: 'Cólera',
          chapter: 'Ciertas enfermedades infecciosas o parasitarias',
          subcategory: 'Infecciones intestinales',
          billable: true,
          gender: 'U',
          minAge: 0,
          maxAge: null,
          notes: 'Incluye todas las formas de cólera'
        },
        {
          code: '8A61.1',
          description: 'Diabetes mellitus tipo 1, sin complicaciones',
          chapter: 'Enfermedades endocrinas, nutricionales o metabólicas',
          subcategory: 'Diabetes mellitus',
          billable: true,
          gender: 'U',
          minAge: 0,
          maxAge: null,
          notes: 'Diabetes mellitus insulinodependiente'
        },
        {
          code: 'BA21',
          description: 'Hipertensión esencial',
          chapter: 'Enfermedades del sistema circulatorio',
          subcategory: 'Enfermedades hipertensivas',
          billable: true,
          gender: 'U',
          minAge: 18,
          maxAge: null,
          notes: 'Hipertensión primaria'
        }
      ];

      exampleData.forEach(item => {
        worksheet.addRow(item);
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

    else if (type === 'doctors') {
      worksheet.columns = [
        { header: 'tipoDocumento', key: 'tipoDocumento', width: 15 },
        { header: 'numeroDocumento', key: 'numeroDocumento', width: 15 },
        { header: 'primerNombre', key: 'primerNombre', width: 15 },
        { header: 'segundoNombre', key: 'segundoNombre', width: 15 },
        { header: 'primerApellido', key: 'primerApellido', width: 15 },
        { header: 'segundoApellido', key: 'segundoApellido', width: 15 },
        { header: 'tarjetaProfesional', key: 'tarjetaProfesional', width: 15 },
        { header: 'especialidad', key: 'especialidad', width: 20 },
        { header: 'codigoEspecialidad', key: 'codigoEspecialidad', width: 15 },
        { header: 'email', key: 'email', width: 25 },
        { header: 'telefono', key: 'telefono', width: 15 }
      ];

      // Datos de ejemplo
      worksheet.addRow({
        tipoDocumento: 'CC',
        numeroDocumento: '12345678',
        primerNombre: 'María',
        segundoNombre: 'Elena',
        primerApellido: 'González',
        segundoApellido: 'López',
        tarjetaProfesional: 'MED123456',
        especialidad: 'Medicina General',
        codigoEspecialidad: 'MG01',
        email: 'maria.gonzalez@example.com',
        telefono: '3001234567'
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

    // Detectar duplicados en el archivo mismo
    const seenInFile = new Set();
    const fileDuplicates = [];
    
    // Filtrar datos nuevos vs duplicados (tanto en DB como en el archivo)
    const newData = [];
    data.forEach(patient => {
      const docNumber = patient.numeroDocumento;
      
      if (existingDocumentNumbers.has(docNumber)) {
        results.duplicates.push({
          numeroDocumento: docNumber,
          name: `${patient.primerNombre} ${patient.primerApellido}`,
          reason: 'Ya existe en la base de datos'
        });
      } else if (seenInFile.has(docNumber)) {
        fileDuplicates.push({
          numeroDocumento: docNumber,
          name: `${patient.primerNombre} ${patient.primerApellido}`,
          reason: 'Duplicado en el archivo'
        });
      } else {
        seenInFile.add(docNumber);
        newData.push(patient);
      }
    });
    
    // Agregar duplicados del archivo a la lista de duplicados
    results.duplicates.push(...fileDuplicates);

    // Insertar solo los documentos nuevos
    if (newData.length > 0) {
      // Validar y filtrar datos antes de insertar
      const validData = newData.filter(patient => {
        // Mapear campos de frontend (en inglés) a backend (en español) si es necesario
        if (patient.documentNumber && !patient.numeroDocumento) {
          patient.numeroDocumento = patient.documentNumber;
        }
        if (patient.documentType && !patient.tipoDocumento) {
          patient.tipoDocumento = patient.documentType;
        }
        if (patient.firstName && !patient.primerNombre) {
          patient.primerNombre = patient.firstName;
        }
        if (patient.firstLastName && !patient.primerApellido) {
          patient.primerApellido = patient.firstLastName;
        }
        if (patient.secondName && !patient.segundoNombre) {
          patient.segundoNombre = patient.secondName;
        }
        if (patient.secondLastName && !patient.segundoApellido) {
          patient.segundoApellido = patient.secondLastName;
        }
        if (patient.birthDate && !patient.fechaNacimiento) {
          patient.fechaNacimiento = patient.birthDate;
        }
        if (patient.gender && !patient.genero) {
          patient.genero = patient.gender;
        }
        if (patient.municipality && !patient.municipio) {
          patient.municipio = patient.municipality;
        }

        // Verificar campos obligatorios
        if (!patient.numeroDocumento || 
            patient.numeroDocumento === null || 
            patient.numeroDocumento === '' ||
            !patient.primerNombre || 
            !patient.primerApellido) {
          results.errors.push({
            data: patient,
            error: 'Faltan campos obligatorios: numeroDocumento, primerNombre, primerApellido'
          });
          return false;
        }
        
        // Asegurar que numeroDocumento sea string y no esté vacío
        patient.numeroDocumento = patient.numeroDocumento.toString().trim();
        
        // Verificar que no sea una cadena vacía después de trim
        if (patient.numeroDocumento === '') {
          results.errors.push({
            data: patient,
            error: 'El número de documento no puede estar vacío'
          });
          return false;
        }
        
        // Normalizar tipo de documento
        if (patient.tipoDocumento) {
          const normalizedDocType = patient.tipoDocumento.toString().toUpperCase().trim();
          const docTypeMapping = {
            'CEDULA DE CIUDADANIA': 'CC',
            'CEDULA CIUDADANIA': 'CC',
            'CEDULA': 'CC',
            'TARJETA DE IDENTIDAD': 'TI',
            'TARJETA IDENTIDAD': 'TI',
            'CEDULA DE EXTRANJERIA': 'CE',
            'CEDULA EXTRANJERIA': 'CE',
            'REGISTRO CIVIL': 'RC',
            'PASAPORTE': 'PT',
            'PASAPORTE EXTRANJERO': 'PE',
            'PERMISO ESPECIAL': 'PA',
            'PERMISO DE PROTECCION TEMPORAL': 'PPT',
            'PERMISO DE PROTECCIÓN TEMPORAL': 'PPT',
            'PPT': 'PPT',
            'CERTIFICADO DE NACIDO VIVO': 'CNV',
            'CERTIFICADO NACIDO VIVO': 'CNV',
            'NACIDO VIVO': 'CNV',
            'SALVOCONDUCTO': 'SC'
          };
          patient.tipoDocumento = docTypeMapping[normalizedDocType] || normalizedDocType;
        }
        
        // Convertir fecha de nacimiento del formato DD/MM/YYYY al formato Date
        if (patient.fechaNacimiento && typeof patient.fechaNacimiento === 'string') {
          const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
          const match = patient.fechaNacimiento.match(dateRegex);
          if (match) {
            const [, day, month, year] = match;
            // Crear fecha en formato ISO (YYYY-MM-DD)
            const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            patient.fechaNacimiento = new Date(isoDate);
            
            // Verificar si la fecha es válida
            if (isNaN(patient.fechaNacimiento.getTime())) {
              results.errors.push({
                data: patient,
                error: `Fecha de nacimiento inválida: ${patient.fechaNacimiento}`
              });
              return false;
            }
          } else {
            // Si no coincide con el formato esperado, intentar parsear directamente
            const parsedDate = new Date(patient.fechaNacimiento);
            if (isNaN(parsedDate.getTime())) {
              // Si no es válida, establecer como null
              patient.fechaNacimiento = null;
            } else {
              patient.fechaNacimiento = parsedDate;
            }
          }
        }
        
        return true;
      });
      
      if (validData.length > 0) {
        console.log(`Iniciando importación de ${validData.length} pacientes válidos...`);
        
        // Pre-filtrar duplicados para optimizar la inserción
        const documentNumbers = validData.map(p => p.numeroDocumento);
        const existingPatients = await Patient.find(
          { numeroDocumento: { $in: documentNumbers } },
          'numeroDocumento primerNombre primerApellido'
        );
        
        const existingDocs = new Set(existingPatients.map(p => p.numeroDocumento));
        
        const newPatients = validData.filter(p => !existingDocs.has(p.numeroDocumento));
        const duplicatePatients = validData.filter(p => existingDocs.has(p.numeroDocumento));
        
        // Agregar duplicados al resultado
        results.duplicates = duplicatePatients.map(p => ({
          numeroDocumento: p.numeroDocumento,
          name: `${p.primerNombre} ${p.primerApellido}`,
          reason: 'Ya existe en la base de datos'
        }));
        
        console.log(`${newPatients.length} pacientes nuevos, ${duplicatePatients.length} duplicados encontrados`);
        
        // Insertar solo pacientes nuevos
        if (newPatients.length > 0) {
          try {
            const insertedDocs = await Patient.insertMany(newPatients, { ordered: false });
            results.success = insertedDocs.map(doc => ({
              numeroDocumento: doc.numeroDocumento,
              name: doc.nombreCompleto || `${doc.primerNombre} ${doc.primerApellido}`
            }));
            console.log(`✅ ${insertedDocs.length} pacientes insertados exitosamente`);
          } catch (error) {
            console.log(`❌ Error en inserción masiva, fallback a inserción individual`);
            
            // Fallback: inserción individual para casos edge
            for (const patient of newPatients) {
              try {
                const doc = new Patient(patient);
                const savedDoc = await doc.save();
                results.success.push({
                  numeroDocumento: savedDoc.numeroDocumento,
                  name: savedDoc.nombreCompleto || `${savedDoc.primerNombre} ${savedDoc.primerApellido}`
                });
              } catch (individualError) {
                if (individualError.code === 11000) {
                  results.duplicates.push({
                    numeroDocumento: patient.numeroDocumento,
                    name: `${patient.primerNombre} ${patient.primerApellido}`,
                    reason: 'Duplicado detectado durante inserción individual'
                  });
                } else {
                  results.errors.push({
                    data: patient,
                    error: individualError.message
                  });
                }
              }
            }
          }
        }
      }
    }

    // Preparar mensaje de respuesta
    const message = [];
    if (results.success.length > 0) {
      message.push(`${results.success.length} pacientes importados exitosamente.`);
    }
    if (results.duplicates.length > 0) {
      message.push(`${results.duplicates.length} pacientes no fueron importados por ser duplicados.`);
    }
    if (results.errors.length > 0) {
      message.push(`${results.errors.length} pacientes tuvieron errores de validación.`);
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
        // El valor se asignará automáticamente según el contrato y tarifa
        // No procesamos el valor desde el archivo de importación
        let valor = 0; // Valor por defecto, se actualizará al asignar contrato
        
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
          try {
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
            
            console.log(`✅ Paciente ${patient.numeroDocumento} creado automáticamente`);
            results.patientsCreated.push({
              numeroDocumento: patient.numeroDocumento,
              name: patient.nombreCompleto
            });
          } catch (patientError) {
            // Si no se puede crear el paciente, intentar buscarlo de nuevo por si fue creado en paralelo
            patient = await Patient.findOne({ numeroDocumento: service.numeroDocumento });
            if (!patient) {
              console.log(`❌ Error creando paciente ${service.numeroDocumento}:`, patientError.message);
              throw new Error(`No se pudo crear el paciente con documento ${service.numeroDocumento}: ${patientError.message}`);
            } else {
              console.log(`ℹ️ Paciente ${service.numeroDocumento} ya fue creado por otro proceso`);
            }
          }
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

// Importación de médicos
const importDoctors = async (req, res) => {
  try {
    const { data } = req.body;
    console.log(`[IMPORT] Iniciando importación de ${data.length} médicos`);

    const results = {
      success: [],
      duplicates: [],
      errors: []
    };

    for (const doctorData of data) {
      try {
        // Mapear campos del español al inglés que espera el modelo
        const mappedDoctor = {
          documentType: doctorData.tipoDocumento || doctorData.documentType,
          documentNumber: doctorData.numeroDocumento || doctorData.documentNumber,
          firstName: doctorData.primerNombre || doctorData.firstName,
          secondName: doctorData.segundoNombre || doctorData.secondName,
          firstLastName: doctorData.primerApellido || doctorData.firstLastName,
          secondLastName: doctorData.segundoApellido || doctorData.secondLastName,
          professionalCard: doctorData.tarjetaProfesional || doctorData.professionalCard,
          specialty: doctorData.especialidad || doctorData.specialty,
          specialtyCode: doctorData.codigoEspecialidad || doctorData.specialtyCode,
          email: doctorData.email,
          phone: doctorData.telefono || doctorData.phone
        };

        console.log(`[IMPORT] Procesando médico:`, {
          document: mappedDoctor.documentNumber,
          name: `${mappedDoctor.firstName} ${mappedDoctor.firstLastName}`,
          professionalCard: mappedDoctor.professionalCard
        });

        // Verificar si ya existe un médico con el mismo documento o tarjeta profesional
        const existingDoctor = await Doctor.findOne({
          $or: [
            { documentNumber: mappedDoctor.documentNumber },
            { professionalCard: mappedDoctor.professionalCard }
          ]
        });

        if (existingDoctor) {
          console.log(`[IMPORT] Médico duplicado encontrado: ${mappedDoctor.documentNumber}`);
          results.duplicates.push({
            data: doctorData,
            message: `Médico con documento ${mappedDoctor.documentNumber} o tarjeta profesional ${mappedDoctor.professionalCard} ya existe`
          });
          continue;
        }

        // Crear nuevo médico
        const newDoctor = await Doctor.create({
          documentType: mappedDoctor.documentType,
          documentNumber: mappedDoctor.documentNumber,
          firstName: mappedDoctor.firstName,
          secondName: mappedDoctor.secondName || null,
          firstLastName: mappedDoctor.firstLastName,
          secondLastName: mappedDoctor.secondLastName || null,
          professionalCard: mappedDoctor.professionalCard,
          specialty: mappedDoctor.specialty,
          specialtyCode: mappedDoctor.specialtyCode || null,
          email: mappedDoctor.email || null,
          phone: mappedDoctor.phone || null,
          empresa: req.user.empresa, // Asignar empresa del usuario que importa
          createdBy: req.user._id
        });

        console.log(`[IMPORT] Médico creado exitosamente:`, newDoctor._id);
        results.success.push({
          data: doctorData,
          id: newDoctor._id,
          documentNumber: newDoctor.documentNumber,
          firstName: newDoctor.firstName,
          firstLastName: newDoctor.firstLastName,
          professionalCard: newDoctor.professionalCard,
          specialty: newDoctor.specialty
        });

      } catch (error) {
        console.error(`[IMPORT] Error creando médico:`, error);
        results.errors.push({
          data: doctorData,
          error: error.message
        });
      }
    }

    const message = [];
    if (results.success.length > 0) {
      message.push(`${results.success.length} médicos importados exitosamente.`);
    }
    
    if (results.duplicates.length > 0) {
      message.push(`${results.duplicates.length} médicos ya existían en el sistema.`);
    }
    
    if (results.errors.length > 0) {
      message.push(`${results.errors.length} médicos tuvieron errores durante la importación.`);
    }

    res.json({ 
      message: message.join(' '),
      details: results
    });

  } catch (error) {
    console.error('Error importando médicos:', error);
    res.status(500).json({ message: error.message });
  }
};

// Importación de códigos CIE-11
const importCIE11 = async (req, res) => {
  try {
    const { data } = req.body;
    console.log(`[IMPORT] Iniciando importación de ${data.length} códigos CIE-11`);

    const results = {
      success: [],
      duplicates: [],
      errors: []
    };

    for (const cie11Data of data) {
      try {
        console.log(`[IMPORT] Procesando código CIE-11:`, {
          code: cie11Data.code,
          description: cie11Data.description?.substring(0, 50) + '...'
        });

        // Verificar si ya existe
        const existingCode = await CIE11.findOne({
          code: cie11Data.code?.toString().toUpperCase().trim()
        });

        if (existingCode) {
          console.log(`[IMPORT] Código CIE-11 duplicado: ${cie11Data.code}`);
          results.duplicates.push({
            data: cie11Data,
            message: `Código ${cie11Data.code} ya existe`
          });
          continue;
        }

        // Validar campos requeridos
        if (!cie11Data.code || !cie11Data.description || !cie11Data.chapter) {
          results.errors.push({
            data: cie11Data,
            error: 'Campos requeridos: code, description, chapter'
          });
          continue;
        }

        // Crear nuevo código CIE-11
        const newCIE11 = await CIE11.create({
          code: cie11Data.code.toString().toUpperCase().trim(),
          description: cie11Data.description.trim(),
          chapter: cie11Data.chapter.trim(),
          subcategory: cie11Data.subcategory?.trim() || null,
          billable: cie11Data.billable !== false, // default true
          gender: cie11Data.gender || 'U',
          minAge: parseInt(cie11Data.minAge) || 0,
          maxAge: cie11Data.maxAge ? parseInt(cie11Data.maxAge) : null,
          notes: cie11Data.notes?.trim() || null,
          createdBy: req.user._id
        });

        console.log(`[IMPORT] Código CIE-11 creado exitosamente:`, newCIE11._id);
        results.success.push({
          data: cie11Data,
          id: newCIE11._id,
          code: newCIE11.code,
          description: newCIE11.description,
          chapter: newCIE11.chapter
        });

      } catch (error) {
        console.error(`[IMPORT] Error creando código CIE-11:`, error);
        results.errors.push({
          data: cie11Data,
          error: error.message
        });
      }
    }

    const message = [];
    if (results.success.length > 0) {
      message.push(`${results.success.length} códigos CIE-11 importados exitosamente.`);
    }
    
    if (results.duplicates.length > 0) {
      message.push(`${results.duplicates.length} códigos ya existían en el sistema.`);
    }
    
    if (results.errors.length > 0) {
      message.push(`${results.errors.length} códigos tuvieron errores durante la importación.`);
    }

    res.json({ 
      message: message.join(' '),
      details: results
    });

  } catch (error) {
    console.error('Error importando códigos CIE-11:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateTemplate,
  importPatients,
  importServices,
  importCities,
  importDoctors,
  importCIE11
};