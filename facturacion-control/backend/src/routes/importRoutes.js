// src/routes/importRoutes.js
const express = require('express');
const router = express.Router();
const { 
  generateTemplate,
  importPatients,
  importServices,
  importCities,
  importDoctors,
  importCIE11
} = require('../controllers/importController');

router.get('/template/:type', generateTemplate);
router.post('/patients', importPatients);
router.post('/services', importServices);
router.post('/cities', importCities);
router.post('/doctors', importDoctors);
router.post('/cie11', importCIE11);

module.exports = router;