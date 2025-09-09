const mongoose = require('mongoose');

const cie11Schema = new mongoose.Schema({
  // Código CIE-11 (ejemplo: 1A00, 1A01.0, etc.)
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  
  // Descripción del diagnóstico en español
  description: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Descripción en inglés (opcional)
  descriptionEn: {
    type: String,
    trim: true
  },
  
  // Categoría principal (capítulo CIE-11)
  chapter: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Código de categoría
  chapterCode: {
    type: String,
    trim: true
  },
  
  // Subcategoría
  subcategory: {
    type: String,
    trim: true
  },
  
  // Indica si es un código válido para facturación
  billable: {
    type: Boolean,
    default: true
  },
  
  // Género aplicable (M=masculino, F=femenino, U=unisex)
  gender: {
    type: String,
    enum: ['M', 'F', 'U'],
    default: 'U'
  },
  
  // Rango de edad mínima (en años)
  minAge: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Rango de edad máxima (en años, null = sin límite)
  maxAge: {
    type: Number,
    min: 0
  },
  
  // Estado del código (activo/inactivo)
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Fecha de vigencia desde
  validFrom: {
    type: Date,
    default: Date.now
  },
  
  // Fecha de vigencia hasta (opcional)
  validUntil: {
    type: Date
  },
  
  // Códigos relacionados o equivalentes
  relatedCodes: [{
    type: String,
    trim: true
  }],
  
  // Notas adicionales o aclaraciones
  notes: {
    type: String,
    trim: true
  },
  
  // Metadatos de auditoría
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

// Índices compuestos para búsqueda eficiente
cie11Schema.index({ code: 1, active: 1 });
cie11Schema.index({ description: 'text', code: 'text' });
cie11Schema.index({ chapter: 1, active: 1 });
cie11Schema.index({ billable: 1, active: 1 });

// Virtual para texto completo de búsqueda
cie11Schema.virtual('searchText').get(function() {
  return `${this.code} - ${this.description}`;
});

// Método estático para búsqueda con autocompletado
cie11Schema.statics.searchForAutocomplete = function(query, limit = 10) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    active: true,
    billable: true,
    $or: [
      { code: searchRegex },
      { description: searchRegex }
    ]
  })
  .select('code description chapter subcategory gender minAge maxAge')
  .limit(limit)
  .sort({ code: 1 });
};

// Método estático para validar código
cie11Schema.statics.validateCode = async function(code) {
  const diagnosis = await this.findOne({ 
    code: code.toUpperCase().trim(), 
    active: true,
    billable: true 
  });
  
  return {
    isValid: !!diagnosis,
    diagnosis: diagnosis
  };
};

// Método estático para obtener por capítulo
cie11Schema.statics.getByChapter = function(chapter, limit = 50) {
  return this.find({
    chapter: new RegExp(chapter, 'i'),
    active: true,
    billable: true
  })
  .select('code description subcategory')
  .limit(limit)
  .sort({ code: 1 });
};

// Middleware para validar rangos de edad
cie11Schema.pre('save', function(next) {
  if (this.maxAge && this.minAge && this.maxAge < this.minAge) {
    next(new Error('La edad máxima no puede ser menor que la edad mínima'));
  }
  next();
});

module.exports = mongoose.model('CIE11', cie11Schema);