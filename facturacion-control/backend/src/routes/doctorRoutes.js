const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, requirePermission, MODULES, ACTIONS } = require('../middleware/auth');
const { companyAccessMiddleware } = require('../middleware/companyAccess');

const {
  createDoctor,
  getDoctors,
  searchDoctors,
  getDoctorByDocument,
  updateDoctor,
  deleteDoctor,
  importDoctors
} = require('../controllers/doctorController');

// Configuración de multer para importación
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    cb(null, `doctors-${Date.now()}${path.extname(file.originalname)}`);
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
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Todas las rutas requieren autenticación y filtrado por empresa
router.use(protect);
router.use(companyAccessMiddleware);

// Rutas CRUD básicas
router.post('/', 
  requirePermission(MODULES.SERVICES, ACTIONS.CREATE),
  createDoctor
);

router.get('/', 
  requirePermission(MODULES.SERVICES, ACTIONS.READ),
  getDoctors
);

router.get('/search', 
  requirePermission(MODULES.SERVICES, ACTIONS.READ),
  searchDoctors
);

router.get('/document/:documentNumber', 
  requirePermission(MODULES.SERVICES, ACTIONS.READ),
  getDoctorByDocument
);

router.put('/:id', 
  requirePermission(MODULES.SERVICES, ACTIONS.UPDATE),
  updateDoctor
);

router.delete('/:id', 
  requirePermission(MODULES.SERVICES, ACTIONS.DELETE),
  deleteDoctor
);

// Importación masiva
router.post('/import', 
  requirePermission(MODULES.SERVICES, ACTIONS.CREATE),
  upload.single('file'),
  importDoctors
);

module.exports = router;