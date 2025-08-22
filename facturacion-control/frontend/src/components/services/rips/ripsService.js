// src/services/rips/ripsService.js
import apiService from '../apiService';

/**
 * Servicio para la generación y gestión de RIPS
 * Implementa soporte para las resoluciones 3374 de 2000 y 2275 de 2023
 */
const ripsService = {
  /**
   * Genera archivos RIPS basados en parámetros y resolución especificada
   * @param {Object} params - Parámetros de generación (fechas, entidad, etc.)
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con el resultado de la generación
   */
  generateRips: async (params, resolution = '3374') => {
    try {
      const endpoint = resolution === '3374' 
        ? '/api/rips/generate-3374' 
        : '/api/rips/generate-2275';
      
      return await apiService.post(endpoint, params);
    } catch (error) {
      console.error('Error al generar RIPS:', error);
      throw error;
    }
  },

  /**
   * Valida datos antes de generar RIPS
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
   * Obtiene la estructura de archivos RIPS según la resolución
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con la estructura de archivos
   */
  getRipsStructure: async (resolution = '3374') => {
    try {
      return await apiService.get(`/api/rips/structure/${resolution}`);
    } catch (error) {
      console.error('Error al obtener estructura RIPS:', error);
      throw error;
    }
  },

  /**
   * Exporta RIPS en el formato especificado
   * @param {string} id - ID del lote RIPS a exportar
   * @param {string} format - Formato de exportación ('TXT', 'XML', 'CSV')
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con la URL de descarga
   */
  exportRips: async (id, format = 'TXT', resolution = '3374') => {
    try {
      return await apiService.get(`/api/rips/export/${id}`, {
        params: { format, resolution }
      });
    } catch (error) {
      console.error('Error al exportar RIPS:', error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de generación de RIPS
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise} - Promesa con el historial de RIPS
   */
  getRipsHistory: async (filters = {}) => {
    try {
      return await apiService.get('/api/rips/history', { params: filters });
    } catch (error) {
      console.error('Error al obtener historial RIPS:', error);
      throw error;
    }
  }
};

export default ripsService;