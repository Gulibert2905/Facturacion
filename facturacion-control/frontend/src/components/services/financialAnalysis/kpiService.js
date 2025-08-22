// src/services/financialAnalysis/kpiService.js
import apiService from '../apiService';

/**
 * Servicio para el cálculo y procesamiento de KPIs financieros
 */
const kpiService = {
  /**
   * Lista de KPIs disponibles
   */
  availableKPIs: [
    {
      id: 'total_invoiced',
      name: 'Total Facturado',
      description: 'Monto total facturado en el período',
      category: 'revenue',
      format: 'currency'
    },
    {
      id: 'total_collected',
      name: 'Total Recaudado',
      description: 'Monto total recaudado en el período',
      category: 'revenue',
      format: 'currency'
    },
    {
      id: 'collection_ratio',
      name: 'Índice de Recaudo',
      description: 'Porcentaje de lo facturado que ha sido recaudado',
      category: 'efficiency',
      format: 'percentage'
    },
    {
      id: 'avg_days_collection',
      name: 'Promedio Días de Cobro',
      description: 'Tiempo promedio para cobrar facturas',
      category: 'efficiency',
      format: 'days'
    },
    {
      id: 'invoice_rejection_rate',
      name: 'Tasa de Rechazo',
      description: 'Porcentaje de facturas rechazadas',
      category: 'quality',
      format: 'percentage'
    },
    {
      id: 'invoice_glosa_rate',
      name: 'Tasa de Glosas',
      description: 'Porcentaje del valor facturado con glosas',
      category: 'quality',
      format: 'percentage'
    },
    {
      id: 'top_debtors',
      name: 'Principales Deudores',
      description: 'Entidades con mayor deuda pendiente',
      category: 'accounts_receivable',
      format: 'list'
    },
    {
      id: 'aging_receivables',
      name: 'Cartera por Edades',
      description: 'Distribución de la cartera por edades',
      category: 'accounts_receivable',
      format: 'distribution'
    },
    {
      id: 'profit_margin',
      name: 'Margen de Rentabilidad',
      description: 'Porcentaje de rentabilidad sobre facturación',
      category: 'profitability',
      format: 'percentage'
    },
    {
      id: 'revenue_growth',
      name: 'Crecimiento de Ingresos',
      description: 'Tasa de crecimiento en comparación con período anterior',
      category: 'growth',
      format: 'percentage'
    }
  ],

  /**
   * Obtiene el valor de un KPI específico
   * @param {string} kpiId - Identificador del KPI
   * @param {Object} params - Parámetros para el cálculo (fechas, filtros, etc.)
   * @returns {Promise} - Promesa con el valor del KPI
   */
  getKPIValue: async (kpiId, params = {}) => {
    try {
      return await apiService.get(`/api/financial/kpi/${kpiId}`, { params });
    } catch (error) {
      console.error(`Error al obtener KPI ${kpiId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene un conjunto de KPIs relacionados
   * @param {string} category - Categoría de KPIs (revenue, efficiency, etc.)
   * @param {Object} params - Parámetros comunes para todos los KPIs
   * @returns {Promise} - Promesa con los valores de los KPIs
   */
  getKPIsByCategory: async (category, params = {}) => {
    try {
      const kpisInCategory = kpiService.availableKPIs.filter(
        kpi => kpi.category === category
      ).map(kpi => kpi.id);
      
      return await apiService.post('/api/financial/kpis/batch', {
        kpiIds: kpisInCategory,
        params
      });
    } catch (error) {
      console.error(`Error al obtener KPIs de categoría ${category}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de un KPI a lo largo del tiempo
   * @param {string} kpiId - Identificador del KPI
   * @param {Object} params - Parámetros para el cálculo (fechas, periodicidad, etc.)
   * @returns {Promise} - Promesa con historial del KPI
   */
  getKPIHistory: async (kpiId, params = {}) => {
    try {
      return await apiService.get(`/api/financial/kpi/${kpiId}/history`, { params });
    } catch (error) {
      console.error(`Error al obtener historial del KPI ${kpiId}:`, error);
      throw error;
    }
  },

  /**
   * Calcula valor de KPI basado en datos locales
   * @param {string} kpiId - Identificador del KPI
   * @param {Array} data - Datos para realizar el cálculo
   * @returns {Object} - Valor calculado del KPI
   */
  calculateKPI: (kpiId, data) => {
    switch (kpiId) {
      case 'total_invoiced':
        return {
          value: data.reduce((sum, item) => sum + (item.invoiced_amount || 0), 0),
          format: 'currency'
        };
        
      case 'total_collected':
        return {
          value: data.reduce((sum, item) => sum + (item.collected_amount || 0), 0),
          format: 'currency'
        };
        
      case 'collection_ratio':
        const totalInvoiced = data.reduce((sum, item) => sum + (item.invoiced_amount || 0), 0);
        const totalCollected = data.reduce((sum, item) => sum + (item.collected_amount || 0), 0);
        
        return {
          value: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
          format: 'percentage'
        };
        
      case 'invoice_rejection_rate':
        const totalInvoices = data.length;
        const rejectedInvoices = data.filter(item => item.status === 'rejected').length;
        
        return {
          value: totalInvoices > 0 ? (rejectedInvoices / totalInvoices) * 100 : 0,
          format: 'percentage'
        };
        
      // Más cálculos de KPIs...
        
      default:
        throw new Error(`KPI no implementado: ${kpiId}`);
    }
  },

  /**
   * Formatea el valor de un KPI según su tipo
   * @param {*} value - Valor numérico del KPI
   * @param {string} format - Formato del KPI (currency, percentage, etc.)
   * @returns {string} - Valor formateado
   */
  formatKPIValue: (value, format) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(value);
        
      case 'percentage':
        return new Intl.NumberFormat('es-CO', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 2
        }).format(value / 100);
        
      case 'days':
        return `${Math.round(value)} días`;
        
      default:
        return value.toString();
    }
  }
};

export default kpiService;