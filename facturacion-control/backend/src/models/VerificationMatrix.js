// src/models/VerificationMatrix.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema para matriz de verificación de servicios
 */
const verificationMatrixSchema = new Schema({
  // Tipos de servicio que se verifican
  serviceTypes: [{
    code: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    active: {
      type: Boolean,
      default: true
    }
  }],
  
  // Tipos de verificación disponibles
  verificationTypes: [{
    code: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    active: {
      type: Boolean,
      default: true
    }
  }],
  
  // Matriz de configuración (servicio x verificación)
  matrix: [{
    serviceTypeCode: {
      type: String,
      required: true
    },
    verificationTypeCode: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      default: 'medium'
    }
  }],
  
  // Metadatos
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// Crear índices
verificationMatrixSchema.index({ 'serviceTypes.code': 1 });
verificationMatrixSchema.index({ 'verificationTypes.code': 1 });

// Crear y exportar modelo
const VerificationMatrix = mongoose.model('VerificationMatrix', verificationMatrixSchema);

module.exports = VerificationMatrix;