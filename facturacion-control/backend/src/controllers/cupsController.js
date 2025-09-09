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

// Eliminar un servicio CUPS
const deleteService = async (req, res) => {
  try {
    const { cupsCode } = req.params;
    
    const service = await Service.findOne({ cupsCode });
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // Verificar si tiene tarifas asociadas
    if (service.contracts && service.contracts.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el servicio porque tiene tarifas asociadas. Elimine primero las tarifas.' 
      });
    }
    
    // Eliminar físicamente si no tiene tarifas
    await Service.deleteOne({ cupsCode });
    
    res.json({ 
      message: 'Servicio eliminado correctamente',
      deleted: true,
      cupsCode 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Asignar tarifa a un servicio para un contrato específico
const assignTariff = async (req, res) => {
  try {
    const { cupsCode } = req.params;
    const { contractId, value, requiresAuthorization, description } = req.body;
    
    // Verificar si el servicio existe, si no crearlo dinámicamente
    let service = await Service.findOne({ cupsCode });
    if (!service) {
      // Crear el servicio dinámicamente en el catálogo
      try {
        service = await Service.create({
          cupsCode,
          description: description || `Servicio ${cupsCode}`,
          category: 'MEDICINA',
          status: 'active',
          contracts: []
        });
        console.log(`Servicio ${cupsCode} creado dinámicamente`);
      } catch (createError) {
        return res.status(400).json({ 
          message: `Error creando servicio: ${createError.message}` 
        });
      }
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
      // Mantener el estado actual si ya existe
      if (service.contracts[existingTariffIndex].active === undefined) {
        service.contracts[existingTariffIndex].active = true;
      }
    } else {
      // Agregar nueva tarifa
      service.contracts.push({
        contractId,
        value,
        requiresAuthorization: requiresAuthorization || false,
        active: true
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
      requiresAuthorization: tariff.requiresAuthorization || false,
      active: tariff.active !== false // Por defecto true si no está especificado
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
    
    console.log(`Iniciando importación de ${tariffs.length} tarifas para contrato ${contractId}`);
    
    for (const tariff of tariffs) {
      try {
        console.log(`Procesando tarifa:`, tariff);
        const { cupsCode, value, requiresAuthorization, description } = tariff;
        
        if (!cupsCode || value === undefined) {
          console.log(`Error de validación para tarifa:`, tariff);
          results.errors.push({
            cupsCode,
            error: 'Código CUPS y valor son obligatorios'
          });
          continue;
        }
        
        // Buscar el servicio, si no existe lo creamos dinámicamente
        let service = await Service.findOne({ cupsCode });
        console.log(`Servicio ${cupsCode} ${service ? 'encontrado' : 'no encontrado'} en catálogo`);
        
        if (!service) {
          // Crear el servicio dinámicamente en el catálogo
          try {
            console.log(`Creando servicio dinámicamente: ${cupsCode}`);
            service = await Service.create({
              cupsCode,
              description: description || `Servicio ${cupsCode}`,
              category: 'MEDICINA',
              status: 'active',
              contracts: []
            });
            console.log(`✅ Servicio ${cupsCode} creado exitosamente en el catálogo`);
          } catch (createError) {
            console.log(`❌ Error creando servicio ${cupsCode}:`, createError.message);
            results.errors.push({
              cupsCode,
              error: `Error creando servicio: ${createError.message}`
            });
            continue;
          }
        }
        
        // Verificar si ya existe la tarifa para este contrato
        const existingTariffIndex = service.contracts.findIndex(
          c => c.contractId && c.contractId.toString() === contractId
        );
        
        if (existingTariffIndex >= 0) {
          // Actualizar tarifa existente
          console.log(`Actualizando tarifa existente para ${cupsCode}`);
          service.contracts[existingTariffIndex].value = value;
          if (requiresAuthorization !== undefined) {
            service.contracts[existingTariffIndex].requiresAuthorization = requiresAuthorization;
          }
          
          await service.save();
          results.updated++;
          console.log(`✅ Tarifa actualizada para ${cupsCode}`);
        } else {
          // Agregar nueva tarifa
          console.log(`Agregando nueva tarifa para ${cupsCode}`);
          service.contracts.push({
            contractId,
            value,
            requiresAuthorization: requiresAuthorization || false,
            active: true
          });
          
          await service.save();
          results.created++;
          console.log(`✅ Nueva tarifa creada para ${cupsCode}`);
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

// Activar/Desactivar tarifa de un contrato específico
const toggleTariffStatus = async (req, res) => {
  try {
    const { cupsCode, contractId } = req.params;
    const { active } = req.body;
    
    const service = await Service.findOne({ cupsCode });
    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // Buscar la tarifa para el contrato específico
    const tariffIndex = service.contracts.findIndex(
      c => c.contractId && c.contractId.toString() === contractId
    );
    
    if (tariffIndex === -1) {
      return res.status(404).json({ 
        message: 'No existe tarifa para este servicio en el contrato especificado' 
      });
    }
    
    // Cambiar el estado
    service.contracts[tariffIndex].active = active;
    await service.save();
    
    res.json({
      message: `Tarifa ${active ? 'activada' : 'desactivada'} correctamente`,
      cupsCode,
      contractId,
      active
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener solo los servicios que tienen tarifas asignadas para un contrato específico
const getServicesWithTariffs = async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Verificar si el contrato existe
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }
    
    // Obtener solo los servicios que tienen tarifa para este contrato
    const servicesWithTariffs = await Service.find({
      status: 'active',
      'contracts.contractId': contractId
    });
    
    // Mapear servicios con sus tarifas para este contrato
    const formattedServices = servicesWithTariffs.map(service => {
      // Buscar la tarifa para este contrato
      const tariff = service.contracts.find(
        c => c.contractId && c.contractId.toString() === contractId
      );
      
      return {
        cupsCode: service.cupsCode,
        description: service.description,
        category: service.category,
        // Datos de la tarifa
        value: tariff ? tariff.value : 0,
        requiresAuthorization: tariff ? tariff.requiresAuthorization : false,
        active: tariff ? (tariff.active !== false) : true,
        hasTariff: true // Todos tienen tarifa porque es el filtro de búsqueda
      };
    });
    
    res.json(formattedServices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};