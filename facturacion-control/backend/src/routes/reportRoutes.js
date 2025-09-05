// src/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { companyAccessMiddleware } = require('../middleware/companyAccess');
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

// Todas las rutas requieren autenticación y filtrado por empresa
router.use(protect);
router.use(companyAccessMiddleware);

// Rutas para reportes
router.post('/generate', generateReport);
router.post('/export', exportReport);

// Rutas para obtener datos de filtros (asegúrate de que el controlador exporta estas funciones)
router.get('/municipalities', getMunicipalities);
router.get('/departments', getDepartments);
router.get('/regimens', getRegimens);

// Rutas para templates de reportes
router.get('/templates', async (req, res) => {
  try {
    // Por ahora devolvemos templates básicos hardcoded
    // En el futuro se pueden implementar desde base de datos
    const templates = [
      {
        _id: 'template1',
        name: 'Reporte Básico de Servicios',
        description: 'Listado básico de servicios facturados',
        fields: ['documentNumber', 'serviceDate', 'cupsCode', 'value'],
        category: 'servicios'
      },
      {
        _id: 'template2', 
        name: 'Reporte de Pacientes',
        description: 'Información detallada de pacientes',
        fields: ['documentNumber', 'fullName', 'birthDate', 'regimen'],
        category: 'pacientes'
      },
      {
        _id: 'template3',
        name: 'Reporte Financiero',
        description: 'Resumen financiero por empresa',
        fields: ['company', 'totalValue', 'serviceCount', 'averageValue'],
        category: 'financiero'
      }
    ];
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;