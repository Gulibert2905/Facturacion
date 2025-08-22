const logger = require('../utils/logger');
const path = require('path');
const Invoice = require('../models/Invoice');
const Service = require('../models/Service');
const Contract = require('../models/Contract');
const AuditResult = require('../models/AuditResult');
const AuditFinding = require('../models/AuditFinding');
const fileExportService = require('../services/fileExportService');
const mongoose = require('mongoose');

/**
 * Controlador para el módulo de Auditoría
 */
const auditController = {
  /**
   * Ejecuta una auditoría con los parámetros especificados
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  runAudit: async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        entityIds = [],
        contractIds = [],
        ruleIds = []
      } = req.body;
      
      // Validar parámetros
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }
      
      // Construir filtros para facturas
      const filter = {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      };
      
      if (entityIds.length > 0) {
        filter.entityId = { $in: entityIds };
      }
      
      if (contractIds.length > 0) {
        filter.contractId = { $in: contractIds };
      }
      
      // Obtener facturas y servicios para auditar
      const invoices = await Invoice.find(filter)
        .populate('services')
        .populate({
          path: 'contractId',
          model: 'Contract'
        });
      
      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron facturas para auditar con los filtros especificados'
        });
      }
      
      // Obtener reglas de auditoría a aplicar
      let rules = [];
      
      if (ruleIds.length > 0) {
        // Obtener reglas específicas
        rules = await mongoose.model('AuditRule').find({
          _id: { $in: ruleIds },
          active: true
        });
      } else {
        // Obtener todas las reglas activas
        rules = await mongoose.model('AuditRule').find({ active: true });
      }
      
      if (rules.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron reglas de auditoría activas'
        });
      }
      
      // Crear registro de auditoría
      const auditResult = new AuditResult({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        entityIds,
        contractIds,
        ruleIds: rules.map(rule => rule._id),
        invoiceCount: invoices.length,
        status: 'processing',
        createdBy: req.user ? req.user._id : null,
        auditDate: new Date()
      });
      
      await auditResult.save();
      
      // Iniciar proceso de auditoría (asíncrono para no bloquear respuesta)
      processAudit(auditResult._id, invoices, rules, req.user);
      
      // Responder con ID de la auditoría
      res.json({
        success: true,
        message: 'Auditoría iniciada correctamente',
        auditId: auditResult._id
      });
    } catch (error) {
      logger.error({
        type: 'run_audit_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al ejecutar auditoría',
        error: error.message
      });
    }
  },

  /**
   * Obtiene resultados de auditorías anteriores
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getAuditResults: async (req, res) => {
    try {
      const { limit = 50, offset = 0, search, startDate, endDate } = req.query;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.auditDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (search) {
        filter.$or = [
          { 'entityNames': { $regex: search, $options: 'i' } }
        ];
      }
      
      // Obtener resultados de auditoría
      const results = await AuditResult.find(filter)
        .sort({ auditDate: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate('createdBy', 'name');
      
      // Obtener conteo total
      const total = await AuditResult.countDocuments(filter);
      
      res.json({
        success: true,
        data: results,
        pagination: {
          total,
          offset: parseInt(offset),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error({
        type: 'get_audit_results_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener resultados de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Obtiene detalles de un resultado específico de auditoría
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getAuditResultDetails: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Obtener resultado de auditoría
      const auditResult = await AuditResult.findById(id)
        .populate('createdBy', 'name')
        .populate('ruleIds', 'name category severity');
      
      if (!auditResult) {
        return res.status(404).json({
          success: false,
          message: 'Resultado de auditoría no encontrado'
        });
      }
      
      // Obtener hallazgos asociados a la auditoría
      const findings = await AuditFinding.find({ auditId: id })
        .populate('invoiceId', 'number date entityName totalValue')
        .populate('serviceId', 'code name value')
        .populate('ruleId', 'name category severity');
      
      // Agrupar hallazgos por severidad
      const findingsBySeverity = {
        critical: findings.filter(f => f.severity === 'critical'),
        high: findings.filter(f => f.severity === 'high'),
        medium: findings.filter(f => f.severity === 'medium'),
        low: findings.filter(f => f.severity === 'low'),
        info: findings.filter(f => f.severity === 'info')
      };
      
      // Resumir resultados
      const summary = {
        totalInvoices: auditResult.invoiceCount,
        totalFindings: findings.length,
        findingsBySeverity: {
          critical: findingsBySeverity.critical.length,
          high: findingsBySeverity.high.length,
          medium: findingsBySeverity.medium.length,
          low: findingsBySeverity.low.length,
          info: findingsBySeverity.info.length
        },
        affectedAmount: findings.reduce((sum, finding) => {
          return sum + (finding.affectedAmount || 0);
        }, 0)
      };
      
      res.json({
        success: true,
        data: {
          auditResult,
          findings,
          summary
        }
      });
    } catch (error) {
      logger.error({
        type: 'get_audit_result_details_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener detalles de resultado de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Verifica servicios facturados contra reglas y parámetros
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  verifyServices: async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        entityId,
        serviceCode,
        verificationTypes = []
      } = req.body;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (entityId) {
        filter.entityId = entityId;
      }
      
      // Obtener facturas y servicios
      let invoices = await Invoice.find(filter).populate('services');
      
      // Filtrar por código de servicio si se especificó
      if (serviceCode) {
        invoices = invoices.map(invoice => {
          if (invoice.services) {
            invoice.services = invoice.services.filter(service => 
              service.code === serviceCode
            );
          }
          return invoice;
        }).filter(invoice => invoice.services && invoice.services.length > 0);
      }
      
      // Verificar servicios
      const verificationResults = {
        totalServices: 0,
        passedServices: 0,
        failedServices: 0,
        details: []
      };
      
      // Contadores para cada tipo de verificación
      const typeCounts = verificationTypes.reduce((counts, type) => {
        counts[type] = { passed: 0, failed: 0 };
        return counts;
      }, {});
      
      // Procesar cada factura y servicio
      for (const invoice of invoices) {
        if (invoice.services && invoice.services.length > 0) {
          for (const service of invoice.services) {
            verificationResults.totalServices++;
            
            // Aplicar cada tipo de verificación seleccionado
            let servicePassed = true;
            
            for (const verificationType of verificationTypes) {
              const verificationResult = await verifyService(
                invoice,
                service,
                verificationType
              );
              
              // Registrar resultado
              verificationResults.details.push({
                id: `${invoice._id}-${service._id}-${verificationType}`,
                serviceCode: service.code,
                serviceName: service.name,
                date: invoice.date,
                entityId: invoice.entityId,
                entityName: invoice.entityName,
                verificationType,
                passed: verificationResult.passed,
                severity: verificationResult.passed ? null : verificationResult.severity,
                message: verificationResult.message
              });
              
              // Actualizar contadores
              if (verificationResult.passed) {
                typeCounts[verificationType].passed++;
              } else {
                typeCounts[verificationType].failed++;
                servicePassed = false;
              }
            }
            
            // Actualizar contadores generales
            if (servicePassed) {
              verificationResults.passedServices++;
            } else {
              verificationResults.failedServices++;
            }
          }
        }
      }
      
      // Agregar resumen por tipo de verificación
      verificationResults.typeResults = Object.keys(typeCounts).map(type => ({
        type,
        passed: typeCounts[type].passed,
        failed: typeCounts[type].failed,
        total: typeCounts[type].passed + typeCounts[type].failed,
        passRate: typeCounts[type].passed / (typeCounts[type].passed + typeCounts[type].failed) * 100
      }));
      
      res.json({
        success: true,
        data: verificationResults
      });
    } catch (error) {
      logger.error({
        type: 'verify_services_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al verificar servicios',
        error: error.message
      });
    }
  },

  /**
   * Valida facturación contra contratos
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  validateContracts: async (req, res) => {
    try {
      const { startDate, endDate, entityIds = [], contractIds = [] } = req.body;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (entityIds.length > 0) {
        filter.entityId = { $in: entityIds };
      }
      
      if (contractIds.length > 0) {
        filter.contractId = { $in: contractIds };
      }
      
      // Obtener facturas con sus contratos
      const invoices = await Invoice.find(filter)
        .populate('services')
        .populate('contractId');
      
      // Validar contra contratos
      const validationResults = {
        totalInvoices: invoices.length,
        validInvoices: 0,
        invalidInvoices: 0,
        findings: []
      };
      
      for (const invoice of invoices) {
        let invoiceValid = true;
        
        // Validar que la factura tenga contrato asociado
        if (!invoice.contractId) {
          validationResults.findings.push({
            invoiceId: invoice._id,
            invoiceNumber: invoice.number,
            entityName: invoice.entityName,
            type: 'missing_contract',
            message: 'La factura no tiene contrato asociado',
            severity: 'high'
          });
          
          invoiceValid = false;
          continue; // Pasar a la siguiente factura
        }
        
        const contract = invoice.contractId;
        
        // Validar vigencia del contrato
        if (invoice.date < contract.startDate || invoice.date > contract.endDate) {
          validationResults.findings.push({
            invoiceId: invoice._id,
            invoiceNumber: invoice.number,
            entityName: invoice.entityName,
            contractId: contract._id,
            contractNumber: contract.number,
            type: 'contract_date_range',
            message: 'La fecha de la factura está fuera del rango de vigencia del contrato',
            severity: 'critical'
          });
          
          invoiceValid = false;
        }
        
        // Validar servicios contra tarifas del contrato
        if (invoice.services && invoice.services.length > 0) {
          for (const service of invoice.services) {
            // Buscar el servicio en el tarifario del contrato
            const contractService = contract.services ? 
              contract.services.find(s => s.code === service.code) : null;
            
            if (!contractService) {
              validationResults.findings.push({
                invoiceId: invoice._id,
                invoiceNumber: invoice.number,
                entityName: invoice.entityName,
                contractId: contract._id,
                contractNumber: contract.number,
                serviceId: service._id,
                serviceCode: service.code,
                serviceName: service.name,
                type: 'service_not_in_contract',
                message: 'El servicio no está incluido en el contrato',
                severity: 'high'
              });
              
              invoiceValid = false;
            } else {
              // Validar tarifa del servicio
              const tariffDiff = Math.abs(service.value - contractService.value);
              const tariffPercentDiff = (tariffDiff / contractService.value) * 100;
              
              // Si la diferencia es mayor al 0.5%, reportar
              if (tariffPercentDiff > 0.5) {
                validationResults.findings.push({
                  invoiceId: invoice._id,
                  invoiceNumber: invoice.number,
                  entityName: invoice.entityName,
                  contractId: contract._id,
                  contractNumber: contract.number,
                  serviceId: service._id,
                  serviceCode: service.code,
                  serviceName: service.name,
                  type: 'tariff_mismatch',
                  message: `La tarifa facturada difiere de la tarifa contractual en ${tariffPercentDiff.toFixed(2)}%`,
                  severity: tariffPercentDiff > 5 ? 'critical' : 'medium',
                  details: {
                    invoicedValue: service.value,
                    contractValue: contractService.value,
                    difference: tariffDiff,
                    percentDifference: tariffPercentDiff
                  }
                });
                
                invoiceValid = false;
              }
            }
          }
        }
        
        // Actualizar contadores
        if (invoiceValid) {
          validationResults.validInvoices++;
        } else {
          validationResults.invalidInvoices++;
        }
      }
      
      // Resumir hallazgos por tipo
      const findingsByType = {};
      for (const finding of validationResults.findings) {
        if (!findingsByType[finding.type]) {
          findingsByType[finding.type] = 0;
        }
        findingsByType[finding.type]++;
      }
      
      validationResults.findingsByType = findingsByType;
      
      res.json({
        success: true,
        data: validationResults
      });
    } catch (error) {
      logger.error({
        type: 'validate_contracts_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al validar contratos',
        error: error.message
      });
    }
  },

  /**
   * Detecta inconsistencias en datos de facturación
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  detectInconsistencies: async (req, res) => {
    try {
      const { startDate, endDate, entityIds = [], contractIds = [] } = req.body;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      if (entityIds.length > 0) {
        filter.entityId = { $in: entityIds };
      }
      
      if (contractIds.length > 0) {
        filter.contractId = { $in: contractIds };
      }
      
      // Obtener facturas
      const invoices = await Invoice.find(filter)
        .populate('services')
        .populate('patient');
      
      // Detectar inconsistencias
      const inconsistencyResults = {
        totalInvoices: invoices.length,
        inconsistenciesFound: 0,
        inconsistencies: []
      };
      
      for (const invoice of invoices) {
        // Verificar coherencia entre suma de servicios y total de factura
        if (invoice.services && invoice.services.length > 0) {
          const servicesTotal = invoice.services.reduce((sum, service) => sum + service.value, 0);
          const totalDiff = Math.abs(servicesTotal - invoice.totalValue);
          
          if (totalDiff > 1) { // Tolerancia de 1 unidad por redondeo
            inconsistencyResults.inconsistencies.push({
              invoiceId: invoice._id,
              invoiceNumber: invoice.number,
              entityName: invoice.entityName,
              date: invoice.date,
              type: 'total_mismatch',
              message: 'El total de la factura no coincide con la suma de servicios',
              severity: 'medium',
              details: {
                invoiceTotal: invoice.totalValue,
                servicesSum: servicesTotal,
                difference: totalDiff
              }
            });
            
            inconsistencyResults.inconsistenciesFound++;
          }
        }
        
        // Verificar información demográfica del paciente
        if (invoice.patient) {
          const patient = invoice.patient;
          
          // Verificar edad para servicios pediátricos o geriátricos
          if (invoice.services) {
            const pediatricServices = invoice.services.filter(
              s => s.name && s.name.toLowerCase().includes('pediatr')
            );
            
            if (pediatricServices.length > 0 && patient.age > 18) {
              inconsistencyResults.inconsistencies.push({
                invoiceId: invoice._id,
                invoiceNumber: invoice.number,
                entityName: invoice.entityName,
                patientId: patient._id,
                type: 'demographic_mismatch',
                message: 'Servicios pediátricos facturados a paciente adulto',
                severity: 'high',
                details: {
                  patientAge: patient.age,
                  services: pediatricServices.map(s => s.name)
                }
              });
              
              inconsistencyResults.inconsistenciesFound++;
            }
          }
        }
        
        // Verificar duplicidad de servicios
        if (invoice.services && invoice.services.length > 1) {
          const serviceCodes = {};
          
          for (const service of invoice.services) {
            if (!serviceCodes[service.code]) {
              serviceCodes[service.code] = [];
            }
            
            serviceCodes[service.code].push(service);
          }
          
          // Buscar duplicados
          for (const [code, services] of Object.entries(serviceCodes)) {
            if (services.length > 1) {
              inconsistencyResults.inconsistencies.push({
                invoiceId: invoice._id,
                invoiceNumber: invoice.number,
                entityName: invoice.entityName,
                date: invoice.date,
                type: 'duplicate_service',
                message: `Servicio ${code} facturado ${services.length} veces en la misma factura`,
                severity: 'medium',
                details: {
                  serviceCode: code,
                  count: services.length,
                  serviceIds: services.map(s => s._id)
                }
              });
              
              inconsistencyResults.inconsistenciesFound++;
            }
          }
        }
        
        // Otras verificaciones...
      }
      
      // Agrupar inconsistencias por tipo
      const inconsistencyTypes = {};
      for (const inconsistency of inconsistencyResults.inconsistencies) {
        if (!inconsistencyTypes[inconsistency.type]) {
          inconsistencyTypes[inconsistency.type] = 0;
        }
        inconsistencyTypes[inconsistency.type]++;
      }
      
      inconsistencyResults.inconsistencyTypes = inconsistencyTypes;
      
      res.json({
        success: true,
        data: inconsistencyResults
      });
    } catch (error) {
      logger.error({
        type: 'detect_inconsistencies_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al detectar inconsistencias',
        error: error.message
      });
    }
  },

  /**
   * Exporta resultados de auditoría
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  exportAuditResults: async (req, res) => {
    try {
      const { id } = req.params;
      const { format = 'PDF' } = req.query;
      
      // Obtener datos de auditoría
      const auditResult = await AuditResult.findById(id)
        .populate('createdBy', 'name')
        .populate('ruleIds', 'name category severity');
      
      if (!auditResult) {
        return res.status(404).json({
          success: false,
          message: 'Resultado de auditoría no encontrado'
        });
      }
      
      // Obtener hallazgos
      const findings = await AuditFinding.find({ auditId: id })
        .populate('invoiceId', 'number date entityName totalValue')
        .populate('serviceId', 'code name value')
        .populate('ruleId', 'name category severity');
      
      // Preparar datos para exportación
      const exportData = {
        auditResult: auditResult.toObject(),
        findings: findings.map(f => f.toObject())
      };
      
      // Exportar según formato solicitado
      const outputFile = await fileExportService.exportAuditResults(exportData, format);
      
      // Retornar URL de descarga
      res.json({
        success: true,
        message: `Resultados exportados en formato ${format}`,
        downloadUrl: `/api/audit/download/${path.basename(outputFile)}`
      });
    } catch (error) {
      logger.error({
        type: 'export_audit_results_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al exportar resultados de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Marca un hallazgo como revisado
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  markFindingAsReviewed: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;
      
      // Validar datos
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el estado de revisión'
        });
      }
      
      // Obtener hallazgo
      const finding = await AuditFinding.findById(id);
      
      if (!finding) {
        return res.status(404).json({
          success: false,
          message: 'Hallazgo no encontrado'
        });
      }
      
      // Actualizar hallazgo
      finding.reviewStatus = status;
      finding.reviewComments = comments;
      finding.reviewedBy = req.user._id;
      finding.reviewDate = new Date();
      
      await finding.save();
      
      res.json({
        success: true,
        message: 'Hallazgo marcado como revisado',
        data: finding
      });
    } catch (error) {
      logger.error({
        type: 'mark_finding_as_reviewed_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al marcar hallazgo como revisado',
        error: error.message
      });
    }
  },

  /**
   * Aplica acciones correctivas a hallazgos
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  applyCorrection: async (req, res) => {
    try {
      const { id } = req.params;
      const { correctionType, correctionData, comments } = req.body;
      
      // Validar datos
      if (!correctionType || !correctionData) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere tipo de corrección y datos'
        });
      }
      
      // Obtener hallazgo
      const finding = await AuditFinding.findById(id)
        .populate('invoiceId')
        .populate('serviceId');
      
      if (!finding) {
        return res.status(404).json({
          success: false,
          message: 'Hallazgo no encontrado'
        });
      }
      
      // Aplicar corrección según tipo
      let correctionResult = null;
      
      switch (correctionType) {
        case 'adjust_value':
          // Ajustar valor de servicio
          if (finding.serviceId) {
            const service = finding.serviceId;
            const oldValue = service.value;
            service.value = correctionData.newValue;
            await service.save();
            
            correctionResult = {
              type: 'adjust_value',
              oldValue,
              newValue: correctionData.newValue,
              difference: correctionData.newValue - oldValue
            };
          }
          break;
          
        case 'update_contract':
          // Actualizar contrato de factura
          if (finding.invoiceId) {
            const invoice = finding.invoiceId;
            const oldContractId = invoice.contractId;
            invoice.contractId = correctionData.contractId;
            await invoice.save();
            
            correctionResult = {
              type: 'update_contract',
              oldContractId,
              newContractId: correctionData.contractId
            };
          }
          break;
          
        case 'remove_service':
          // Eliminar servicio
          if (finding.serviceId) {
            const service = finding.serviceId;
            await Service.findByIdAndDelete(service._id);
            
            correctionResult = {
              type: 'remove_service',
              serviceId: service._id,
              serviceName: service.name
            };
          }
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: `Tipo de corrección no válido: ${correctionType}`
          });
      }
      
      // Actualizar hallazgo
      finding.correctionStatus = 'applied';
      finding.correctionType = correctionType;
      finding.correctionData = correctionResult;
      finding.correctionComments = comments;
      finding.correctedBy = req.user._id;
      finding.correctionDate = new Date();
      
      await finding.save();
      
      res.json({
        success: true,
        message: 'Corrección aplicada correctamente',
        data: {
          finding,
          correctionResult
        }
      });
    } catch (error) {
      logger.error({
        type: 'apply_correction_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al aplicar corrección',
        error: error.message
      });
    }
  },

  /**
   * Obtiene estadísticas de auditoría
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getAuditStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Construir filtros
      const filter = {};
      
      if (startDate && endDate) {
        filter.auditDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      // Obtener auditorías
      const audits = await AuditResult.find(filter);
      
      // Obtener hallazgos
      const findings = await AuditFinding.find({ 
        auditId: { $in: audits.map(a => a._id) }
      });
      
      // Calcular estadísticas
      const stats = {
        totalAudits: audits.length,
        totalFindings: findings.length,
        findingsBySeverity: {
          critical: findings.filter(f => f.severity === 'critical').length,
          high: findings.filter(f => f.severity === 'high').length,
          medium: findings.filter(f => f.severity === 'medium').length,
          low: findings.filter(f => f.severity === 'low').length,
          info: findings.filter(f => f.severity === 'info').length
        },
        findingsByCategory: {},
        reviewedFindings: findings.filter(f => f.reviewStatus).length,
        correctedFindings: findings.filter(f => f.correctionStatus === 'applied').length
      };
      
      // Agrupar por categoría
      for (const finding of findings) {
        if (finding.category) {
          if (!stats.findingsByCategory[finding.category]) {
            stats.findingsByCategory[finding.category] = 0;
          }
          stats.findingsByCategory[finding.category]++;
        }
      }
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error({
        type: 'get_audit_stats_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Obtiene matriz de verificación de servicios
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getVerificationMatrix: async (req, res) => {
    try {
      // Obtener matriz de verificación de la base de datos
      const matrix = await mongoose.model('VerificationMatrix').findOne({});
      
      if (!matrix) {
        return res.status(404).json({
          success: false,
          message: 'Matriz de verificación no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: matrix
      });
    } catch (error) {
      logger.error({
        type: 'get_verification_matrix_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener matriz de verificación',
        error: error.message
      });
    }
  },

  /**
   * Actualiza matriz de verificación
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  updateVerificationMatrix: async (req, res) => {
    try {
      const matrixData = req.body;
      
      // Validar datos
      if (!matrixData || !matrixData.serviceTypes || !matrixData.verificationTypes) {
        return res.status(400).json({
          success: false,
          message: 'Datos de matriz incompletos'
        });
      }
      
      // Actualizar o crear matriz
      const matrix = await mongoose.model('VerificationMatrix').findOneAndUpdate(
        {},
        matrixData,
        { upsert: true, new: true }
      );
      
      res.json({
        success: true,
        message: 'Matriz de verificación actualizada',
        data: matrix
      });
    } catch (error) {
      logger.error({
        type: 'update_verification_matrix_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar matriz de verificación',
        error: error.message
      });
    }
  }
};

/**
 * Procesa una auditoría (función asíncrona ejecutada en segundo plano)
 * @param {string} auditId - ID de la auditoría
 * @param {Array} invoices - Facturas a auditar
 * @param {Array} rules - Reglas a aplicar
 * @param {Object} user - Usuario que inició la auditoría
 */
async function processAudit(auditId, invoices, rules, user) {
  try {
    // Obtener resultado de auditoría
    const auditResult = await AuditResult.findById(auditId);
    
    if (!auditResult) {
      logger.error({
        type: 'process_audit_error',
        message: 'Resultado de auditoría no encontrado',
        auditId
      });
      return;
    }
    
    // Inicializar contadores
    let totalFindings = 0;
    const findingsBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };
    
    // Aplicar cada regla a cada factura
    for (const rule of rules) {
      for (const invoice of invoices) {
        // Aplicar regla según categoría
        let findings = [];
        
        switch (rule.category) {
          case 'service_validation':
            findings = await applyServiceValidationRule(rule, invoice);
            break;
            
          case 'contract_compliance':
            findings = await applyContractComplianceRule(rule, invoice);
            break;
            
          case 'coding_accuracy':
            findings = await applyCodingAccuracyRule(rule, invoice);
            break;
            
          case 'tariff_validation':
            findings = await applyTariffValidationRule(rule, invoice);
            break;
            
          case 'documentation':
            findings = await applyDocumentationRule(rule, invoice);
            break;
            
          case 'regulatory_compliance':
            findings = await applyRegulatoryComplianceRule(rule, invoice);
            break;
            
          default:
            // Regla genérica
            findings = await applyGenericRule(rule, invoice);
        }
        
        // Guardar hallazgos encontrados
        if (findings && findings.length > 0) {
          for (const finding of findings) {
            const newFinding = new AuditFinding({
              auditId,
              ruleId: rule._id,
              invoiceId: invoice._id,
              serviceId: finding.serviceId,
              severity: finding.severity || rule.severity,
              category: rule.category,
              message: finding.message,
              details: finding.details,
              affectedAmount: finding.affectedAmount || 0,
              createdBy: user ? user._id : null,
              foundDate: new Date()
            });
            
            await newFinding.save();
            
            // Actualizar contadores
            totalFindings++;
            findingsBySeverity[newFinding.severity]++;
          }
        }
      }
    }
    
    // Actualizar resultado de auditoría
    auditResult.status = 'completed';
    auditResult.findings = {
      total: totalFindings,
      bySeverity: findingsBySeverity
    };
    auditResult.completedDate = new Date();
    
    await auditResult.save();
    
    logger.info({
      type: 'audit_completed',
      auditId,
      totalFindings,
      findingsBySeverity
    });
  } catch (error) {
    logger.error({
      type: 'process_audit_error',
      message: error.message,
      stack: error.stack,
      auditId
    });
    
    // Actualizar resultado de auditoría con error
    await AuditResult.findByIdAndUpdate(auditId, {
      status: 'error',
      error: error.message
    });
  }
}

/**
 * Verifica un servicio según el tipo de verificación
 * @param {Object} invoice - Factura que contiene el servicio
 * @param {Object} service - Servicio a verificar
 * @param {string} verificationType - Tipo de verificación a aplicar
 * @returns {Object} Resultado de la verificación
 */
async function verifyService(invoice, service, verificationType) {
  try {
    let result = {
      passed: true,
      severity: null,
      message: 'Verificación exitosa'
    };
    
    // Aplicar el tipo de verificación correspondiente
    switch (verificationType) {
      case 'tariff_validation':
        // Verificar tarifa contra contrato
        if (invoice.contractId) {
          const contract = await Contract.findById(invoice.contractId);
          if (contract && contract.services) {
            const contractService = contract.services.find(s => s.code === service.code);
            if (contractService) {
              const tariffDiff = Math.abs(service.value - contractService.value);
              const tariffPercentDiff = (tariffDiff / contractService.value) * 100;
              
              if (tariffPercentDiff > 0.5) {
                result.passed = false;
                result.severity = tariffPercentDiff > 5 ? 'critical' : 'medium';
                result.message = `La tarifa facturada difiere de la tarifa contractual en ${tariffPercentDiff.toFixed(2)}%`;
              }
            } else {
              result.passed = false;
              result.severity = 'high';
              result.message = 'El servicio no está incluido en el contrato';
            }
          } else {
            result.passed = false;
            result.severity = 'medium';
            result.message = 'Contrato no encontrado o sin servicios definidos';
          }
        } else {
          result.passed = false;
          result.severity = 'medium';
          result.message = 'Factura sin contrato asociado';
        }
        break;
        
      case 'code_consistency':
        // Verificar consistencia de código de servicio
        const serviceDefinition = await Service.findOne({ code: service.code });
        if (!serviceDefinition) {
          result.passed = false;
          result.severity = 'medium';
          result.message = 'Código de servicio no encontrado en el catálogo';
        } else if (serviceDefinition.name !== service.name) {
          result.passed = false;
          result.severity = 'low';
          result.message = 'Nombre de servicio no coincide con el catálogo';
        }
        break;
        
      case 'billing_rules':
        // Verificar reglas de facturación específicas
        const rulesToCheck = await mongoose.model('BillingRule').find({ 
          serviceCode: service.code,
          active: true 
        });
        
        for (const rule of rulesToCheck) {
          // Evaluar condiciones de regla
          const ruleResult = await evaluateBillingRule(rule, invoice, service);
          if (!ruleResult.passed) {
            result.passed = false;
            result.severity = rule.severity;
            result.message = ruleResult.message;
            break;
          }
        }
        break;
        
      case 'documentation_required':
        // Verificar si el servicio requiere documentación adicional
        const hasDocumentation = await checkServiceDocumentation(invoice._id, service._id);
        if (!hasDocumentation) {
          result.passed = false;
          result.severity = 'medium';
          result.message = 'Servicio requiere documentación adicional no adjuntada';
        }
        break;
        
      case 'frequency_limits':
        // Verificar límites de frecuencia de facturación
        if (invoice.patient) {
          const frequencyResult = await checkServiceFrequency(service.code, invoice.patient._id, invoice.date);
          if (!frequencyResult.passed) {
            result.passed = false;
            result.severity = 'high';
            result.message = frequencyResult.message;
          }
        }
        break;
        
      default:
        // Verificación genérica
        result.message = 'Tipo de verificación no implementada';
    }
    
    return result;
  } catch (error) {
    logger.error({
      type: 'verify_service_error',
      message: error.message,
      stack: error.stack,
      invoiceId: invoice._id,
      serviceId: service._id,
      verificationType
    });
    
    return {
      passed: false,
      severity: 'info',
      message: `Error en verificación: ${error.message}`
    };
  }
}

/**
 * Evalúa una regla de facturación específica
 * @param {Object} rule - Regla de facturación
 * @param {Object} invoice - Factura
 * @param {Object} service - Servicio
 * @returns {Object} Resultado de la evaluación
 */
async function evaluateBillingRule(rule, invoice, service) {
  // Implementación por defecto: retorna éxito
  return {
    passed: true,
    message: 'Regla cumplida'
  };
}

/**
 * Verifica si un servicio tiene la documentación requerida
 * @param {ObjectId} invoiceId - ID de la factura
 * @param {ObjectId} serviceId - ID del servicio
 * @returns {boolean} Verdadero si tiene documentación
 */
async function checkServiceDocumentation(invoiceId, serviceId) {
  // Implementación por defecto: retorna verdadero
  return true;
}

/**
 * Verifica frecuencia de facturación de un servicio para un paciente
 * @param {string} serviceCode - Código del servicio
 * @param {ObjectId} patientId - ID del paciente
 * @param {Date} currentDate - Fecha actual
 * @returns {Object} Resultado de la verificación
 */
async function checkServiceFrequency(serviceCode, patientId, currentDate) {
  // Implementación por defecto: retorna éxito
  return {
    passed: true,
    message: 'Frecuencia dentro de límites permitidos'
  };
}

/**
 * Aplica una regla de validación de servicios
 * @param {Object} rule - Regla a aplicar
 * @param {Object} invoice - Factura a validar
 * @returns {Array} Hallazgos encontrados
 */
async function applyServiceValidationRule(rule, invoice) {
  const findings = [];
  
  if (!invoice.services || invoice.services.length === 0) {
    return findings;
  }
  
  // Aplicar regla según criterios
  for (const service of invoice.services) {
    // Implementar lógica específica según regla
    
    // Ejemplo: verificar si el servicio cumple con las condiciones de la regla
    const matches = await checkRuleConditions(rule, service);
    
    if (matches) {
      findings.push({
        serviceId: service._id,
        message: rule.message || 'Servicio no cumple con regla de validación',
        details: {
          ruleId: rule._id,
          ruleName: rule.name,
          serviceCode: service.code,
          serviceName: service.name
        },
        affectedAmount: service.value
      });
    }
  }
  
  return findings;
}

/**
 * Aplica una regla de cumplimiento de contrato
 * @param {Object} rule - Regla a aplicar
 * @param {Object} invoice - Factura a validar
 * @returns {Array} Hallazgos encontrados
 */
async function applyContractComplianceRule(rule, invoice) {
  const findings = [];
  
  // Verificar si la factura tiene contrato asociado
  if (!invoice.contractId) {
    findings.push({
      message: 'Factura sin contrato asociado',
      details: {
        ruleId: rule._id,
        ruleName: rule.name,
        invoiceNumber: invoice.number
      },
      affectedAmount: invoice.totalValue
    });
    return findings;
  }
  
  // Obtener contrato completo si no está poblado
  let contract = invoice.contractId;
  if (!contract.services) {
    contract = await Contract.findById(invoice.contractId);
  }
  
  if (!contract) {
    findings.push({
      message: 'Contrato no encontrado',
      details: {
        ruleId: rule._id,
        ruleName: rule.name,
        invoiceNumber: invoice.number,
        contractId: invoice.contractId
      },
      affectedAmount: invoice.totalValue
    });
    return findings;
  }
  
  // Verificar vigencia del contrato
  if (invoice.date < contract.startDate || invoice.date > contract.endDate) {
    findings.push({
      message: 'Factura fuera del periodo de vigencia del contrato',
      details: {
        ruleId: rule._id,
        ruleName: rule.name,
        invoiceNumber: invoice.number,
        contractNumber: contract.number,
        invoiceDate: invoice.date,
        contractStartDate: contract.startDate,
        contractEndDate: contract.endDate
      },
      affectedAmount: invoice.totalValue
    });
  }
  
  // Verificar servicios contra contrato
  if (invoice.services && contract.services) {
    for (const service of invoice.services) {
      const contractService = contract.services.find(s => s.code === service.code);
      
      if (!contractService) {
        findings.push({
          serviceId: service._id,
          message: 'Servicio no incluido en el contrato',
          details: {
            ruleId: rule._id,
            ruleName: rule.name,
            serviceCode: service.code,
            serviceName: service.name,
            contractNumber: contract.number
          },
          affectedAmount: service.value
        });
      } else if (Math.abs(service.value - contractService.value) > 0.01) {
        findings.push({
          serviceId: service._id,
          message: 'Tarifa no coincide con la establecida en el contrato',
          details: {
            ruleId: rule._id,
            ruleName: rule.name,
            serviceCode: service.code,
            serviceName: service.name,
            contractNumber: contract.number,
            invoicedValue: service.value,
            contractValue: contractService.value,
            difference: service.value - contractService.value
          },
          affectedAmount: Math.abs(service.value - contractService.value)
        });
      }
    }
  }
  
  return findings;
}

/**
 * Aplica una regla de exactitud de codificación
 * @param {Object} rule - Regla a aplicar
 * @param {Object} invoice - Factura a validar
 * @returns {Array} Hallazgos encontrados
 */
async function applyCodingAccuracyRule(rule, invoice) {
  const findings = [];
  
  if (!invoice.services || invoice.services.length === 0) {
    return findings;
  }
  
  // Verificar exactitud de codificación para cada servicio
  for (const service of invoice.services) {
    // Verificar que el código exista en el catálogo
    const catalogService = await Service.findOne({ code: service.code });
    
    if (!catalogService) {
      findings.push({
        serviceId: service._id,
        message: 'Código de servicio no encontrado en el catálogo',
        details: {
          ruleId: rule._id,
          ruleName: rule.name,
          serviceCode: service.code,
          serviceName: service.name
        },
        affectedAmount: service.value
      });
    } else if (catalogService.name !== service.name) {
      findings.push({
        serviceId: service._id,
        message: 'Descripción del servicio no coincide con el catálogo',
        details: {
          ruleId: rule._id,
          ruleName: rule.name,
          serviceCode: service.code,
          serviceName: service.name,
          catalogName: catalogService.name
        },
        affectedAmount: service.value
      });
    }
    
    // Verificar reglas específicas de codificación
    // Implementar según necesidades
  }
  
  return findings;
}

/**
 * Aplica una regla de validación de tarifas
 * @param {Object} rule - Regla a aplicar
 * @param {Object} invoice - Factura a validar
 * @returns {Array} Hallazgos encontrados
 */
async function applyTariffValidationRule(rule, invoice) {
  const findings = [];
  
  if (!invoice.services || invoice.services.length === 0) {
    return findings;
  }
  
  // Verificar tarifas para cada servicio
  for (const service of invoice.services) {
    // Obtener tarifa de referencia
    const referencePrice = await getReferencePrice(service.code, invoice.entityId);
    
    if (referencePrice) {
      const difference = service.value - referencePrice;
      const percentDifference = (difference / referencePrice) * 100;
      
      // Si la diferencia es mayor al umbral, registrar hallazgo
      if (Math.abs(percentDifference) > rule.threshold) {
        findings.push({
          serviceId: service._id,
          message: `Tarifa ${percentDifference > 0 ? 'superior' : 'inferior'} a la referencia en ${Math.abs(percentDifference).toFixed(2)}%`,
          details: {
            ruleId: rule._id,
            ruleName: rule.name,
            serviceCode: service.code,
            serviceName: service.name,
            chargedValue: service.value,
            referenceValue: referencePrice,
            difference,
            percentDifference
          },
          affectedAmount: Math.abs(difference)
        });
      }
    }
  }
  
  return findings;
}

/**
 * Obtiene precio de referencia para un servicio
 * @param {string} serviceCode - Código del servicio
 * @param {ObjectId} entityId - ID de la entidad
 * @returns {number|null} Precio de referencia o null si no existe
 */
async function getReferencePrice(serviceCode, entityId) {
  // Implementación por defecto
  // Aquí se podría implementar lógica para obtener precios de referencia
  // según diferentes fuentes (tarifarios, históricos, etc.)
  return null;
}

/**
 * Aplica una regla de documentación
 * @param {Object} rule - Regla a aplicar
 * @param {Object} invoice - Factura a validar
 * @returns {Array} Hallazgos encontrados
 */
async function applyDocumentationRule(rule, invoice) {
  const findings = [];
  
  // Verificar si la factura tiene la documentación requerida
  const requiredDocs = await getRequiredDocumentation(invoice);
  const availableDocs = await getAvailableDocumentation(invoice._id);
  
  const missingDocs = requiredDocs.filter(doc => 
    !availableDocs.some(available => available.type === doc.type)
  );
  
  if (missingDocs.length > 0) {
    findings.push({
      message: 'Documentación requerida faltante',
      details: {
        ruleId: rule._id,
        ruleName: rule.name,
        invoiceNumber: invoice.number,
        missingDocuments: missingDocs.map(doc => doc.type)
      },
      affectedAmount: invoice.totalValue
    });
  }
  
  // Verificar documentación específica para servicios
  if (invoice.services) {
    for (const service of invoice.services) {
      const serviceRequiredDocs = await getRequiredDocumentationForService(service.code);
      const serviceAvailableDocs = await getAvailableDocumentationForService(invoice._id, service._id);
      
      const serviceMissingDocs = serviceRequiredDocs.filter(doc => 
        !serviceAvailableDocs.some(available => available.type === doc.type)
      );
      
      if (serviceMissingDocs.length > 0) {
        findings.push({
          serviceId: service._id,
          message: 'Documentación de servicio faltante',
          details: {
            ruleId: rule._id,
            ruleName: rule.name,
            serviceCode: service.code,
            serviceName: service.name,
            missingDocuments: serviceMissingDocs.map(doc => doc.type)
          },
          affectedAmount: service.value
        });
      }
    }
  }
  
  return findings;
}

/**
 * Obtiene documentación requerida para una factura
 * @param {Object} invoice - Factura
 * @returns {Array} Documentos requeridos
 */
async function getRequiredDocumentation(invoice) {
  // Implementación por defecto
  return [];
}

/**
 * Obtiene documentación disponible para una factura
 * @param {ObjectId} invoiceId - ID de la factura
 * @returns {Array} Documentos disponibles
 */
async function getAvailableDocumentation(invoiceId) {
  // Implementación por defecto
  return [];
}

/**
 * Obtiene documentación requerida para un servicio
 * @param {string} serviceCode - Código del servicio
 * @returns {Array} Documentos requeridos
 */
async function getRequiredDocumentationForService(serviceCode) {
  // Implementación por defecto
  return [];
}

/**
 * Obtiene documentación disponible para un servicio
 * @param {ObjectId} invoiceId - ID de la factura
 * @param {ObjectId} serviceId - ID del servicio
 * @returns {Array} Documentos disponibles
 */
async function getAvailableDocumentationForService(invoiceId, serviceId) {
  // Implementación por defecto
  return [];
}

/**
 * Aplica una regla de cumplimiento regulatorio
 * @param {Object} rule - Regla a aplicar
 * @param {Object} invoice - Factura a validar
 * @returns {Array} Hallazgos encontrados
 */
async function applyRegulatoryComplianceRule(rule, invoice) {
  const findings = [];
  
  // Implementar verificaciones regulatorias específicas
  // Esto dependerá de las regulaciones aplicables
  
  return findings;
}

/**
 * Aplica una regla genérica
 * @param {Object} rule - Regla a aplicar
 * @param {Object} invoice - Factura a validar
 * @returns {Array} Hallazgos encontrados
 */
async function applyGenericRule(rule, invoice) {
  const findings = [];
  
  // Implementar lógica para reglas genéricas
  // Esto dependerá de la estructura y configuración de las reglas
  
  return findings;
}

/**
 * Verifica si un servicio cumple con las condiciones de una regla
 * @param {Object} rule - Regla a verificar
 * @param {Object} service - Servicio a verificar
 * @returns {boolean} Verdadero si cumple las condiciones
 */
async function checkRuleConditions(rule, service) {
  // Implementación por defecto
  return false;
}

module.exports = auditController;