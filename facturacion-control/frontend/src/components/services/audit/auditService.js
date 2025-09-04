// src/services/audit/auditService.js
import { apiService } from '../apiService';

/**
 * Servicio para gestión de auditorías
 */
const auditService = {
  /**
   * Ejecuta una auditoría con los parámetros especificados
   * @param {Object} params - Parámetros para la auditoría
   * @param {string} params.startDate - Fecha de inicio del período a auditar
   * @param {string} params.endDate - Fecha de fin del período a auditar
   * @param {string[]} params.ruleIds - IDs de reglas de auditoría a aplicar
   * @param {string[]} params.entityIds - IDs de entidades a auditar
   * @param {string[]} params.contractIds - IDs de contratos a auditar
   * @returns {Promise} - Promesa con resultados de auditoría
   */
  runAudit: async (params = {}) => {
    try {
      return await apiService.post('/audit/run', params);
    } catch (error) {
      console.error('Error al ejecutar auditoría:', error);
      throw error;
    }
  },

  /**
   * Obtiene resultados de auditorías anteriores
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise} - Promesa con resultados de auditorías
   */
  getAuditResults: async (filters = {}) => {
    try {
      return await apiService.get('/audit/results', { params: filters });
    } catch (error) {
      console.error('Error al obtener resultados de auditoría:', error);
      throw error;
    }
  },

  /**
   * Obtiene detalles de un resultado específico de auditoría
   * @param {string} resultId - ID del resultado de auditoría
   * @returns {Promise} - Promesa con detalles del resultado
   */
  getAuditResultDetails: async (resultId) => {
    try {
      return await apiService.get(`/api/audit/results/${resultId}`);
    } catch (error) {
      console.error('Error al obtener detalles de resultado:', error);
      throw error;
    }
  },

  /**
   * Verifica servicios facturados contra reglas y parámetros
   * @param {Object} params - Parámetros para verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyServices: async (params = {}) => {
    try {
      return await apiService.post('/audit/verify-services', params);
    } catch (error) {
      console.error('Error al verificar servicios:', error);
      throw error;
    }
  },

  /**
   * Valida facturación contra contratos
   * @param {Object} params - Parámetros para validación
   * @returns {Promise} - Promesa con resultados de validación
   */
  validateContracts: async (params = {}) => {
    try {
      return await apiService.post('/audit/validate-contracts', params);
    } catch (error) {
      console.error('Error al validar contratos:', error);
      throw error;
    }
  },

  /**
   * Detecta inconsistencias en datos de facturación
   * @param {Object} params - Parámetros para detección
   * @returns {Promise} - Promesa con inconsistencias detectadas
   */
  detectInconsistencies: async (params = {}) => {
    try {
      return await apiService.post('/audit/detect-inconsistencies', params);
    } catch (error) {
      console.error('Error al detectar inconsistencias:', error);
      throw error;
    }
  },

  /**
   * Exporta resultados de auditoría en formato solicitado
   * @param {string} resultId - ID del resultado de auditoría
   * @param {string} format - Formato de exportación (PDF, EXCEL, CSV)
   * @returns {Promise} - Promesa con URL de descarga
   */
  exportAuditResults: async (resultId, format = 'PDF') => {
    try {
      const response = await apiService.get(`/api/audit/export/${resultId}`, {
        params: { format }
      });
      
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      }
      
      return response;
    } catch (error) {
      console.error('Error al exportar resultados:', error);
      throw error;
    }
  },

  /**
   * Marca un hallazgo como revisado
   * @param {string} findingId - ID del hallazgo
   * @param {Object} reviewData - Datos de la revisión
   * @returns {Promise} - Promesa con resultado de la operación
   */
  markFindingAsReviewed: async (findingId, reviewData = {}) => {
    try {
      return await apiService.post(`/api/audit/findings/${findingId}/review`, reviewData);
    } catch (error) {
      console.error('Error al marcar hallazgo como revisado:', error);
      throw error;
    }
  },

  /**
   * Aplica acciones correctivas a hallazgos
   * @param {string} findingId - ID del hallazgo
   * @param {Object} correctionData - Datos de la corrección
   * @returns {Promise} - Promesa con resultado de la operación
   */
  applyCorrection: async (findingId, correctionData = {}) => {
    try {
      return await apiService.post(`/api/audit/findings/${findingId}/correct`, correctionData);
    } catch (error) {
      console.error('Error al aplicar corrección:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas resumidas de auditoría
   * @param {Object} params - Parámetros para las estadísticas
   * @returns {Promise} - Promesa con estadísticas
   */
  getAuditStats: async (params = {}) => {
    try {
      return await apiService.get('/audit/stats', { params });
    } catch (error) {
      console.error('Error al obtener estadísticas de auditoría:', error);
      throw error;
    }
  }
};

export default auditService;