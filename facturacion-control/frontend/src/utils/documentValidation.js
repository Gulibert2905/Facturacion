// src/utils/documentValidation.js

/**
 * Utilidades para validar tipos de documento según la edad del paciente
 * Reglas de validación:
 * - 0-7 años: Registro Civil (RC)
 * - 8-17 años: Tarjeta de Identidad (TI) 
 * - 18+ años: Cédula de Ciudadanía (CC)
 * - Excepciones: PT (Permiso Temporal), CE (Cédula Extranjería), PA (Pasaporte) son válidos para cualquier edad
 */

export const documentTypes = [
  { value: 'CC', label: 'Cédula de Ciudadanía', ageRange: [18, 150] },
  { value: 'TI', label: 'Tarjeta de Identidad', ageRange: [8, 17] },
  { value: 'RC', label: 'Registro Civil', ageRange: [0, 7] },
  { value: 'CE', label: 'Cédula de Extranjería', ageRange: null }, // Sin restricción de edad
  { value: 'PA', label: 'Pasaporte', ageRange: null }, // Sin restricción de edad
  { value: 'PT', label: 'Permiso Temporal', ageRange: null } // Sin restricción de edad
];

/**
 * Calcula la edad exacta a partir de una fecha de nacimiento
 * @param {Date|string} birthDate - Fecha de nacimiento
 * @returns {number|null} - Edad en años o null si la fecha es inválida
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // Ajustar si no ha pasado el cumpleaños este año
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }
  
  return age;
};

/**
 * Obtiene el tipo de documento recomendado según la edad
 * @param {number} age - Edad en años
 * @returns {string} - Código del tipo de documento recomendado
 */
export const getRecommendedDocumentType = (age) => {
  if (age === null || age === undefined) return '';
  
  if (age >= 0 && age <= 7) return 'RC';
  if (age >= 8 && age <= 17) return 'TI';
  if (age >= 18) return 'CC';
  
  return '';
};

/**
 * Valida si un tipo de documento es apropiado para la edad dada
 * @param {string} documentType - Tipo de documento (CC, TI, RC, CE, PA, PT)
 * @param {number} age - Edad en años
 * @returns {object} - Resultado de la validación
 */
export const validateDocumentTypeForAge = (documentType, age) => {
  if (!documentType || age === null || age === undefined) {
    return {
      isValid: true,
      message: '',
      severity: 'info'
    };
  }

  const docType = documentTypes.find(dt => dt.value === documentType);
  
  if (!docType) {
    return {
      isValid: false,
      message: 'Tipo de documento no válido',
      severity: 'error'
    };
  }

  // Los tipos sin restricción de edad siempre son válidos
  if (!docType.ageRange) {
    return {
      isValid: true,
      message: `${docType.label} válido para cualquier edad`,
      severity: 'success'
    };
  }

  const [minAge, maxAge] = docType.ageRange;
  
  if (age < minAge || age > maxAge) {
    const recommended = getRecommendedDocumentType(age);
    const recommendedDoc = documentTypes.find(dt => dt.value === recommended);
    
    return {
      isValid: false,
      message: `Para ${age} años se debe usar: ${recommendedDoc?.label || recommended}`,
      severity: 'error',
      recommendedType: recommended
    };
  }

  return {
    isValid: true,
    message: `${docType.label} apropiado para ${age} años`,
    severity: 'success'
  };
};

/**
 * Obtiene todos los tipos de documento válidos para una edad específica
 * @param {number} age - Edad en años
 * @returns {Array} - Lista de tipos de documento válidos
 */
export const getValidDocumentTypesForAge = (age) => {
  if (age === null || age === undefined) {
    return documentTypes;
  }

  return documentTypes.filter(docType => {
    if (!docType.ageRange) return true; // Sin restricción de edad
    
    const [minAge, maxAge] = docType.ageRange;
    return age >= minAge && age <= maxAge;
  });
};

/**
 * Formatea un tipo de documento para mostrar
 * @param {string} documentType - Código del tipo de documento
 * @returns {string} - Etiqueta legible del tipo de documento
 */
export const formatDocumentType = (documentType) => {
  const docType = documentTypes.find(dt => dt.value === documentType);
  return docType ? docType.label : documentType;
};

/**
 * Valida el número de documento según el tipo
 * @param {string} documentNumber - Número de documento
 * @param {string} documentType - Tipo de documento
 * @returns {object} - Resultado de la validación
 */
export const validateDocumentNumber = (documentNumber, documentType) => {
  if (!documentNumber) {
    return {
      isValid: false,
      message: 'Número de documento es requerido',
      severity: 'error'
    };
  }

  const cleanNumber = String(documentNumber).replace(/\D/g, '');
  
  if (cleanNumber !== String(documentNumber)) {
    return {
      isValid: false,
      message: 'El número de documento solo debe contener dígitos',
      severity: 'error'
    };
  }

  // Validaciones por tipo de documento
  switch (documentType) {
    case 'CC':
      if (cleanNumber.length < 6 || cleanNumber.length > 12) {
        return {
          isValid: false,
          message: 'Cédula debe tener entre 6 y 12 dígitos',
          severity: 'error'
        };
      }
      break;
      
    case 'TI':
      if (cleanNumber.length < 8 || cleanNumber.length > 11) {
        return {
          isValid: false,
          message: 'Tarjeta de Identidad debe tener entre 8 y 11 dígitos',
          severity: 'error'
        };
      }
      break;
      
    case 'RC':
      if (cleanNumber.length < 6 || cleanNumber.length > 15) {
        return {
          isValid: false,
          message: 'Registro Civil debe tener entre 6 y 15 dígitos',
          severity: 'error'
        };
      }
      break;
      
    default:
      if (cleanNumber.length < 6 || cleanNumber.length > 15) {
        return {
          isValid: false,
          message: 'Documento debe tener entre 6 y 15 dígitos',
          severity: 'error'
        };
      }
  }

  return {
    isValid: true,
    message: `Número de documento válido (${cleanNumber.length} dígitos)`,
    severity: 'success'
  };
};

export default {
  documentTypes,
  calculateAge,
  getRecommendedDocumentType,
  validateDocumentTypeForAge,
  getValidDocumentTypesForAge,
  formatDocumentType,
  validateDocumentNumber
};