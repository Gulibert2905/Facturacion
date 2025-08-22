// src/services/customValidationService.js
// Un servicio de validación personalizado para tus necesidades específicas

/**
 * Valida los filtros para generar reportes
 * @param {Object} data - Filtros a validar
 * @returns {Object} Resultado de la validación
 */
export const validateRipsGeneration = (data, filters) => {
    const errors = [];
  
    // Validar fechas
    if (!data.startDate) {
      errors.push('La fecha de inicio es obligatoria');
    }
  
    if (!data.endDate) {
      errors.push('La fecha de fin es obligatoria');
    }
  
    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
      errors.push('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
  
    // IMPORTANTE: Validación personalizada para empresas
    // Comprobamos en los filtros originales si hay 'all' o alguna empresa específica
    const hasCompany = filters && (
      (filters.companies && filters.companies.length > 0) || 
      (filters.companies && filters.companies.includes('all'))
    );
    
    if (!hasCompany) {
      errors.push('Debe seleccionar una empresa');
    }
  
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  const customValidationService = {
    validateRipsGeneration
  };
  
  export default customValidationService;