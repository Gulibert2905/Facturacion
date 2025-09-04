const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('../utils/logger');

/**
 * Configuración de seguridad mejorada para producción
 */
const securityConfig = {
    // Rate limiting general
    generalRateLimit: rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: {
            error: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo más tarde.',
            retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000 / 60)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn({
                type: 'rate_limit_exceeded',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.path
            });
            res.status(429).json({
                error: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo más tarde.',
                retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000 / 60)
            });
        }
    }),

    // Rate limiting más estricto para login
    loginRateLimit: rateLimit({
        windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
        max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 5,
        skipSuccessfulRequests: true,
        message: {
            error: 'Demasiados intentos de login. Cuenta temporalmente bloqueada.',
            retryAfter: Math.ceil((parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 900000) / 1000 / 60)
        },
        handler: (req, res) => {
            logger.error({
                type: 'login_rate_limit_exceeded',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                username: req.body?.username || 'unknown'
            });
            res.status(429).json({
                error: 'Demasiados intentos de login. Cuenta temporalmente bloqueada.',
                retryAfter: Math.ceil((parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 900000) / 1000 / 60)
            });
        }
    }),

    // Configuración de Helmet mejorada
    helmetConfig: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: [
                    "'self'", 
                    "'unsafe-inline'", 
                    "https://fonts.googleapis.com",
                    "https://cdnjs.cloudflare.com"
                ],
                fontSrc: [
                    "'self'", 
                    "https://fonts.gstatic.com",
                    "https://cdnjs.cloudflare.com"
                ],
                scriptSrc: [
                    "'self'",
                    process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : "'self'"
                ],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000, // 1 año
            includeSubDomains: true,
            preload: true
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: "same-origin" },
        frameguard: { action: 'deny' }
    })
};

/**
 * Middleware de configuración de proxy confiable
 */
const trustProxy = (app) => {
    if (process.env.TRUST_PROXY === 'true') {
        app.set('trust proxy', 1);
        logger.info('Trust proxy habilitado');
    }
};

/**
 * Middleware para headers de seguridad adicionales
 */
const additionalSecurityHeaders = (req, res, next) => {
    // Ocultar información del servidor
    res.removeHeader('X-Powered-By');
    
    // Headers de seguridad adicionales
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    // En producción, agregar headers más restrictivos
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        res.setHeader('Referrer-Policy', 'same-origin');
        res.setHeader('Feature-Policy', 
            "geolocation 'none'; microphone 'none'; camera 'none'"
        );
    }
    
    next();
};

/**
 * Middleware para logging de seguridad
 */
const securityLogger = (req, res, next) => {
    // Log de requests sospechosos
    const suspiciousPatterns = [
        /admin/i, /wp-admin/i, /phpmyadmin/i, 
        /\.php$/i, /\.asp$/i, /\.jsp$/i,
        /eval\(/i, /script/i, /javascript:/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(req.path) || pattern.test(req.get('User-Agent') || '')
    );
    
    if (isSuspicious) {
        logger.warn({
            type: 'suspicious_request',
            ip: req.ip,
            path: req.path,
            method: req.method,
            userAgent: req.get('User-Agent'),
            headers: req.headers
        });
    }
    
    next();
};

module.exports = {
    securityConfig,
    trustProxy,
    additionalSecurityHeaders,
    securityLogger
};