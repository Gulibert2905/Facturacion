// backend/src/utils/performanceMonitor.js
const logger = require('./logger');

/**
 * Función de utilidad para medir el rendimiento de operaciones
 * 
 * @param {Function} fn - Función a medir (puede ser async)
 * @param {string} operationName - Nombre de la operación
 * @param {Object} metadata - Metadatos adicionales
 * @returns {Promise<any>} - Resultado de la función
 */
async function measurePerformance(fn, operationName, metadata = {}) {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    
    const duration = Date.now() - startTime;
    logger.logPerformance(operationName, duration, metadata);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.logError(error, null, {
      operation: operationName,
      duration,
      ...metadata
    });
    
    throw error;
  }
}

// También proporcionamos un decorador para funciones
function withPerformanceLogging(fn, operationName) {
  return async function(...args) {
    return measurePerformance(
      () => fn.apply(this, args),
      operationName,
      { args: args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)) }
    );
  };
}

module.exports = {
  measurePerformance,
  withPerformanceLogging
};