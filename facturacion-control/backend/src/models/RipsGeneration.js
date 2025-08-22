// src/models/RipsGeneration.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Esquema para el historial de generación de RIPS
 */
const ripsGenerationSchema = new Schema({
  // Entidad para la que se generaron los RIPS
  entityId: {
    type: Schema.Types.ObjectId,
    ref: 'Entity',
    required: true
  },
  // Período de facturación
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Versión de RIPS generada
  version: {
    type: String,
    enum: ['3374', '2275'],
    default: '2275'
  },
  // Formato de archivo generado
  format: {
    type: String,
    enum: ['TXT', 'CSV', 'XML'],
    default: 'TXT'
  },
  // Fecha y hora de generación
  generatedAt: {
    type: Date,
    default: Date.now
  },
  // Usuario que generó los RIPS
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Estado de la generación
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'ERROR'],
    default: 'PENDING'
  },
  // Mensaje de error (si corresponde)
  errorMessage: String,
  // Ruta del archivo generado
  filePath: String,
  // Nombre del archivo generado
  fileName: String,
  // Tamaño del archivo generado (en bytes)
  fileSize: Number,
  // Contador de facturas incluidas
  invoiceCount: {
    type: Number,
    default: 0
  },
  // Contador de servicios incluidos
  serviceCount: {
    type: Number,
    default: 0
  },
  // Registro de archivos generados
  files: [{
    // Tipo de archivo (AF, US, etc.)
    type: {
      type: String,
      required: true
    },
    // Nombre del archivo
    name: {
      type: String,
      required: true
    },
    // Número de registros
    recordCount: {
      type: Number,
      default: 0
    }
  }],
  // Resultado de validación
  validation: {
    // Indica si los datos son válidos
    isValid: {
      type: Boolean,
      default: true
    },
    // Errores de validación
    errors: [{
      code: String,
      message: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info'],
        default: 'error'
      },
      details: Schema.Types.Mixed
    }],
    // Advertencias de validación
    warnings: [{
      code: String,
      message: String,
      severity: {
        type: String,
        default: 'warning'
      },
      details: Schema.Types.Mixed
    }]
  },
  // Información de envío (si corresponde)
  submission: {
    // Fecha de envío
    sentAt: Date,
    // Usuario que envió los RIPS
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    // Método de envío
    method: {
      type: String,
      enum: ['EMAIL', 'FTP', 'MANUAL', 'API'],
      default: 'MANUAL'
    },
    // Destinatario
    recipient: String,
    // Respuesta o confirmación
    response: String,
    // Estado del envío
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'RECEIVED', 'REJECTED', 'ERROR'],
      default: 'PENDING'
    }
  },
  // Filtros utilizados para la generación
  filters: {
    entityIds: [Schema.Types.ObjectId],
    contractIds: [Schema.Types.ObjectId],
    invoiceStatus: [String],
    serviceTypes: [String],
    customFilters: Schema.Types.Mixed
  },
  // Metadatos adicionales
  metadata: {
    // Versión de la aplicación
    appVersion: String,
    // IP del usuario
    ipAddress: String,
    // Tiempo de generación (en milisegundos)
    generationTime: Number,
    // Notas o comentarios adicionales
    notes: String
  }
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  versionKey: false // No incluir __v en los documentos
});

// Crear índices para búsquedas rápidas
ripsGenerationSchema.index({ entityId: 1, generatedAt: -1 });
ripsGenerationSchema.index({ startDate: 1, endDate: 1 });
ripsGenerationSchema.index({ status: 1 });
ripsGenerationSchema.index({ 'validation.isValid': 1 });

// Crear y exportar modelo
const RipsGeneration = mongoose.model('RipsGeneration', ripsGenerationSchema);

module.exports = RipsGeneration;