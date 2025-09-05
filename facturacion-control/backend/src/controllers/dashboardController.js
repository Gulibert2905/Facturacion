// Archivo: backend/src/controllers/dashboardController.js (mejorado)
const ServiceRecord = require('../models/ServiceRecord');
const Patient = require('../models/Patient');
const PreBill = require('../models/PreBill');
const Company = require('../models/Company');
const logger = require('../utils/logger');
const Contract = require('../models/Contract');
const { measurePerformance } = require('../utils/performanceMonitor');

// Función para obtener estadísticas por período
const getDashboardStats = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        logger.info({
            type: 'dashboard_stats_request',
            period
        });

        // Calcular fechas basadas en el período
        const endDate = new Date();
        let startDate = new Date();
        
        switch(period) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'custom':
                if (req.query.startDate) {
                    startDate = new Date(req.query.startDate);
                }
                if (req.query.endDate) {
                    endDate = new Date(req.query.endDate);
                }
                break;
        }

        // Obtener estadísticas mediante ejecución paralela
        const [
            todayServices,
            totalPatients,
            totalServices,
            pendingServices,
            prefacturasPorEmpresa,
            serviciosMasFacturados,
            valoresPorPeriodo,
            distribucionRegimen,
            distribucionMunicipio,
            facturacionSemanal
        ] = await Promise.all([
            // Servicios de hoy
            measurePerformance(async () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                return ServiceRecord.countDocuments({
                    serviceDate: {
                        $gte: today,
                        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                });
            }, 'dashboard_count_today_services'),
            
            // Total pacientes
            measurePerformance(() => 
                Patient.countDocuments({ active: true })
            , 'dashboard_count_patients'),
            
            // Total servicios
            measurePerformance(() => 
                ServiceRecord.countDocuments({
                    serviceDate: { $gte: startDate, $lte: endDate }
                })
            , 'dashboard_count_services'),
            
            // Servicios pendientes
            measurePerformance(() => 
                ServiceRecord.countDocuments({ 
                    status: 'pendiente',
                    serviceDate: { $gte: startDate, $lte: endDate }
                })
            , 'dashboard_count_pending'),
            
            // Prefacturas por empresa
            measurePerformance(() => 
                PreBill.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    },
                    {
                        $group: {
                            _id: '$companyId',
                            total: { $sum: 1 },
                            valorTotal: { $sum: '$totalValue' }
                        }
                    },
                    {
                        $lookup: {
                            from: 'companies',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'empresa'
                        }
                    }
                ])
            , 'dashboard_aggregate_prebills_by_company'),
            
            // Servicios más facturados
            measurePerformance(() => 
                ServiceRecord.aggregate([
                    {
                        $match: {
                            serviceDate: { $gte: startDate, $lte: endDate }
                        }
                    },
                    {
                        $group: {
                            _id: '$cupsCode',
                            cantidad: { $sum: 1 },
                            valorTotal: { $sum: '$value' }
                        }
                    },
                    { $sort: { cantidad: -1 } },
                    { $limit: 10 }
                ])
            , 'dashboard_aggregate_top_services'),
            
            // Valores por período
            measurePerformance(() => 
                PreBill.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            total: { $sum: '$totalValue' }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ])
            , 'dashboard_aggregate_values_by_period'),
            
            // Distribución por régimen
            measurePerformance(() => 
                Patient.aggregate([
                    {
                        $group: {
                            _id: '$regimen',
                            cantidad: { $sum: 1 }
                        }
                    }
                ])
            , 'dashboard_aggregate_by_regimen'),
            
            // Distribución por municipio
            measurePerformance(() => 
                Patient.aggregate([
                    {
                        $group: {
                            _id: '$municipality',
                            cantidad: { $sum: 1 }
                        }
                    },
                    { $sort: { cantidad: -1 } },
                    { $limit: 10 }
                ])
            , 'dashboard_aggregate_by_municipality'),
            
            // Facturación semanal
            measurePerformance(() => 
                ServiceRecord.aggregate([
                    {
                        $match: {
                            serviceDate: { $gte: startDate, $lte: endDate }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$serviceDate' },
                                week: { $week: '$serviceDate' }
                            },
                            total: { $sum: '$value' },
                            cantidad: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.week': 1 } }
                ])
            , 'dashboard_aggregate_weekly_billing')
        ]);

        // Construir respuesta consolidada
        const response = {
            todayServices,
            totalPatients,
            totalServices,
            pendingServices,
            prefacturasPorEmpresa,
            serviciosMasFacturados,
            valoresPorPeriodo,
            distribucionRegimen,
            distribucionMunicipio,
            facturacionSemanal,
            metadata: {
                period,
                startDate,
                endDate
            }
        };

        res.json(response);
    } catch (error) {
        logger.logError(error, req, {
            operation: 'dashboard_stats'
        });
        
        res.status(500).json({ 
            message: 'Error al obtener estadísticas del dashboard',
            error: error.message
        });
    }
};

// Obtener servicios recientes
const getRecentServices = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const [recentServices, recentPrebills, recentPatients] = await Promise.all([
            // Servicios recientes
            ServiceRecord.find()
                .populate('patientId', 'fullName')
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .lean(),
            
            // Prefacturas recientes
            PreBill.find()
                .populate('patientId', 'fullName')
                .populate('companyId', 'name')
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .lean(),
            
            // Pacientes recientes
            Patient.find()
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .lean()
        ]);

        // Formatear datos para la respuesta
        const formattedServices = recentServices.map(service => ({
            _id: service._id,
            type: 'service',
            patientName: service.patientId ? service.patientId.fullName : 'Paciente desconocido',
            cupsCode: service.cupsCode,
            value: service.value,
            serviceDate: service.serviceDate,
            status: service.status,
            createdAt: service.createdAt
        }));

        const formattedPrebills = recentPrebills.map(prebill => ({
            _id: prebill._id,
            type: 'prebill',
            patientName: prebill.patientId ? prebill.patientId.fullName : 'Paciente desconocido',
            companyName: prebill.companyId ? prebill.companyId.name : 'Empresa desconocida',
            totalValue: prebill.totalValue,
            servicesCount: prebill.services ? prebill.services.length : 0,
            status: prebill.status,
            createdAt: prebill.createdAt
        }));

        const formattedPatients = recentPatients.map(patient => ({
            _id: patient._id,
            type: 'patient',
            fullName: patient.fullName,
            documentNumber: patient.documentNumber,
            regimen: patient.regimen,
            municipality: patient.municipality,
            createdAt: patient.createdAt
        }));

        // Combinar, ordenar por fecha y limitar
        const allActivity = [...formattedServices, ...formattedPrebills, ...formattedPatients]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, Number(limit));

        res.json(allActivity);
    } catch (error) {
        logger.logError(error, req, {
            operation: 'recent_activity'
        });
        
        res.status(500).json({ 
            message: 'Error al obtener actividad reciente',
            error: error.message
        });
    }
};

// Nuevo endpoint para estadísticas avanzadas con filtros múltiples
const getDashboardStatsAdvanced = async (req, res) => {
  try {
    const {
      period = 'month',
      company = 'all',
      contract = 'all',
      regimen = 'all',
      municipality = 'all',
      city = 'all',
      startDate,
      endDate
    } = req.query;

    // Calcular fechas
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        serviceDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const endDateCalc = new Date();
      let startDateCalc = new Date();
      
      switch(period) {
        case 'today':
          startDateCalc.setHours(0, 0, 0, 0);
          endDateCalc.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDateCalc.setDate(startDateCalc.getDate() - 7);
          break;
        case 'month':
          startDateCalc.setMonth(startDateCalc.getMonth() - 1);
          break;
        case 'quarter':
          startDateCalc.setMonth(startDateCalc.getMonth() - 3);
          break;
        case 'semester':
          startDateCalc.setMonth(startDateCalc.getMonth() - 6);
          break;
        case 'year':
          startDateCalc.setFullYear(startDateCalc.getFullYear() - 1);
          break;
      }
      
      dateFilter = {
        serviceDate: { $gte: startDateCalc, $lte: endDateCalc }
      };
    }

    // Construir filtros dinámicos
    let serviceFilter = { ...dateFilter };
    let patientFilter = {};
    
    if (company !== 'all') {
      serviceFilter.companyId = new mongoose.Types.ObjectId(company);
    }
    
    if (contract !== 'all') {
      serviceFilter.contractId = new mongoose.Types.ObjectId(contract);
    }
    
    if (regimen !== 'all') {
      patientFilter.regimen = regimen;
    }
    
    if (municipality !== 'all') {
      patientFilter.municipality = municipality;
    }
    
    if (city !== 'all') {
      patientFilter.$or = [
        { ciudadNacimiento: city },
        { ciudadExpedicion: city }
      ];
    }

    // Ejecutar consultas en paralelo
    const [
      // Métricas básicas con filtros
      totalServices,
      totalRevenue,
      totalPatients,
      pendingServices,
      
      // Contratos con progreso de techo
      contractsWithProgress,
      
      // Distribuciones
      servicesByRegimen,
      servicesByMunicipality,
      servicesByCompany,
      servicesByType,
      
      // Tendencias temporales
      servicesOverTime,
      revenueOverTime,
      
      // Métricas de eficiencia
      averageServiceValue,
      topServices
      
    ] = await Promise.all([
      // Total servicios filtrados
      ServiceRecord.countDocuments(serviceFilter),
      
      // Total ingresos
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ]).then(result => result[0]?.total || 0),
      
      // Pacientes únicos
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        { $group: { _id: '$patientId' } },
        { $count: 'total' }
      ]).then(result => result[0]?.total || 0),
      
      // Servicios pendientes
      ServiceRecord.countDocuments({ ...serviceFilter, status: 'pendiente' }),
      
      // Contratos con progreso de techo
      Contract.find({
        ...(company !== 'all' ? { company: new mongoose.Types.ObjectId(company) } : {}),
        tieneTecho: true,
        status: 'active'
      })
      .populate('company', 'name')
      .lean()
      .then(async (contracts) => {
        // Actualizar valores facturados para cada contrato
        const contractsWithData = await Promise.all(
          contracts.map(async (contract) => {
            const facturado = await ServiceRecord.aggregate([
              {
                $match: {
                  contractId: contract._id,
                  status: { $ne: 'anulado' }
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$value' }
                }
              }
            ]);
            
            const valorFacturado = facturado[0]?.total || 0;
            const porcentajeEjecutado = contract.valorTecho > 0 ? 
              Math.round((valorFacturado / contract.valorTecho) * 100) : 0;
            
            return {
              ...contract,
              valorFacturado,
              porcentajeEjecutado,
              valorDisponible: contract.valorTecho - valorFacturado,
              estado: porcentajeEjecutado >= 90 ? 'critico' : 
                     porcentajeEjecutado >= 80 ? 'alerta' : 'normal'
            };
          })
        );
        
        return contractsWithData.sort((a, b) => b.porcentajeEjecutado - a.porcentajeEjecutado);
      }),
      
      // Distribución por régimen
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        {
          $lookup: {
            from: 'patients',
            localField: 'patientId',
            foreignField: '_id',
            as: 'patient'
          }
        },
        { $unwind: '$patient' },
        ...(Object.keys(patientFilter).length > 0 ? [{ $match: patientFilter }] : []),
        {
          $group: {
            _id: '$patient.regimen',
            count: { $sum: 1 },
            value: { $sum: '$value' }
          }
        }
      ]),
      
      // Distribución por municipio
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        {
          $lookup: {
            from: 'patients',
            localField: 'patientId',
            foreignField: '_id',
            as: 'patient'
          }
        },
        { $unwind: '$patient' },
        ...(Object.keys(patientFilter).length > 0 ? [{ $match: patientFilter }] : []),
        {
          $group: {
            _id: '$patient.municipality',
            count: { $sum: 1 },
            value: { $sum: '$value' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Distribución por empresa
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        {
          $lookup: {
            from: 'companies',
            localField: 'companyId',
            foreignField: '_id',
            as: 'company'
          }
        },
        { $unwind: '$company' },
        {
          $group: {
            _id: { id: '$companyId', name: '$company.name' },
            count: { $sum: 1 },
            value: { $sum: '$value' }
          }
        }
      ]),
      
      // Distribución por tipo de servicio (basado en CUPS)
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        {
          $group: {
            _id: {
              $cond: {
                if: { $regexMatch: { input: '$cupsCode', regex: /^89/ } },
                then: 'Consultas',
                else: {
                  $cond: {
                    if: { $regexMatch: { input: '$cupsCode', regex: /^87/ } },
                    then: 'Procedimientos',
                    else: 'Otros'
                  }
                }
              }
            },
            count: { $sum: 1 },
            value: { $sum: '$value' }
          }
        }
      ]),
      
      // Servicios a lo largo del tiempo
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        {
          $group: {
            _id: {
              year: { $year: '$serviceDate' },
              month: { $month: '$serviceDate' },
              day: period === 'week' || period === 'today' ? { $dayOfMonth: '$serviceDate' } : null
            },
            count: { $sum: 1 },
            value: { $sum: '$value' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      
      // Ingresos a lo largo del tiempo (igual estructura que servicios)
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        {
          $group: {
            _id: {
              year: { $year: '$serviceDate' },
              month: { $month: '$serviceDate' }
            },
            totalValue: { $sum: '$value' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      
      // Valor promedio de servicio
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        {
          $group: {
            _id: null,
            avgValue: { $avg: '$value' }
          }
        }
      ]).then(result => result[0]?.avgValue || 0),
      
      // Top 10 servicios más facturados
      ServiceRecord.aggregate([
        { $match: serviceFilter },
        {
          $group: {
            _id: '$cupsCode',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Obtener contratos con techo y su progreso
      (async () => {
        try {
          const contracts = await Contract.find({
            tieneTecho: true,
            status: 'active'
          }).populate('company', 'name');
          
          const contractsWithProgress = await Promise.all(
            contracts.map(async (contract) => {
              await contract.actualizarValorFacturado();
              
              return {
                _id: contract._id,
                name: contract.name,
                company: contract.company,
                valorTecho: contract.valorTecho,
                valorFacturado: contract.valorFacturado,
                valorDisponible: contract.valorDisponible,
                porcentajeEjecutado: contract.porcentajeEjecutado,
                estado: contract.estadoTecho,
                alertas: contract.alertas
              };
            })
          );
          
          return contractsWithProgress;
        } catch (error) {
          logger.error('Error obteniendo contratos con techo:', error);
          return [];
        }
      })()
    ]);

    // Formatear respuesta compatible con Dashboard básico
    const response = {
      // Métricas principales (compatibilidad con Dashboard.jsx)
      totalServices,
      totalRevenue,
      totalPatients,
      pendingPreBills: pendingServices, // Alias para compatibilidad
      servicesTrend: 0, // Por ahora sin implementar
      revenueTrend: 0, // Por ahora sin implementar
      
      // Métricas adicionales para el dashboard avanzado
      metrics: {
        totalServices,
        totalRevenue,
        totalPatients,
        pendingServices,
        averageServiceValue: Math.round(averageServiceValue)
      },
      
      // Progreso de contratos con techo
      contractsProgress: contractsWithProgress,
      
      // Distribuciones
      distributions: {
        byRegimen: servicesByRegimen.map(item => ({
          name: item._id || 'No especificado',
          count: item.count,
          value: item.value
        })),
        byMunicipality: servicesByMunicipality.map(item => ({
          name: item._id || 'No especificado',
          count: item.count,
          value: item.value
        })),
        byCompany: servicesByCompany.map(item => ({
          name: item._id.name || 'No especificado',
          count: item.count,
          value: item.value
        })),
        byServiceType: servicesByType.map(item => ({
          name: item._id,
          count: item.count,
          value: item.value
        }))
      },
      
      // Datos para gráficos (compatibilidad con Dashboard.jsx)
      servicesOverTime: servicesOverTime.map(item => ({
        name: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        value: item.count
      })),
      revenueOverTime: revenueOverTime.map(item => ({
        name: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        value: item.totalValue
      })),
      servicesByType: servicesByType.map(item => ({
        name: item._id,
        value: item.count
      })),
      
      // Tendencias temporales (para dashboard avanzado)
      trends: {
        servicesOverTime: servicesOverTime.map(item => ({
          period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}${item._id.day ? `-${String(item._id.day).padStart(2, '0')}` : ''}`,
          count: item.count,
          value: item.value
        })),
        revenueOverTime: revenueOverTime.map(item => ({
          period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          value: item.totalValue
        }))
      },
      
      // Top servicios
      topServices: topServices.map(item => ({
        cupsCode: item._id,
        count: item.count,
        totalValue: item.totalValue
      })),
      
      // Metadatos
      filters: {
        period,
        company,
        contract,
        regimen,
        municipality,
        startDate,
        endDate
      },
      
      timestamp: new Date()
    };

    res.json(response);
    
  } catch (error) {
    console.error('Error en getDashboardStatsAdvanced:', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas avanzadas',
      error: error.message
    });
  }
};

// Endpoint específico para proyecciones
const getProjections = async (req, res) => {
  try {
    const { company, contract } = req.query;
    
    // Obtener datos de los últimos 90 días para calcular tendencias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    let filter = {
      serviceDate: { $gte: startDate, $lte: endDate },
      status: { $ne: 'anulado' }
    };
    
    if (company !== 'all') {
      filter.companyId = new mongoose.Types.ObjectId(company);
    }
    
    if (contract !== 'all') {
      filter.contractId = new mongoose.Types.ObjectId(contract);
    }
    
    // Calcular proyecciones basadas en tendencia
    const dailyData = await ServiceRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$serviceDate' },
            month: { $month: '$serviceDate' },
            day: { $dayOfMonth: '$serviceDate' }
          },
          dailyValue: { $sum: '$value' },
          dailyCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Calcular métricas de proyección
    const totalValue = dailyData.reduce((sum, day) => sum + day.dailyValue, 0);
    const totalDays = dailyData.length;
    const dailyAverage = totalDays > 0 ? totalValue / totalDays : 0;
    
    // Proyecciones
    const monthlyProjection = dailyAverage * 30;
    const yearlyProjection = dailyAverage * 365;
    
    // Calcular velocidad de consumo (últimos 30 días)
    const last30Days = dailyData.slice(-30);
    const burnRate = last30Days.length > 0 ? 
      last30Days.reduce((sum, day) => sum + day.dailyValue, 0) / last30Days.length : 0;
    
    res.json({
      monthlyProjection: Math.round(monthlyProjection),
      yearlyProjection: Math.round(yearlyProjection),
      burnRate: Math.round(burnRate),
      dailyAverage: Math.round(dailyAverage),
      dataPoints: dailyData.length,
      lastUpdated: new Date()
    });
    
  } catch (error) {
    console.error('Error en getProjections:', error);
    res.status(500).json({
      message: 'Error al calcular proyecciones',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats, // Mantener el original
  getDashboardStatsAdvanced, // Nuevo endpoint con filtros avanzados
  getProjections, // Nuevo endpoint para proyecciones
  getRecentServices // Mantener el original
};