// src/models/AuditFinding.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema para hallazgos de auditoría
 */
const auditFindingSchema = new Schema({
  // Resultado de auditoría al que pertenece
  auditId: {
    type: Schema.Types.ObjectId,
    ref: 'AuditResult',
    required: true
  },
  // Regla que generó el hallazgo
  ruleId: {
    type: Schema.Types.ObjectId,
    ref: 'AuditRule'
  },
  // Factura relacionada con el hallazgo
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  // Servicio específico relacionado con el hallazgo (opcional)
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service'
  },
  // Severidad del hallazgo
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    default: 'medium'
  },
  // Categoría del hallazgo
  category: {
    type: String,
    enum: ['service_validation', 'contract_compliance', 'coding_accuracy', 'tariff_validation', 'documentation', 'regulatory_compliance', 'other'],
    default: 'other'
  },
  // Mensaje descriptivo del hallazgo
  message: {
    type: String,
    required: true
  },
  // Detalles adicionales del hallazgo
  details: Schema.Types.Mixed,
  // Monto afectado por el hallazgo
  affectedAmount: {
    type: Number,
    default: 0
  },
  // Fecha en que se encontró el hallazgo
  foundDate: {
    type: Date,
    default: Date.now
  },
  // Estado de revisión
  reviewStatus: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending'
  },
  // Comentarios de revisión
  reviewComments: String,
  // Usuario que revisó el hallazgo
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Fecha de revisión
  reviewDate: Date,
  // Estado de corrección
  correctionStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'applied', 'rejected', 'not_applicable'],
    default: 'pending'
  },
  // Tipo de corrección aplicada
  correctionType: {
    type: String,
    enum: ['adjust_value', 'update_contract', 'remove_service', 'add_documentation', 'other']
  },
  // Datos de la corrección aplicada
  correctionData: Schema.Types.Mixed,
  // Comentarios sobre la corrección
  correctionComments: String,
  // Usuario que aplicó la corrección
  correctedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Fecha de corrección
  correctionDate: Date,
  // Usuario que creó el hallazgo
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Crear índices para búsquedas frecuentes
auditFindingSchema.index({ auditId: 1 });
auditFindingSchema.index({ severity: 1 });
auditFindingSchema.index({ category: 1 });
auditFindingSchema.index({ reviewStatus: 1 });
auditFindingSchema.index({ correctionStatus: 1 });
auditFindingSchema.index({ invoiceId: 1 });

// Crear y exportar modelo
const AuditFinding = mongoose.model('AuditFinding', auditFindingSchema);

module.exports = AuditFinding;