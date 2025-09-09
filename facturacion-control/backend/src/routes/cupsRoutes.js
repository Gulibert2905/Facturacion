// routes/cupsRoutes.js
const express = require('express');
const router = express.Router();
//const {// protect } = require('../middleware/auth'); // Ajusta según tu middleware de autenticación
const {
  getServices,
  getServiceByCupsCode,
  createService,
  updateService,
  deleteService,
  assignTariff,
  removeTariff,
  importServices,
  getServiceTariff,
  importTariffs,
  toggleTariffStatus,
  getServicesWithTariffs
} = require('../controllers/cupsController');

// Rutas para catálogo CUPS
router.get('/', getServices);
router.get('/:cupsCode', getServiceByCupsCode);
router.post('/',createService);
router.put('/:cupsCode', updateService);
router.delete('/:cupsCode', deleteService);
router.post('/import', importServices);

// Rutas para tarifas
router.post('/:cupsCode/tariff', assignTariff);
router.delete('/:cupsCode/tariff/:contractId', removeTariff);
router.get('/:cupsCode/tariff/:contractId', getServiceTariff);
router.post('/contract/:contractId/import-tariffs', importTariffs);
router.patch('/:cupsCode/tariff/:contractId/toggle', toggleTariffStatus);
router.get('/contract/:contractId/services-with-tariffs', getServicesWithTariffs);

module.exports = router;