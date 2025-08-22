// src/models/Entity.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema para entidades (aseguradoras/EPS)
 */
const entitySchema = new Schema({
  // Código único de la entidad (para RIPS)
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 10
  },
  // Nombre de la entidad
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  // Tipo de entidad (EPS, IPS, ARL, etc.)
  type: {
    type: String,
    required: true,
    enum: ['EPS', 'EPS-S', 'ARL', 'EMPRESA', 'PERSONA', 'OTRA'],
    default: 'EPS'
  },
  // NIT o identificación tributaria
  nit: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Régimen (Contributivo, Subsidiado, etc.)
  regime: {
    type: String,
    enum: ['CONTRIBUTIVO', 'SUBSIDIADO', 'MIXTO', 'ESPECIAL', 'NO_APLICA'],
    default: 'CONTRIBUTIVO'
  },
  // Dirección
  address: {
    type: String,
    trim: true
  },
  // Ciudad
  city: {
    type: String,
    trim: true
  },
  // Departamento/Estado
  state: {
    type: String,
    trim: true
  },
  // Teléfono
  phone: {
    type: String,
    trim: true
  },
  // Correo electrónico
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  // Contacto principal
  contact: {
    name: String,
    position: String,
    phone: String,
    email: String
  },
  // Estado (activo/inactivo)
  active: {
    type: Boolean,
    default: true
  },
  // Configuración para RIPS
  ripsConfig: {
    // Prefijo para archivos RIPS
    prefix: {
      type: String,
      default: ''
    },
    // Formato de archivo preferido
    fileFormat: {
      type: String,
      enum: ['TXT', 'CSV', 'XML'],
      default: 'TXT'
    },
    // Versión de RIPS a utilizar
    version: {
      type: String,
      enum: ['3374', '2275'],
      default: '2275'
    },
    // Ruta para envío FTP (si aplica)
    ftpPath: String,
    // Credenciales FTP (si aplica)
    ftpCredentials: {
      username: String,
      password: String,
      host: String,
      port: Number
    }
  },
  // Configuración de facturación
  billingConfig: {
    // Prefijo de facturación
    prefix: String,
    // Días para pago
    paymentDays: {
      type: Number,
      default: 30
    },
    // Requerimientos específicos
    requirements: [String],
    // Formato de numeración
    numberFormat: String,
    // Aplica IVA
    applyVAT: {
      type: Boolean,
      default: false
    },
    // Porcentaje de IVA (si aplica)
    vatPercentage: {
      type: Number,
      default: 0
    }
  },
  // Contratos asociados a la entidad (referencias)
  contracts: [{
    type: Schema.Types.ObjectId,
    ref: 'Contract'
  }],
  // Configuración para glosas
  glossConfig: {
    // Dirección de correo para glosas
    email: String,
    // Días para respuesta de glosas
    responseDays: {
      type: Number,
      default: 15
    }
  },
  // Auditor asignado
  auditor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Campos personalizados (extensibles según necesidad)
  customFields: {
    type: Map,
    of: Schema.Types.Mixed
  },
  // Metadata
  metadata: {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: Date
  }
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  versionKey: false // No incluir __v en los documentos
});

// Crear y exportar modelo
const Entity = mongoose.model('Entity', entitySchema);

module.exports = Entity;