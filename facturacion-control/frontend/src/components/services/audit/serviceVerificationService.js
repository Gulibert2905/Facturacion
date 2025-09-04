// src/services/audit/serviceVerificationService.js
import { apiService } from '../apiService';

/**
 * Servicio especializado para verificación automática de servicios
 */
const serviceVerificationService = {
  /**
   * Tipos de verificación disponibles
   */
  verificationType: [
    {
      id: 'auth_required',
      name: 'Autorización Requerida',
      description: 'Verifica que el servicio tenga una autorización válida'
    },
    {
      id: 'code_validity',
      name: 'Validez de Códigos',
      description: 'Verifica que los códigos de servicios sean válidos según normativas'
    },
    {
      id: 'service_coverage',
      name: 'Cobertura del Servicio',
      description: 'Verifica que el servicio esté cubierto por el plan del paciente'
    },
    {
      id: 'quantity_limits',
      name: 'Límites de Cantidad',
      description: 'Verifica que no se excedan cantidades máximas permitidas'
    },
    {
      id: 'documentation_required',
      name: 'Documentación Requerida',
      description: 'Verifica que exista la documentación soporte necesaria'
    },
    {
      id: 'medical_necessity',
      name: 'Necesidad Médica',
      description: 'Verifica que el servicio sea médicamente necesario según diagnóstico'
    }
  ],

  /**
   * Realiza verificación general de servicios
   * @param {Object} params - Parámetros de verificación
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
   * Verifica autorizaciones de servicios
   * @param {Object} params - Parámetros de verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyAuthorizations: async (params = {}) => {
    try {
      return await apiService.post('/audit/verify-authorizations', params);
    } catch (error) {
      console.error('Error al verificar autorizaciones:', error);
      throw error;
    }
  },

  /**
   * Verifica validez de códigos de servicios
   * @param {Object} params - Parámetros de verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyServiceCodes: async (params = {}) => {
    try {
      return await apiService.post('/audit/verify-service-codes', params);
    } catch (error) {
      console.error('Error al verificar códigos de servicios:', error);
      throw error;
    }
  },

  /**
   * Verifica cobertura de servicios según planes
   * @param {Object} params - Parámetros de verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyServiceCoverage: async (params = {}) => {
    try {
      return await apiService.post('/audit/verify-service-coverage', params);
    } catch (error) {
      console.error('Error al verificar cobertura de servicios:', error);
      throw error;
    }
  },

  /**
   * Verifica límites de cantidad en servicios
   * @param {Object} params - Parámetros de verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyQuantityLimits: async (params = {}) => {
    try {
      return await apiService.post('/audit/verify-quantity-limits', params);
    } catch (error) {
      console.error('Error al verificar límites de cantidad:', error);
      throw error;
    }
  },

  /**
   * Verifica documentación requerida para servicios
   * @param {Object} params - Parámetros de verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyDocumentation: async (params = {}) => {
    try {
      return await apiService.post('/audit/verify-documentation', params);
    } catch (error) {
      console.error('Error al verificar documentación:', error);
      throw error;
    }
  },

  /**
   * Verifica necesidad médica de servicios
   * @param {Object} params - Parámetros de verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyMedicalNecessity: async (params = {}) => {
    try {
      return await apiService.post('/audit/verify-medical-necessity', params);
    } catch (error) {
      console.error('Error al verificar necesidad médica:', error);
      throw error;
    }
  },

  /**
   * Verifica servicios para un paciente específico
   * @param {string} patientId - ID del paciente
   * @param {Object} params - Parámetros de verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyPatientServices: async (patientId, params = {}) => {
    try {
      return await apiService.post(`/api/audit/verify-patient-services/${patientId}`, params);
    } catch (error) {
      console.error('Error al verificar servicios del paciente:', error);
      throw error;
    }
  },

  /**
   * Verifica servicios para una factura específica
   * @param {string} invoiceId - ID de la factura
   * @param {Object} params - Parámetros de verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyInvoiceServices: async (invoiceId, params = {}) => {
    try {
      return await apiService.post(`/api/audit/verify-invoice-services/${invoiceId}`, params);
    } catch (error) {
      console.error('Error al verificar servicios de factura:', error);
      throw error;
    }
  },

  /**
   * Obtiene matriz de verificación de servicios
   * La matriz define qué verificaciones aplicar a cada tipo de servicio
   * @returns {Promise} - Promesa con matriz de verificación
   */
  getVerificationMatrix: async () => {
    try {
      return await apiService.get('/audit/verification-matrix');
    } catch (error) {
      console.error('Error al obtener matriz de verificación:', error);
      throw error;
    }
  },

  /**
   * Actualiza matriz de verificación de servicios
   * @param {Object} matrixData - Datos de la matriz de verificación
   * @returns {Promise} - Promesa con resultado de la operación
   */
  updateVerificationMatrix: async (matrixData) => {
    try {
      return await apiService.put('/audit/verification-matrix', matrixData);
    } catch (error) {
      console.error('Error al actualizar matriz de verificación:', error);
      throw error;
    }
  },

  /**
   * Verifica consistencia de códigos de diagnóstico y procedimiento
   * @param {Object} params - Parámetros de verificación
   * @returns {Promise} - Promesa con resultados de verificación
   */
  verifyDiagnosisProcedureConsistency: async (params = {}) => {
    try {
      return await apiService.post('/audit/verify-diagnosis-procedure', params);
    } catch (error) {
      console.error('Error al verificar consistencia diagnóstico-procedimiento:', error);
      throw error;
    }
  }
};

export default serviceVerificationService;