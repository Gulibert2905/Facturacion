const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    // Campos obligatorios
    documentType: {
        type: String,
        required: true,
        enum: ['CC', 'TI', 'CE', 'RC','PT','PA']  // Validación de tipos de documento permitidos
    },
    documentNumber: {
        type: String,
        required: true,
        unique: true  // Asegura que no haya duplicados
    },
    firstName: {
        type: String,
        required: true
    },
    firstLastName: {
        type: String,
        required: true
    },

    // Campos opcionales
    secondName: {
        type: String,
        default: ''  // Valor por defecto para campo opcional
    },
    secondLastName: {
        type: String,
        default: ''
    },
    birthDate: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['M', 'F', 'Masculino','Femenino','' ],  // Incluimos cadena vacía como valor válido
        default: ''
    },
    municipality: {
        type: String,
        default: ''
    },
    department: {
        type: String,
        default: ''
    },
    regimen: {
        type: String,
        default: ''
    },
    eps: {
        type: String,
        default: ''
    },
    zone: {
        type: String,
        default: 'U'
    },
    active: {
        type: Boolean,
        default: true
    },
    fullName: {
        type: String
    }
}, {
    timestamps: true
});

// Middleware para generar fullName automáticamente
patientSchema.pre('save', function(next) {
    const names = [this.firstName, this.secondName].filter(Boolean);
    const lastNames = [this.firstLastName, this.secondLastName].filter(Boolean);
    this.fullName = [...names, ...lastNames].join(' ');
    next();
});

module.exports = mongoose.model('Patient', patientSchema);