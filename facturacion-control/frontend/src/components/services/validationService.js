// src/services/validationService.js

/**
 * Servicio para validaciones de datos en el sistema de facturación
 */
class ValidationService {
    /**
     * Valida un objeto paciente
     * @param {Object} patient - Objeto con datos del paciente
     * @returns {Object} Resultado de la validación
     */
    validatePatient(patient) {
      const errors = [];
      const warnings = [];
      
      // Campos requeridos
      const requiredFields = [
        { field: 'documentType', name: 'Tipo de documento' },
        { field: 'documentNumber', name: 'Número de documento' },
        { field: 'firstName', name: 'Primer nombre' },
        { field: 'firstLastName', name: 'Primer apellido' }
      ];
      
      // Validar campos requeridos
      requiredFields.forEach(field => {
        if (!patient[field.field] || patient[field.field].trim() === '') {
          errors.push(`El campo "${field.name}" es obligatorio`);
        }
      });
      
      // Validar tipo de documento
      if (patient.documentType && !['CC', 'TI', 'CE', 'PA', 'RC'].includes(patient.documentType)) {
        errors.push('Tipo de documento inválido (debe ser CC, TI, CE, PA o RC)');
      }
      
      // Validar número de documento
      if (patient.documentNumber && !/^[0-9]+$/.test(patient.documentNumber)) {
        errors.push('El número de documento solo debe contener dígitos');
      }
      
      // Validar género
      if (patient.gender && !['M', 'F'].includes(patient.gender)) {
        errors.push('Género inválido (debe ser M o F)');
      }
      
      // Validar fecha de nacimiento
      if (patient.birthDate) {
        const birthDate = new Date(patient.birthDate);
        if (isNaN(birthDate.getTime())) {
          errors.push('Fecha de nacimiento inválida');
        } else {
          const now = new Date();
          if (birthDate > now) {
            errors.push('La fecha de nacimiento no puede ser futura');
          }
          
          // Calcular edad
          const age = now.getFullYear() - birthDate.getFullYear();
          
          // Advertencia si el paciente es mayor a 100 años
          if (age > 100) {
            warnings.push('El paciente tiene más de 100 años, verifique la fecha de nacimiento');
          }
        }
      } else {
        warnings.push('No se ha especificado la fecha de nacimiento');
      }
      
      // Validar régimen
      if (patient.regimen && !['Contributivo', 'Subsidiado', 'Particular'].includes(patient.regimen)) {
        warnings.push('Régimen no reconocido (valores comunes: Contributivo, Subsidiado, Particular)');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    }
    
    /**
     * Valida un objeto servicio
     * @param {Object} service - Objeto con datos del servicio
     * @param {Object} contract - Objeto contrato relacionado (opcional)
     * @returns {Object} Resultado de la validación
     */
    validateService(service, contract = null) {
      const errors = [];
      const warnings = [];
      
      // Validar campos requeridos para un servicio
      if (!service.serviceDate) {
        errors.push('La fecha del servicio es obligatoria');
      }
      
      if (!service.cupsCode) {
        errors.push('El código CUPS es obligatorio');
      } else {
        // Validar formato de CUPS (patrón simplificado)
        const cupsPattern = /^\d{6}$/;
        if (!cupsPattern.test(service.cupsCode)) {
          warnings.push('El formato del código CUPS podría ser incorrecto, verifique');
        }
      }
      
      if (!service.value || isNaN(service.value) || service.value <= 0) {
        errors.push('El valor del servicio debe ser un número positivo');
      }
      
      // Validaciones según el contrato (si se proporciona)
      if (contract) {
        // Verificar si el servicio está incluido en el contrato
        if (contract.services && !contract.services.includes(service.cupsCode)) {
          errors.push('Este servicio no está incluido en el contrato seleccionado');
        }
        
        // Verificar si el servicio requiere autorización
        if (contract.requiresAuthorization && 
            (!service.authorization || service.authorization.trim() === '')) {
          errors.push('Este servicio requiere autorización según el contrato');
        }
        
        // Verificar tarifa según contrato
        if (contract.tariffs && contract.tariffs[service.cupsCode] && 
            contract.tariffs[service.cupsCode] !== service.value) {
          warnings.push(`El valor del servicio no coincide con la tarifa del contrato (${contract.tariffs[service.cupsCode]})`);
        }
      }
      
      // Validar diagnóstico
      if (!service.diagnosis || service.diagnosis.trim() === '') {
        warnings.push('Se recomienda incluir un diagnóstico para el servicio');
      } else {
        // Validar formato CIE10 (ejemplo básico)
        const cie10Pattern = /^[A-Z][0-9][0-9](\.[0-9])?$/;
        if (!cie10Pattern.test(service.diagnosis)) {
          warnings.push('El formato del diagnóstico no parece seguir el estándar CIE-10');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    }
    
    /**
     * Valida datos para generación de RIPS
     * @param {Object} params - Parámetros para generación de RIPS
     * @returns {Object} Resultado de la validación
     */
    validateRipsGeneration(params) {
      const errors = [];
      const warnings = [];
      
      // Verificar fechas
      if (!params.startDate || !params.endDate) {
        errors.push('Las fechas de inicio y fin son obligatorias');
      } else {
        const startDate = new Date(params.startDate);
        const endDate = new Date(params.endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.push('Formato de fecha inválido');
        } else if (startDate > endDate) {
          errors.push('La fecha de inicio debe ser anterior a la fecha fin');
        } else {
          // Verificar que el período no sea mayor a un mes (advertencia)
          const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos
          if (endDate - startDate > oneMonth) {
            warnings.push('El período seleccionado es mayor a un mes, esto podría generar archivos muy grandes');
          }
        }
      }
      
      // Verificar empresa y contrato
      if (!params.company) {
        errors.push('Debe seleccionar una empresa');
      }
      
      // Verificar resolución RIPS
      if (!params.resolution || !['2275', '3374'].includes(params.resolution)) {
        warnings.push('No se ha especificado la resolución RIPS o el valor no es válido');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    }
    
    /**
     * Valida datos para creación de prefactura
     * @param {Object} preBillData - Datos de la prefactura
     * @returns {Object} Resultado de la validación
     */
    validatePreBill(preBillData) {
      const errors = [];
      const warnings = [];
      
      // Verificar campos requeridos
      if (!preBillData.companyId) {
        errors.push('Debe seleccionar una empresa');
      }
      
      if (!preBillData.contractId) {
        errors.push('Debe seleccionar un contrato');
      }
      
      if (!preBillData.patientId) {
        errors.push('Debe seleccionar un paciente');
      }
      
      // Verificar servicios
      if (!preBillData.services || !Array.isArray(preBillData.services) || preBillData.services.length === 0) {
        errors.push('Debe incluir al menos un servicio en la prefactura');
      } else {
        // Verificar que los servicios tengan los campos mínimos
        preBillData.services.forEach((service, index) => {
          if (!service.serviceId) {
            errors.push(`El servicio #${index + 1} no tiene ID`);
          }
          
          if (!service.cupsCode) {
            errors.push(`El servicio #${index + 1} no tiene código CUPS`);
          }
          
          if (!service.value || isNaN(service.value) || service.value <= 0) {
            errors.push(`El servicio #${index + 1} tiene un valor inválido`);
          }
        });
      }
      
      // Verificar totalValue (si existe)
      if (preBillData.totalValue) {
        const calculatedTotal = preBillData.services ?
          preBillData.services.reduce((sum, service) => sum + (service.value || 0), 0) :
          0;
        
        if (preBillData.totalValue !== calculatedTotal) {
          warnings.push(`El valor total (${preBillData.totalValue}) no coincide con la suma de los servicios (${calculatedTotal})`);
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    }
  }
  
  // Exportar una instancia única del servicio
  export const validationService = new ValidationService();
  
  // También exportar la clase para pruebas o extensión
  export default ValidationService;