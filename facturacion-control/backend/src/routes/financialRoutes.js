// routes/financialRoutes.js
const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');

/**
 * Rutas para el módulo de Análisis Financiero
 */

// Obtener KPIs financieros
router.get('/kpis', financialController.getFinancialKPIs);

// Obtener tendencias de facturación
router.get('/billing-trends', financialController.getBillingTrends);

// Obtener tendencias de recaudos
router.get('/collection-trends', financialController.getCollectionTrends);

// Obtener proyecciones financieras
router.get('/projections', financialController.getFinancialProjections);

// Obtener análisis de cartera por edades
router.get('/accounts-receivable', financialController.getAccountsReceivableAging);

// Obtener análisis de rentabilidad
router.get('/profitability', financialController.getProfitabilityAnalysis);

// Exportar reporte financiero
router.post('/export/:reportType', financialController.exportFinancialReport);

// Obtener valor de un KPI específico
router.get('/kpi/:kpiId', financialController.getKPIValue);

// Obtener historial de un KPI a lo largo del tiempo
router.get('/kpi/:kpiId/history', financialController.getKPIHistory);

// Obtener KPIs por categoría
router.post('/kpis/batch', financialController.getKPIsByCategory);

// Obtener estadísticas financieras
router.get('/stats', financialController.getFinancialStats);

module.exports = router;