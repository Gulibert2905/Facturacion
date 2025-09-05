const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    // Campos obligatorios
    tipoDocumento: {
        type: String,
        required: true,
        enum: ['CC', 'TI', 'CE', 'RC','PT','PA']  // Validación de tipos de documento permitidos
    },
    numeroDocumento: {
        type: String,
        required: true,
        unique: true  // Asegura que no haya duplicados
    },
    primerNombre: {
        type: String,
        required: true
    },
    primerApellido: {
        type: String,
        required: true
    },

    // Campos opcionales
    segundoNombre: {
        type: String,
        default: ''  // Valor por defecto para campo opcional
    },
    segundoApellido: {
        type: String,
        default: ''
    },
    fechaNacimiento: {
        type: Date,
        default: null
    },
    genero: {
        type: String,
        enum: ['M', 'F', 'Masculino','Femenino','' ],  // Incluimos cadena vacía como valor válido
        default: ''
    },
    municipio: {
        type: String,
        default: ''
    },
    departamento: {
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
    ciudadNacimiento: String,
    ciudadExpedicion: String,
    zona: {
        type: String,
        default: 'U'
    },
    activo: {
        type: Boolean,
        default: true
    },
    nombreCompleto: {
        type: String
    }
}, {
    timestamps: true
});

// Middleware para generar nombreCompleto automáticamente
patientSchema.pre('save', function(next) {
    const nombres = [this.primerNombre, this.segundoNombre].filter(Boolean);
    const apellidos = [this.primerApellido, this.segundoApellido].filter(Boolean);
    this.nombreCompleto = [...nombres, ...apellidos].join(' ');
    next();
});

module.exports = mongoose.model('Patient', patientSchema);