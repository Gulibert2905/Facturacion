// src/services/customValidationService.js
// Un servicio de validación personalizado para tus necesidades específicas

/**
 * Valida los filtros para generar reportes
 * @param {Object} data - Filtros a validar
 * @returns {Object} Resultado de la validación
 */
const validateRipsGeneration = (data, originalFilters) => {
  const errors = [];

  // Validar fechas obligatorias
  if (!data.startDate) {
    errors.push('La fecha de inicio es obligatoria');
  }

  if (!data.endDate) {
    errors.push('La fecha de fin es obligatoria');
  }

  // Validar formato de fechas
  if (data.startDate) {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push('La fecha de inicio no es válida');
    }
  }

  if (data.endDate) {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push('La fecha de fin no es válida');
    }
  }

  // Validar rango de fechas
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (startDate > endDate) {
      errors.push('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
    
    // Validar que el rango no sea demasiado amplio (opcional)
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      errors.push('El rango de fechas no puede ser mayor a un año');
    }
  }

  // Nota: Removí la validación obligatoria de empresa ya que según tu lógica, 
  // "Todas" es una opción válida y se maneja en el backend

  return {
    isValid: errors.length === 0,
    errors
  };
};
  
  const customValidationService = {
    validateRipsGeneration
  };
  
  export default customValidationService;