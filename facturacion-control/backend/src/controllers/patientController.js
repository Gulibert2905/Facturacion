const Patient = require('../models/Patient');
const ServiceRecord = require('../models/ServiceRecord');
const City = require('../models/City');

const getCities = async (req, res) => {
    try {
        // Obtener ciudades de la colección específica
        const cities = await City.find({}, 'nombre departamento')
            .sort({ nombre: 1 })
            .lean();
        
        // Formatear las ciudades para el autocomplete
        const formattedCities = cities.map(city => city.nombre);
        
        // También obtener ciudades de pacientes existentes como respaldo
        const citiesNacimiento = await Patient.distinct('ciudadNacimiento', { ciudadNacimiento: { $ne: null, $ne: '' } });
        const citiesExpedicion = await Patient.distinct('ciudadExpedicion', { ciudadExpedicion: { $ne: null, $ne: '' } });
        
        // Combinar todas las ciudades y eliminar duplicados
        const allCities = [...new Set([...formattedCities, ...citiesNacimiento, ...citiesExpedicion])];
        
        res.json(allCities.sort());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPatients = async (req, res) => {
    try {
        const patients = await Patient.find({ active: true });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Versión optimizada de getPatientByDocument
const getPatientByDocument = async (req, res) => {
    try {
        const documentNumber = req.params.document;

        // Validar que el número de documento no esté vacío
        if (!documentNumber || documentNumber.trim() === '') {
            return res.status(400).json({ 
                message: 'El número de documento es requerido',
                code: 'INVALID_DOCUMENT'
            });
        }

        // Usar proyección para seleccionar solo los campos necesarios
        const patient = await Patient.findOne({ 
            documentNumber,
            active: true
        }).select('documentType documentNumber firstName secondName firstLastName secondLastName fullName birthDate gender regimen municipality ciudadNacimiento ciudadExpedicion');

        if (!patient) {
            return res.status(404).json({ 
                message: 'Paciente no encontrado',
                documentNumber,
                code: 'PATIENT_NOT_FOUND'
            });
        }

        // Usar countDocuments en lugar de find().count() para mejor rendimiento
        const pendingServices = await ServiceRecord.countDocuments({
            patientId: patient._id,
            status: 'pendiente'
        });

        // Construir respuesta
        const response = {
            patient: patient.toObject(),
            metadata: {
                hasPendingServices: pendingServices > 0,
                pendingServicesCount: pendingServices,
                lastUpdate: patient.updatedAt
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error en getPatientByDocument:', error);
        res.status(500).json({ 
            message: 'Error al buscar paciente',
            error: error.message,
            code: 'SERVER_ERROR'
        });
    }
};

const createPatient = async (req, res) => {
    try {
        // Verificar si ya existe
        const existingPatient = await Patient.findOne({
            documentNumber: req.body.documentNumber
        });

        if (existingPatient) {
            return res.status(400).json({
                message: 'Ya existe un paciente con este número de documento'
            });
        }

        const patientData = {
            documentType: req.body.documentType,
            documentNumber: req.body.documentNumber,
            firstName: req.body.firstName,
            secondName: req.body.secondName || '',
            firstLastName: req.body.firstLastName,
            secondLastName: req.body.secondLastName || '',
            birthDate: req.body.birthDate,
            gender: req.body.gender,
            municipality: req.body.municipality,
            department: req.body.department,
            regimen: req.body.regimen,
            eps: req.body.eps,
            zone: req.body.zone || 'U'
        };

        const patient = new Patient(patientData);
        const savedPatient = await patient.save();
        res.status(201).json(savedPatient);
    } catch (error) {
        console.error('Error creando paciente:', error);
        res.status(400).json({ 
            message: error.message,
            details: error.errors 
        });
    }
};

const updatePatient = async (req, res) => {
    try {
        const patientData = {
            ...req.body,
            // Regenerar fullName con los nuevos datos si se proporcionan
            firstName: req.body.firstName,
            secondName: req.body.secondName,
            firstLastName: req.body.firstLastName,
            secondLastName: req.body.secondLastName
        };

        const updatedPatient = await Patient.findByIdAndUpdate(
            req.params.id,
            patientData,
            { new: true, runValidators: true }
        );

        if (!updatedPatient) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }

        res.json(updatedPatient);
    } catch (error) {
        console.error('Error actualizando paciente:', error);
        res.status(400).json({ 
            message: error.message,
            details: error.errors 
        });
    }
};

// Opcional: Agregar validación de datos
const validatePatientData = (data) => {
    const errors = [];

    if (!data.firstName || !data.firstLastName) {
        errors.push('El nombre y primer apellido son obligatorios');
    }

    if (data.gender && !['M', 'F'].includes(data.gender)) {
        errors.push('El género debe ser M o F');
    }

    return errors;
};

module.exports = {
    getPatients,
    getPatientByDocument,
    createPatient,
    updatePatient,
    getCities
};