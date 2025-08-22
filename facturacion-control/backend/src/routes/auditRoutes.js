// routes/auditRoutes.js
const express = require('express');
const router = express.Router();
//const { authMiddleware } = require('../middleware/authMiddleware');
const auditController = require('../controllers/auditController');
const rulesController = require('../controllers/auditRulesController');

/**
 * Rutas para el módulo de Auditoría
 */

// Ejecutar una auditoría
router.post('/run',  auditController.runAudit);

// Obtener resultados de auditorías
router.get('/results',  auditController.getAuditResults);

// Obtener detalles de un resultado específico
router.get('/results/:id',  auditController.getAuditResultDetails);

// Verificar servicios
router.post('/verify-services',  auditController.verifyServices);

// Validar contratos vs facturación
router.post('/validate-contracts',  auditController.validateContracts);

// Detectar inconsistencias
router.post('/detect-inconsistencies',  auditController.detectInconsistencies);

// Exportar resultados de auditoría
router.get('/export/:id',  auditController.exportAuditResults);

// Marcar hallazgo como revisado
router.post('/findings/:id/review',  auditController.markFindingAsReviewed);

// Aplicar corrección a hallazgo
router.post('/findings/:id/correct',  auditController.applyCorrection);

// Obtener estadísticas de auditoría
router.get('/stats',  auditController.getAuditStats);

// Rutas para gestión de reglas de auditoría
router.get('/rules',  rulesController.getAllRules);
router.get('/rules/:id',  rulesController.getRuleById);
router.post('/rules',  rulesController.createRule);
router.put('/rules/:id',  rulesController.updateRule);
router.delete('/rules/:id',  rulesController.deleteRule);
router.patch('/rules/:id/status',  rulesController.toggleRuleStatus);
router.get('/rules/category/:categoryId',  rulesController.getRulesByCategory);
router.post('/rules/:id/apply',  rulesController.applyRule);

// Obtener matriz de verificación de servicios
router.get('/verification-matrix',  auditController.getVerificationMatrix);

// Actualizar matriz de verificación
router.put('/verification-matrix',  auditController.updateVerificationMatrix);

module.exports = router;