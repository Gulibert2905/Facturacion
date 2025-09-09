// utils/dateValidation.js - Utilidades para validación de fechas en múltiples formatos

/**
 * Parsea una fecha desde múltiples formatos
 * @param {string|Date} dateString - La fecha como string o objeto Date
 * @returns {Date|null} - Objeto Date válido o null si es inválida
 */
export const parseFlexibleDate = (dateString) => {
  if (!dateString) return null;
  
  // Si ya es un objeto Date, verificar si es válido
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? null : dateString;
  }
  
  const str = dateString.toString().trim();
  if (!str) return null;
  
  // Patrones de fecha comunes
  const patterns = [
    // YYYY-MM-DD (ISO format)
    {
      regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      parser: (match) => new Date(match[1], match[2] - 1, match[3])
    },
    // DD/MM/YYYY (formato colombiano - prioridad)
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      parser: (match) => {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        
        // Si day > 12, definitivamente es DD/MM/YYYY
        if (day > 12) {
          return new Date(year, month - 1, day);
        }
        // Si month > 12, definitivamente es MM/DD/YYYY
        if (month > 12) {
          return new Date(year, day - 1, month);
        }
        // Si ambos son <= 12, asumir DD/MM/YYYY (formato colombiano)
        return new Date(year, month - 1, day);
      }
    },
    // DD-MM-YYYY (formato con guiones)
    {
      regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      parser: (match) => {
        const first = parseInt(match[1]);
        const second = parseInt(match[2]);
        const year = parseInt(match[3]);
        
        // Si first > 12, definitivamente es DD-MM-YYYY
        if (first > 12) {
          return new Date(year, second - 1, first);
        }
        // Si second > 12, definitivamente es MM-DD-YYYY  
        if (second > 12) {
          return new Date(year, first - 1, second);
        }
        // Si ambos son <= 12, asumir DD-MM-YYYY (formato colombiano)
        return new Date(year, second - 1, first);
      }
    },
    // DD.MM.YYYY
    {
      regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
      parser: (match) => new Date(match[3], match[2] - 1, match[1])
    }
  ];
  
  // Intentar cada patrón
  for (const pattern of patterns) {
    const match = str.match(pattern.regex);
    if (match) {
      try {
        const date = pattern.parser(match);
        // Validar que la fecha sea válida
        if (date && !isNaN(date.getTime())) {
          // Validar rangos razonables
          const year = date.getFullYear();
          if (year >= 1900 && year <= 2100) {
            return date;
          }
        }
      } catch (error) {
        continue;
      }
    }
  }
  
  // Intentar con Date constructor nativo como último recurso
  try {
    const nativeDate = new Date(str);
    if (!isNaN(nativeDate.getTime())) {
      const year = nativeDate.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return nativeDate;
      }
    }
  } catch (error) {
    // Ignorar error
  }
  
  return null;
};

/**
 * Valida si una fecha está en un formato válido
 * @param {string|Date} dateValue - La fecha a validar
 * @returns {object} - {isValid: boolean, date: Date|null, error: string|null}
 */
export const validateFlexibleDate = (dateValue) => {
  if (!dateValue) {
    return { isValid: false, date: null, error: 'Fecha requerida' };
  }
  
  const parsedDate = parseFlexibleDate(dateValue);
  
  if (!parsedDate) {
    return { 
      isValid: false, 
      date: null, 
      error: 'Fecha inválida. Formatos válidos: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY' 
    };
  }
  
  // Validaciones adicionales
  const now = new Date();
  const year = parsedDate.getFullYear();
  
  // Validar que no sea una fecha futura para fechas de nacimiento
  if (parsedDate > now) {
    return { 
      isValid: false, 
      date: parsedDate, 
      error: 'La fecha no puede ser futura' 
    };
  }
  
  // Validar rango razonable
  if (year < 1900 || year > now.getFullYear()) {
    return { 
      isValid: false, 
      date: parsedDate, 
      error: `El año debe estar entre 1900 y ${now.getFullYear()}` 
    };
  }
  
  return { isValid: true, date: parsedDate, error: null };
};

/**
 * Valida fecha de servicio (puede ser futura pero con límites)
 * @param {string|Date} dateValue - La fecha a validar
 * @returns {object} - {isValid: boolean, date: Date|null, error: string|null}
 */
export const validateServiceDate = (dateValue) => {
  if (!dateValue) {
    return { isValid: false, date: null, error: 'Fecha de servicio requerida' };
  }
  
  const parsedDate = parseFlexibleDate(dateValue);
  
  if (!parsedDate) {
    return { 
      isValid: false, 
      date: null, 
      error: 'Fecha inválida. Formatos válidos: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY' 
    };
  }
  
  const now = new Date();
  const year = parsedDate.getFullYear();
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1); // Máximo 1 año en el futuro
  
  // Validar rango razonable (desde 2000 hasta 1 año en el futuro)
  if (year < 2000) {
    return { 
      isValid: false, 
      date: parsedDate, 
      error: 'La fecha de servicio no puede ser anterior a 2000' 
    };
  }
  
  if (parsedDate > maxFutureDate) {
    return { 
      isValid: false, 
      date: parsedDate, 
      error: 'La fecha de servicio no puede ser más de 1 año en el futuro' 
    };
  }
  
  return { isValid: true, date: parsedDate, error: null };
};

/**
 * Formatea una fecha para mostrar en la UI
 * @param {Date} date - La fecha a formatear
 * @returns {string} - Fecha formateada como YYYY-MM-DD
 */
export const formatDateForDisplay = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  return date.toISOString().split('T')[0];
};

/**
 * Obtiene un mensaje de error descriptivo para fechas
 * @param {string} fieldName - Nombre del campo
 * @returns {string} - Mensaje de error
 */
export const getDateErrorMessage = (fieldName = 'fecha') => {
  return `${fieldName} inválida. Use uno de estos formatos: YYYY-MM-DD (ej: 2024-01-15), DD/MM/YYYY (ej: 15/01/2024), DD-MM-YYYY (ej: 15-01-2024), DD.MM.YYYY (ej: 15.01.2024)`;
};