const CIE11 = require('../models/CIE11');

/**
 * Middleware para validar códigos de diagnóstico CIE-11
 * Verifica que el diagnóstico proporcionado sea válido según el Ministerio de Salud
 */
const validateDiagnosis = async (req, res, next) => {
  try {
    const { diagnosis } = req.body;
    
    // Si no hay diagnóstico, continuar (puede ser opcional según el endpoint)
    if (!diagnosis || diagnosis.trim() === '') {
      return next();
    }

    const diagnosisCode = diagnosis.trim().toUpperCase();
    
    // Validar que el código existe y está activo
    const validDiagnosis = await CIE11.validateCode(diagnosisCode);
    
    if (!validDiagnosis.isValid) {
      return res.status(400).json({
        success: false,
        message: `Código de diagnóstico CIE-11 inválido: ${diagnosisCode}`,
        details: 'El código de diagnóstico debe ser un código CIE-11 válido según el Ministerio de Salud de Colombia',
        validationError: {
          field: 'diagnosis',
          code: 'INVALID_DIAGNOSIS_CODE',
          provided: diagnosisCode
        }
      });
    }

    // Agregar información del diagnóstico a la request para uso posterior
    req.diagnosisInfo = validDiagnosis.diagnosis;
    
    next();
  } catch (error) {
    console.error('Error validating diagnosis:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error al validar el código de diagnóstico',
      error: error.message
    });
  }
};

/**
 * Middleware específico para validación de diagnósticos en servicios
 * Puede requerir diagnóstico obligatorio para ciertos tipos de servicio
 */
const validateServiceDiagnosis = async (req, res, next) => {
  try {
    const { diagnosis, cupsCode } = req.body;
    
    // Para algunos códigos CUPS específicos, el diagnóstico puede ser obligatorio
    const requiresDiagnosis = await checkIfServiceRequiresDiagnosis(cupsCode);
    
    if (requiresDiagnosis && (!diagnosis || diagnosis.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: `El servicio con código CUPS ${cupsCode} requiere un diagnóstico CIE-11`,
        validationError: {
          field: 'diagnosis',
          code: 'DIAGNOSIS_REQUIRED',
          cupsCode: cupsCode
        }
      });
    }

    // Si hay diagnóstico, validarlo
    if (diagnosis && diagnosis.trim() !== '') {
      return validateDiagnosis(req, res, next);
    }
    
    next();
  } catch (error) {
    console.error('Error validating service diagnosis:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al validar el diagnóstico del servicio',
      error: error.message
    });
  }
};

/**
 * Función auxiliar para determinar si un servicio requiere diagnóstico
 * Basada en códigos CUPS o reglas de negocio específicas
 */
const checkIfServiceRequiresDiagnosis = async (cupsCode) => {
  // Lista de códigos que siempre requieren diagnóstico
  const alwaysRequireDiagnosis = [
    // Procedimientos quirúrgicos generalmente requieren diagnóstico
    // Consultas especializadas
    // Procedimientos de alta complejidad
  ];
  
  // Lista de prefijos que requieren diagnóstico
  const prefixesRequiringDiagnosis = [
    '89', // Procedimientos quirúrgicos
    '88', // Procedimientos especiales
    '87', // Radiología especializada
  ];
  
  if (!cupsCode) return false;
  
  // Verificar códigos específicos
  if (alwaysRequireDiagnosis.includes(cupsCode)) {
    return true;
  }
  
  // Verificar prefijos
  const codePrefix = cupsCode.substring(0, 2);
  if (prefixesRequiringDiagnosis.includes(codePrefix)) {
    return true;
  }
  
  return false;
};

/**
 * Validador para diagnósticos en prefacturas
 * Valida que todos los servicios en una prefactura tengan diagnósticos válidos
 */
const validatePreBillDiagnoses = async (req, res, next) => {
  try {
    const { services, diagnosis: globalDiagnosis } = req.body;
    
    if (!services || !Array.isArray(services)) {
      return next();
    }

    const validationErrors = [];

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const serviceDiagnosis = service.diagnosis || globalDiagnosis;
      
      if (serviceDiagnosis && serviceDiagnosis.trim() !== '') {
        const diagnosisCode = serviceDiagnosis.trim().toUpperCase();
        const validDiagnosis = await CIE11.validateCode(diagnosisCode);
        
        if (!validDiagnosis.isValid) {
          validationErrors.push({
            serviceIndex: i,
            cupsCode: service.cupsCode,
            diagnosis: diagnosisCode,
            error: 'Código CIE-11 inválido'
          });
        }
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Se encontraron diagnósticos CIE-11 inválidos en los servicios',
        validationErrors: validationErrors
      });
    }

    next();
  } catch (error) {
    console.error('Error validating prebill diagnoses:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al validar los diagnósticos de la prefactura',
      error: error.message
    });
  }
};

module.exports = {
  validateDiagnosis,
  validateServiceDiagnosis,
  validatePreBillDiagnoses,
  checkIfServiceRequiresDiagnosis
};