// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDashboardStatsAdvanced,
  getProjections,
  getRecentServices
} = require('../controllers/dashboardController');
//const { protect } = require('../middleware/auth');

router.get('/stats', getDashboardStats);
router.get('/recent-services', getRecentServices);

// Nuevas rutas para funcionalidades avanzadas
router.get('/stats/advanced', getDashboardStatsAdvanced);
router.get('/projections', getProjections);

module.exports = router;