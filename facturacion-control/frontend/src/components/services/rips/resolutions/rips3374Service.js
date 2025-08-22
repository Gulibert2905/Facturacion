// src/services/rips/resolutions/rips3374Service.js
import apiService from '../../apiService';

/**
 * Servicio específico para la gestión de RIPS según la Resolución 3374 de 2000
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
          description: 'Contiene los datos de la transacción entre la entidad y el prestador',
          fields: [
            { name: 'codigo_prestador', type: 'string', length: 12, required: true },
            { name: 'fecha_remision', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'codigo_entidad', type: 'string', length: 6, required: true },
            { name: 'nombre_entidad', type: 'string', length: 30, required: true },
            { name: 'numero_factura', type: 'string', length: 20, required: true },
            { name: 'fecha_inicio', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'fecha_final', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'codigo_archivo', type: 'string', length: 2, required: true },
            { name: 'total_registros', type: 'number', length: 10, required: true },
          ]
        },
        { 
          code: 'US', 
          name: 'Archivo de usuarios',
          required: true,
          description: 'Contiene los datos de identificación del usuario atendido',
          fields: [
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'codigo_entidad', type: 'string', length: 6, required: true },
            { name: 'tipo_usuario', type: 'string', length: 1, required: true },
            { name: 'primer_apellido', type: 'string', length: 30, required: true },
            { name: 'segundo_apellido', type: 'string', length: 30, required: false },
            { name: 'primer_nombre', type: 'string', length: 20, required: true },
            { name: 'segundo_nombre', type: 'string', length: 20, required: false },
            { name: 'edad', type: 'number', length: 3, required: true },
            { name: 'unidad_medida_edad', type: 'string', length: 1, required: true },
            { name: 'sexo', type: 'string', length: 1, required: true },
            { name: 'codigo_departamento', type: 'string', length: 2, required: true },
            { name: 'codigo_municipio', type: 'string', length: 3, required: true },
            { name: 'zona_residencia', type: 'string', length: 1, required: true },
          ]
        },
        { 
          code: 'AC', 
          name: 'Archivo de consultas',
          required: false,
          description: 'Contiene los datos de las consultas realizadas',
          fields: [
            { name: 'numero_factura', type: 'string', length: 20, required: true },
            { name: 'codigo_prestador', type: 'string', length: 12, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'fecha_consulta', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'codigo_consulta', type: 'string', length: 8, required: true },
            { name: 'finalidad_consulta', type: 'string', length: 2, required: true },
            { name: 'causa_externa', type: 'string', length: 2, required: true },
            { name: 'codigo_diagnostico_principal', type: 'string', length: 4, required: true },
            { name: 'codigo_diagnostico_relacionado1', type: 'string', length: 4, required: false },
            { name: 'codigo_diagnostico_relacionado2', type: 'string', length: 4, required: false },
            { name: 'codigo_diagnostico_relacionado3', type: 'string', length: 4, required: false },
            { name: 'tipo_diagnostico_principal', type: 'string', length: 1, required: true },
            { name: 'valor_consulta', type: 'number', length: 15, required: true },
            { name: 'valor_cuota_moderadora', type: 'number', length: 15, required: true },
            { name: 'valor_neto', type: 'number', length: 15, required: true },
          ]
        },
        { 
          code: 'AP', 
          name: 'Archivo de procedimientos',
          required: false,
          description: 'Contiene los datos de procedimientos realizados',
          fields: [
            { name: 'numero_factura', type: 'string', length: 20, required: true },
            { name: 'codigo_prestador', type: 'string', length: 12, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'fecha_procedimiento', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'codigo_procedimiento', type: 'string', length: 8, required: true },
            { name: 'ambito_realizacion', type: 'string', length: 1, required: true },
            { name: 'finalidad_procedimiento', type: 'string', length: 2, required: true },
            { name: 'personal_atiende', type: 'string', length: 1, required: true },
            { name: 'diagnostico_principal', type: 'string', length: 4, required: true },
            { name: 'diagnostico_relacionado', type: 'string', length: 4, required: false },
            { name: 'complicacion', type: 'string', length: 4, required: false },
            { name: 'forma_realizacion', type: 'string', length: 1, required: true },
            { name: 'valor_procedimiento', type: 'number', length: 15, required: true },
          ]
        },
        { 
          code: 'AM', 
          name: 'Archivo de medicamentos',
          required: false,
          description: 'Contiene los datos de medicamentos suministrados',
          fields: [
            { name: 'numero_factura', type: 'string', length: 20, required: true },
            { name: 'codigo_prestador', type: 'string', length: 12, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'codigo_medicamento', type: 'string', length: 20, required: true },
            { name: 'tipo_medicamento', type: 'string', length: 1, required: true },
            { name: 'nombre_generico', type: 'string', length: 30, required: true },
            { name: 'forma_farmaceutica', type: 'string', length: 20, required: true },
            { name: 'concentracion', type: 'string', length: 20, required: true },
            { name: 'unidad_medida', type: 'string', length: 20, required: true },
            { name: 'numero_unidades', type: 'number', length: 5, required: true },
            { name: 'valor_unitario', type: 'number', length: 15, required: true },
            { name: 'valor_total', type: 'number', length: 15, required: true },
          ]
        },
        { 
          code: 'AT', 
          name: 'Archivo de servicios de urgencias con observación',
          required: false,
          description: 'Contiene los datos de atenciones de urgencia con observación',
          fields: [
            { name: 'numero_factura', type: 'string', length: 20, required: true },
            { name: 'codigo_prestador', type: 'string', length: 12, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'fecha_ingreso', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_ingreso', type: 'string', length: 5, required: true },
            { name: 'causa_externa', type: 'string', length: 2, required: true },
            { name: 'diagnostico_principal_ingreso', type: 'string', length: 4, required: true },
            { name: 'diagnostico_relacionado1_ingreso', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado2_ingreso', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado3_ingreso', type: 'string', length: 4, required: false },
            { name: 'fecha_salida', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_salida', type: 'string', length: 5, required: true },
            { name: 'diagnostico_principal_egreso', type: 'string', length: 4, required: true },
            { name: 'diagnostico_relacionado1_egreso', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado2_egreso', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado3_egreso', type: 'string', length: 4, required: false },
            { name: 'destino_usuario', type: 'string', length: 1, required: true },
            { name: 'estado_salida', type: 'string', length: 1, required: true },
            { name: 'causa_muerte', type: 'string', length: 4, required: false },
          ]
        },
        { 
          code: 'AH', 
          name: 'Archivo de hospitalización',
          required: false,
          description: 'Contiene los datos de hospitalizaciones',
          fields: [
            { name: 'numero_factura', type: 'string', length: 20, required: true },
            { name: 'codigo_prestador', type: 'string', length: 12, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'via_ingreso', type: 'string', length: 1, required: true },
            { name: 'fecha_ingreso', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_ingreso', type: 'string', length: 5, required: true },
            { name: 'causa_externa', type: 'string', length: 2, required: true },
            { name: 'diagnostico_principal_ingreso', type: 'string', length: 4, required: true },
            { name: 'diagnostico_relacionado1_ingreso', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado2_ingreso', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado3_ingreso', type: 'string', length: 4, required: false },
            { name: 'fecha_salida', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_salida', type: 'string', length: 5, required: true },
            { name: 'diagnostico_principal_egreso', type: 'string', length: 4, required: true },
            { name: 'diagnostico_relacionado1_egreso', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado2_egreso', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado3_egreso', type: 'string', length: 4, required: false },
            { name: 'complicacion', type: 'string', length: 4, required: false },
            { name: 'estado_salida', type: 'string', length: 1, required: true },
            { name: 'causa_muerte', type: 'string', length: 4, required: false },
            { name: 'diagnostico_causa_muerte', type: 'string', length: 4, required: false },
          ]
        },
        { 
          code: 'AN', 
          name: 'Archivo de recién nacidos',
          required: false,
          description: 'Contiene los datos de recién nacidos',
          fields: [
            { name: 'numero_factura', type: 'string', length: 20, required: true },
            { name: 'codigo_prestador', type: 'string', length: 12, required: true },
            { name: 'tipo_documento_madre', type: 'string', length: 2, required: true },
            { name: 'numero_documento_madre', type: 'string', length: 20, required: true },
            { name: 'fecha_nacimiento', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_nacimiento', type: 'string', length: 5, required: true },
            { name: 'edad_gestacional', type: 'number', length: 2, required: true },
            { name: 'control_prenatal', type: 'string', length: 1, required: true },
            { name: 'sexo', type: 'string', length: 1, required: true },
            { name: 'peso', type: 'number', length: 4, required: true },
            { name: 'diagnostico_principal', type: 'string', length: 4, required: true },
            { name: 'diagnostico_relacionado1', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado2', type: 'string', length: 4, required: false },
            { name: 'diagnostico_relacionado3', type: 'string', length: 4, required: false },
            { name: 'condicion_salida', type: 'string', length: 1, required: true },
            { name: 'causa_muerte', type: 'string', length: 4, required: false },
            { name: 'fecha_salida', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_salida', type: 'string', length: 5, required: true },
          ]
        },
        { 
          code: 'AU', 
          name: 'Archivo de otros servicios',
          required: false,
          description: 'Contiene los datos de otros servicios no incluidos en los archivos anteriores',
          fields: [
            { name: 'numero_factura', type: 'string', length: 20, required: true },
            { name: 'codigo_prestador', type: 'string', length: 12, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'fecha_servicio', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'codigo_servicio', type: 'string', length: 20, required: true },
            { name: 'nombre_servicio', type: 'string', length: 60, required: true },
            { name: 'cantidad', type: 'number', length: 5, required: true },
            { name: 'valor_unitario', type: 'number', length: 15, required: true },
            { name: 'valor_total', type: 'number', length: 15, required: true },
          ]
        },
        { 
          code: 'AD', 
          name: 'Archivo de descripción agrupada',
          required: false,
          description: 'Contiene los datos de descripción agrupada de servicios',
          fields: [
            { name: 'numero_factura', type: 'string', length: 20, required: true },
            { name: 'codigo_prestador', type: 'string', length: 12, required: true },
            { name: 'concepto', type: 'string', length: 2, required: true },
            { name: 'codigo_concepto', type: 'string', length: 20, required: false },
            { name: 'valor', type: 'number', length: 15, required: true },
          ]
        }
      ]
    };
  },

  /**
   * Valida datos específicos para la resolución 3374
   * @param {Object} data - Datos a validar
   * @returns {Object} - Resultados de la validación
   */
  validateData: async (data) => {
    try {
      return await apiService.post('/api/rips/validate-3374', data);
    } catch (error) {
      console.error('Error al validar datos para resolución 3374:', error);
      throw error;
    }
  },

  /**
   * Genera los archivos RIPS según la resolución 3374
   * @param {Object} data - Datos para generación
   * @returns {Promise} - Promesa con el resultado de la generación
   */
  generateFiles: async (data) => {
    try {
      return await apiService.post('/api/rips/generate-3374', data);
    } catch (error) {
      console.error('Error al generar archivos para resolución 3374:', error);
      throw error;
    }
  },

  /**
   * Obtiene reglas de validación específicas para un tipo de archivo
   * @param {string} fileType - Código del tipo de archivo (AF, US, etc.)
   * @returns {Array} - Reglas de validación
   */
  getValidationRules: (fileType) => {
    const commonRules = [
      {
        name: 'required_fields',
        description: 'Verifica que todos los campos obligatorios estén presentes',
        severity: 'error'
      },
      {
        name: 'field_length',
        description: 'Verifica que los campos no excedan la longitud máxima',
        severity: 'error'
      },
      {
        name: 'data_type',
        description: 'Verifica que los campos tengan el tipo de dato correcto',
        severity: 'error'
      },
      {
        name: 'date_format',
        description: 'Verifica que las fechas tengan el formato YYYY-MM-DD',
        severity: 'error'
      }
    ];

    // Reglas específicas según el tipo de archivo
    const specificRules = {
      'AF': [
        {
          name: 'unique_invoice',
          description: 'Verifica que no existan facturas duplicadas',
          severity: 'error'
        },
        {
          name: 'date_range',
          description: 'Verifica que la fecha final no sea anterior a la fecha inicial',
          severity: 'error'
        }
      ],
      'US': [
        {
          name: 'valid_document_type',
          description: 'Verifica que el tipo de documento sea válido',
          severity: 'error'
        },
        {
          name: 'valid_age_unit',
          description: 'Verifica que la unidad de medida de edad sea válida',
          severity: 'error'
        }
      ],
      // Más reglas específicas para otros tipos de archivo
    };

    return [...commonRules, ...(specificRules[fileType] || [])];
  }
};

export default rips3374Service;