const express = require('express');
const cors = require('cors');
const { requestLogger, errorLogger } = require('./middleware/loggingMiddleware');
const { 
    securityConfig, 
    trustProxy, 
    additionalSecurityHeaders, 
    securityLogger 
} = require('./middleware/security');
const { httpsRedirect } = require('./config/https');
const logger = require('./utils/logger');

require('dotenv').config();
const connectDB = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const patientRoutes = require('./routes/patientRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const contractRoutes = require('./routes/contractRoutes');
const preBillRoutes = require('./routes/preBillRoutes');
const companyRoutes = require('./routes/companyRoutes');
const reportRoutes = require('./routes/reportRoutes');
const importRoutes = require('./routes/importRoutes');
const userRoutes = require('./routes/userRoutes');
const rolePermissionRoutes = require('./routes/rolePermissionRoutes');
const ripsRoutes = require('./routes/ripsRoutes');
const financialRoutes = require('./routes/financialRoutes');
const auditRoutes = require('./routes/auditRoutes');
const cupsRoutes = require('./routes/cupsRoutes');

// Inicializar app
const app = express();

// Configurar proxy confiable
trustProxy(app);

// Middleware de seguridad temprana
app.use(httpsRedirect);
app.use(securityLogger);
app.use(additionalSecurityHeaders);

// Rate limiting general (aplicar a todas las rutas)
app.use(securityConfig.generalRateLimit);

// Helmet para headers de seguridad
app.use(securityConfig.helmetConfig);

// Middleware para logging de solicitudes
app.use(requestLogger);

// Conectar a la base de datos
connectDB();

// Middleware básico con límites de seguridad
app.use(express.json({ 
    limit: process.env.JSON_LIMIT || '1mb',
    type: 'application/json'
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: process.env.URL_ENCODED_LIMIT || '1mb'
}));

// Configuración CORS restrictiva para producción
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim()).filter(url => url)
            : [];
        
        // Rechazar requests sin origin en producción
        if (!origin && process.env.NODE_ENV === 'production') {
            logger.warn({
                type: 'cors_no_origin_blocked',
                message: 'Request sin origin bloqueado en producción'
            });
            return callback(new Error('Origin requerido en producción'), false);
        }
        
        // Permitir origins configurados
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.error({
                type: 'cors_blocked',
                origin,
                allowedOrigins,
                severity: 'high'
            });
            callback(new Error(`Origin ${origin} no permitido por CORS`), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400
};

app.use(cors(corsOptions));

// Rate limiting específico para autenticación
app.use('/api/auth/login', securityConfig.loginRateLimit);
app.use('/api/auth/register', securityConfig.loginRateLimit);

// Rutas de la aplicación
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/prebills', preBillRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/users', userRoutes);
app.use('/api/role-permissions', rolePermissionRoutes);
app.use('/api/rips', ripsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/cups', cupsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Metrics endpoint (solo en producción con auth)
if (process.env.METRICS_ENABLED === 'true') {
    app.get('/metrics', (req, res) => {
        // Verificar auth token para metrics
        const authHeader = req.headers['authorization'];
        const metricsToken = process.env.METRICS_TOKEN;
        
        if (!metricsToken || authHeader !== `Bearer ${metricsToken}`) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        
        // Aquí irían las métricas reales
        res.json({
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: Date.now()
        });
    });
}

// Ruta de información (limitada en producción)
app.get('/', (req, res) => {
    const info = {
        message: 'API Sistema de Facturación',
        version: '3.0.0',
        environment: process.env.NODE_ENV
    };
    
    // Solo mostrar información detallada en desarrollo
    if (process.env.NODE_ENV !== 'production') {
        info.phase = 'Fase 3 - Análisis Financiero, Auditoría';
        info.documentation = '/api-docs';
    }
    
    res.json(info);
});

// Middleware para manejo de errores
app.use(errorLogger);

// Manejo de rutas no encontradas con logging de seguridad
app.use((req, res) => {
    logger.warn({
        type: '404_not_found',
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'medium'
    });
    res.status(404).json({ 
        error: 'Endpoint no encontrado'
    });
});

// Manejo global de errores
app.use((error, req, res, next) => {
    logger.error({
        type: 'unhandled_error',
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?._id,
        severity: 'high'
    });
    
    // No exponer detalles del error en producción
    const message = process.env.NODE_ENV === 'production' 
        ? 'Error interno del servidor'
        : error.message;
        
    res.status(error.status || 500).json({
        error: message
    });
});

module.exports = app;