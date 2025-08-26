// backend/src/models/ExportTemplate.js
const mongoose = require('mongoose');

const exportTemplateSchema = new mongoose.Schema({
  nombrePlantilla: {
    type: String,
    required: true
  },
  empresaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  tipoExportacion: {
    type: String,
    enum: ['CONTABLE', 'RIPS', 'PERSONALIZADO'],
    default: 'CONTABLE'
  },
  configuracionContable: {
    empresa: String,
    tipoDocumento: String,
    prefijo: String,
    terceroInterno: String,
    terceroExterno: String,
    formaPago: {
      type: String,
      default: 'Credito'
    },
    diasVencimiento: {
      type: Number,
      default: 30
    },
    unidadMedida: {
      type: String,
      default: 'Und.'
    },
    iva: {
      type: Number,
      default: 0
    }
  },
  numeracionConfig: {
    numeroActual: {
      type: Number,
      default: 1000
    },
    incremento: {
      type: Number,
      default: 1
    }
  },
  activo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ExportTemplate', exportTemplateSchema);