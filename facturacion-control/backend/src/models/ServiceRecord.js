const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema({
  // Información del paciente
  documentType: {
    type: String,
    required: true,
    enum: ['CC', 'CE', 'TI', 'RC', 'PA', 'MS', 'AS', 'PE']
  },
  documentNumber: {
    type: String,
    required: true,
    trim: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Información del servicio
  serviceDate: {
    type: Date,
    required: true
  },
  cupsCode: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    default: 0
  },
  
  // Información adicional
  municipality: {
    type: String,
    trim: true
  },
  observations: {
    type: String,
    trim: true
  },
  authorization: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  
  // Información del médico (Resolución 2275 de 2023)
  doctorDocumentType: {
    type: String,
    enum: ['CC', 'CE', 'TI', 'RC', 'PA', 'MS', 'AS', 'PE']
  },
  doctorDocumentNumber: {
    type: String,
    trim: true
  },
  doctorName: {
    type: String,
    trim: true
  },
  doctorProfessionalCard: {
    type: String,
    trim: true
  },
  doctorSpecialty: {
    type: String,
    trim: true
  },
  
  // Referencias
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  preBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PreBill'
  },
  
  // Estado
  status: {
    type: String,
    enum: ['pendiente', 'prefacturado', 'facturado', 'anulado'],
    default: 'pendiente'
  },
  
  // Auditoría
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsqueda eficiente
serviceRecordSchema.index({ documentNumber: 1 });
serviceRecordSchema.index({ serviceDate: 1 });
serviceRecordSchema.index({ cupsCode: 1 });
serviceRecordSchema.index({ status: 1 });
serviceRecordSchema.index({ contractId: 1 });
serviceRecordSchema.index({ company: 1 });
serviceRecordSchema.index({ doctorDocumentNumber: 1 });

// Índice compuesto para evitar duplicados
serviceRecordSchema.index({
  documentNumber: 1,
  cupsCode: 1,
  serviceDate: 1,
  contractId: 1
}, { unique: true });

// Virtual para verificar si está prefacturado
serviceRecordSchema.virtual('isPrefactured').get(function() {
  return this.status === 'prefacturado' || this.status === 'facturado';
});

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);