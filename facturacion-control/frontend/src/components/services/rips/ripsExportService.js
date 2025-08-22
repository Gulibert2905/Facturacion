// src/services/rips/ripsExportService.js
import apiService from '../apiService';

/**
 * Servicio para la exportación de RIPS en diferentes formatos
 */
const ripsExportService = {
  /**
   * Exporta RIPS en formato TXT (estándar oficial)
   * @param {string} id - ID del lote RIPS a exportar
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con la URL de descarga
   */
  exportToTXT: async (id, resolution = '3374') => {
    try {
      const endpoint = resolution === '3374' 
        ? '/api/rips/export/txt-3374' 
        : '/api/rips/export/txt-2275';
      
      const response = await apiService.get(`${endpoint}/${id}`);
      
      // Si el backend retorna URLs directas para descarga
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      }
      
      return response;
    } catch (error) {
      console.error('Error al exportar RIPS a TXT:', error);
      throw error;
    }
  },

  /**
   * Exporta RIPS en formato XML
   * @param {string} id - ID del lote RIPS a exportar
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con la URL de descarga
   */
  exportToXML: async (id, resolution = '3374') => {
    try {
      const endpoint = resolution === '3374' 
        ? '/api/rips/export/xml-3374' 
        : '/api/rips/export/xml-2275';
      
      const response = await apiService.get(`${endpoint}/${id}`);
      
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      }
      
      return response;
    } catch (error) {
      console.error('Error al exportar RIPS a XML:', error);
      throw error;
    }
  },

  /**
   * Exporta RIPS en formato CSV
   * @param {string} id - ID del lote RIPS a exportar
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con la URL de descarga
   */
  exportToCSV: async (id, resolution = '3374') => {
    try {
      const endpoint = resolution === '3374' 
        ? '/api/rips/export/csv-3374' 
        : '/api/rips/export/csv-2275';
      
      const response = await apiService.get(`${endpoint}/${id}`);
      
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      }
      
      return response;
    } catch (error) {
      console.error('Error al exportar RIPS a CSV:', error);
      throw error;
    }
  },

  /**
   * Exporta RIPS en cualquier formato especificado
   * @param {string} id - ID del lote RIPS a exportar
   * @param {string} format - Formato de exportación ('TXT', 'XML', 'CSV')
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Promise} - Promesa con el resultado de la exportación
   */
  exportRips: async (id, format = 'TXT', resolution = '3374') => {
    switch (format.toUpperCase()) {
      case 'XML':
        return await this.exportToXML(id, resolution);
      case 'CSV':
        return await this.exportToCSV(id, resolution);
      case 'TXT':
      default:
        return await this.exportToTXT(id, resolution);
    }
  },

  /**
   * Obtiene la lista de formatos disponibles según la resolución
   * @param {string} resolution - Resolución a aplicar ('3374' o '2275')
   * @returns {Array} - Array con formatos disponibles
   */
  getAvailableFormats: (resolution = '3374') => {
    // Formatos básicos disponibles para ambas resoluciones
    const formats = [
      { value: 'TXT', label: 'Texto plano (TXT) - Estándar oficial' },
      { value: 'CSV', label: 'CSV - Para trabajo en Excel' }
    ];
    
    // XML solo disponible para resolución 2275
    if (resolution === '2275') {
      formats.push({ value: 'XML', label: 'XML - Formato estructurado' });
    }
    
    return formats;
  },

  /**
   * Verifica si un lote RIPS está listo para exportación
   * @param {string} id - ID del lote RIPS
   * @returns {Promise} - Promesa con el estado del lote
   */
  checkExportStatus: async (id) => {
    try {
      return await apiService.get(`/api/rips/export-status/${id}`);
    } catch (error) {
      console.error('Error al verificar estado de exportación:', error);
      throw error;
    }
  }
};

export default ripsExportService;