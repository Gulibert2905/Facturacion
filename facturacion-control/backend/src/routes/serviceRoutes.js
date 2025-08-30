const express = require('express');
const router = express.Router();
const { protect, requirePermission, MODULES, ACTIONS } = require('../middleware/auth');
const { validateServiceRecord } = require('../middleware/serviceValidation');
const { sanitizeInput, validateServiceData, validatePagination } = require('../middleware/validation');
const { updateContractValues } = require('../controllers/contractController');

const {
  createServiceRecordEnhanced,
  getServiceRecords,
  updateRecordStatus,
  getPatientServices,
  assignContract
} = require('../controllers/serviceController');

// Todas las rutas requieren autenticación
router.use(protect);

// Aplicar middlewares en orden: validación -> crear servicio -> actualizar contrato
router.post('/record', 
  requirePermission(MODULES.SERVICES, ACTIONS.CREATE),
  validateServiceRecord, 
  createServiceRecordEnhanced, 
  updateContractValues
);

router.get('/records', 
  requirePermission(MODULES.SERVICES, ACTIONS.READ),
  getServiceRecords
);

router.patch('/records/:id/status', 
  requirePermission(MODULES.SERVICES, ACTIONS.UPDATE),
  updateRecordStatus
);

router.get('/patients/:documentNumber/services', 
  requirePermission(MODULES.SERVICES, ACTIONS.READ),
  getPatientServices
);

router.patch('/services/:id/assign-contract', 
  requirePermission(MODULES.SERVICES, ACTIONS.UPDATE),
  assignContract
);

module.exports = router;