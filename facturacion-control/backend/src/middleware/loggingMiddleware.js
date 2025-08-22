// src/middleware/loggingMiddleware.js
const logger = require('../utils/logger');

// Middleware para registrar solicitudes HTTP
const requestLogger = (req, res, next) => {
  // Guardar tiempo de inicio
  req.startTime = Date.now();
  
  // Registrar la solicitud
  logger.logRequest(req);
  
  // Capturar la respuesta
  const originalSend = res.send;
  
  res.send = function (body) {
    // Calcular duración
    const duration = Date.now() - req.startTime;
    
    // Registrar performance
    logger.logPerformance('http_request', duration, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode
    });
    
    // Registrar respuesta (solo en nivel debug para evitar logs excesivos)
    if (logger.level === 'debug') {
      const responseBody = typeof body === 'string' ? body : JSON.stringify(body);
      logger.logResponse(res, { 
        responseSize: Buffer.byteLength(responseBody, 'utf8'),
        duration
      });
    }
    
    // Llamar al método original
    return originalSend.call(this, body);
  };
  
  next();
};

// Middleware para manejar errores
const errorLogger = (err, req, res, next) => {
  logger.logError(err, req, { handled: true });
  
  // Enviar respuesta de error
  res.status(err.status || 500).json({
    message: err.message || 'Error del servidor',
    code: err.code || 'SERVER_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = {
  requestLogger,
  errorLogger
};