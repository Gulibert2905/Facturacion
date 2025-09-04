const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  departamento: {
    type: String,
    required: true,
    trim: true
  },
  codigo: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'cities'
});

// Índice para búsquedas rápidas
citySchema.index({ nombre: 1 });
citySchema.index({ departamento: 1 });

module.exports = mongoose.model('City', citySchema);