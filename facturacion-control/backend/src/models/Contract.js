const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  type: {
    type: String,
    enum: ['LABORATORIO', 'ODONTOLOGIA', 'MEDICINA', 'OTROS'],
    default: 'MEDICINA'
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTo: {
    type: Date,
    required: true
  },
  
  // NUEVOS CAMPOS PARA TECHO PRESUPUESTAL
  valorTecho: {
    type: Number,
    default: null, // null significa sin techo
    min: 0
  },
  tieneTecho: {
    type: Boolean,
    default: false
  },
  
  // CAMPOS ADICIONALES PARA SEGUIMIENTO
  valorFacturado: {
    type: Number,
    default: 0,
    min: 0
  },
  ultimaActualizacion: {
    type: Date,
    default: Date.now
  },
  
  // CONFIGURACIÓN DE ALERTAS
  alertas: {
    porcentajeAlerta: {
      type: Number,
      default: 80, // Alertar al 80%
      min: 0,
      max: 100
    },
    porcentajeCritico: {
      type: Number,
      default: 90, // Crítico al 90%
      min: 0,
      max: 100
    }
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'expired'],
    default: 'active'
  },
  
  // METADATOS
  observaciones: String,
  contactoResponsable: String,
  telefonoContacto: String,
  emailContacto: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// VIRTUALS PARA CÁLCULOS AUTOMÁTICOS
contractSchema.virtual('porcentajeEjecutado').get(function() {
  if (!this.tieneTecho || !this.valorTecho || this.valorTecho === 0) {
    return 0;
  }
  return Math.round((this.valorFacturado / this.valorTecho) * 100);
});

contractSchema.virtual('valorDisponible').get(function() {
  if (!this.tieneTecho || !this.valorTecho) {
    return null;
  }
  return Math.max(0, this.valorTecho - this.valorFacturado);
});

contractSchema.virtual('estadoTecho').get(function() {
  if (!this.tieneTecho) return 'sin_techo';
  
  const porcentaje = this.porcentajeEjecutado;
  if (porcentaje >= this.alertas.porcentajeCritico) return 'critico';
  if (porcentaje >= this.alertas.porcentajeAlerta) return 'alerta';
  return 'normal';
});

contractSchema.virtual('vigente').get(function() {
  const now = new Date();
  return now >= this.validFrom && now <= this.validTo;
});

// MIDDLEWARE PARA ACTUALIZAR valorFacturado AUTOMÁTICAMENTE
contractSchema.methods.actualizarValorFacturado = async function() {
  const ServiceRecord = mongoose.model('ServiceRecord');
  
  const result = await ServiceRecord.aggregate([
    {
      $match: {
        contractId: this._id,
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
  
  this.valorFacturado = result.length > 0 ? result[0].total : 0;
  this.ultimaActualizacion = new Date();
  
  return this.save();
};

module.exports = mongoose.model('Contract', contractSchema);