// backend/services/rips/rips3374Service.js
const moment = require('moment');

/**
 * Servicio para gestión de RIPS según la Resolución 3374 de 2000
 */
const rips3374Service = {
  /**
   * Obtiene la estructura de archivos RIPS según la Resolución 3374
   * @returns {Object} - Estructura de archivos RIPS
   */
  getStructure: () => {
    return {
      version: '3374 de 2000',
      description: 'Registros Individuales de Prestación de Servicios de Salud según Resolución 3374 de 2000',
      fileTypes: [
        { 
          code: 'AF', 
          name: 'Archivo de transacciones',
          required: true,
          description: 'Contiene los datos de la transacción entre la entidad y el prestador'
        },
        { 
          code: 'US', 
          name: 'Archivo de usuarios',
          required: true,
          description: 'Contiene los datos de identificación del usuario atendido'
        },
        { 
          code: 'AC', 
          name: 'Archivo de consultas',
          required: false,
          description: 'Contiene los datos de las consultas realizadas'
        },
        { 
          code: 'AP', 
          name: 'Archivo de procedimientos',
          required: false,
          description: 'Contiene los datos de procedimientos realizados'
        },
        { 
          code: 'AM', 
          name: 'Archivo de medicamentos',
          required: false,
          description: 'Contiene los datos de medicamentos suministrados'
        },
        { 
          code: 'AT', 
          name: 'Archivo de servicios de urgencias con observación',
          required: false,
          description: 'Contiene los datos de atenciones de urgencia con observación'
        },
        { 
          code: 'AH', 
          name: 'Archivo de hospitalización',
          required: false,
          description: 'Contiene los datos de hospitalizaciones'
        },
        { 
          code: 'AN', 
          name: 'Archivo de recién nacidos',
          required: false,
          description: 'Contiene los datos de recién nacidos'
        },
        { 
          code: 'AU', 
          name: 'Archivo de otros servicios',
          required: false,
          description: 'Contiene los datos de otros servicios no incluidos en los archivos anteriores'
        },
        { 
          code: 'AD', 
          name: 'Archivo de descripción agrupada',
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
      'AF': 'Archivo de transacciones',
      'US': 'Archivo de usuarios',
      'AC': 'Archivo de consultas',
      'AP': 'Archivo de procedimientos',
      'AM': 'Archivo de medicamentos',
      'AT': 'Archivo de servicios de urgencias con observación',
      'AH': 'Archivo de hospitalización',
      'AN': 'Archivo de recién nacidos',
      'AU': 'Archivo de otros servicios',
      'AD': 'Archivo de descripción agrupada'
    };
    
    return fileTypes[fileType] || fileType;
  },

  /**
   * Mapea datos de facturas al formato RIPS 3374
   * @param {Array} invoices - Facturas a procesar
   * @param {Object} entity - Entidad para la cual se generan los RIPS
   * @returns {Object} - Datos formateados para RIPS
   */
  mapDataToRipsFormat: async (invoices, entity) => {
    // Inicializar estructura de datos RIPS
    const ripsData = {
      AF: [], // Archivo de transacciones
      US: [], // Archivo de usuarios
      AC: [], // Archivo de consultas
      AP: [], // Archivo de procedimientos
      AM: [], // Archivo de medicamentos
      AT: [], // Archivo de urgencias
      AH: [], // Archivo de hospitalización
      AN: [], // Archivo de recién nacidos
      AU: [], // Archivo de otros servicios
      AD: []  // Archivo de descripción agrupada
    };
    
    // Obtener configuración del prestador
    const providerConfig = {
      code: process.env.PROVIDER_CODE || '123456789012',
      // Otras configuraciones del prestador...
    };
    
    // Para cada factura
    for (const invoice of invoices) {
      // Registro en archivo AF (transacciones) - uno por cada factura
      ripsData.AF.push({
        codigo_prestador: providerConfig.code,
        fecha_remision: moment().format('YYYY-MM-DD'),
        codigo_entidad: entity.code,
        nombre_entidad: entity.name.substring(0, 30), // Limitar a 30 caracteres
        numero_factura: invoice.number,
        fecha_inicio: moment(invoice.startDate).format('YYYY-MM-DD'),
        fecha_final: moment(invoice.endDate).format('YYYY-MM-DD'),
        codigo_archivo: 'AF',
        total_registros: 1 // Se actualiza al final
      });
      
      // Procesar pacientes para archivo US (usuarios)
      if (invoice.patients && invoice.patients.length > 0) {
        for (const patient of invoice.patients) {
          // Verificar si el paciente ya está incluido para evitar duplicados
          const patientExists = ripsData.US.some(us => 
            us.tipo_documento === patient.documentType && 
            us.numero_documento === patient.documentNumber
          );
          
          if (!patientExists) {
            ripsData.US.push({
              tipo_documento: patient.documentType,
              numero_documento: patient.documentNumber,
              codigo_entidad: entity.code,
              tipo_usuario: patient.userType || '1',
              primer_apellido: (patient.lastName || '').substring(0, 30),
              segundo_apellido: (patient.secondLastName || '').substring(0, 30),
              primer_nombre: (patient.firstName || '').substring(0, 20),
              segundo_nombre: (patient.secondName || '').substring(0, 20),
              edad: patient.age || 0,
              unidad_medida_edad: patient.ageUnit || '1', // 1=Años, 2=Meses, 3=Días
              sexo: patient.gender || 'M',
              codigo_departamento: (patient.department || '').substring(0, 2),
              codigo_municipio: (patient.municipality || '').substring(0, 3),
              zona_residencia: patient.residenceZone || 'U' // U=Urbana, R=Rural
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
              ripsData.AC.push(mapConsultationService(invoice, service));
              break;
            
            case 'PROCEDURE':
              ripsData.AP.push(mapProcedureService(invoice, service));
              break;
            
            case 'MEDICATION':
              ripsData.AM.push(mapMedicationService(invoice, service));
              break;
            
            case 'EMERGENCY':
              ripsData.AT.push(mapEmergencyService(invoice, service));
              break;
            
            case 'HOSPITALIZATION':
              ripsData.AH.push(mapHospitalizationService(invoice, service));
              break;
            
            case 'NEWBORN':
              ripsData.AN.push(mapNewbornService(invoice, service));
              break;
            
            default:
              // Otros servicios no categorizados
              ripsData.AU.push(mapOtherService(invoice, service));
          }
        }
      }
      
      // Procesamiento adicional si es necesario
    }
    
    // Actualizar contadores de registros en AF
    if (ripsData.AF.length > 0) {
      const counters = {
        US: ripsData.US.length,
        AC: ripsData.AC.length,
        AP: ripsData.AP.length,
        AM: ripsData.AM.length,
        AT: ripsData.AT.length,
        AH: ripsData.AH.length,
        AN: ripsData.AN.length,
        AU: ripsData.AU.length,
        AD: ripsData.AD.length
      };
      
      // Actualizar AF con contadores por tipo de archivo
      for (const fileType of Object.keys(counters)) {
        if (counters[fileType] > 0) {
          ripsData.AF.push({
            codigo_prestador: providerConfig.code,
            fecha_remision: moment().format('YYYY-MM-DD'),
            codigo_entidad: entity.code,
            nombre_entidad: entity.name.substring(0, 30),
            numero_factura: 'RIPS', // Identificador especial para archivos de control
            fecha_inicio: moment().format('YYYY-MM-DD'),
            fecha_final: moment().format('YYYY-MM-DD'),
            codigo_archivo: fileType,
            total_registros: counters[fileType]
          });
        }
      }
    }
    
    return ripsData;
  },

  /**
   * Genera el contenido de un archivo RIPS
   * @param {string} fileType - Tipo de archivo (AF, US, etc.)
   * @param {Array} data - Datos para el archivo
   * @returns {string} - Contenido del archivo
   */
  generateRipsFile: (fileType, data) => {
    if (!data || data.length === 0) {
      return '';
    }
    
    // Obtener estructura de campos según tipo de archivo
    const fields = rips3374Service.getFileStructure(fileType);
    
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
   * Obtiene la estructura de campos para un tipo de archivo
   * @param {string} fileType - Tipo de archivo (AF, US, etc.)
   * @returns {Array} - Estructura de campos
   */
  getFileStructure: (fileType) => {
    // Definir estructura de cada tipo de archivo según la Resolución 3374
    const structures = {
      'AF': [
        { name: 'codigo_prestador', type: 'string', length: 12 },
        { name: 'fecha_remision', type: 'date', length: 10 },
        { name: 'codigo_entidad', type: 'string', length: 6 },
        { name: 'nombre_entidad', type: 'string', length: 30 },
        { name: 'numero_factura', type: 'string', length: 20 },
        { name: 'fecha_inicio', type: 'date', length: 10 },
        { name: 'fecha_final', type: 'date', length: 10 },
        { name: 'codigo_archivo', type: 'string', length: 2 },
        { name: 'total_registros', type: 'number', length: 10 }
      ],
      'US': [
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'codigo_entidad', type: 'string', length: 6 },
        { name: 'tipo_usuario', type: 'string', length: 1 },
        { name: 'primer_apellido', type: 'string', length: 30 },
        { name: 'segundo_apellido', type: 'string', length: 30 },
        { name: 'primer_nombre', type: 'string', length: 20 },
        { name: 'segundo_nombre', type: 'string', length: 20 },
        { name: 'edad', type: 'number', length: 3 },
        { name: 'unidad_medida_edad', type: 'string', length: 1 },
        { name: 'sexo', type: 'string', length: 1 },
        { name: 'codigo_departamento', type: 'string', length: 2 },
        { name: 'codigo_municipio', type: 'string', length: 3 },
        { name: 'zona_residencia', type: 'string', length: 1 }
      ],
      'AC': [
        { name: 'numero_factura', type: 'string', length: 20 },
        { name: 'codigo_prestador', type: 'string', length: 12 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'fecha_consulta', type: 'date', length: 10 },
        { name: 'codigo_consulta', type: 'string', length: 8 },
        { name: 'finalidad_consulta', type: 'string', length: 2 },
        { name: 'causa_externa', type: 'string', length: 2 },
        { name: 'codigo_diagnostico_principal', type: 'string', length: 4 },
        { name: 'codigo_diagnostico_relacionado1', type: 'string', length: 4 },
        { name: 'codigo_diagnostico_relacionado2', type: 'string', length: 4 },
        { name: 'codigo_diagnostico_relacionado3', type: 'string', length: 4 },
        { name: 'tipo_diagnostico_principal', type: 'string', length: 1 },
        { name: 'valor_consulta', type: 'number', length: 15 },
        { name: 'valor_cuota_moderadora', type: 'number', length: 15 },
        { name: 'valor_neto', type: 'number', length: 15 }
      ],
      'AP': [
        { name: 'numero_factura', type: 'string', length: 20 },
        { name: 'codigo_prestador', type: 'string', length: 12 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'fecha_procedimiento', type: 'date', length: 10 },
        { name: 'codigo_procedimiento', type: 'string', length: 8 },
        { name: 'ambito_realizacion', type: 'string', length: 1 },
        { name: 'finalidad_procedimiento', type: 'string', length: 2 },
        { name: 'personal_atiende', type: 'string', length: 1 },
        { name: 'diagnostico_principal', type: 'string', length: 4 },
        { name: 'diagnostico_relacionado', type: 'string', length: 4 },
        { name: 'complicacion', type: 'string', length: 4 },
        { name: 'forma_realizacion', type: 'string', length: 1 },
        { name: 'valor_procedimiento', type: 'number', length: 15 }
      ],
      // Estructuras para otros tipos de archivo...
      'AM': [
        { name: 'numero_factura', type: 'string', length: 20 },
        { name: 'codigo_prestador', type: 'string', length: 12 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'codigo_medicamento', type: 'string', length: 20 },
        { name: 'tipo_medicamento', type: 'string', length: 1 },
        { name: 'nombre_generico', type: 'string', length: 30 },
        { name: 'forma_farmaceutica', type: 'string', length: 20 },
        { name: 'concentracion', type: 'string', length: 20 },
        { name: 'unidad_medida', type: 'string', length: 20 },
        { name: 'numero_unidades', type: 'number', length: 5 },
        { name: 'valor_unitario', type: 'number', length: 15 },
        { name: 'valor_total', type: 'number', length: 15 }
      ],
      'AU': [
        { name: 'numero_factura', type: 'string', length: 20 },
        { name: 'codigo_prestador', type: 'string', length: 12 },
        { name: 'tipo_documento', type: 'string', length: 2 },
        { name: 'numero_documento', type: 'string', length: 20 },
        { name: 'fecha_servicio', type: 'date', length: 10 },
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
   * Valida datos RIPS según las reglas de la resolución 3374
   * @param {Object} data - Datos a validar
   * @returns {Object} - Resultados de la validación
   */
  validateData: async (data) => {
    const errors = [];
    const warnings = [];
    
    // Validaciones de estructura y formato
    
    // Validaciones de consistencia cruzada
    
    // Validaciones específicas por tipo de archivo
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
};

// Funciones auxiliares para mapeo de datos

/**
 * Mapea un servicio de consulta al formato RIPS
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AC
 */
function mapConsultationService(invoice, service) {
  return {
    numero_factura: invoice.number,
    codigo_prestador: process.env.PROVIDER_CODE || '123456789012',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    fecha_consulta: moment(service.date).format('YYYY-MM-DD'),
    codigo_consulta: service.code,
    finalidad_consulta: service.purpose || '10', // 10=Otra
    causa_externa: service.externalCause || '13', // 13=Otra
    codigo_diagnostico_principal: service.mainDiagnosis || '',
    codigo_diagnostico_relacionado1: service.relatedDiagnosis1 || '',
    codigo_diagnostico_relacionado2: service.relatedDiagnosis2 || '',
    codigo_diagnostico_relacionado3: service.relatedDiagnosis3 || '',
    tipo_diagnostico_principal: service.diagnosisType || '1', // 1=Impresión diagnóstica
    valor_consulta: service.value || 0,
    valor_cuota_moderadora: service.moderatingFee || 0,
    valor_neto: (service.value || 0) - (service.moderatingFee || 0)
  };
}

/**
 * Mapea un servicio de procedimiento al formato RIPS
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AP
 */
function mapProcedureService(invoice, service) {
  return {
    numero_factura: invoice.number,
    codigo_prestador: process.env.PROVIDER_CODE || '123456789012',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    fecha_procedimiento: moment(service.date).format('YYYY-MM-DD'),
    codigo_procedimiento: service.code,
    ambito_realizacion: service.scope || '1', // 1=Ambulatorio
    finalidad_procedimiento: service.purpose || '2', // 2=Terapéutico
    personal_atiende: service.attendingPersonnel || '1', // 1=Médico
    diagnostico_principal: service.mainDiagnosis || '',
    diagnostico_relacionado: service.relatedDiagnosis || '',
    complicacion: service.complication || '',
    forma_realizacion: service.realizationForm || '1', // 1=Único
    valor_procedimiento: service.value || 0
  };
}

/**
 * Mapea un servicio de medicamento al formato RIPS
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AM
 */
function mapMedicationService(invoice, service) {
  return {
    numero_factura: invoice.number,
    codigo_prestador: process.env.PROVIDER_CODE || '123456789012',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    codigo_medicamento: service.code,
    tipo_medicamento: service.medicationType || '1', // 1=POS
    nombre_generico: (service.genericName || '').substring(0, 30),
    forma_farmaceutica: (service.pharmaceuticalForm || '').substring(0, 20),
    concentracion: (service.concentration || '').substring(0, 20),
    unidad_medida: (service.unit || '').substring(0, 20),
    numero_unidades: service.quantity || 0,
    valor_unitario: service.unitValue || 0,
    valor_total: service.totalValue || 0
  };
}

/**
 * Mapea un servicio de urgencias al formato RIPS
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AT
 */
function mapEmergencyService(invoice, service) {
  return {
    // Mapeo para archivo AT (Urgencias)
    numero_factura: invoice.number,
    codigo_prestador: process.env.PROVIDER_CODE || '123456789012',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    fecha_ingreso: moment(service.admissionDate).format('YYYY-MM-DD'),
    hora_ingreso: moment(service.admissionTime).format('HH:mm'),
    causa_externa: service.externalCause || '13',
    diagnostico_principal_ingreso: service.admissionDiagnosis || '',
    diagnostico_relacionado1_ingreso: service.relatedDiagnosis1 || '',
    diagnostico_relacionado2_ingreso: service.relatedDiagnosis2 || '',
    diagnostico_relacionado3_ingreso: service.relatedDiagnosis3 || '',
    fecha_salida: moment(service.dischargeDate).format('YYYY-MM-DD'),
    hora_salida: moment(service.dischargeTime).format('HH:mm'),
    diagnostico_principal_egreso: service.dischargeDiagnosis || '',
    diagnostico_relacionado1_egreso: service.relatedDischargeDiagnosis1 || '',
    diagnostico_relacionado2_egreso: service.relatedDischargeDiagnosis2 || '',
    diagnostico_relacionado3_egreso: service.relatedDischargeDiagnosis3 || '',
    destino_usuario: service.destination || '1', // 1=Domicilio
    estado_salida: service.dischargeStatus || '1', // 1=Vivo
    causa_muerte: service.deathCause || ''
  };
}

/**
 * Mapea un servicio de hospitalización al formato RIPS
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AH
 */
function mapHospitalizationService(invoice, service) {
  // Implementar mapeo para hospitalización (AH)
  return {
    // Campos según estructura AH
  };
}

/**
 * Mapea un servicio de recién nacido al formato RIPS
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AN
 */
function mapNewbornService(invoice, service) {
  // Implementar mapeo para recién nacidos (AN)
  return {
    // Campos según estructura AN
  };
}

/**
 * Mapea otros servicios al formato RIPS
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} - Registro para archivo AU
 */
function mapOtherService(invoice, service) {
  return {
    numero_factura: invoice.number,
    codigo_prestador: process.env.PROVIDER_CODE || '123456789012',
    tipo_documento: service.patient.documentType,
    numero_documento: service.patient.documentNumber,
    fecha_servicio: moment(service.date).format('YYYY-MM-DD'),
    codigo_servicio: service.code,
    nombre_servicio: (service.name || '').substring(0, 60),
    cantidad: service.quantity || 1,
    valor_unitario: service.unitValue || 0,
    valor_total: service.totalValue || 0
  };
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

module.exports = rips3374Service;