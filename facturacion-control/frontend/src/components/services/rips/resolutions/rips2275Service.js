// src/services/rips/resolutions/rips2275Service.js
import apiService from '../../apiService';

/**
 * Servicio específico para la gestión de RIPS según la Resolución 2275 de 2023
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
          description: 'Contiene los datos de la transacción entre la entidad y el prestador',
          fields: [
            { name: 'codigo_prestador', type: 'string', length: 16, required: true },
            { name: 'codigo_habilitacion', type: 'string', length: 12, required: true },
            { name: 'fecha_remision', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'codigo_entidad', type: 'string', length: 8, required: true },
            { name: 'nombre_entidad', type: 'string', length: 60, required: true },
            { name: 'numero_factura', type: 'string', length: 30, required: true },
            { name: 'prefijo_factura', type: 'string', length: 6, required: false },
            { name: 'numero_contrato', type: 'string', length: 30, required: true },
            { name: 'plan_beneficios', type: 'string', length: 2, required: true },
            { name: 'fecha_inicio', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'fecha_final', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'codigo_archivo', type: 'string', length: 4, required: true },
            { name: 'total_registros', type: 'number', length: 10, required: true },
            { name: 'total_valor', type: 'number', length: 20, required: true },
          ]
        },
        { 
          code: 'ATUS', 
          name: 'Archivo de usuarios (nuevo formato)',
          required: true,
          description: 'Contiene los datos de identificación del usuario atendido',
          fields: [
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'codigo_entidad', type: 'string', length: 8, required: true },
            { name: 'tipo_usuario', type: 'string', length: 2, required: true },
            { name: 'primer_apellido', type: 'string', length: 60, required: true },
            { name: 'segundo_apellido', type: 'string', length: 60, required: false },
            { name: 'primer_nombre', type: 'string', length: 60, required: true },
            { name: 'segundo_nombre', type: 'string', length: 60, required: false },
            { name: 'fecha_nacimiento', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'sexo', type: 'string', length: 1, required: true },
            { name: 'codigo_pais', type: 'string', length: 3, required: true },
            { name: 'codigo_departamento', type: 'string', length: 2, required: true },
            { name: 'codigo_municipio', type: 'string', length: 3, required: true },
            { name: 'zona_residencia', type: 'string', length: 1, required: true },
            { name: 'tipo_regimen', type: 'string', length: 2, required: true },
            { name: 'etnia', type: 'string', length: 2, required: true },
            { name: 'grupo_poblacional', type: 'string', length: 2, required: true },
            { name: 'telefono', type: 'string', length: 20, required: false },
            { name: 'correo_electronico', type: 'string', length: 100, required: false },
          ]
        },
        { 
          code: 'ACCT', 
          name: 'Archivo de consultas (nuevo formato)',
          required: false,
          description: 'Contiene los datos de las consultas realizadas',
          fields: [
            { name: 'numero_factura', type: 'string', length: 30, required: true },
            { name: 'prefijo_factura', type: 'string', length: 6, required: false },
            { name: 'codigo_prestador', type: 'string', length: 16, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'fecha_consulta', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_consulta', type: 'string', length: 5, required: true },
            { name: 'numero_autorizacion', type: 'string', length: 30, required: false },
            { name: 'codigo_consulta', type: 'string', length: 10, required: true },
            { name: 'modalidad_atencion', type: 'string', length: 2, required: true },
            { name: 'finalidad_consulta', type: 'string', length: 2, required: true },
            { name: 'causa_externa', type: 'string', length: 2, required: true },
            { name: 'codigo_diagnostico_principal', type: 'string', length: 6, required: true },
            { name: 'codigo_diagnostico_relacionado1', type: 'string', length: 6, required: false },
            { name: 'codigo_diagnostico_relacionado2', type: 'string', length: 6, required: false },
            { name: 'codigo_diagnostico_relacionado3', type: 'string', length: 6, required: false },
            { name: 'tipo_diagnostico_principal', type: 'string', length: 1, required: true },
            { name: 'codigo_resultado_consulta', type: 'string', length: 2, required: true },
            { name: 'valor_consulta', type: 'number', length: 15, required: true },
            { name: 'valor_cuota_moderadora', type: 'number', length: 15, required: true },
            { name: 'valor_neto', type: 'number', length: 15, required: true },
          ]
        },
        { 
          code: 'APCT', 
          name: 'Archivo de procedimientos (nuevo formato)',
          required: false,
          description: 'Contiene los datos de procedimientos realizados',
          fields: [
            { name: 'numero_factura', type: 'string', length: 30, required: true },
            { name: 'prefijo_factura', type: 'string', length: 6, required: false },
            { name: 'codigo_prestador', type: 'string', length: 16, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'fecha_procedimiento', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_procedimiento', type: 'string', length: 5, required: true },
            { name: 'numero_autorizacion', type: 'string', length: 30, required: false },
            { name: 'codigo_procedimiento', type: 'string', length: 10, required: true },
            { name: 'modalidad_atencion', type: 'string', length: 2, required: true },
            { name: 'ambito_realizacion', type: 'string', length: 2, required: true },
            { name: 'finalidad_procedimiento', type: 'string', length: 2, required: true },
            { name: 'personal_atiende', type: 'string', length: 2, required: true },
            { name: 'diagnostico_principal', type: 'string', length: 6, required: true },
            { name: 'diagnostico_relacionado', type: 'string', length: 6, required: false },
            { name: 'complicacion', type: 'string', length: 6, required: false },
            { name: 'forma_realizacion', type: 'string', length: 2, required: true },
            { name: 'valor_procedimiento', type: 'number', length: 15, required: true },
            { name: 'valor_cuota_moderadora', type: 'number', length: 15, required: true },
            { name: 'valor_neto', type: 'number', length: 15, required: true },
          ]
        },
        { 
          code: 'AMCT', 
          name: 'Archivo de medicamentos (nuevo formato)',
          required: false,
          description: 'Contiene los datos de medicamentos suministrados',
          fields: [
            { name: 'numero_factura', type: 'string', length: 30, required: true },
            { name: 'prefijo_factura', type: 'string', length: 6, required: false },
            { name: 'codigo_prestador', type: 'string', length: 16, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'numero_autorizacion', type: 'string', length: 30, required: false },
            { name: 'fecha_dispensacion', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'codigo_medicamento', type: 'string', length: 20, required: true },
            { name: 'codigo_diagnostico', type: 'string', length: 6, required: true },
            { name: 'tipo_medicamento', type: 'string', length: 2, required: true },
            { name: 'nombre_generico', type: 'string', length: 60, required: true },
            { name: 'forma_farmaceutica', type: 'string', length: 20, required: true },
            { name: 'concentracion', type: 'string', length: 20, required: true },
            { name: 'unidad_medida', type: 'string', length: 20, required: true },
            { name: 'numero_unidades', type: 'number', length: 5, required: true },
            { name: 'valor_unitario', type: 'number', length: 15, required: true },
            { name: 'valor_total', type: 'number', length: 15, required: true },
          ]
        },
        { 
          code: 'AUCT', 
          name: 'Archivo de urgencias (nuevo formato)',
          required: false,
          description: 'Contiene los datos de atenciones de urgencia',
          fields: [
            { name: 'numero_factura', type: 'string', length: 30, required: true },
            { name: 'prefijo_factura', type: 'string', length: 6, required: false },
            { name: 'codigo_prestador', type: 'string', length: 16, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'fecha_ingreso', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_ingreso', type: 'string', length: 5, required: true },
            { name: 'numero_autorizacion', type: 'string', length: 30, required: false },
            { name: 'causa_externa', type: 'string', length: 2, required: true },
            { name: 'diagnostico_principal_ingreso', type: 'string', length: 6, required: true },
            { name: 'diagnostico_relacionado1_ingreso', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado2_ingreso', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado3_ingreso', type: 'string', length: 6, required: false },
            { name: 'fecha_salida', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_salida', type: 'string', length: 5, required: true },
            { name: 'diagnostico_principal_egreso', type: 'string', length: 6, required: true },
            { name: 'diagnostico_relacionado1_egreso', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado2_egreso', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado3_egreso', type: 'string', length: 6, required: false },
            { name: 'destino_usuario', type: 'string', length: 2, required: true },
            { name: 'estado_salida', type: 'string', length: 1, required: true },
            { name: 'causa_muerte', type: 'string', length: 6, required: false },
            { name: 'observacion', type: 'string', length: 1, required: true },
            { name: 'valor_consulta', type: 'number', length: 15, required: true },
            { name: 'valor_observacion', type: 'number', length: 15, required: true },
            { name: 'valor_total', type: 'number', length: 15, required: true },
          ]
        },
        { 
          code: 'AHCT', 
          name: 'Archivo de hospitalización (nuevo formato)',
          required: false,
          description: 'Contiene los datos de hospitalizaciones',
          fields: [
            { name: 'numero_factura', type: 'string', length: 30, required: true },
            { name: 'prefijo_factura', type: 'string', length: 6, required: false },
            { name: 'codigo_prestador', type: 'string', length: 16, required: true },
            { name: 'tipo_documento', type: 'string', length: 2, required: true },
            { name: 'numero_documento', type: 'string', length: 20, required: true },
            { name: 'via_ingreso', type: 'string', length: 2, required: true },
            { name: 'fecha_ingreso', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_ingreso', type: 'string', length: 5, required: true },
            { name: 'numero_autorizacion', type: 'string', length: 30, required: false },
            { name: 'causa_externa', type: 'string', length: 2, required: true },
            { name: 'diagnostico_principal_ingreso', type: 'string', length: 6, required: true },
            { name: 'diagnostico_relacionado1_ingreso', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado2_ingreso', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado3_ingreso', type: 'string', length: 6, required: false },
            { name: 'fecha_salida', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_salida', type: 'string', length: 5, required: true },
            { name: 'diagnostico_principal_egreso', type: 'string', length: 6, required: true },
            { name: 'diagnostico_relacionado1_egreso', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado2_egreso', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado3_egreso', type: 'string', length: 6, required: false },
            { name: 'complicacion', type: 'string', length: 6, required: false },
            { name: 'estado_salida', type: 'string', length: 1, required: true },
            { name: 'causa_muerte', type: 'string', length: 6, required: false },
            { name: 'dias_estancia', type: 'number', length: 5, required: true },
            { name: 'valor_estancia', type: 'number', length: 15, required: true },
            { name: 'valor_total', type: 'number', length: 15, required: true },
          ]
        },
        { 
          code: 'ANCT', 
          name: 'Archivo de recién nacidos (nuevo formato)',
          required: false,
          description: 'Contiene los datos de recién nacidos',
          fields: [
            { name: 'numero_factura', type: 'string', length: 30, required: true },
            { name: 'prefijo_factura', type: 'string', length: 6, required: false },
            { name: 'codigo_prestador', type: 'string', length: 16, required: true },
            { name: 'tipo_documento_madre', type: 'string', length: 2, required: true },
            { name: 'numero_documento_madre', type: 'string', length: 20, required: true },
            { name: 'fecha_nacimiento', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_nacimiento', type: 'string', length: 5, required: true },
            { name: 'edad_gestacional', type: 'number', length: 2, required: true },
            { name: 'control_prenatal', type: 'string', length: 1, required: true },
            { name: 'sexo', type: 'string', length: 1, required: true },
            { name: 'peso', type: 'number', length: 4, required: true },
            { name: 'diagnostico_principal', type: 'string', length: 6, required: true },
            { name: 'diagnostico_relacionado1', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado2', type: 'string', length: 6, required: false },
            { name: 'diagnostico_relacionado3', type: 'string', length: 6, required: false },
            { name: 'condicion_salida', type: 'string', length: 1, required: true },
            { name: 'causa_muerte', type: 'string', length: 6, required: false },
            { name: 'fecha_salida', type: 'date', format: 'YYYY-MM-DD', required: true },
            { name: 'hora_salida', type: 'string', length: 5, required: true },
            { name: 'numero_documento_recien_nacido', type: 'string', length: 20, required: false },
            { name: 'tipo_documento_recien_nacido', type: 'string', length: 2, required: false },
          ]
        },
        { 
          code: 'ADCT', 
          name: 'Archivo de descripción (nuevo formato)',
          required: false,
          description: 'Contiene los datos de descripción agrupada de servicios',
          fields: [
            { name: 'numero_factura', type: 'string', length: 30, required: true },
            { name: 'prefijo_factura', type: 'string', length: 6, required: false },
            { name: 'codigo_prestador', type: 'string', length: 16, required: true },
            { name: 'concepto', type: 'string', length: 2, required: true },
            { name: 'codigo_concepto', type: 'string', length: 20, required: false },
            { name: 'cantidad', type: 'number', length: 10, required: true },
            { name: 'valor_unitario', type: 'number', length: 15, required: true },
            { name: 'valor_total', type: 'number', length: 15, required: true },
          ]
        }
      ]
    };
  },

  /**
   * Valida datos específicos para la resolución 2275
   * @param {Object} data - Datos a validar
   * @returns {Object} - Resultados de la validación
   */
validateData: async (data) => {
try {
    return await apiService.post('/api/rips/validate-2275', data);
} catch (error) {
    console.error('Error al validar datos para resolución 2275:', error);
    throw error;
}
},

  /**
   * Genera los archivos RIPS según la resolución 2275
   * @param {Object} data - Datos para generación
   * @returns {Promise} - Promesa con el resultado de la generación
   */
  generateFiles: async (data) => {
    try {
      return await apiService.post('/api/rips/generate-2275', data);
    } catch (error) {
      console.error('Error al generar archivos para resolución 2275:', error);
      throw error;
    }
  },

  /**
   * Obtiene reglas de validación específicas para un tipo de archivo
   * @param {string} fileType - Código del tipo de archivo (AFCT, ATUS, etc.)
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
      'AFCT': [
        {
          name: 'unique_invoice',
          description: 'Verifica que no existan facturas duplicadas',
          severity: 'error'
        },
        {
          name: 'date_range',
          description: 'Verifica que la fecha final no sea anterior a la fecha inicial',
          severity: 'error'
        },
        {
          name: 'valid_provider_code',
          description: 'Verifica que el código de prestador sea válido y esté registrado',
          severity: 'error'
        }
      ],
      'ATUS': [
        {
          name: 'valid_document_type',
          description: 'Verifica que el tipo de documento sea válido según nueva codificación',
          severity: 'error'
        },
        {
          name: 'valid_email_format',
          description: 'Verifica que el correo electrónico tenga un formato válido',
          severity: 'warning'
        },
        {
          name: 'valid_country_code',
          description: 'Verifica que el código de país sea válido según estándar ISO',
          severity: 'error'
        }
      ],
      // Otras reglas específicas...
    };

    return [...commonRules, ...(specificRules[fileType] || [])];
  },

  /**
   * Convierte datos de formato 3374 a formato 2275
   * @param {Object} data3374 - Datos en formato 3374
   * @returns {Object} - Datos transformados a formato 2275
   */
  convertFromOldFormat: (data3374) => {
    // Lógica para convertir entre formatos
    // Esta es una implementación inicial básica
    const result = {
      AFCT: [], ATUS: [], ACCT: [], APCT: [], AMCT: [], AUCT: [], AHCT: [], ANCT: [], ADCT: []
    };

    // Mapear AF a AFCT
    if (data3374.AF && data3374.AF.length) {
      result.AFCT = data3374.AF.map(record => ({
        codigo_prestador: record.codigo_prestador,
        codigo_habilitacion: record.codigo_prestador, // En el formato viejo no existía, se usa el mismo
        fecha_remision: record.fecha_remision,
        codigo_entidad: record.codigo_entidad,
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

    // Mapeos similares para otros tipos de archivos...

    return result;
  }
};

export default rips2275Service;