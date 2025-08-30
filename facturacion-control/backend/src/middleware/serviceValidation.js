const ServiceRecord = require('../models/ServiceRecord');
const Contract = require('../models/Contract');

const validateServiceRecord = async (req, res, next) => {
  try {
    const { documentNumber, cupsCode, serviceDate, contractId } = req.body;
    
    // Convertir fecha para comparación (solo día, ignorar hora)
    const serviceDateOnly = new Date(serviceDate);
    serviceDateOnly.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(serviceDateOnly);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // VALIDACIÓN 1: Prevenir servicios duplicados en la misma fecha
    const duplicateService = await ServiceRecord.findOne({
      documentNumber,
      cupsCode,
      serviceDate: {
        $gte: serviceDateOnly,
        $lt: nextDay
      },
      status: { $ne: 'anulado' }
    });
    
    if (duplicateService) {
      return res.status(400).json({
        error: 'DUPLICATE_SERVICE',
        message: `Ya existe un servicio ${cupsCode} para el paciente ${documentNumber} en la fecha ${serviceDate}`,
        details: {
          existingService: {
            id: duplicateService._id,
            fecha: duplicateService.serviceDate,
            contrato: duplicateService.contractId
          }
        }
      });
    }
    
    // VALIDACIÓN 2: Verificar que el contrato tenga capacidad disponible
    if (contractId) {
      const contract = await Contract.findById(contractId);
      
      if (!contract) {
        return res.status(400).json({
          error: 'CONTRACT_NOT_FOUND',
          message: 'Contrato no encontrado'
        });
      }
      
      // Verificar si el contrato está vigente
      const now = new Date();
      if (now < contract.validFrom || now > contract.validTo) {
        return res.status(400).json({
          error: 'CONTRACT_EXPIRED',
          message: 'El contrato no está vigente en la fecha actual'
        });
      }
      
      // Verificar capacidad del techo presupuestal
      if (contract.tieneTecho && contract.valorTecho) {
        const valorDisponible = contract.valorTecho - contract.valorFacturado;
        const valorServicio = req.body.value || 0;
        
        if (valorServicio > valorDisponible) {
          return res.status(400).json({
            error: 'INSUFFICIENT_BUDGET',
            message: 'El contrato no tiene suficiente presupuesto disponible',
            details: {
              valorServicio,
              valorDisponible,
              valorTecho: contract.valorTecho,
              valorEjecutado: contract.valorFacturado,
              porcentajeEjecutado: Math.round((contract.valorFacturado / contract.valorTecho) * 100)
            }
          });
        }
      }
    }
    
    // VALIDACIÓN 3: Límite de servicios por paciente por día (configurable)
    const MAX_SERVICES_PER_DAY = 5; // Configurable según necesidades
    
    const servicesCountToday = await ServiceRecord.countDocuments({
      documentNumber,
      serviceDate: {
        $gte: serviceDateOnly,
        $lt: nextDay
      },
      status: { $ne: 'anulado' }
    });
    
    if (servicesCountToday >= MAX_SERVICES_PER_DAY) {
      return res.status(400).json({
        error: 'DAILY_LIMIT_EXCEEDED',
        message: `El paciente ${documentNumber} ya tiene ${servicesCountToday} servicios registrados para esta fecha. Límite máximo: ${MAX_SERVICES_PER_DAY}`,
        details: {
          serviciosHoy: servicesCountToday,
          limite: MAX_SERVICES_PER_DAY
        }
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Error en validación de servicios:', error);
    res.status(500).json({
      error: 'VALIDATION_ERROR',
      message: 'Error interno en la validación'
    });
  }
};

module.exports = { validateServiceRecord };