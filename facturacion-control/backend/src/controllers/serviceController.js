const Service = require('../models/Service');
const ServiceRecord = require('../models/ServiceRecord');
const PreBill = require('../models/PreBill');
const Patient = require('../models/Patient');

console.log('ServiceController cargado correctamente');

const createServiceRecord = async (req, res) => {
  try {
    const {
      documentType,
      documentNumber,
      patientName,
      serviceDate,
      cupsCode,
      contractId,
      value,
      municipality,
      observations
    } = req.body;

    // Verificar duplicados
    const existingRecord = await ServiceRecord.findOne({
      documentNumber,
      cupsCode,
      serviceDate,
      contractId
    });

    if (existingRecord) {
      return res.status(400).json({
        message: 'Ya existe un registro para este paciente con el mismo servicio y fecha'
      });
    }

    const serviceRecord = await ServiceRecord.create({
      documentType,
      documentNumber,
      patientName,
      serviceDate,
      cupsCode,
      contractId,
      value,
      municipality,
      observations,
      createdBy: req.user._id
    });

    res.status(201).json(serviceRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getServiceRecords = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      contractId,
      status,
      municipality
    } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.serviceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (contractId) query.contractId = contractId;
    if (status) query.status = status;
    if (municipality) query.municipality = municipality;

    const records = await ServiceRecord.find(query)
      .populate('contractId', 'name type')
      .populate('createdBy', 'username fullName')
      .sort({ serviceDate: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRecordStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const record = await ServiceRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    record.status = status;
    await record.save();

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Versión optimizada de getPatientServices
const getPatientServices = async (req, res) => {
  console.log('getPatientServices EJECUTÁNDOSE con params:', req.params);
  try {
      const { documentNumber } = req.params;
      console.log('Buscando servicios para documento:', documentNumber);

      if (!documentNumber) {
        return res.status(400).json({ 
            message: 'Número de documento es requerido',
            code: 'INVALID_DOCUMENT'
        });
    }
      

      // Buscar el paciente
      const patient = await Patient.findOne({ documentNumber }).select('_id documentType documentNumber firstName secondName firstLastName secondLastName fullName birthDate gender regimen municipality department eps zone active');
      
      if (!patient) {
          return res.status(404).json({ 
              message: 'Paciente no encontrado',
              code: 'PATIENT_NOT_FOUND' 
          });
      }

      // Buscar servicios con filtro de estado optimizado
      const serviceRecords = await ServiceRecord.find({
        documentNumber: documentNumber,
          status: { $ne: 'anulado' }
      }).sort({ serviceDate: -1 }).lean();

      // Usar $in con los IDs de servicio para consulta eficiente
      const serviceIds = serviceRecords.map(record => record._id);
      const prebills = await PreBill.find({
          'services.serviceId': { $in: serviceIds }
      }).select('services.serviceId createdAt _id').lean();

      // Mapear servicios prefacturados para búsqueda O(1)
      const prefacturedServices = new Map();
      prebills.forEach(prebill => {
          prebill.services.forEach(service => {
              if (service.serviceId) {
                  prefacturedServices.set(service.serviceId.toString(), {
                      prefacturedAt: prebill.createdAt,
                      preBillId: prebill._id
                  });
              }
          });
      });

      // Obtener códigos CUPS únicos para minimizar consultas
      const uniqueCupsCode = [...new Set(serviceRecords.map(record => record.cupsCode))];
      const serviceDetails = await Service.find({
          cupsCode: { $in: uniqueCupsCode }
      }).lean();

      // Mapear detalles para búsqueda O(1)
      const serviceDetailsMap = serviceDetails.reduce((map, detail) => {
          map[detail.cupsCode] = detail;
          return map;
      }, {});

      // Verificar si hay algún detalle faltante
      const missingDetails = uniqueCupsCode.filter(
        code => !serviceDetailsMap[code]
      );
      if (missingDetails.length > 0) {
        console.warn('Códigos CUPS sin detalles:', missingDetails);
      }

      // Enriquecer datos de servicios
      const servicesWithDetails = serviceRecords.map(record => {
          const prefactureInfo = prefacturedServices.get(record._id.toString());
          const detail = serviceDetailsMap[record.cupsCode];

          return {
              _id: record._id,
              serviceDate: record.serviceDate,
              cupsCode: record.cupsCode,
              description: detail ? detail.description : '',
              value: record.value,
              isPrefactured: !!prefactureInfo,
              prefacturedAt: prefactureInfo ? prefactureInfo.prefacturedAt : null,
              preBillId: prefactureInfo ? prefactureInfo.preBillId : null
          };
      });

      // Responder con datos estructurados
      res.json({
          patient: patient.toObject(),
          services: servicesWithDetails,
          metadata: {
              totalServices: servicesWithDetails.length,
              prefacturedServices: servicesWithDetails.filter(s => s.isPrefactured).length,
              pendingServices: servicesWithDetails.filter(s => !s.isPrefactured).length
          }
      });
      console.log('Servicios encontrados:', serviceRecords.length, 'para el paciente:', patient.fullName || documentNumber);
      console.log('Enviando respuesta con paciente:', {
        nombre: patient.fullName || 'No disponible',
        servicios: servicesWithDetails.length
      });

  } catch (error) {
      console.error('Error en getPatientServices:', error);
      res.status(500).json({ 
          message: 'Error al obtener servicios del paciente',
          error: error.message,
          code: 'SERVER_ERROR'
      });
  }
};

const assignContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { contractId, company, value } = req.body;
    
    const service = await ServiceRecord.findById(id);
    
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    service.contractId = contractId;
    service.company = company;
    service.value = value;
    
    await service.save();
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createServiceRecord,
  getServiceRecords,
  updateRecordStatus,
  getPatientServices,
  assignContract
};