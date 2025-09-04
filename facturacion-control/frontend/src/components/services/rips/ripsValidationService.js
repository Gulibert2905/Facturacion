// src/services/rips/ripsValidationService.js
import { apiService } from '../apiService';

/**
 * Servicio para la validación de datos RIPS
 * Implementa las reglas de validación para las resoluciones 3374 y 2275
 */
const ripsValidationService = {
  /**
   * Obtiene la estructura de archivos RIPS según la resolución
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con la estructura de archivos
   */
  getRipsStructure: async (resolution = '3374') => {
    try {
      // En un entorno real, esto se obtendría del backend
      // Por ahora, devolvemos datos estáticos según la resolución
      if (resolution === '3374') {
        return {
          fileTypes: [
            { code: 'AF', name: 'Archivo de transacciones' },
            { code: 'CT', name: 'Archivo de consultas' },
            { code: 'AC', name: 'Archivo de otros servicios' },
            { code: 'AP', name: 'Archivo de procedimientos' },
            { code: 'AM', name: 'Archivo de medicamentos' },
            { code: 'AT', name: 'Archivo de servicios de urgencias con observación' },
            { code: 'AU', name: 'Archivo de usuarios' },
            { code: 'AH', name: 'Archivo de hospitalización' },
            { code: 'AN', name: 'Archivo de recién nacidos' },
            { code: 'US', name: 'Archivo de descripción' },
            { code: 'AD', name: 'Archivo de descripción agrupada' }
          ],
          version: '3374 de 2000'
        };
      } else {
        return {
          fileTypes: [
            { code: 'AFCT', name: 'Archivo de transacciones (nuevo formato)' },
            { code: 'ATUS', name: 'Archivo de usuarios (nuevo formato)' },
            { code: 'ACCT', name: 'Archivo de consultas (nuevo formato)' },
            { code: 'APCT', name: 'Archivo de procedimientos (nuevo formato)' },
            { code: 'AMCT', name: 'Archivo de medicamentos (nuevo formato)' },
            { code: 'AHCT', name: 'Archivo de hospitalización (nuevo formato)' },
            { code: 'ANCT', name: 'Archivo de recién nacidos (nuevo formato)' },
            { code: 'AUCT', name: 'Archivo de urgencias (nuevo formato)' },
            { code: 'ADCT', name: 'Archivo de descripción (nuevo formato)' }
          ],
          version: '2275 de 2023'
        };
      }
    } catch (error) {
      console.error('Error al obtener estructura RIPS:', error);
      throw error;
    }
  },

  /**
   * Valida un conjunto de datos RIPS
   * @param {Object} data - Datos a validar
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con el resultado de la validación
   */
  validateRipsData: async (data, resolution = '3374') => {
    try {
      const endpoint = resolution === '3374' 
        ? '/api/rips/validate-3374' 
        : '/api/rips/validate-2275';
      
      return await apiService.post(endpoint, data);
    } catch (error) {
      console.error('Error al validar datos RIPS:', error);
      throw error;
    }
  },

  /**
   * Realiza validación local de datos básicos
   * @param {Object} data - Datos a validar
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Object} - Resultado preliminar de validación
   */
  validateBasicData: (data, resolution = '3374') => {
    const errors = [];
    const warnings = [];

    // Validaciones comunes para ambas resoluciones
    if (!data.startDate || !data.endDate) {
      errors.push({
        file: 'General',
        field: 'Período',
        message: 'Debe definir fechas de inicio y fin del período'
      });
    }

    if (!data.entityCode) {
      errors.push({
        file: 'General',
        field: 'Entidad',
        message: 'Debe seleccionar una entidad'
      });
    }

    // Validaciones específicas según resolución
    if (resolution === '3374') {
      // Validaciones para resolución 3374
      if (data.includeFiles && !data.includeFiles.includes('AF')) {
        errors.push({
          file: 'AF',
          field: 'Archivo de transacciones',
          message: 'El archivo AF es obligatorio en la resolución 3374'
        });
      }
      
      // Más validaciones específicas para 3374...
    } else {
      // Validaciones para resolución 2275
      if (data.includeFiles && !data.includeFiles.includes('AFCT')) {
        errors.push({
          file: 'AFCT',
          field: 'Archivo de transacciones',
          message: 'El archivo AFCT es obligatorio en la resolución 2275'
        });
      }
      
      // Más validaciones específicas para 2275...
    }

    // Retornar resultado de validación local
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Obtiene las reglas de validación para un tipo de archivo específico
   * @param {string} fileType - Tipo de archivo (AF, CT, etc.)
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con las reglas de validación
   */
  getValidationRules: async (fileType, resolution = '3374') => {
    try {
      return await apiService.get(`/api/rips/validation-rules/${resolution}/${fileType}`);
    } catch (error) {
      console.error('Error al obtener reglas de validación:', error);
      throw error;
    }
  }
};

export default ripsValidationService;