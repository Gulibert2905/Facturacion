const express = require('express');
const router = express.Router();
const {
    getPatients,
    getPatientByDocument,
    createPatient,
    updatePatient
} = require('../controllers/patientController');
const { getPatientServices } = require('../controllers/serviceController');

// Primero las rutas específicas
router.get('/patient/:patientId/services', getPatientServices); // Cambiado
router.get('/:document', getPatientByDocument);
router.get('/', getPatients);
router.post('/', createPatient);
router.put('/:id', updatePatient);

module.exports = router;