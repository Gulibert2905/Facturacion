const Contract = require('../models/Contract');
const ServiceRecord = require('../models/ServiceRecord');


// Obtener contratos con información de techo
const getContractsWithCeiling = async (req, res) => {
  try {
    const { includeWithoutCeiling = false } = req.query;
    
    const query = { status: 'active' };
    if (!includeWithoutCeiling) {
      query.tieneTecho = true;
    }
    
    const contracts = await Contract.find(query)
      .populate('company', 'name nit')
      .sort({ 'alertas.porcentajeCritico': -1 });
    
    // Calcular métricas en tiempo real
    const contractsWithMetrics = await Promise.all(
      contracts.map(async (contract) => {
        // Actualizar valor facturado actual
        await contract.actualizarValorFacturado();
        
        const contractObj = contract.toObject();
        
        if (contract.tieneTecho) {
          // Calcular días estimados para agotamiento
          const valorDisponible = contract.valorDisponible;
          const diasHistoricos = 30; // Últimos 30 días para calcular promedio
          
          const fechaLimite = new Date();
          fechaLimite.setDate(fechaLimite.getDate() - diasHistoricos);
          
          const serviciosRecientes = await ServiceRecord.aggregate([
            {
              $match: {
                contractId: contract._id,
                serviceDate: { $gte: fechaLimite },
                status: { $ne: 'anulado' }
              }
            },
            {
              $group: {
                _id: null,
                valorPromedioDiario: { $avg: '$value' },
                totalServicios: { $sum: 1 },
                totalValor: { $sum: '$value' }
              }
            }
          ]);
          
          let diasEstimadosAgotamiento = null;
          if (serviciosRecientes.length > 0 && serviciosRecientes[0].valorPromedioDiario > 0) {
            const promedioDiario = serviciosRecientes[0].valorPromedioDiario;
            diasEstimadosAgotamiento = Math.ceil(valorDisponible / promedioDiario);
          }
          
          contractObj.metricas = {
            diasEstimadosAgotamiento,
            promedioFacturacionDiaria: serviciosRecientes[0]?.valorPromedioDiario || 0,
            serviciosRecientes: serviciosRecientes[0]?.totalServicios || 0,
            ultimaActualizacion: contract.ultimaActualizacion
          };
        }
        
        return contractObj;
      })
    );
    
    res.json(contractsWithMetrics);
    
  } catch (error) {
    console.error('Error obteniendo contratos:', error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar techo de contrato
const updateContractCeiling = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tieneTecho, 
      valorTecho, 
      alertas 
    } = req.body;
    
    const contract = await Contract.findById(id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }
    
    // Validaciones de negocio
    if (tieneTecho && (!valorTecho || valorTecho <= 0)) {
      return res.status(400).json({
        message: 'Si el contrato tiene techo, debe especificar un valor mayor a cero'
      });
    }
    
    if (valorTecho && valorTecho < contract.valorFacturado) {
      return res.status(400).json({
        message: `El nuevo valor de techo (${valorTecho}) no puede ser menor al valor ya facturado (${contract.valorFacturado})`
      });
    }
    
    // Actualizar campos
    contract.tieneTecho = tieneTecho;
    contract.valorTecho = valorTecho;
    
    if (alertas) {
      contract.alertas = {
        ...contract.alertas,
        ...alertas
      };
    }
    
    contract.ultimaActualizacion = new Date();
    
    await contract.save();
    
    res.json(contract);
    
  } catch (error) {
    console.error('Error actualizando techo:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener alertas de contratos
const getContractAlerts = async (req, res) => {
  try {
    const contracts = await Contract.find({
      tieneTecho: true,
      status: 'active'
    }).populate('company', 'name');
    
    const alerts = [];
    
    for (const contract of contracts) {
      await contract.actualizarValorFacturado();
      
      const porcentaje = contract.porcentajeEjecutado;
      const estado = contract.estadoTecho;
      
      if (['alerta', 'critico'].includes(estado)) {
        alerts.push({
          contractId: contract._id,
          contractName: contract.name,
          companyName: contract.company.name,
          porcentajeEjecutado: porcentaje,
          valorEjecutado: contract.valorFacturado,
          valorTecho: contract.valorTecho,
          valorDisponible: contract.valorDisponible,
          estado,
          fechaUltimaActualizacion: contract.ultimaActualizacion,
          nivel: estado === 'critico' ? 'error' : 'warning'
        });
      }
    }
    
    // Ordenar por nivel de criticidad
    alerts.sort((a, b) => {
      if (a.nivel === 'error' && b.nivel === 'warning') return -1;
      if (a.nivel === 'warning' && b.nivel === 'error') return 1;
      return b.porcentajeEjecutado - a.porcentajeEjecutado;
    });
    
    res.json(alerts);
    
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ message: error.message });
  }
};

// 3. MIDDLEWARE PARA ACTUALIZAR AUTOMÁTICAMENTE VALORES DE CONTRATOS
const updateContractValues = async (req, res, next) => {
  try {
    // Este middleware se ejecuta después de crear/actualizar un servicio
    const serviceRecord = res.locals.createdService || res.locals.updatedService;
    
    if (serviceRecord && serviceRecord.contractId) {
      const contract = await Contract.findById(serviceRecord.contractId);
      
      if (contract) {
        await contract.actualizarValorFacturado();
        
        // Verificar si se debe generar alerta
        const porcentaje = contract.porcentajeEjecutado;
        
        if (contract.tieneTecho && porcentaje >= contract.alertas.porcentajeAlerta) {
          // Emitir evento para notificaciones en tiempo real si tienes WebSocket
          // socketIO.emit('contract-alert', {
          //   contractId: contract._id,
          //   porcentaje,
          //   estado: contract.estadoTecho
          // });
          
          console.log(`ALERTA: Contrato ${contract.name} al ${porcentaje}% de ejecución`);
        }
      }
    }
    
    next();
    
  } catch (error) {
    console.error('Error actualizando valores de contrato:', error);
    next(); // No bloquear la respuesta por este error
  }
};

module.exports = {
  getContractsWithCeiling,
  updateContractCeiling,
  getContractAlerts,
  updateContractValues
};
