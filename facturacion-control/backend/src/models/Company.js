const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  nombre: String,
  nit: String,
  codigo: String,
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  configuracionFacturacion: {
    prefijos: [String],
    centroCosto: String,
    sucursalPorDefecto: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);