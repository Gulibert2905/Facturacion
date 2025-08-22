// src/routes/importRoutes.js
const express = require('express');
const router = express.Router();
const { 
  generateTemplate,
  importPatients,
  importServices 
} = require('../controllers/importController');

router.get('/template/:type', generateTemplate);
router.post('/patients', importPatients);
router.post('/services', importServices);

module.exports = router;