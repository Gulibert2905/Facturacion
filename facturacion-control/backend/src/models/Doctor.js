const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  // Información básica del médico
  documentType: {
    type: String,
    required: true,
    uppercase: true,  // Automatically convert to uppercase
    enum: ['CC', 'CE', 'TI', 'RC', 'PA', 'MS', 'AS', 'PE', 'PPT', 'CNV', 'SC']
  },
  documentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  secondName: {
    type: String,
    trim: true
  },
  firstLastName: {
    type: String,
    required: true,
    trim: true
  },
  secondLastName: {
    type: String,
    trim: true
  },
  
  // Información profesional
  professionalCard: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  specialty: {
    type: String,
    required: true,
    trim: true
  },
  specialtyCode: {
    type: String,
    trim: true
  },
  
  // Información de contacto
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Estado
  active: {
    type: Boolean,
    default: true
  },
  
  // Empresa asociada (para filtros multi-empresa)
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
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
doctorSchema.index({ documentNumber: 1 });
doctorSchema.index({ professionalCard: 1 });
doctorSchema.index({ firstName: 1, firstLastName: 1 });
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ empresa: 1 });
doctorSchema.index({ active: 1 });

// Virtual para nombre completo
doctorSchema.virtual('fullName').get(function() {
  const names = [this.firstName, this.secondName].filter(Boolean).join(' ');
  const lastNames = [this.firstLastName, this.secondLastName].filter(Boolean).join(' ');
  return `${names} ${lastNames}`.trim();
});

// Método estático para buscar por documento
doctorSchema.statics.findByDocument = function(documentNumber) {
  return this.findOne({ documentNumber, active: true });
};

// Método estático para búsqueda con autocompletado
doctorSchema.statics.searchForAutocomplete = function(query, companyId = null) {
  const searchRegex = new RegExp(query, 'i');
  const filter = {
    active: true,
    $or: [
      { firstName: searchRegex },
      { firstLastName: searchRegex },
      { documentNumber: searchRegex },
      { professionalCard: searchRegex },
      { specialty: searchRegex }
    ]
  };
  
  if (companyId) {
    filter.empresa = companyId;
  }
  
  return this.find(filter)
    .select('documentType documentNumber firstName secondName firstLastName secondLastName professionalCard specialty')
    .limit(10)
    .sort({ firstName: 1, firstLastName: 1 });
};

module.exports = mongoose.model('Doctor', doctorSchema);