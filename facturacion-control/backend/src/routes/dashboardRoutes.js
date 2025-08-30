// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect, requirePermission, MODULES, ACTIONS } = require('../middleware/auth');
const {
  getDashboardStats,
  getDashboardStatsAdvanced,
  getProjections,
  getRecentServices
} = require('../controllers/dashboardController');

// Todas las rutas requieren autenticación
router.use(protect);

router.get('/stats', 
  requirePermission(MODULES.DASHBOARD, ACTIONS.READ),
  getDashboardStats
);

router.get('/recent-services', 
  requirePermission(MODULES.DASHBOARD, ACTIONS.READ),
  getRecentServices
);

// Nuevas rutas para funcionalidades avanzadas
router.get('/stats/advanced', 
  requirePermission(MODULES.DASHBOARD, ACTIONS.READ),
  getDashboardStatsAdvanced
);

router.get('/projections', 
  requirePermission(MODULES.DASHBOARD, ACTIONS.READ),
  getProjections
);

module.exports = router;