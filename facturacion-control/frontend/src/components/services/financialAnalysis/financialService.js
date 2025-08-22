  // src/services/financialAnalysis/financialService.js
  import apiService from '../apiService';

  /**
   * Servicio para obtener y procesar datos financieros
   */
  const financialService = {
    /**
     * Obtiene resumen de KPIs financieros
     * @param {Object} params - Parámetros de filtrado (fechas, etc.)
     * @returns {Promise} - Promesa con datos de KPIs
     */
    getFinancialKPIs: async (params = {}) => {
      try {
        return await apiService.get('/api/financial/kpis', { params });
      } catch (error) {
        console.error('Error al obtener KPIs financieros:', error);
        throw error;
      }
    },

    /**
     * Obtiene datos de facturación para análisis de tendencias
     * @param {Object} params - Parámetros de filtrado (período, agrupación, etc.)
     * @returns {Promise} - Promesa con datos de facturación
     */
    getBillingTrends: async (params = {}) => {
      try {
        return await apiService.get('/api/financial/billing-trends', { params });
      } catch (error) {
        console.error('Error al obtener tendencias de facturación:', error);
        throw error;
      }
    },

    /**
     * Obtiene datos de recaudos para análisis de tendencias
     * @param {Object} params - Parámetros de filtrado (período, agrupación, etc.)
     * @returns {Promise} - Promesa con datos de recaudos
     */
    getCollectionTrends: async (params = {}) => {
      try {
        return await apiService.get('/api/financial/collection-trends', { params });
      } catch (error) {
        console.error('Error al obtener tendencias de recaudos:', error);
        throw error;
      }
    },

    /**
     * Obtiene proyecciones financieras basadas en datos históricos
     * @param {Object} params - Parámetros para la proyección (periodo, método, etc.)
     * @returns {Promise} - Promesa con datos de proyección
     */
    getFinancialProjections: async (params = {}) => {
      try {
        return await apiService.get('/api/financial/projections', { params });
      } catch (error) {
        console.error('Error al obtener proyecciones financieras:', error);
        throw error;
      }
    },

    /**
     * Obtiene análisis de cartera por edades
     * @param {Object} params - Parámetros de filtrado (fecha corte, entidad, etc.)
     * @returns {Promise} - Promesa con datos de cartera
     */
    getAccountsReceivableAging: async (params = {}) => {
      try {
        return await apiService.get('/api/financial/accounts-receivable', { params });
      } catch (error) {
        console.error('Error al obtener análisis de cartera:', error);
        throw error;
      }
    },

    /**
     * Obtiene análisis de rentabilidad por servicio o contrato
     * @param {Object} params - Parámetros de filtrado (servicio, contrato, período, etc.)
     * @returns {Promise} - Promesa con datos de rentabilidad
     */
    getProfitabilityAnalysis: async (params = {}) => {
      try {
        return await apiService.get('/api/financial/profitability', { params });
      } catch (error) {
        console.error('Error al obtener análisis de rentabilidad:', error);
        throw error;
      }
    },

    /**
     * Exporta informe financiero en formato solicitado
     * @param {string} reportType - Tipo de informe a exportar
     * @param {Object} params - Parámetros del informe
     * @param {string} format - Formato de exportación ('PDF', 'EXCEL', 'CSV')
     * @returns {Promise} - Promesa con URL de descarga
     */
    exportFinancialReport: async (reportType, params = {}, format = 'PDF') => {
      try {
        const response = await apiService.post(`/api/financial/export/${reportType}`, {
          params,
          format
        });
        
        if (response.downloadUrl) {
          window.open(response.downloadUrl, '_blank');
        }
        
        return response;
      } catch (error) {
        console.error('Error al exportar informe financiero:', error);
        throw error;
      }
    }
  };

  export default financialService;