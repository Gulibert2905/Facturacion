// Crea este archivo en backend/src/utils/logger.js
const winston = require('winston');
const path = require('path');
const { format, transports } = winston;
require('dotenv').config();

// Formato personalizado para logs
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.metadata(),
  format.json()
);

// Configuración de transports basada en entorno
const getTransports = () => {
  const logTransports = [];
  
  // Transport para errores
  logTransports.push(
    new transports.File({ 
      filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'error.log'), 
      level: 'error',
      maxsize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || 5,
      tailable: true
    })
  );
  
  // Transport para logs combinados
  logTransports.push(
    new transports.File({ 
      filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'combined.log'),
      maxsize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || 5,
      tailable: true
    })
  );
  
  // Transport para auditoría (logs de seguridad)
  logTransports.push(
    new transports.File({ 
      filename: path.join(process.env.LOG_FILE_PATH || 'logs', 'audit.log'),
      level: 'warn',
      maxsize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || 10,
      tailable: true
    })
  );
  
  // En producción, también enviar a syslog si está disponible
  if (process.env.NODE_ENV === 'production' && process.env.SYSLOG_ENABLED === 'true') {
    logTransports.push(
      new transports.Syslog({
        host: process.env.SYSLOG_HOST || 'localhost',
        port: process.env.SYSLOG_PORT || 514,
        protocol: process.env.SYSLOG_PROTOCOL || 'udp4',
        facility: 'local0'
      })
    );
  }
  
  return logTransports;
};

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
  format: customFormat,
  defaultMeta: { service: 'facturacion-api' },
  transports: getTransports()
});

// En desarrollo, también mostrar logs en consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf((info) => {
        const timestamp = info.timestamp;
        const level = info.level;
        const message = typeof info.message === 'object' ? JSON.stringify(info.message, null, 2) : info.message;
        const meta = info.metadata ? JSON.stringify(info.metadata, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${meta}`;
      })
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