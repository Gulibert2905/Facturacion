// controllers/cupsController.js
const Service = require('../models/Service');
const Contract = require('../models/Contract');

// Obtener todos los servicios CUPS
const getServices = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    const query = {};
    
    // Filtrar por estado
    if (status) {
      query.status = status;
    }
    
    // Buscar por código o descripción
    if (search) {
      query.$or = [
        { cupsCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const services = await Service.find(query)
      .sort({ cupsCode: 1 });
    
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un servicio por código CUPS
const getServiceByCupsCode = async (req, res) => {
  try {
    const { cupsCode } = req.params;
    
    const service = await Service.findOne({ cupsCode })
      .populate({
        path: 'contracts.contractId',
        select: 'name code company',
        populate: {
          path: 'company',
          select: 'name'
        }
      });
    
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo servicio CUPS
const createService = async (req, res) => {
  try {
    const { cupsCode, description, category, status } = req.body;
    
    // Verificar si ya existe un servicio con el mismo código
    const existingService = await Service.findOne({ cupsCode });
    if (existingService) {
      return res.status(400).json({ message: 'Ya existe un servicio con este código CUPS' });
    }
    
    const service = await Service.create({
      cupsCode,
      description,
      category,
      status: status || 'active',
      contracts: []
    });
    
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Actualizar un servicio CUPS
const updateService = async (req, res) => {
  try {
    const { cupsCode } = req.params;
    const { description, category, status } = req.body;
    
    const service = await Service.findOne({ cupsCode });
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    service.description = description || service.description;
    service.category = category || service.category;
    if (status) service.status = status;
    
    await service.save();
    
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Asignar tarifa a un servicio para un contrato específico
const assignTariff = async (req, res) => {
  try {
    const { cupsCode } = req.params;
    const { contractId, value, requiresAuthorization } = req.body;
    
    // Verificar si el servicio existe
    const service = await Service.findOne({ cupsCode });
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // Verificar si el contrato existe
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }
    
    // Buscar si ya existe una tarifa para este contrato
    const existingTariffIndex = service.contracts.findIndex(
      c => c.contractId && c.contractId.toString() === contractId
    );
    
    if (existingTariffIndex >= 0) {
      // Actualizar la tarifa existente
      service.contracts[existingTariffIndex].value = value;
      service.contracts[existingTariffIndex].requiresAuthorization = requiresAuthorization || false;
    } else {
      // Agregar nueva tarifa
      service.contracts.push({
        contractId,
        value,
        requiresAuthorization: requiresAuthorization || false
      });
    }
    
    await service.save();
    
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar tarifa de un contrato
const removeTariff = async (req, res) => {
  try {
    const { cupsCode, contractId } = req.params;
    
    const service = await Service.findOne({ cupsCode });
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // Filtrar para eliminar la tarifa del contrato
    service.contracts = service.contracts.filter(
      c => !c.contractId || c.contractId.toString() !== contractId
    );
    
    await service.save();
    
    res.json({ message: 'Tarifa eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Importar servicios desde archivo
const importServices = async (req, res) => {
  try {
    const { services } = req.body;
    
    const results = {
      created: 0,
      updated: 0,
      errors: []
    };
    
    for (const service of services) {
      try {
        const { cupsCode, description, category } = service;
        
        if (!cupsCode || !description) {
          results.errors.push({
            cupsCode,
            error: 'Código CUPS y descripción son obligatorios'
          });
          continue;
        }
        
        // Verificar si ya existe
        const existingService = await Service.findOne({ cupsCode });
        
        if (existingService) {
          // Actualizar servicio existente
          existingService.description = description;
          if (category) existingService.category = category;
          
          await existingService.save();
          results.updated++;
        } else {
          // Crear nuevo servicio
          await Service.create({
            cupsCode,
            description,
            category: category || '',
            status: 'active',
            contracts: []
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          cupsCode: service.cupsCode || 'Desconocido',
          error: error.message
        });
      }
    }
    
    res.json({
      message: `Importación completada: ${results.created} servicios creados, ${results.updated} actualizados, ${results.errors.length} errores`,
      details: results
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener tarifa de un servicio para un contrato específico
const getServiceTariff = async (req, res) => {
  try {
    const { cupsCode, contractId } = req.params;
    
    const service = await Service.findOne({ cupsCode });
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // Buscar la tarifa para el contrato específico
    const tariff = service.contracts.find(
      c => c.contractId && c.contractId.toString() === contractId
    );
    
    if (!tariff) {
      return res.status(404).json({ 
        message: `No existe tarifa para el servicio ${cupsCode} en el contrato especificado` 
      });
    }
    
    res.json({
      cupsCode,
      description: service.description,
      value: tariff.value,
      requiresAuthorization: tariff.requiresAuthorization || false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Importar tarifas para un contrato específico
const importTariffs = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { tariffs } = req.body;
    
    // Verificar si el contrato existe
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }
    
    const results = {
      updated: 0,
      created: 0,
      errors: []
    };
    
    for (const tariff of tariffs) {
      try {
        const { cupsCode, value, requiresAuthorization } = tariff;
        
        if (!cupsCode || value === undefined) {
          results.errors.push({
            cupsCode,
            error: 'Código CUPS y valor son obligatorios'
          });
          continue;
        }
        
        // Buscar el servicio
        const service = await Service.findOne({ cupsCode });
        
        if (!service) {
          results.errors.push({
            cupsCode,
            error: 'Servicio no encontrado'
          });
          continue;
        }
        
        // Verificar si ya existe la tarifa para este contrato
        const existingTariffIndex = service.contracts.findIndex(
          c => c.contractId && c.contractId.toString() === contractId
        );
        
        if (existingTariffIndex >= 0) {
          // Actualizar tarifa existente
          service.contracts[existingTariffIndex].value = value;
          if (requiresAuthorization !== undefined) {
            service.contracts[existingTariffIndex].requiresAuthorization = requiresAuthorization;
          }
          
          await service.save();
          results.updated++;
        } else {
          // Agregar nueva tarifa
          service.contracts.push({
            contractId,
            value,
            requiresAuthorization: requiresAuthorization || false
          });
          
          await service.save();
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          cupsCode: tariff.cupsCode || 'Desconocido',
          error: error.message
        });
      }
    }
    
    res.json({
      message: `Importación de tarifas completada: ${results.created} tarifas creadas, ${results.updated} actualizadas, ${results.errors.length} errores`,
      details: results
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  getServiceByCupsCode,
  createService,
  updateService,
  assignTariff,
  removeTariff,
  importServices,
  getServiceTariff,
  importTariffs
};