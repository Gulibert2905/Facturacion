// backend/routes/ripsRoutes.js
const express = require('express');
const router = express.Router();
const ripsController = require('../controllers/ripsController');
//const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * Rutas para el módulo de RIPS
 */

// Ruta para generar RIPS según resolución 3374
router.post('/generate-3374',  ripsController.generate3374);

// Ruta para generar RIPS según resolución 2275
router.post('/generate-2275',  ripsController.generate2275);

// Ruta para validar datos según resolución 3374
router.post('/validate-3374',  ripsController.validate3374);

// Ruta para validar datos según resolución 2275
router.post('/validate-2275',  ripsController.validate2275);

// Ruta para obtener historial de generación de RIPS
router.get('/history',  ripsController.getHistory);

// Ruta para descargar archivos RIPS generados
router.get('/download/:id',  ripsController.downloadRips);

// Ruta para obtener estructura de archivos RIPS
router.get('/structure/:resolution',  ripsController.getStructure);

// Ruta para exportar RIPS en formato específico
router.get('/export/:id', ripsController.exportRips);

module.exports = router;