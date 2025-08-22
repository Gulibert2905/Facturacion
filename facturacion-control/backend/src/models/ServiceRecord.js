// models/ServiceRecord.js
const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    company: {  // Referencia a la empresa
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null  // Permitir que sea null
    },
    contractId: {  // Referencia al contrato
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        default: null  // Permitir que sea null
    },
    documentNumber: {
        type: String,
        required: true
    },
    cupsCode: {
        type: String,
        required: true
    },
    serviceDate: {
        type: Date,
        required: true
    },
    value: {
        type: Number,
        default: 0  // Valor por defecto
    },
    description: String,
    authorization: String,
    diagnosis: String,
    status: {
        type: String,
        default: 'pendiente'
    },
    isPrefactured: {
        type: Boolean,
        default: false
    },
    prefacturedAt: Date
}, {
    timestamps: true,
    toJSON: { getters: true }
});

// Modificar el índice para permitir servicios duplicados con diferentes contratos
serviceRecordSchema.index({
    patientId: 1,
    cupsCode: 1,
    serviceDate: 1,
    contractId: 1
}, { unique: true });

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);