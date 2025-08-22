const moment = require('moment');
const xml2js = require('xml2js');

/**
 * Servicio para gestión de RIPS según la Resolución 2275 de 2023
 */
const rips2275Service = {
  /**
   * Obtiene la estructura de archivos RIPS según la Resolución 2275
   * @returns {Object} - Estructura de archivos RIPS
   */
  getStructure: () => {
    return {
      version: '2275 de 2023',
      description: 'Registros Individuales de Prestación de Servicios de Salud según Resolución 2275 de 2023',
      fileTypes: [
        { 
          code: 'AFCT', 
          name: 'Archivo de transacciones (nuevo formato)',
          required: true,
          description: 'Contiene los datos de la transacción entre la entidad y el prestador'
        },
        { 
          code: 'ATUS', 
          name: 'Archivo de usuarios (nuevo formato)',
          required: true,
          description: 'Contiene los datos de identificación del usuario atendido'
        },
        { 
          code: 'ACCT', 
          name: 'Archivo de consultas (nuevo formato)',
          required: false,
          description: 'Contiene los datos de las consultas realizadas'
        },
        { 
          code: 'APCT', 
          name: 'Archivo de procedimientos (nuevo formato)',
          required: false,
          description: 'Contiene los datos de procedimientos realizados'
        },
        { 
          code: 'AMCT', 
          name: 'Archivo de medicamentos (nuevo formato)',
          required: false,
          description: 'Contiene los datos de medicamentos suministrados'
        },
        { 
          code: 'AHCT', 
          name: 'Archivo de hospitalización (nuevo formato)',
          required: false,
          description: 'Contiene los datos de hospitalizaciones'
        },
        { 
          code: 'ANCT', 
          name: 'Archivo de recién nacidos (nuevo formato)',
          required: false,
          description: 'Contiene los datos de recién nacidos'
        },
        { 
          code: 'AUCT', 
          name: 'Archivo de urgencias (nuevo formato)',
          required: false,
          description: 'Contiene los datos de atenciones de urgencia'
        },
        { 
          code: 'ADCT', 
          name: 'Archivo de descripción (nuevo formato)',
          required: false,
          description: 'Contiene los datos de descripción agrupada de servicios'
        }
      ]
    };
  },

  /**
   * Obtiene el nombre de un tipo de archivo RIPS
   * @param {string} fileType - Código del tipo de archivo
   * @returns {string} - Nombre del tipo de archivo
   */
  getFileTypeName: (fileType) => {
    const fileTypes = {
      'AFCT': 'Archivo de transacciones (nuevo formato)',
      'ATUS': 'Archivo de usuarios (nuevo formato)',
      'ACCT': 'Archivo de consultas (nuevo formato)',
      'APCT': 'Archivo de procedimientos (nuevo formato)',
      'AMCT': 'Archivo de medicamentos (nuevo formato)',
      'AHCT': 'Archivo de hospitalización (nuevo formato)',
      'ANCT': 'Archivo de recién nacidos (nuevo formato)',
      'AUCT': 'Archivo de urgencias (nuevo formato)',
      'ADCT': 'Archivo de descripción (nuevo formato)'
    };
    
    return fileTypes[fileType] || fileType;
  },

  /**
   * Mapea datos de facturas al formato RIPS 2275
   * @param {Array} invoices - Facturas a procesar
   * @param {Object} entity - Entidad para la cual se generan los RIPS
   * @returns {Object} - Datos formateados para RIPS
   */
  mapDataToRipsFormat: async (invoices, entity) => {
    // Inicializar estructura de datos RIPS
    const ripsData = {
      AFCT: [], // Archivo de transacciones
      ATUS: [], // Archivo de usuarios
      ACCT: [], // Archivo de consultas
      APCT: [], // Archivo de procedimientos
      AMCT: [], // Archivo de medicamentos
      AHCT: [], // Archivo de hospitalización
      ANCT: [], // Archivo de recién nacidos
      AUCT: [], // Archivo de urgencias
      ADCT: []  // Archivo de descripción
    };
    
    // Obtener configuración del prestador
    const providerConfig = {
      code: process.env.PROVIDER_CODE || '12345678901234567',
      habilitationCode: process.env.HABILITATION_CODE || '123456789012'
    };
    
    // Para cada factura
    for (const invoice of invoices) {
      // Registro en archivo AFCT (transacciones) - uno por cada factura
      ripsData.AFCT.push({
        codigo_prestador: providerConfig.code,
        codigo_habilitacion: providerConfig.habilitationCode,
        fecha_remision: moment().format('YYYY-MM-DD'),
        codigo_entidad: entity.code,
        nombre_entidad: entity.name.substring(0, 60),
        numero_factura: invoice.number,
        prefijo_factura: invoice.prefix || '',
        numero_contrato: invoice.contractNumber || '',
        plan_beneficios: invoice.benefitsPlan || '01', // 01=Plan de Beneficios en Salud
        fecha_inicio: moment(invoice.startDate).format('YYYY-MM-DD'),
        fecha_final: moment(invoice.endDate).format('YYYY-MM-DD'),
        codigo_archivo: 'AFCT',
        total_registros: 1, // Se actualiza al final
        total_valor: invoice.totalValue || 0
      });
      
      // Procesar pacientes para archivo ATUS (usuarios)
      if (invoice.patients && invoice.patients.length > 0) {
        for (const patient of invoice.patients) {
          // Verificar si el paciente ya está incluido para evitar duplicados
          const patientExists = ripsData.ATUS.some(us => 
            us.tipo_documento === patient.documentType && 
            us.numero_documento === patient.documentNumber
          );
          
          if (!patientExists) {
            ripsData.ATUS.push({
              tipo_documento: patient.documentType,
              numero_documento: patient.documentNumber,
              codigo_entidad: entity.code,
              tipo_usuario: patient.userType || '01', // Actualizado a 2 dígitos
              primer_apellido: (patient.lastName || '').substring(0, 60),
              segundo_apellido: (patient.secondLastName || '').substring(0, 60),
              primer_nombre: (patient.firstName || '').substring(0, 60),
              segundo_nombre: (patient.secondName || '').substring(0, 60),
              fecha_nacimiento: moment(patient.birthDate).format('YYYY-MM-DD'),
              sexo: patient.gender || 'M',
              codigo_pais: patient.countryCode || '170', // 170=Colombia
              codigo_departamento: (patient.department || '').substring(0, 2),
              codigo_municipio: (patient.municipality || '').substring(0, 3),
              zona_residencia: patient.residenceZone || 'U', // U=Urbana, R=Rural
              tipo_regimen: patient.regimeType || '01', // Actualizado a 2 dígitos
              etnia: patient.ethnicity || '01', // 01=Ninguna
              grupo_poblacional: patient.populationGroup || '01', // 01=Ninguno
              telefono: (patient.phone || '').substring(0, 20),
              correo_electronico: (patient.email || '').substring(0, 100)
            });
          }
        }
      }
      
      // Procesar servicios por tipo
      if (invoice.services && invoice.services.length > 0) {
        for (const service of invoice.services) {
          // Según el tipo de servicio, mapear al archivo correspondiente
          switch (service.type) {
            case 'CONSULTATION':
              ripsData.ACCT.push(mapConsultationService2275(invoice, service));
              break;
            
            case 'PROCEDURE':
              ripsData.APCT.push(mapProcedureService2275(invoice, service));
              break;
            
            case 'MEDICATION':
              ripsData.AMCT.push(mapMedicationService2275(invoice, service));
              break;
            
            case 'EMERGENCY':
              ripsData.AUCT.push(mapEmergencyService2275(invoice, service));
              break;
            
            case 'HOSPITALIZATION':
              ripsData.AHCT.push(mapHospitalizationService2275(invoice, service));
              break;
            
            case 'NEWBORN':
              ripsData.ANCT.push(mapNewbornService2275(invoice, service));
              break;
            
            default:
              // Otros servicios se mapean a descripción
              ripsData.ADCT.push(mapDescriptionService2275(invoice, service));
          }
        }
      }
    }
    
    // Actualizar contadores de registros en AFCT
    if (ripsData.AFCT.length > 0) {
      const counters = {
        ATUS: ripsData.ATUS.length,
        ACCT: ripsData.ACCT.length,
        APCT: ripsData.APCT.length,
        AMCT: ripsData.AMCT.length,
        AUCT: ripsData.AUCT.length,
        AHCT: ripsData.AHCT.length,
        ANCT: ripsData.ANCT.length,
        ADCT: ripsData.ADCT.length
      };
      
      // Actualizar AFCT con contadores por tipo de archivo
      for (const fileType of Object.keys(counters)) {
        if (counters[fileType] > 0) {
          ripsData.AFCT.push({
            codigo_prestador: providerConfig.code,
            codigo_habilitacion: providerConfig.habilitationCode,
            fecha_remision: moment().format('YYYY-MM-DD'),
            codigo_entidad: entity.code,
            nombre_entidad: entity.name.substring(0, 60),
            numero_factura: 'RIPS', // Identificador especial para archivos de control
            prefijo_factura: '',
            numero_contrato: '',
            plan_beneficios: '01',
            fecha_inicio: moment().format('YYYY-MM-DD'),
            fecha_final: moment().format('YYYY-MM-DD'),
            codigo_archivo: fileType,
            total_registros: counters[fileType],
            total_valor: 0
          });
        }
      }
    }
    
    return ripsData;
  },

  /**
   * Genera el contenido de un archivo RIPS
   * @param {string} fileType - Tipo de archivo (AFCT, ATUS, etc.)
   * @param {Array} data - Datos para el archivo
   * @returns {string} - Contenido del archivo
   */
  generateRipsFile: (fileType, data) => {
    if (!data || data.length === 0) {
      return '';
    }
    
    // Obtener estructura de campos según tipo de archivo
    const fields = rips2275Service.getFileStructure(fileType);
    
    // Generar líneas del archivo
    const lines = data.map(record => {
      // Mapear y formatear cada campo según su tipo y longitud
      return fields.map(field => {
        const value = record[field.name] !== undefined ? record[field.name] : '';
        return formatFieldValue(value, field.type, field.length);
      }).join(',');
    });
    
    return lines.join('\n');
  },

  /**
   * Genera archivos RIPS en formato XML (solo para 2275)
   * @param {Object} ripsData - Datos RIPS para todos los archivos
   * @returns {string} - Contenido XML
   */
  generateXmlFiles: (ripsData) => {
    // Crear estructura XML según especificación de resolución 2275
    const xmlObj = {
      'RIPS': {
        '$': {
          'version': '2275-2023',
          'fechaGeneracion': moment().format('YYYY-MM-DDTHH:mm:ss')
        },
        'AFCT': { 'registro': ripsData.AFCT.map(mapRecordToXml) },
        'ATUS': { 'registro': ripsData.ATUS.map(mapRecordToXml) }
      }
    };
    
    // Agregar archivos opcionales solo si tienen datos
    if (ripsData.ACCT && ripsData.ACCT.length > 0) {
      xmlObj.RIPS.ACCT = { 'registro': ripsData.ACCT.map(mapRecordToXml) };
    }
    
    if (ripsData.APCT && ripsData.APCT.length > 0) {
      xmlObj.RIPS.APCT = { 'registro': ripsData.APCT.map(mapRecordToXml) };
    }
    
    if (ripsData.AMCT && ripsData.AMCT.length > 0) {
      xmlObj.RIPS.AMCT = { 'registro': ripsData.AMCT.map(mapRecordToXml) };
    }
    
    if (ripsData.AUCT && ripsData.AUCT.length > 0) {
      xmlObj.RIPS.AUCT = { 'registro': ripsData.AUCT.map(mapRecordToXml) };
    }
    
    if (ripsData.AHCT && ripsData.AHCT.length > 0) {
      xmlObj.RIPS.AHCT = { 'registro': ripsData.AHCT.map(mapRecordToXml) };
    }
    
    if (ripsData.ANCT && ripsData.ANCT.length > 0) {
      xmlObj.RIPS.ANCT = { 'registro': ripsData.ANCT.map(mapRecordToXml) };
    }
    
    if (ripsData.ADCT && ripsData.ADCT.length > 0) {
      xmlObj.RIPS.ADCT = { 'registro': ripsData.ADCT.map(mapRecordToXml) };
    }
    
    // Convertir objeto a XML
    const builder = new xml2js.Builder({
      rootName: 'RIPS',
      xmldec: { 'version': '1.0', 'encoding': 'UTF-8' }
    });
    
    return builder.buildObject(xmlObj);
  },

  /**
   * Obtiene la estructura de campos para un tipo de archivo
   * @param {string} fileType - Tipo de archivo (AFCT, ATUS, etc.)
   * @returns {Array} - Estructura de campos
   */
  getFileStructure: (fileType) => {
    // Definir estructura de cada tipo de archivo según la Resolución 2275
    const structures = {
      'AFCT': [
        { name: 'codigo_prestador', type: 'string', length: 16 },
        { name: 'codigo_habilitacion', type: 'string', length: 12 },
        { name: 'fecha_remision', type: 'date', length: 10 },
        { name: 'codigo_entidad', type: 'string', length: 8 },
        { name: 'nombre_entidad', type: 'string', length: 60 },
        { name: 'numero_factura', type: 'string', length: 30 },
        { name: 'prefijo_factura', type: 'string', length: 6 },
        { name: 'numero_contrato', type: 'string', length: 30 },
        { name: 'plan_beneficios', type: 'string', length: 2 },
        { name: 'fecha_inicio', type: 'date', length: 10 },
        { name: 'fecha_final', type: 'date', length: 10 },
        { name: 'codigo_archivo', type: 'string', length: 4 },
        { name: 'total_registros', type: 'number', length: 10 },
        { name: 'total_valor', type: 'number', length: 20 }
      ],
      'ATUS': [
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'codigo_entidad', type: 'string', length: 8 },
        { name: 'tipo_usuario', type: 'string', length: 2 },
        { name: 'primer_apellido', type: 'string', length: 60 },
        { name: 'segundo_apellido', type: 'string', length: 60 },
        { name: 'primer_nombre', type: 'string', length: 60 },
        { name: 'segundo_nombre', type: 'string', length: 60 },
        { name: 'fecha_nacimiento', type: 'date', length: 10 },
        { name: 'sexo', type: 'string', length: 1 },
        { name: 'codigo_pais', type: 'string', length: 3 },
        { name: 'codigo_departamento', type: 'string', length: 2 },
        { name: 'codigo_municipio', type: 'string', length: 3 },
        { name: 'zona_residencia', type: 'string', length: 1 },
        { name: 'tipo_regimen', type: 'string', length: 2 },
        { name: 'etnia', type: 'string', length: 2 },
        { name: 'grupo_poblacional', type: 'string', length: 2 },
        { name: 'telefono', type: 'string', length: 20 },
        { name: 'correo_electronico', type: 'string', length: 100 }
      ],
      'ACCT': [
        { name: 'numero_factura', type: 'string', length: 30 },
        { name: 'prefijo_factura', type: 'string', length: 6 },
        { name: 'codigo_prestador', type: 'string', length: 16 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'fecha_consulta', type: 'date', length: 10 },
        { name: 'hora_consulta', type: 'string', length: 5 },
        { name: 'numero_autorizacion', type: 'string', length: 30 },
        { name: 'codigo_consulta', type: 'string', length: 10 },
        { name: 'modalidad_atencion', type: 'string', length: 2 },
        { name: 'finalidad_consulta', type: 'string', length: 2 },
        { name: 'causa_externa', type: 'string', length: 2 },
        { name: 'codigo_diagnostico_principal', type: 'string', length: 6 },
        { name: 'codigo_diagnostico_relacionado1', type: 'string', length: 6 },
        { name: 'codigo_diagnostico_relacionado2', type: 'string', length: 6 },
        { name: 'codigo_diagnostico_relacionado3', type: 'string', length: 6 },
        { name: 'tipo_diagnostico_principal', type: 'string', length: 1 },
        { name: 'codigo_resultado_consulta', type: 'string', length: 2 },
        { name: 'valor_consulta', type: 'number', length: 15 },
        { name: 'valor_cuota_moderadora', type: 'number', length: 15 },
        { name: 'valor_neto', type: 'number', length: 15 }
      ],
      'APCT': [
        { name: 'numero_factura', type: 'string', length: 30 },
        { name: 'prefijo_factura', type: 'string', length: 6 },
        { name: 'codigo_prestador', type: 'string', length: 16 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'fecha_procedimiento', type: 'date', length: 10 },
        { name: 'hora_procedimiento', type: 'string', length: 5 },
        { name: 'numero_autorizacion', type: 'string', length: 30 },
        { name: 'codigo_procedimiento', type: 'string', length: 10 },
        { name: 'modalidad_atencion', type: 'string', length: 2 },
        { name: 'ambito_realizacion', type: 'string', length: 2 },
        { name: 'finalidad_procedimiento', type: 'string', length: 2 },
        { name: 'personal_atiende', type: 'string', length: 2 },
        { name: 'diagnostico_principal', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado', type: 'string', length: 6 },
        { name: 'complicacion', type: 'string', length: 6 },
        { name: 'forma_realizacion', type: 'string', length: 2 },
        { name: 'valor_procedimiento', type: 'number', length: 15 },
        { name: 'valor_cuota_moderadora', type: 'number', length: 15 },
        { name: 'valor_neto', type: 'number', length: 15 }
      ],
      'AMCT': [
        { name: 'numero_factura', type: 'string', length: 30 },
        { name: 'prefijo_factura', type: 'string', length: 6 },
        { name: 'codigo_prestador', type: 'string', length: 16 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'numero_autorizacion', type: 'string', length: 30 },
        { name: 'fecha_dispensacion', type: 'date', length: 10 },
        { name: 'codigo_medicamento', type: 'string', length: 20 },
        { name: 'codigo_diagnostico', type: 'string', length: 6 },
        { name: 'tipo_medicamento', type: 'string', length: 2 },
        { name: 'nombre_generico', type: 'string', length: 60 },
        { name: 'forma_farmaceutica', type: 'string', length: 20 },
        { name: 'concentracion', type: 'string', length: 20 },
        { name: 'unidad_medida', type: 'string', length: 20 },
        { name: 'numero_unidades', type: 'number', length: 5 },
        { name: 'valor_unitario', type: 'number', length: 15 },
        { name: 'valor_total', type: 'number', length: 15 }
      ],
      'AHCT': [
        { name: 'numero_factura', type: 'string', length: 30 },
        { name: 'prefijo_factura', type: 'string', length: 6 },
        { name: 'codigo_prestador', type: 'string', length: 16 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'numero_autorizacion', type: 'string', length: 30 },
        { name: 'fecha_ingreso', type: 'date', length: 10 },
        { name: 'hora_ingreso', type: 'string', length: 5 },
        { name: 'via_ingreso', type: 'string', length: 2 },
        { name: 'diagnostico_principal_ingreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado1_ingreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado2_ingreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado3_ingreso', type: 'string', length: 6 },
        { name: 'fecha_egreso', type: 'date', length: 10 },
        { name: 'hora_egreso', type: 'string', length: 5 },
        { name: 'diagnostico_principal_egreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado1_egreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado2_egreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado3_egreso', type: 'string', length: 6 },
        { name: 'diagnostico_complicacion', type: 'string', length: 6 },
        { name: 'estado_salida', type: 'string', length: 1 },
        { name: 'causa_muerte', type: 'string', length: 6 },
        { name: 'destino_usuario', type: 'string', length: 2 },
        { name: 'valor_estancia', type: 'number', length: 15 }
      ],
      'AUCT': [
        { name: 'numero_factura', type: 'string', length: 30 },
        { name: 'prefijo_factura', type: 'string', length: 6 },
        { name: 'codigo_prestador', type: 'string', length: 16 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'fecha_ingreso', type: 'date', length: 10 },
        { name: 'hora_ingreso', type: 'string', length: 5 },
        { name: 'numero_autorizacion', type: 'string', length: 30 },
        { name: 'causa_externa', type: 'string', length: 2 },
        { name: 'diagnostico_principal_ingreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado1_ingreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado2_ingreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado3_ingreso', type: 'string', length: 6 },
        { name: 'fecha_salida', type: 'date', length: 10 },
        { name: 'hora_salida', type: 'string', length: 5 },
        { name: 'diagnostico_principal_egreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado1_egreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado2_egreso', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado3_egreso', type: 'string', length: 6 },
        { name: 'destino_usuario', type: 'string', length: 2 },
        { name: 'estado_salida', type: 'string', length: 1 },
        { name: 'causa_muerte', type: 'string', length: 6 },
        { name: 'observacion', type: 'string', length: 1 },
        { name: 'valor_consulta', type: 'number', length: 15 },
        { name: 'valor_observacion', type: 'number', length: 15 },
        { name: 'valor_total', type: 'number', length: 15 }
      ],
      'ANCT': [
        { name: 'numero_factura', type: 'string', length: 30 },
        { name: 'prefijo_factura', type: 'string', length: 6 },
        { name: 'codigo_prestador', type: 'string', length: 16 },
        { name: 'tipo_documento_madre', type: 'string', length: 2 },
        { name: 'numero_documento_madre', type: 'string', length: 20 },
        { name: 'fecha_nacimiento', type: 'date', length: 10 },
        { name: 'hora_nacimiento', type: 'string', length: 5 },
        { name: 'edad_gestacional', type: 'number', length: 2 },
        { name: 'control_prenatal', type: 'string', length: 1 },
        { name: 'sexo', type: 'string', length: 1 },
        { name: 'peso', type: 'number', length: 4 },
        { name: 'diagnostico_principal', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado1', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado2', type: 'string', length: 6 },
        { name: 'diagnostico_relacionado3', type: 'string', length: 6 },
        { name: 'condicion_salida', type: 'string', length: 1 },
        { name: 'causa_muerte', type: 'string', length: 6 }
      ],
      'ADCT': [
        { name: 'numero_factura', type: 'string', length: 30 },
        { name: 'prefijo_factura', type: 'string', length: 6 },
        { name: 'codigo_prestador', type: 'string', length: 16 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'fecha_servicio', type: 'date', length: 10 },
        { name: 'numero_autorizacion', type: 'string', length: 30 },
        { name: 'codigo_servicio', type: 'string', length: 20 },
        { name: 'nombre_servicio', type: 'string', length: 60 },
        { name: 'cantidad', type: 'number', length: 5 },
        { name: 'valor_unitario', type: 'number', length: 15 },
        { name: 'valor_total', type: 'number', length: 15 }
      ]
    };
    
    return structures[fileType] || [];
  },

  /**
   * Valida datos RIPS según las reglas de la resolución 2275
   * @param {Object} data - Datos a validar
   * @returns {Object} - Resultados de la validación
   */
  validateData: async (data) => {
    const errors = [];
    const warnings = [];
    
    // Validar archivos obligatorios
    if (!data.AFCT || data.AFCT.length === 0) {
      errors.push('El archivo AFCT (transacciones) es obligatorio y no contiene datos');
    }
    
    if (!data.ATUS || data.ATUS.length === 0) {
      errors.push('El archivo ATUS (usuarios) es obligatorio y no contiene datos');
    }
    
    // Validar consistencia entre archivos
    if (data.AFCT && data.AFCT.length > 0 && data.ATUS && data.ATUS.length > 0) {
      // Verificar que todos los usuarios referenciados en otros archivos existan en ATUS
      const usuariosATUS = new Set(data.ATUS.map(u => `${u.tipo_documento}|${u.numero_documento}`));
      
      // Validar usuarios en ACCT
      if (data.ACCT && data.ACCT.length > 0) {
        for (const consulta of data.ACCT) {
          const userKey = `${consulta.tipo_documento}|${consulta.numero_documento}`;
          if (!usuariosATUS.has(userKey)) {
            errors.push(`Usuario ${userKey} referenciado en ACCT no existe en ATUS`);
          }
        }
      }
      
      // Validar usuarios en APCT
      if (data.APCT && data.APCT.length > 0) {
        for (const procedimiento of data.APCT) {
          const userKey = `${procedimiento.tipo_documento}|${procedimiento.numero_documento}`;
          if (!usuariosATUS.has(userKey)) {
            errors.push(`Usuario ${userKey} referenciado en APCT no existe en ATUS`);
          }
        }
      }
      
      // Validaciones similares para otros archivos
      // ...
    }
    
    // Validaciones específicas por tipo de archivo
    
    // Validar AFCT
    if (data.AFCT && data.AFCT.length > 0) {
      for (const [index, transaccion] of data.AFCT.entries()) {
        // Validar campos obligatorios
        if (!transaccion.codigo_prestador) {
          errors.push(`AFCT[${index}]: El campo codigo_prestador es obligatorio`);
        } else if (transaccion.codigo_prestador.length !== 16) {
          errors.push(`AFCT[${index}]: El campo codigo_prestador debe tener 16 caracteres`);
        }
        
        if (!transaccion.codigo_habilitacion) {
          errors.push(`AFCT[${index}]: El campo codigo_habilitacion es obligatorio`);
        }
        
        // Validar fechas
        if (!transaccion.fecha_remision) {
          errors.push(`AFCT[${index}]: El campo fecha_remision es obligatorio`);
        } else if (!moment(transaccion.fecha_remision, 'YYYY-MM-DD', true).isValid()) {
          errors.push(`AFCT[${index}]: El campo fecha_remision tiene un formato inválido`);
        }
        
        // Más validaciones específicas...
      }
    }
    
    // Validar ATUS
    if (data.ATUS && data.ATUS.length > 0) {
      for (const [index, usuario] of data.ATUS.entries()) {
        // Validar tipo de documento
        if (!usuario.tipo_documento) {
          errors.push(`ATUS[${index}]: El campo tipo_documento es obligatorio`);
        } else if (!['CC', 'TI', 'RC', 'CE', 'PA', 'MS', 'AS', 'CD', 'SC', 'PE'].includes(usuario.tipo_documento)) {
          errors.push(`ATUS[${index}]: El tipo de documento ${usuario.tipo_documento} no es válido`);
        }
        
        // Validar número de documento
        if (!usuario.numero_documento) {
          errors.push(`ATUS[${index}]: El campo numero_documento es obligatorio`);
        }
        
        // Validar fecha de nacimiento
        if (!usuario.fecha_nacimiento) {
          errors.push(`ATUS[${index}]: El campo fecha_nacimiento es obligatorio`);
        } else if (!moment(usuario.fecha_nacimiento, 'YYYY-MM-DD', true).isValid()) {
          errors.push(`ATUS[${index}]: El campo fecha_nacimiento tiene un formato inválido`);
        }
        
        // Más validaciones específicas...
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Convierte datos de formato 3374 a formato 2275
   * @param {Object} data3374 - Datos en formato 3374
   * @returns {Object} - Datos transformados a formato 2275
   */
  convertFromOldFormat: (data3374) => {
    // Implementar conversión entre formatos
    // Esta es una implementación inicial básica
    const result = {
      AFCT: [], ATUS: [], ACCT: [], APCT: [], AMCT: [], AUCT: [], AHCT: [], ANCT: [], ADCT: []
    };

    // Mapear AF a AFCT
    if (data3374.AF && data3374.AF.length) {
      result.AFCT = data3374.AF.map(record => ({
        codigo_prestador: record.codigo_prestador + '0000', // Extender a 16 caracteres
        codigo_habilitacion: record.codigo_prestador, // En el formato viejo no existía, se usa el mismo
        fecha_remision: record.fecha_remision,
        codigo_entidad: record.codigo_entidad.padEnd(8, '0'), // Extender a 8 caracteres
        nombre_entidad: record.nombre_entidad,
        numero_factura: record.numero_factura,
        prefijo_factura: '', // Campo nuevo
        numero_contrato: '', // Campo nuevo obligatorio (requiere datos adicionales)
        plan_beneficios: '01', // Valor por defecto, debe ajustarse
        fecha_inicio: record.fecha_inicio,
        fecha_final: record.fecha_final,
        codigo_archivo: record.codigo_archivo === 'AF' ? 'AFCT' : record.codigo_archivo,
        total_registros: record.total_registros,
        total_valor: 0 // Campo nuevo obligatorio
      }));
    }

    // Mapear US a ATUS
    if (data3374.US && data3374.US.length) {
      result.ATUS = data3374.US.map(record => ({
        tipo_documento: record.tipo_documento,
        numero_documento: record.numero_documento,
        codigo_entidad: record.codigo_entidad.padEnd(8, '0'),
        tipo_usuario: (record.tipo_usuario || '1').padStart(2, '0'), // Convertir a 2 dígitos
        primer_apellido: record.primer_apellido || '',
        segundo_apellido: record.segundo_apellido || '',
        primer_nombre: record.primer_nombre || '',
        segundo_nombre: record.segundo_nombre || '',
        fecha_nacimiento: record.fecha_nacimiento,
        sexo: record.sexo,
        codigo_pais: record.codigo_pais || '170',
        codigo_departamento: record.codigo_departamento || '',
        codigo_municipio: record.codigo_municipio || '',
        zona_residencia: record.zona_residencia || 'U',
        tipo_regimen: (record.tipo_regimen || '1').padStart(2, '0'), // Convertir a 2 dígitos
        etnia: '01', // Campo nuevo
        grupo_poblacional: '01', // Campo nuevo
        telefono: '', // Campo nuevo
        correo_electronico: '' // Campo nuevo
      }));
    }

    // Mapear AC a ACCT
    if (data3374.AC && data3374.AC.length) {
      result.ACCT = data3374.AC.map(record => ({
        numero_factura: record.numero_factura,
        prefijo_factura: '', // Campo nuevo
        codigo_prestador: record.codigo_prestador + '0000', // Extender a 16 caracteres
        tipo_documento: record.tipo_documento,
        numero_documento: record.numero_documento,
        fecha_consulta: record.fecha_consulta,
        hora_consulta: record.hora_consulta || '00:00',
        numero_autorizacion: record.numero_autorizacion || '',
        codigo_consulta: record.codigo_consulta,
        modalidad_atencion: '01', // Campo nuevo
        finalidad_consulta: (record.finalidad_consulta || '1').padStart(2, '0'), // Convertir a 2 dígitos
        causa_externa: (record.causa_externa || '1').padStart(2, '0'), // Convertir a 2 dígitos
        codigo_diagnostico_principal: (record.codigo_diagnostico_principal || '').padEnd(6, '0'),
        codigo_diagnostico_relacionado1: (record.codigo_diagnostico_relacionado1 || '').padEnd(6, '0'),
        codigo_diagnostico_relacionado2: (record.codigo_diagnostico_relacionado2 || '').padEnd(6, '0'),
        codigo_diagnostico_relacionado3: (record.codigo_diagnostico_relacionado3 || '').padEnd(6, '0'),
        tipo_diagnostico_principal: record.tipo_diagnostico_principal || '1',
        codigo_resultado_consulta: '01', // Campo nuevo
        valor_consulta: record.valor_consulta || 0,
        valor_cuota_moderadora: record.valor_cuota_moderadora || 0,
        valor_neto: (record.valor_consulta || 0) - (record.valor_cuota_moderadora || 0)
      }));
    }

    // Mapeos similares para otros tipos de archivos
    // Implementar según necesidades específicas

    return result;
  }
};

// Funciones auxiliares para mapeo de datos

/**
 * Mapea un servicio de consulta al formato RIPS 2275
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo ACCT
 */
function mapConsultationService2275(invoice, service) {
  return {
    numero_factura: invoice.number,
    prefijo_factura: invoice.prefix || '',
    codigo_prestador: process.env.PROVIDER_CODE || '12345678901234567',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    fecha_consulta: moment(service.date).format('YYYY-MM-DD'),
    hora_consulta: moment(service.time || service.date).format('HH:mm'),
    numero_autorizacion: service.authorizationNumber || '',
    codigo_consulta: service.code,
    modalidad_atencion: service.attentionMode || '01', // 01=Presencial
    finalidad_consulta: service.purpose || '10', // 10=Otra
    causa_externa: service.externalCause || '13', // 13=Otra
    codigo_diagnostico_principal: (service.mainDiagnosis || '').padEnd(6, '0'), // Ampliar a 6 dígitos
    codigo_diagnostico_relacionado1: (service.relatedDiagnosis1 || '').padEnd(6, '0'),
    codigo_diagnostico_relacionado2: (service.relatedDiagnosis2 || '').padEnd(6, '0'),
    codigo_diagnostico_relacionado3: (service.relatedDiagnosis3 || '').padEnd(6, '0'),
    tipo_diagnostico_principal: service.diagnosisType || '1', // 1=Impresión diagnóstica
    codigo_resultado_consulta: service.resultCode || '01', // 01=Sin cambios
    valor_consulta: service.value || 0,
    valor_cuota_moderadora: service.moderatingFee || 0,
    valor_neto: (service.value || 0) - (service.moderatingFee || 0)
  };
}

/**
 * Mapea un servicio de medicamento al formato RIPS 2275
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AMCT
 */
function mapMedicationService2275(invoice, service) {
  return {
    numero_factura: invoice.number,
    prefijo_factura: invoice.prefix || '',
    codigo_prestador: process.env.PROVIDER_CODE || '12345678901234567',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    numero_autorizacion: service.authorizationNumber || '',
    fecha_dispensacion: moment(service.date).format('YYYY-MM-DD'),
    codigo_medicamento: service.code,
    codigo_diagnostico: (service.diagnosis || '').padEnd(6, '0'),
    tipo_medicamento: service.medicationType || '01', // 01=POS
    nombre_generico: (service.genericName || '').substring(0, 60),
    forma_farmaceutica: (service.pharmaceuticalForm || '').substring(0, 20),
    concentracion: (service.concentration || '').substring(0, 20),
    unidad_medida: (service.unit || '').substring(0, 20),
    numero_unidades: service.quantity || 0,
    valor_unitario: service.unitValue || 0,
    valor_total: service.totalValue || 0
  };
}

/**
 * Mapea un servicio de procedimiento al formato RIPS 2275
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo APCT
 */
function mapProcedureService2275(invoice, service) {
  return {
    numero_factura: invoice.number,
    prefijo_factura: invoice.prefix || '',
    codigo_prestador: process.env.PROVIDER_CODE || '12345678901234567',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    fecha_procedimiento: moment(service.date).format('YYYY-MM-DD'),
    hora_procedimiento: moment(service.time || service.date).format('HH:mm'),
    numero_autorizacion: service.authorizationNumber || '',
    codigo_procedimiento: service.code,
    modalidad_atencion: service.attentionMode || '01', // 01=Presencial
    ambito_realizacion: service.scope || '01', // 01=Ambulatorio
    finalidad_procedimiento: service.purpose || '02', // 02=Terapéutico
    personal_atiende: service.attendingPersonnel || '01', // 01=Médico
    diagnostico_principal: (service.mainDiagnosis || '').padEnd(6, '0'),
    diagnostico_relacionado: (service.relatedDiagnosis || '').padEnd(6, '0'),
    complicacion: (service.complication || '').padEnd(6, '0'),
    forma_realizacion: service.realizationForm || '01', // 01=Único
    valor_procedimiento: service.value || 0,
    valor_cuota_moderadora: service.moderatingFee || 0,
    valor_neto: (service.value || 0) - (service.moderatingFee || 0)
  };
}

/**
 * Mapea un servicio de urgencias al formato RIPS 2275
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AUCT
 */
function mapEmergencyService2275(invoice, service) {
  return {
    numero_factura: invoice.number,
    prefijo_factura: invoice.prefix || '',
    codigo_prestador: process.env.PROVIDER_CODE || '12345678901234567',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    fecha_ingreso: moment(service.admissionDate).format('YYYY-MM-DD'),
    hora_ingreso: moment(service.admissionTime || service.admissionDate).format('HH:mm'),
    numero_autorizacion: service.authorizationNumber || '',
    causa_externa: service.externalCause || '13', // 13=Otra
    diagnostico_principal_ingreso: (service.admissionDiagnosis || '').padEnd(6, '0'),
    diagnostico_relacionado1_ingreso: (service.relatedDiagnosis1 || '').padEnd(6, '0'),
    diagnostico_relacionado2_ingreso: (service.relatedDiagnosis2 || '').padEnd(6, '0'),
    diagnostico_relacionado3_ingreso: (service.relatedDiagnosis3 || '').padEnd(6, '0'),
    fecha_salida: moment(service.dischargeDate).format('YYYY-MM-DD'),
    hora_salida: moment(service.dischargeTime || service.dischargeDate).format('HH:mm'),
    diagnostico_principal_egreso: (service.dischargeDiagnosis || '').padEnd(6, '0'),
    diagnostico_relacionado1_egreso: (service.relatedDischargeDiagnosis1 || '').padEnd(6, '0'),
    diagnostico_relacionado2_egreso: (service.relatedDischargeDiagnosis2 || '').padEnd(6, '0'),
    diagnostico_relacionado3_egreso: (service.relatedDischargeDiagnosis3 || '').padEnd(6, '0'),
    destino_usuario: service.destination || '01', // 01=Domicilio
    estado_salida: service.dischargeStatus || '1', // 1=Vivo
    causa_muerte: (service.deathCause || '').padEnd(6, '0'),
    observacion: service.observation || '1', // 1=Sin observación, 2=Con observación
    valor_consulta: service.consultationValue || 0,
    valor_observacion: service.observationValue || 0,
    valor_total: service.totalValue || 0
  };
}

/**
 * Mapea un servicio de hospitalización al formato RIPS 2275
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AHCT
 */
function mapHospitalizationService2275(invoice, service) {
  return {
    numero_factura: invoice.number,
    prefijo_factura: invoice.prefix || '',
    codigo_prestador: process.env.PROVIDER_CODE || '12345678901234567',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    numero_autorizacion: service.authorizationNumber || '',
    fecha_ingreso: moment(service.admissionDate).format('YYYY-MM-DD'),
    hora_ingreso: moment(service.admissionTime || service.admissionDate).format('HH:mm'),
    via_ingreso: service.admissionRoute || '01', // 01=Urgencias
    diagnostico_principal_ingreso: (service.admissionDiagnosis || '').padEnd(6, '0'),
    diagnostico_relacionado1_ingreso: (service.relatedDiagnosis1 || '').padEnd(6, '0'),
    diagnostico_relacionado2_ingreso: (service.relatedDiagnosis2 || '').padEnd(6, '0'),
    diagnostico_relacionado3_ingreso: (service.relatedDiagnosis3 || '').padEnd(6, '0'),
    fecha_egreso: moment(service.dischargeDate).format('YYYY-MM-DD'),
    hora_egreso: moment(service.dischargeTime || service.dischargeDate).format('HH:mm'),
    diagnostico_principal_egreso: (service.dischargeDiagnosis || '').padEnd(6, '0'),
    diagnostico_relacionado1_egreso: (service.relatedDischargeDiagnosis1 || '').padEnd(6, '0'),
    diagnostico_relacionado2_egreso: (service.relatedDischargeDiagnosis2 || '').padEnd(6, '0'),
    diagnostico_relacionado3_egreso: (service.relatedDischargeDiagnosis3 || '').padEnd(6, '0'),
    diagnostico_complicacion: (service.complicationDiagnosis || '').padEnd(6, '0'),
    estado_salida: service.dischargeStatus || '1', // 1=Vivo
    causa_muerte: (service.deathCause || '').padEnd(6, '0'),
    destino_usuario: service.destination || '01', // 01=Domicilio
    valor_estancia: service.stayValue || 0
  };
}

/**
 * Mapea un servicio de recién nacido al formato RIPS 2275
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo ANCT
 */
function mapNewbornService2275(invoice, service) {
  return {
    numero_factura: invoice.number,
    prefijo_factura: invoice.prefix || '',
    codigo_prestador: process.env.PROVIDER_CODE || '12345678901234567',
    tipo_documento_madre: service.motherDocumentType,
    numero_documento_madre: service.motherDocumentNumber,
    fecha_nacimiento: moment(service.birthDate).format('YYYY-MM-DD'),
    hora_nacimiento: moment(service.birthTime || service.birthDate).format('HH:mm'),
    edad_gestacional: service.gestationalAge || 40,
    control_prenatal: service.prenatalControl || '1', // 1=Sí
    sexo: service.gender || 'M',
    peso: service.weight || 3000,
    diagnostico_principal: (service.mainDiagnosis || '').padEnd(6, '0'),
    diagnostico_relacionado1: (service.relatedDiagnosis1 || '').padEnd(6, '0'),
    diagnostico_relacionado2: (service.relatedDiagnosis2 || '').padEnd(6, '0'),
    diagnostico_relacionado3: (service.relatedDiagnosis3 || '').padEnd(6, '0'),
    condicion_salida: service.healthCondition || '1', // 1=Vivo
    causa_muerte: (service.deathCause || '').padEnd(6, '0')
  };
}

/**
 * Mapea un servicio de descripción al formato RIPS 2275
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo ADCT
 */
function mapDescriptionService2275(invoice, service) {
  return {
    numero_factura: invoice.number,
    prefijo_factura: invoice.prefix || '',
    codigo_prestador: process.env.PROVIDER_CODE || '12345678901234567',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    fecha_servicio: moment(service.date).format('YYYY-MM-DD'),
    numero_autorizacion: service.authorizationNumber || '',
    codigo_servicio: service.code,
    nombre_servicio: (service.name || '').substring(0, 60),
    cantidad: service.quantity || 1,
    valor_unitario: service.unitValue || 0,
    valor_total: service.totalValue || 0
  };
}

/**
 * Mapea un registro a formato XML para la resolución 2275
 * @param {Object} record - Registro a mapear
 * @returns {Object} - Objeto formateado para XML
 */
function mapRecordToXml(record) {
  // Convertir objeto plano a formato XML con atributos
  const xmlRecord = {
    '$': {} // Atributos del elemento
  };
  
  // Cada propiedad del objeto se convierte en un atributo
  for (const key in record) {
    if (record.hasOwnProperty(key)) {
      xmlRecord.$[key] = record[key].toString();
    }
  }
  
  return xmlRecord;
}

/**
 * Formatea un valor según tipo y longitud para RIPS
 * @param {*} value - Valor a formatear
 * @param {string} type - Tipo de dato (string, number, date)
 * @param {number} length - Longitud máxima
 * @returns {string} - Valor formateado
 */
function formatFieldValue(value, type, length) {
  if (value === null || value === undefined) {
    value = '';
  }
  
  switch (type) {
    case 'number':
      // Formatear número sin decimales
      return value.toString().substring(0, length);
      
    case 'date':
      // Formatear fecha YYYY-MM-DD
      if (value && value.length === 10) {
        return value; // Ya está formateada
      }
      try {
        return moment(value).format('YYYY-MM-DD');
      } catch (err) {
        return '';
      }
      
    case 'string':
    default:
      // Limitar longitud y eliminar comillas (pueden causar problemas en CSV)
      return value.toString().substring(0, length).replace(/"/g, '');
  }
}

module.exports = rips2275Service;