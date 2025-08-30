const express = require('express');
const cors = require('cors');
const { requestLogger, errorLogger } = require('./middleware/loggingMiddleware');
const logger = require('./utils/logger');

require('dotenv').config();
const connectDB = require('./config/db');

// Importar rutas existentes
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


// Importar nuevas rutas de Fase 3
const ripsRoutes = require('./routes/ripsRoutes');
const financialRoutes = require('./routes/financialRoutes');
const auditRoutes = require('./routes/auditRoutes');
const cupsRoutes = require('./routes/cupsRoutes');

// Inicializar app
const app = express();
console.log('Rutas registradas:');
console.log('- /api/services con:', require('./routes/serviceRoutes'));
console.log('- /api/prebills con:', require('./routes/preBillRoutes'));

// Middleware para logging de solicitudes
app.use(requestLogger);

// Conectar a la base de datos
connectDB();

// Middleware básico
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuración CORS basada en el entorno
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS || '').split(',').map(url => url.trim())
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    // Permitir requests sin origin (como aplicaciones móviles o Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Para compatibilidad con navegadores legacy
};

app.use(cors(corsOptions));

// Rutas existentes
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

// Nuevas rutas de la Fase 3
app.use('/api/rips', ripsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/cups', cupsRoutes); 

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando',
    version: '3.0.0', // Actualizado para incluir los módulos de Fase 3
    phase: 'Fase 3 - Análisis Financiero, Auditoría'
  });
});

// Middleware para manejo de errores
app.use(errorLogger);

// Manejo de rutas no encontradas
app.use((req, res) => {
  logger.warn({
    type: 'not_found',
    method: req.method,
    url: req.originalUrl
  });
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Servidor corriendo en puerto ${PORT}`);
  logger.info(`Módulos Fase 3 activados: Análisis Financiero, Auditoría`);
});