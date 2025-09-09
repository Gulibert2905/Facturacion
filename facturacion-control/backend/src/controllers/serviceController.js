const Service = require('../models/Service');
const ServiceRecord = require('../models/ServiceRecord');
const PreBill = require('../models/PreBill');
const Patient = require('../models/Patient');
const { validateServiceRecord } = require('../middleware/serviceValidation');
const { updateContractValues } = require('../controllers/contractController');

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

    // Usar el filtro de empresa desde el middleware
    const query = req.createCompanyFilter ? req.createCompanyFilter() : {};

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
      .populate('empresa', 'nombre nit codigo')
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

const createServiceRecordEnhanced = async (req, res) => {
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

    // La validación ya se hizo en el middleware validateServiceRecord
    
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
      createdBy: req.user?._id
    });

    // Guardar para el middleware de actualización de contratos
    res.locals.createdService = serviceRecord;

    res.status(201).json({
      success: true,
      data: serviceRecord,
      message: 'Servicio registrado exitosamente'
    });
    
  } catch (error) {
    console.error('Error creando servicio:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

const exportPrefacturacion = async (req, res) => {
  try {
    const {
      services,
      patient,
      company,
      contract,
      totalServices,
      totalValue
    } = req.body;

    if (!services || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay servicios para exportar'
      });
    }

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'Información del paciente es requerida'
      });
    }

    // Crear la prefacturación
    const prefacturacion = new PreBill({
      companyId: company,
      contractId: contract,
      patientId: patient._id,
      patientData: {
        documentNumber: patient.documentNumber,
        documentType: patient.documentType,
        firstName: patient.firstName,
        secondName: patient.secondName,
        firstLastName: patient.firstLastName,
        secondLastName: patient.secondLastName,
        birthDate: patient.birthDate,
        gender: patient.gender,
        eps: patient.eps,
        department: patient.department,
        municipality: patient.municipality,
        zone: patient.zone
      },
      services: services.map(service => ({
        serviceId: service._id,
        cupsCode: service.cupsCode,
        description: service.description,
        serviceDate: service.serviceDate,
        value: service.value,
        authorization: service.authorization || '',
        diagnosis: service.diagnosis || ''
      })),
      totalValue: totalValue,
      status: 'parcial'
    });

    await prefacturacion.save();

    // Marcar los servicios como prefacturados
    const serviceIds = services.map(service => service._id);
    await ServiceRecord.updateMany(
      { _id: { $in: serviceIds } },
      { 
        status: 'prefacturado',
        preBillId: prefacturacion._id,
        updatedAt: new Date()
      }
    );

    // Generar Excel inmediatamente
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Prefacturación');

    // Definir las columnas según la estructura requerida
    worksheet.columns = [
      { header: 'N DOCUMENTO', key: 'documentNumber', width: 15 },
      { header: 'TIPDOC', key: 'documentType', width: 10 },
      { header: 'PRINOM', key: 'firstName', width: 15 },
      { header: 'SEGNOM', key: 'secondName', width: 15 },
      { header: 'PRIAPE', key: 'firstLastName', width: 15 },
      { header: 'SEGAPE', key: 'secondLastName', width: 15 },
      { header: 'FECNAC', key: 'birthDate', width: 12 },
      { header: 'SEXO', key: 'gender', width: 8 },
      { header: 'EPS', key: 'eps', width: 15 },
      { header: 'DPTO', key: 'department', width: 15 },
      { header: 'MIPIO', key: 'municipality', width: 15 },
      { header: 'ZONA', key: 'zone', width: 10 },
      { header: 'CIUDAD_NAC', key: 'ciudadNacimiento', width: 20 },
      { header: 'CIUDAD_EXP', key: 'ciudadExpedicion', width: 20 },
      { header: 'TOTAL', key: 'totalValue', width: 12 },
      { header: 'FECHA_SERV', key: 'serviceDate', width: 12 },
      { header: 'AUTORIZACION', key: 'authorization', width: 15 },
      { header: 'DX', key: 'diagnosis', width: 10 },
      { header: 'CUPS', key: 'cupsCode', width: 10 },
      { header: 'TIPDOC_MED', key: 'doctorDocumentType', width: 12 },
      { header: 'DOC_MEDICO', key: 'doctorDocumentNumber', width: 15 },
      { header: 'NOMBRE_MEDICO', key: 'doctorName', width: 25 },
      { header: 'TP_MEDICO', key: 'doctorProfessionalCard', width: 15 },
      { header: 'ESPECIALIDAD', key: 'doctorSpecialty', width: 20 },
      { header: 'EMPRESA', key: 'company', width: 20 },
      { header: 'CONTRATO', key: 'contract', width: 20 }
    ];

    // Agregar los datos de la prefactura recién creada
    services.forEach(service => {
      worksheet.addRow({
        documentNumber: patient.documentNumber,
        documentType: patient.documentType,
        firstName: patient.firstName,
        secondName: patient.secondName,
        firstLastName: patient.firstLastName,
        secondLastName: patient.secondLastName,
        birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : '',
        gender: patient.gender,
        eps: patient.eps,
        department: patient.department,
        municipality: patient.municipality,
        zone: patient.zone || 'U',
        ciudadNacimiento: patient.ciudadNacimiento,
        ciudadExpedicion: patient.ciudadExpedicion,
        totalValue: service.value,
        serviceDate: service.serviceDate ? new Date(service.serviceDate).toISOString().split('T')[0] : '',
        authorization: service.authorization || '',
        diagnosis: service.diagnosis || '',
        cupsCode: service.cupsCode,
        doctorDocumentType: service.doctorDocumentType || '',
        doctorDocumentNumber: service.doctorDocumentNumber || '',
        doctorName: service.doctorName || '',
        doctorProfessionalCard: service.doctorProfessionalCard || '',
        doctorSpecialty: service.doctorSpecialty || '',
        company: company.name || company,
        contract: contract.name || contract
      });
    });

    // Aplicar estilos
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Enviar archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=prefacturacion_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    res.send(buffer);

  } catch (error) {
    console.error('Error exportando prefacturación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar prefacturación',
      error: error.message
    });
  }
};

module.exports = {
  createServiceRecord,
  getServiceRecords,
  updateRecordStatus,
  getPatientServices,
  assignContract,
  createServiceRecordEnhanced,
  exportPrefacturacion
};