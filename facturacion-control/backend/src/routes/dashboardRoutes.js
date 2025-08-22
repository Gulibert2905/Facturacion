// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentServices } = require('../controllers/dashboardController');
//const { protect } = require('../middleware/auth');

router.get('/stats', getDashboardStats);
router.get('/recent-services', getRecentServices);

module.exports = router;