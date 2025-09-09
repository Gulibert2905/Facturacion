const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, requirePermission, MODULES, ACTIONS } = require('../middleware/auth');

const {
  searchDiagnoses,
  validateDiagnosis,
  getDiagnosesByChapter,
  getChapters,
  createDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  importDiagnoses
} = require('../controllers/cie11Controller');

// Configuración de multer para importación
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    cb(null, `cie11-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas públicas (solo lectura) - disponibles para todos los usuarios autenticados
router.get('/search', 
  requirePermission(MODULES.SERVICES, ACTIONS.READ),
  searchDiagnoses
);

router.get('/validate/:code', 
  requirePermission(MODULES.SERVICES, ACTIONS.READ),
  validateDiagnosis
);

router.get('/chapters', 
  requirePermission(MODULES.SERVICES, ACTIONS.READ),
  getChapters
);

router.get('/chapter/:chapter', 
  requirePermission(MODULES.SERVICES, ACTIONS.READ),
  getDiagnosesByChapter
);

// Rutas administrativas - solo para usuarios con permisos de administración
router.post('/', 
  requirePermission(MODULES.SERVICES, ACTIONS.CREATE),
  createDiagnosis
);

router.put('/:id', 
  requirePermission(MODULES.SERVICES, ACTIONS.UPDATE),
  updateDiagnosis
);

router.delete('/:id', 
  requirePermission(MODULES.SERVICES, ACTIONS.DELETE),
  deleteDiagnosis
);

// Importación masiva
router.post('/import', 
  requirePermission(MODULES.SERVICES, ACTIONS.CREATE),
  upload.single('file'),
  importDiagnoses
);

module.exports = router;