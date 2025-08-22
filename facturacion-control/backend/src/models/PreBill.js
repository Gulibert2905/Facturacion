const mongoose = require('mongoose');

const preBillSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  // Datos del paciente al momento de la prefactura
  patientData: {
    documentNumber: String,
    documentType: String,
    firstName: String,
    secondName: String,
    firstLastName: String,
    secondLastName: String,
    birthDate: Date,
    gender: String,  // M o F
    eps: String,
    department: String,
    municipality: String,
    zone: String
  },
  services: [{
    serviceId: mongoose.Schema.Types.ObjectId,
    cupsCode: String,
    value: Number,
    serviceDate: Date,
    authorization: String,
    diagnosis: String,
    description: String
  }],
  totalValue: Number,
  status: {
    type: String,
    enum: ['parcial', 'finalizada', 'anulada'],
    default: 'parcial'
  }
}, { timestamps: true });

// Índices para búsqueda eficiente
preBillSchema.index({ createdAt: 1 });
preBillSchema.index({ companyId: 1 });
preBillSchema.index({ contractId: 1 });
preBillSchema.index({ status: 1 });

module.exports = mongoose.model('PreBill', preBillSchema);