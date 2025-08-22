// Archivo: backend/src/controllers/dashboardController.js (mejorado)
const ServiceRecord = require('../models/ServiceRecord');
const Patient = require('../models/Patient');
const PreBill = require('../models/PreBill');
const Company = require('../models/Company');
const logger = require('../utils/logger');
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

module.exports = {
    getDashboardStats,
    getRecentServices
};