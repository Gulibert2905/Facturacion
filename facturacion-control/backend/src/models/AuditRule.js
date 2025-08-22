// src/models/AuditRule.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema para reglas de auditoría
 */
const auditRuleSchema = new Schema({
  // Nombre de la regla
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Descripción de la regla
  description: {
    type: String,
    trim: true
  },
  // Categoría de la regla
  category: {
    type: String,
    enum: ['service_validation', 'contract_compliance', 'coding_accuracy', 'tariff_validation', 'documentation', 'regulatory_compliance', 'other'],
    default: 'other'
  },
  // Severidad de los hallazgos generados por esta regla
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    default: 'medium'
  },
  // Mensaje predeterminado para hallazgos
  message: {
    type: String,
    trim: true
  },
  // Código de la regla (para identificación rápida)
  code: {
    type: String,
    trim: true,
    uppercase: true
  },
  // Estado de la regla (activa/inactiva)
  active: {
    type: Boolean,
    default: true
  },
  // Entidades específicas a las que aplica la regla (si está vacío, aplica a todas)
  entityIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Entity'
  }],
  // Tipos de servicios a los que aplica la regla (si está vacío, aplica a todos)
  serviceTypes: [String],
  // Códigos de servicio específicos a los que aplica la regla (si está vacío, aplica a todos)
  serviceCodes: [String],
  // Tipos de contrato a los que aplica la regla (si está vacío, aplica a todos)
  contractTypes: [String],
  // Condiciones de aplicación (lógica específica)
  conditions: Schema.Types.Mixed,
  // Umbral para valores numéricos (por ejemplo, % de diferencia permitido)
  threshold: {
    type: Number,
    default: 0
  },
  // Implementación de la regla (puede ser código ejecutable o referencia a una función)
  implementation: Schema.Types.Mixed,
  // Prioridad de ejecución (mayor número = mayor prioridad)
  priority: {
    type: Number,
    default: 1
  },
  // Metadatos adicionales
  metadata: Schema.Types.Mixed,
  // Usuario que creó la regla
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Usuario que actualizó la regla
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Crear índices para búsquedas frecuentes
auditRuleSchema.index({ category: 1 });
auditRuleSchema.index({ severity: 1 });
auditRuleSchema.index({ active: 1 });
auditRuleSchema.index({ code: 1 });
auditRuleSchema.index({ entityIds: 1 });
auditRuleSchema.index({ serviceTypes: 1 });
auditRuleSchema.index({ serviceCodes: 1 });

// Crear y exportar modelo
const AuditRule = mongoose.model('AuditRule', auditRuleSchema);

module.exports = AuditRule;