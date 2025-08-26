// src/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { 
  generateReport, 
  exportReport, 
  getMunicipalities,
  getDepartments,
  getRegimens,
  //generateAdvancedReport,
  getExportTemplates,
  createExportTemplate,
  updateExportTemplate,
  
} = require('../controllers/reportController');

// Rutas para reportes
router.post('/generate', generateReport);
router.post('/export', exportReport);

// Rutas para obtener datos de filtros (asegúrate de que el controlador exporta estas funciones)
router.get('/municipalities', getMunicipalities);
router.get('/departments', getDepartments);
router.get('/regimens', getRegimens);

module.exports = router;