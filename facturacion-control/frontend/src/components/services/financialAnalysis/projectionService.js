// src/services/financialAnalysis/projectionService.js
import { apiService } from '../apiService';

/**
 * Servicio para cálculo y gestión de proyecciones financieras
 */
const projectionService = {
  /**
   * Métodos de proyección disponibles
   */
  projectionMethods: [
    {
      id: 'linear_regression',
      name: 'Regresión Lineal',
      description: 'Proyección basada en tendencia lineal de datos históricos'
    },
    {
      id: 'moving_average',
      name: 'Media Móvil',
      description: 'Proyección basada en promedio de últimos períodos'
    },
    {
      id: 'seasonal',
      name: 'Estacional',
      description: 'Proyección que considera patrones estacionales'
    },
    {
      id: 'growth_rate',
      name: 'Tasa de Crecimiento',
      description: 'Proyección basada en tasa de crecimiento histórica'
    }
  ],

  /**
   * Obtiene proyección financiera según parámetros
   * @param {Object} params - Parámetros para la proyección
   * @returns {Promise} - Promesa con datos de proyección
   */
  getProjection: async (params = {}) => {
    try {
      const defaults = {
        method: 'linear_regression',
        periods: 12,
        dataType: 'revenue',
        startDate: null,
        endDate: null
      };
      
      const queryParams = { ...defaults, ...params };
      
      return await apiService.get('/api/financial/projections', {
        params: queryParams
      });
    } catch (error) {
      console.error('Error al obtener proyección financiera:', error);
      throw error;
    }
  },

  /**
   * Obtiene proyecciones para múltiples escenarios
   * @param {Array} scenarios - Lista de escenarios para proyectar
   * @returns {Promise} - Promesa con proyecciones para cada escenario
   */
  getMultiScenarioProjection: async (scenarios = []) => {
    try {
      return await apiService.post('/api/financial/projections/scenarios', {
        scenarios
      });
    } catch (error) {
      console.error('Error al obtener proyecciones multi-escenario:', error);
      throw error;
    }
  },

  /**
   * Calcula proyección lineal basada en datos históricos
   * @param {Array} historicalData - Datos históricos ordenados cronológicamente
   * @param {number} periodsToProject - Número de períodos a proyectar
   * @returns {Array} - Datos proyectados
   */
  calculateLinearProjection: (historicalData, periodsToProject = 12) => {
    // Implementación básica de regresión lineal
    // En un entorno real, esto debería usar una biblioteca más robusta
    
    if (!historicalData || historicalData.length < 2) {
      throw new Error('Se requieren al menos 2 puntos de datos para la proyección');
    }
    
    // Convertir datos a coordenadas x, y para regresión lineal
    const coordinates = historicalData.map((data, index) => ({
      x: index,
      y: data.value
    }));
    
    // Calcular coeficientes de regresión lineal
    const n = coordinates.length;
    const sumX = coordinates.reduce((sum, point) => sum + point.x, 0);
    const sumY = coordinates.reduce((sum, point) => sum + point.y, 0);
    const sumXY = coordinates.reduce((sum, point) => sum + (point.x * point.y), 0);
    const sumXX = coordinates.reduce((sum, point) => sum + (point.x * point.x), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generar proyecciones
    const projectedData = [];
    const lastDataPoint = historicalData[historicalData.length - 1];
    
    for (let i = 1; i <= periodsToProject; i++) {
      const projectedValue = slope * (n + i - 1) + intercept;
      
      // Crear objeto de proyección usando estructura similar a datos históricos
      const projectedDate = new Date(lastDataPoint.date);
      projectedDate.setMonth(projectedDate.getMonth() + i);
      
      projectedData.push({
        date: projectedDate.toISOString().split('T')[0],
        value: Math.max(0, projectedValue), // No permitir valores negativos
        projected: true
      });
    }
    
    return projectedData;
  },

  /**
   * Calcula proyección con media móvil
   * @param {Array} historicalData - Datos históricos ordenados cronológicamente
   * @param {number} periodsToProject - Número de períodos a proyectar
   * @param {number} windowSize - Tamaño de la ventana para la media móvil
   * @returns {Array} - Datos proyectados
   */
  calculateMovingAverageProjection: (historicalData, periodsToProject = 12, windowSize = 3) => {
    if (!historicalData || historicalData.length < windowSize) {
      throw new Error(`Se requieren al menos ${windowSize} puntos de datos para la proyección`);
    }
    
    const projectedData = [];
    const lastDataPoint = historicalData[historicalData.length - 1];
    
    // Obtener los últimos n valores para la media móvil inicial
    const lastValues = historicalData.slice(-windowSize).map(item => item.value);
    
    for (let i = 1; i <= periodsToProject; i++) {
      // Calcular la media móvil
      const average = lastValues.reduce((sum, val) => sum + val, 0) / windowSize;
      
      // Crear fecha proyectada
      const projectedDate = new Date(lastDataPoint.date);
      projectedDate.setMonth(projectedDate.getMonth() + i);
      
      // Crear punto de datos proyectado
      const projectedPoint = {
        date: projectedDate.toISOString().split('T')[0],
        value: average,
        projected: true
      };
      
      projectedData.push(projectedPoint);
      
      // Actualizar array de valores para siguiente cálculo
      lastValues.shift(); // Eliminar primer elemento
      lastValues.push(average); // Añadir nuevo valor proyectado
    }
    
    return projectedData;
  },

  /**
   * Calcula proyección estacional
   * @param {Array} historicalData - Datos históricos de al menos 2 años
   * @param {number} periodsToProject - Número de períodos a proyectar
   * @returns {Array} - Datos proyectados
   */
  calculateSeasonalProjection: (historicalData, periodsToProject = 12) => {
    if (!historicalData || historicalData.length < 24) {
      throw new Error('Se requieren al menos 24 meses de datos históricos para proyección estacional');
    }
    
    // Determinar factores estacionales (simplificado)
    const seasonalFactors = [];
    const periodsPerYear = 12; // Asumimos datos mensuales
    
    // Calcular promedio para cada mes del año
    for (let month = 0; month < periodsPerYear; month++) {
      const monthlyValues = [];
      
      // Recopilar valores para este mes de todos los años disponibles
      for (let year = 0; year < Math.floor(historicalData.length / periodsPerYear); year++) {
        const index = year * periodsPerYear + month;
        if (index < historicalData.length) {
          monthlyValues.push(historicalData[index].value);
        }
      }
      
      // Calcular promedio para este mes
      const monthlyAverage = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length;
      seasonalFactors.push(monthlyAverage);
    }
    
    // Normalizar factores estacionales
    const factorSum = seasonalFactors.reduce((sum, factor) => sum + factor, 0);
    const factorAverage = factorSum / seasonalFactors.length;
    const normalizedFactors = seasonalFactors.map(factor => factor / factorAverage);
    
    // Proyectar usando factores estacionales y tendencia lineal
    const projectedData = [];
    const lastDataPoint = historicalData[historicalData.length - 1];
    
    // Calcular tendencia lineal básica
    const linearProjection = this.calculateLinearProjection(historicalData, periodsToProject);
    
    for (let i = 1; i <= periodsToProject; i++) {
      // Determinar el mes correspondiente (0-11)
      const monthIndex = (new Date(lastDataPoint.date).getMonth() + i) % 12;
      
      // Aplicar factor estacional a la proyección lineal
      const baseValue = linearProjection[i - 1].value;
      const seasonalValue = baseValue * normalizedFactors[monthIndex];
      
      // Crear fecha proyectada
      const projectedDate = new Date(lastDataPoint.date);
      projectedDate.setMonth(projectedDate.getMonth() + i);
      
      projectedData.push({
        date: projectedDate.toISOString().split('T')[0],
        value: seasonalValue,
        projected: true,
        baseValue: baseValue, // Valor sin ajuste estacional
        seasonalFactor: normalizedFactors[monthIndex]
      });
    }
    
    return projectedData;
  }
};

export default projectionService;