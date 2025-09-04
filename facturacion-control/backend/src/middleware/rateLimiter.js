// src/middleware/rateLimiter.js
const logger = require('../utils/logger');

/**
 * Implementación simple de rate limiting en memoria
 * Para producción, se recomienda usar Redis o una solución más robusta
 */

class SimpleRateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  /**
   * Limpia requests antiguos cada 5 minutos
   */
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now - data.windowStart > data.windowMs) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Verifica si una IP excede el límite
   * @param {string} key - Clave (IP + endpoint)
   * @param {number} limit - Número máximo de requests
   * @param {number} windowMs - Ventana de tiempo en ms
   * @returns {Object} - {allowed: boolean, remaining: number, resetTime: number}
   */
  isAllowed(key, limit, windowMs) {
    const now = Date.now();
    const data = this.requests.get(key);

    if (!data) {
      // Primera request
      this.requests.set(key, {
        count: 1,
        windowStart: now,
        windowMs
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      };
    }

    // Verificar si la ventana ha expirado
    if (now - data.windowStart > windowMs) {
      // Nueva ventana
      this.requests.set(key, {
        count: 1,
        windowStart: now,
        windowMs
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      };
    }

    // Ventana actual
    if (data.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.windowStart + windowMs
      };
    }

    // Incrementar contador
    data.count++;
    this.requests.set(key, data);

    return {
      allowed: true,
      remaining: limit - data.count,
      resetTime: data.windowStart + windowMs
    };
  }
}

const rateLimiter = new SimpleRateLimiter();

/**
 * Middleware de rate limiting genérico
 * @param {Object} options - Opciones de configuración
 * @returns {Function} - Middleware de Express
 */
const createRateLimit = (options = {}) => {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos por defecto
    max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por defecto
    message = 'Demasiadas solicitudes, intenta más tarde',
    statusCode = 429,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
    endpoint = ''
  } = options;

  return (req, res, next) => {
    try {
      const key = `${keyGenerator(req)}_${endpoint}`;
      const result = rateLimiter.isAllowed(key, max, windowMs);

      // Agregar headers informativos
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });

      if (!result.allowed) {
        logger.warn({
          type: 'rate_limit_exceeded',
          ip: keyGenerator(req),
          endpoint: req.originalUrl,
          userAgent: req.get('User-Agent')
        });

        return res.status(statusCode).json({
          success: false,
          message,
          retryAfter: Math.round((result.resetTime - Date.now()) / 1000)
        });
      }

      next();
    } catch (error) {
      logger.error('Error en rate limiting:', error);
      // En caso de error, permitir la request
      next();
    }
  };
};

/**
 * Rate limiters específicos para diferentes endpoints
 */

// Para login - configurado por variables de entorno
const loginRateLimit = createRateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 2 * 60 * 1000),
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || (process.env.NODE_ENV === 'production' ? 5 : 20),
  message: `Demasiados intentos de login. Intenta en ${Math.floor((parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 60000)} minutos.`,
  endpoint: 'login'
});

// Para registro - moderado
const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por IP por hora
  message: 'Demasiados registros desde esta IP. Intenta en 1 hora.',
  endpoint: 'register'
});

// Para API general - permisivo
const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por IP
  message: 'Demasiadas solicitudes. Intenta más tarde.',
  endpoint: 'api'
});

// Para operaciones sensibles - estricto
const sensitiveRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // 10 operaciones por IP
  message: 'Límite de operaciones excedido. Intenta en 5 minutos.',
  endpoint: 'sensitive'
});

module.exports = {
  createRateLimit,
  loginRateLimit,
  registerRateLimit,
  apiRateLimit,
  sensitiveRateLimit,
  rateLimiter
};