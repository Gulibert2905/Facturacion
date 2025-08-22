const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createServiceRecord,
  getServiceRecords,
  updateRecordStatus,
  getPatientServices,
  assignContract
} = require('../controllers/serviceController');

router.post('/record', protect, createServiceRecord);
router.get('/records', protect, getServiceRecords);
router.patch('/records/:id/status', protect, updateRecordStatus);
router.get('/patients/:documentNumber/services', getPatientServices);
router.patch('/services/:id/assign-contract', protect, assignContract);
module.exports = router;