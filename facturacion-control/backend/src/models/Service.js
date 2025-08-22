// models/Service.js - versión mejorada
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  cupsCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Mantener la estructura existente de contratos
  contracts: [{
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract'
    },
    value: Number,
    requiresAuthorization: {
      type: Boolean,
      default: false
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validTo: {
      type: Date
    }
  }]
}, {
  timestamps: true
});

// Índices para búsqueda rápida
serviceSchema.index({ cupsCode: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ 'contracts.contractId': 1 });

module.exports = mongoose.model('Service', serviceSchema);