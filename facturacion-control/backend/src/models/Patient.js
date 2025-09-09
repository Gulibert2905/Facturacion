const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    // Campos obligatorios
    tipoDocumento: {
        type: String,
        required: true,
        uppercase: true,  // Automatically convert to uppercase
        enum: ['CC', 'TI', 'CE', 'RC','PT','PA', 'PE', 'PPT', 'CNV', 'SC']  // Validación de tipos de documento permitidos
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
        uppercase: true,  // Automatically convert to uppercase
        enum: ['M', 'F', 'MASCULINO','FEMENINO','' ],  // Incluimos cadena vacía como valor válido
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

// Validación personalizada para tipo de documento según edad
patientSchema.pre('save', function(next) {
    const nombres = [this.primerNombre, this.segundoNombre].filter(Boolean);
    const apellidos = [this.primerApellido, this.segundoApellido].filter(Boolean);
    this.nombreCompleto = [...nombres, ...apellidos].join(' ');
    
    // Validar tipo de documento según edad (solo si hay fecha de nacimiento)
    if (this.fechaNacimiento && this.tipoDocumento) {
        const today = new Date();
        const age = today.getFullYear() - this.fechaNacimiento.getFullYear() - 
                   ((today.getMonth() < this.fechaNacimiento.getMonth() || 
                     (today.getMonth() === this.fechaNacimiento.getMonth() && today.getDate() < this.fechaNacimiento.getDate())) ? 1 : 0);
        
        // Solo validar para documentos colombianos estándar (no PT, CE, PA)
        if (!['PT', 'CE', 'PA'].includes(this.tipoDocumento)) {
            if (age >= 0 && age <= 7 && this.tipoDocumento !== 'RC') {
                return next(new Error('Para menores de 0 a 7 años debe usar Registro Civil (RC)'));
            }
            if (age >= 8 && age <= 17 && this.tipoDocumento !== 'TI') {
                return next(new Error('Para menores de 8 a 17 años debe usar Tarjeta de Identidad (TI)'));
            }
            if (age >= 18 && this.tipoDocumento !== 'CC') {
                return next(new Error('Para mayores de 18 años debe usar Cédula de Ciudadanía (CC)'));
            }
        }
    }
    
    next();
});

module.exports = mongoose.model('Patient', patientSchema);