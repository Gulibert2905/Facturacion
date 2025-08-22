// src/models/AuditResult.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema para resultados de auditoría
 */
const auditResultSchema = new Schema({
  // Período de auditoría
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Entidades incluidas en la auditoría
  entityIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Entity'
  }],
  // Nombres de entidades (para búsqueda rápida)
  entityNames: [String],
  // Contratos incluidos en la auditoría
  contractIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Contract'
  }],
  // Reglas aplicadas
  ruleIds: [{
    type: Schema.Types.ObjectId,
    ref: 'AuditRule'
  }],
  // Número de facturas auditadas
  invoiceCount: {
    type: Number,
    default: 0
  },
  // Fecha de ejecución de la auditoría
  auditDate: {
    type: Date,
    default: Date.now
  },
  // Estado de la auditoría
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'error'],
    default: 'pending'
  },
  // Mensaje de error (si corresponde)
  error: String,
  // Fecha de finalización
  completedDate: Date,
  // Hallazgos encontrados
  findings: {
    total: {
      type: Number,
      default: 0
    },
    bySeverity: {
      critical: {
        type: Number,
        default: 0
      },
      high: {
        type: Number,
        default: 0
      },
      medium: {
        type: Number,
        default: 0
      },
      low: {
        type: Number,
        default: 0
      },
      info: {
        type: Number,
        default: 0
      }
    }
  },
  // Usuario que inició la auditoría
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Etiquetas (para categorización)
  tags: [String],
  // Comentarios o notas
  notes: String,
  // Metadatos adicionales
  metadata: Schema.Types.Mixed
}, {
  timestamps: true,
  versionKey: false
});

// Crear índices para búsquedas frecuentes
auditResultSchema.index({ auditDate: -1 });
auditResultSchema.index({ status: 1 });
auditResultSchema.index({ entityIds: 1 });
auditResultSchema.index({ 'findings.total': -1 });

// Crear y exportar modelo
const AuditResult = mongoose.model('AuditResult', auditResultSchema);

module.exports = AuditResult;