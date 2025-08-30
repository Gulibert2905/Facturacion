const express = require('express');
const router = express.Router();
const {
    getPatients,
    getPatientByDocument,
    createPatient,
    updatePatient
} = require('../controllers/patientController');
const { getPatientServices } = require('../controllers/serviceController');
const { protect, requirePermission, MODULES, ACTIONS } = require('../middleware/auth');
const { sanitizeInput, validatePatientData, validatePagination } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(protect);

// Primero las rutas específicas
router.get('/patient/:patientId/services', 
    requirePermission(MODULES.SERVICES, ACTIONS.READ),
    getPatientServices
);

router.get('/:document', 
    requirePermission(MODULES.PATIENTS, ACTIONS.READ),
    getPatientByDocument
);

router.get('/', 
    requirePermission(MODULES.PATIENTS, ACTIONS.READ),
    getPatients
);

router.post('/', 
    requirePermission(MODULES.PATIENTS, ACTIONS.CREATE),
    createPatient
);

router.put('/:id', 
    requirePermission(MODULES.PATIENTS, ACTIONS.UPDATE),
    updatePatient
);

module.exports = router;