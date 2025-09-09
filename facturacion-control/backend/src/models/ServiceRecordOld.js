// models/ServiceRecord.js
const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema({
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    empresa: {  // Referencia a la empresa
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null  // Permitir que sea null
    },
    contratoId: {  // Referencia al contrato
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        default: null  // Permitir que sea null
    },
    numeroDocumento: {
        type: String,
        required: true
    },
    codigoCups: {
        type: String,
        required: true
    },
    fechaServicio: {
        type: Date,
        required: true
    },
    valor: {
        type: Number,
        default: 0  // Valor por defecto
    },
    descripcion: String,
    autorizacion: String,
    diagnostico: String,
    estado: {
        type: String,
        default: 'pendiente'
    },
    estaPrefacturado: {
        type: Boolean,
        default: false
    },
    fechaPrefacturacion: Date
}, {
    timestamps: true,
    toJSON: { getters: true }
});

// Modificar el índice para permitir servicios duplicados con diferentes contratos
serviceRecordSchema.index({
    pacienteId: 1,
    codigoCups: 1,
    fechaServicio: 1,
    contratoId: 1
}, { unique: true });

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);