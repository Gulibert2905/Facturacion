// src/controllers/auditRulesController.js
const logger = require('../utils/logger');
const AuditRule = require('../models/AuditRule');
const mongoose = require('mongoose');

/**
 * Controlador para gestión de reglas de auditoría
 */
const auditRulesController = {
  /**
   * Obtiene todas las reglas de auditoría
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getAllRules: async (req, res) => {
    try {
      const { active, limit = 100, offset = 0, search } = req.query;
      
      // Construir filtros
      const filter = {};
      
      if (active !== undefined) {
        filter.active = active === 'true';
      }
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Obtener reglas
      const rules = await AuditRule.find(filter)
        .sort({ priority: -1, name: 1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .populate('entityIds', 'name code');
      
      // Obtener conteo total
      const total = await AuditRule.countDocuments(filter);
      
      res.json({
        success: true,
        data: rules,
        pagination: {
          total,
          offset: parseInt(offset),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error({
        type: 'get_all_audit_rules_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener reglas de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Obtiene una regla de auditoría por ID
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getRuleById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const rule = await AuditRule.findById(id)
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .populate('entityIds', 'name code');
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Regla de auditoría no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      logger.error({
        type: 'get_audit_rule_by_id_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener regla de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Crea una nueva regla de auditoría
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  createRule: async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        severity,
        message,
        code,
        active = true,
        entityIds = [],
        serviceTypes = [],
        serviceCodes = [],
        contractTypes = [],
        conditions,
        threshold,
        implementation,
        priority = 1,
        metadata
      } = req.body;
      
      // Validar datos obligatorios
      if (!name || !category || !severity) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren nombre, categoría y severidad'
        });
      }
      
      // Crear nueva regla
      const rule = new AuditRule({
        name,
        description,
        category,
        severity,
        message,
        code: code || generateRuleCode(category, name),
        active,
        entityIds,
        serviceTypes,
        serviceCodes,
        contractTypes,
        conditions,
        threshold,
        implementation,
        priority,
        metadata,
        createdBy: req.user ? req.user._id : null
      });
      
      await rule.save();
      
      res.status(201).json({
        success: true,
        message: 'Regla de auditoría creada exitosamente',
        data: rule
      });
    } catch (error) {
      logger.error({
        type: 'create_audit_rule_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al crear regla de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Actualiza una regla de auditoría existente
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  updateRule: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Establecer usuario que actualiza
      updateData.updatedBy = req.user ? req.user._id : null;
      
      // Actualizar regla
      const rule = await AuditRule.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Regla de auditoría no encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Regla de auditoría actualizada exitosamente',
        data: rule
      });
    } catch (error) {
      logger.error({
        type: 'update_audit_rule_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar regla de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Cambia el estado de activación de una regla
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  toggleRuleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      if (active === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el estado active'
        });
      }
      
      const rule = await AuditRule.findByIdAndUpdate(
        id,
        { 
          active, 
          updatedBy: req.user ? req.user._id : null 
        },
        { new: true }
      );
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Regla de auditoría no encontrada'
        });
      }
      
      res.json({
        success: true,
        message: `Regla de auditoría ${active ? 'activada' : 'desactivada'} exitosamente`,
        data: rule
      });
    } catch (error) {
      logger.error({
        type: 'toggle_audit_rule_status_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado de regla de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Elimina una regla de auditoría
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  deleteRule: async (req, res) => {
    try {
      const { id } = req.params;
      
      const rule = await AuditRule.findByIdAndDelete(id);
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Regla de auditoría no encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Regla de auditoría eliminada exitosamente',
        data: { id }
      });
    } catch (error) {
      logger.error({
        type: 'delete_audit_rule_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar regla de auditoría',
        error: error.message
      });
    }
  },

  /**
   * Obtiene reglas de auditoría por categoría
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  getRulesByCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { active, limit = 100, offset = 0 } = req.query;
      
      // Construir filtros
      const filter = { category: categoryId };
      
      if (active !== undefined) {
        filter.active = active === 'true';
      }
      
      // Obtener reglas
      const rules = await AuditRule.find(filter)
        .sort({ priority: -1, name: 1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .populate('entityIds', 'name code');
      
      // Obtener conteo total
      const total = await AuditRule.countDocuments(filter);
      
      res.json({
        success: true,
        data: rules,
        pagination: {
          total,
          offset: parseInt(offset),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error({
        type: 'get_audit_rules_by_category_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener reglas de auditoría por categoría',
        error: error.message
      });
    }
  },

  /**
   * Aplica una regla específica a un conjunto de datos
   * @param {Request} req - Solicitud
   * @param {Response} res - Respuesta
   */
  applyRule: async (req, res) => {
    try {
      const { id } = req.params;
      const { invoiceIds = [], entityIds = [], startDate, endDate } = req.body;
      
      // Validar parámetros
      if ((!invoiceIds || invoiceIds.length === 0) && !startDate && !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren IDs de facturas o rango de fechas'
        });
      }
      
      // Obtener regla a aplicar
      const rule = await AuditRule.findById(id);
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Regla de auditoría no encontrada'
        });
      }
      
      // Construir filtros para facturas
      const filter = {};
      
      if (invoiceIds && invoiceIds.length > 0) {
        filter._id = { $in: invoiceIds };
      } else {
        if (startDate && endDate) {
          filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        
        if (entityIds && entityIds.length > 0) {
          filter.entityId = { $in: entityIds };
        }
      }
      
      // Obtener facturas
      const invoices = await mongoose.model('Invoice').find(filter)
        .populate('services')
        .populate({
          path: 'contractId',
          model: 'Contract'
        })
        .populate('patient');
      
      if (invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron facturas para aplicar la regla'
        });
      }
      
      // Aplicar regla a facturas
      const results = [];
      let findings = [];
      
      for (const invoice of invoices) {
        // Aplicar regla según categoría
        let ruleFindings = [];
        
        switch (rule.category) {
          case 'service_validation':
            ruleFindings = await applyServiceValidationRule(rule, invoice);
            break;
            
          case 'contract_compliance':
            ruleFindings = await applyContractComplianceRule(rule, invoice);
            break;
            
          case 'coding_accuracy':
            ruleFindings = await applyCodingAccuracyRule(rule, invoice);
            break;
            
          case 'tariff_validation':
            ruleFindings = await applyTariffValidationRule(rule, invoice);
            break;
            
          case 'documentation':
            ruleFindings = await applyDocumentationRule(rule, invoice);
            break;
            
          case 'regulatory_compliance':
            ruleFindings = await applyRegulatoryComplianceRule(rule, invoice);
            break;
            
          default:
            // Regla genérica
            ruleFindings = await applyGenericRule(rule, invoice);
        }
        
        // Agregar hallazgos encontrados
        if (ruleFindings && ruleFindings.length > 0) {
          findings = [...findings, ...ruleFindings];
          
          results.push({
            invoiceId: invoice._id,
            invoiceNumber: invoice.number,
            entityName: invoice.entityName,
            entityId: invoice.entityId,
            date: invoice.date,
            totalValue: invoice.totalValue,
            findingsCount: ruleFindings.length
          });
        }
      }
      
      // Responder con resultados
      res.json({
        success: true,
        message: `Regla aplicada a ${invoices.length} facturas`,
        data: {
          rule: {
            id: rule._id,
            name: rule.name,
            category: rule.category,
            severity: rule.severity
          },
          summary: {
            totalInvoices: invoices.length,
            invoicesWithFindings: results.length,
            totalFindings: findings.length
          },
          invoices: results,
          findings
        }
      });
    } catch (error) {
      logger.error({
        type: 'apply_audit_rule_error',
        message: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Error al aplicar regla de auditoría',
        error: error.message
      });
    }
  }
};

/**
 * Genera un código para la regla basado en su categoría y nombre
 * @param {string} category - Categoría de la regla
 * @param {string} name - Nombre de la regla
 * @returns {string} Código generado
 */
function generateRuleCode(category, name) {
  // Crear prefijo basado en categoría
  const prefixMap = {
    'service_validation': 'SV',
    'contract_compliance': 'CC',
    'coding_accuracy': 'CA',
    'tariff_validation': 'TV',
    'documentation': 'DC',
    'regulatory_compliance': 'RC',
    'other': 'OT'
  };
  
  const prefix = prefixMap[category] || 'RU';
  
  // Extraer iniciales del nombre
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  
  // Generar sufijo aleatorio
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${prefix}-${initials}${randomSuffix}`;
}

// Funciones auxiliares para aplicar reglas (importadas del controlador de auditoría)
// Se asume que estas funciones están declaradas en otro lugar del código
async function applyServiceValidationRule(rule, invoice) {
  // Implementación por defecto (placeholder)
  return [];
}

async function applyContractComplianceRule(rule, invoice) {
  // Implementación por defecto (placeholder)
  return [];
}

async function applyCodingAccuracyRule(rule, invoice) {
  // Implementación por defecto (placeholder)
  return [];
}

async function applyTariffValidationRule(rule, invoice) {
  // Implementación por defecto (placeholder)
  return [];
}

async function applyDocumentationRule(rule, invoice) {
  // Implementación por defecto (placeholder)
  return [];
}

async function applyRegulatoryComplianceRule(rule, invoice) {
  // Implementación por defecto (placeholder)
  return [];
}

async function applyGenericRule(rule, invoice) {
  // Implementación por defecto (placeholder)
  return [];
}

module.exports = auditRulesController;