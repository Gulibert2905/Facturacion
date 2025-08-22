// Crea este archivo en backend/src/utils/logger.js
const winston = require('winston');
const { format, transports } = winston;
require('dotenv').config();

// Formato personalizado para logs
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.metadata(),
  format.json()
);

// Crear logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: { service: 'facturacion-api' },
  transports: [
    // Escribir logs de error y advertencia a archivo
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// En desarrollo, también mostrar logs en consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Funciones de ayuda para contextos comunes
logger.logRequest = (req, info = {}) => {
  logger.info({
    type: 'request',
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    params: req.params,
    body: req.body,
    ip: req.ip,
    userId: req.user?._id,
    userRole: req.user?.role,
    ...info
  });
};

logger.logResponse = (res, info = {}) => {
  logger.info({
    type: 'response',
    statusCode: res.statusCode,
    ...info
  });
};

logger.logError = (error, req = null, additionalInfo = {}) => {
  const logData = {
    type: 'error',
    error: error.message,
    stack: error.stack,
    ...additionalInfo
  };
  
  if (req) {
    logData.method = req.method;
    logData.url = req.originalUrl;
    logData.query = req.query;
    logData.params = req.params;
    logData.userId = req.user?._id;
  }
  
  logger.error(logData);
};

logger.logPerformance = (operation, durationMs, metadata = {}) => {
  logger.info({
    type: 'performance',
    operation,
    durationMs,
    ...metadata
  });
};

module.exports = logger;