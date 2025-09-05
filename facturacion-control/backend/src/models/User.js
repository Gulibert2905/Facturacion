// src/models/User.js
const mongoose = require('mongoose');

// Definir módulos del sistema
const MODULES = {
    DASHBOARD: 'dashboard',
    PATIENTS: 'patients', 
    SERVICES: 'services',
    PREBILLS: 'prebills',
    REPORTS: 'reports',
    AUDIT: 'audit',
    FINANCIAL: 'financial',
    RIPS: 'rips',
    CONTRACTS: 'contracts',
    COMPANIES: 'companies',
    USERS: 'users',
    IMPORT: 'import'
};

// Definir acciones posibles
const ACTIONS = {
    READ: 'read',
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    EXECUTE: 'execute' // Para operaciones especiales
};

// Schema para permisos individuales
const permissionSchema = new mongoose.Schema({
    module: { 
        type: String, 
        required: true,
        enum: Object.values(MODULES)
    },
    actions: [{ 
        type: String, 
        enum: Object.values(ACTIONS)
    }]
}, { _id: false });

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido']
    },
    password: { 
        type: String, 
        required: true,
        minlength: [12, 'La contraseña debe tener al menos 12 caracteres'],
        validate: {
            validator: function(password) {
                // Validar complejidad: al menos 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
                const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
                return regex.test(password);
            },
            message: 'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'
        }
    },
    fullName: { 
        type: String, 
        required: true,
        trim: true
    },
    role: { 
        type: String, 
        enum: ['superadmin', 'admin', 'facturador', 'auditor', 'reportes', 'rips', 'custom'], 
        default: 'facturador' 
    },
    // Para usuarios con rol 'custom' - permisos granulares
    customPermissions: [permissionSchema],
    
    // Empresas asignadas al usuario
    assignedCompanies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    
    // Si es true, puede ver todas las empresas (solo superadmin y algunos admin)
    canViewAllCompanies: {
        type: Boolean,
        default: false
    },
    
    // Información adicional
    department: {
        type: String,
        trim: true,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockedUntil: {
        type: Date,
        default: null
    },
    active: { 
        type: Boolean, 
        default: true 
    },
    
    // Metadatos
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Campos para reset de contraseña
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    passwordChangedAt: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true 
});

// Método para obtener permisos del usuario
userSchema.methods.getPermissions = function() {
    // Si es custom, retorna permisos personalizados
    if (this.role === 'custom') {
        return this.customPermissions;
    }
    
    // Permisos predefinidos por rol
    const rolePermissions = {
        superadmin: Object.values(MODULES).map(module => ({
            module,
            actions: Object.values(ACTIONS)
        })),
        
        admin: [
            { module: MODULES.DASHBOARD, actions: [ACTIONS.READ] },
            { module: MODULES.PATIENTS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE] },
            { module: MODULES.SERVICES, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE] },
            { module: MODULES.PREBILLS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE] },
            { module: MODULES.REPORTS, actions: [ACTIONS.READ] },
            { module: MODULES.AUDIT, actions: [ACTIONS.READ] },
            { module: MODULES.FINANCIAL, actions: [ACTIONS.READ] },
            { module: MODULES.RIPS, actions: [ACTIONS.READ, ACTIONS.CREATE] },
            { module: MODULES.CONTRACTS, actions: [ACTIONS.READ, ACTIONS.UPDATE] },
            { module: MODULES.COMPANIES, actions: [ACTIONS.READ, ACTIONS.UPDATE] },
            { module: MODULES.IMPORT, actions: [ACTIONS.READ, ACTIONS.EXECUTE] }
        ],
        
        facturador: [
            { module: MODULES.DASHBOARD, actions: [ACTIONS.READ] },
            { module: MODULES.PATIENTS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE] },
            { module: MODULES.SERVICES, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE] },
            { module: MODULES.PREBILLS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE] },
            { module: MODULES.REPORTS, actions: [ACTIONS.READ] },
            { module: MODULES.CONTRACTS, actions: [ACTIONS.READ] },
            { module: MODULES.IMPORT, actions: [ACTIONS.READ, ACTIONS.EXECUTE] }
        ],
        
        auditor: [
            { module: MODULES.DASHBOARD, actions: [ACTIONS.READ] },
            { module: MODULES.PATIENTS, actions: [ACTIONS.READ] },
            { module: MODULES.SERVICES, actions: [ACTIONS.READ] },
            { module: MODULES.PREBILLS, actions: [ACTIONS.READ] },
            { module: MODULES.REPORTS, actions: [ACTIONS.READ] },
            { module: MODULES.AUDIT, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE] },
            { module: MODULES.FINANCIAL, actions: [ACTIONS.READ] },
            { module: MODULES.CONTRACTS, actions: [ACTIONS.READ] }
        ],
        
        reportes: [
            { module: MODULES.DASHBOARD, actions: [ACTIONS.READ] },
            { module: MODULES.REPORTS, actions: [ACTIONS.READ] },
            { module: MODULES.FINANCIAL, actions: [ACTIONS.READ] }
        ],
        
        rips: [
            { module: MODULES.DASHBOARD, actions: [ACTIONS.READ] },
            { module: MODULES.PATIENTS, actions: [ACTIONS.READ] },
            { module: MODULES.SERVICES, actions: [ACTIONS.READ] },
            { module: MODULES.RIPS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.EXECUTE] },
            { module: MODULES.REPORTS, actions: [ACTIONS.READ] }
        ]
    };
    
    return rolePermissions[this.role] || [];
};

// Método para verificar si tiene permiso específico
userSchema.methods.hasPermission = function(module, action) {
    const permissions = this.getPermissions();
    const modulePermission = permissions.find(p => p.module === module);
    return modulePermission && modulePermission.actions.includes(action);
};

// Método para verificar si está bloqueado
userSchema.methods.isLocked = function() {
    return !!(this.lockedUntil && this.lockedUntil > Date.now());
};

// Método para generar token de reset de contraseña
userSchema.methods.createPasswordResetToken = function() {
    const crypto = require('crypto');
    
    // Generar token aleatorio
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash del token para almacenar en BD
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expira en 10 minutos
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    
    // Retornar token sin hash (para enviar por email)
    return resetToken;
};

// Método para verificar si el token de reset es válido
userSchema.methods.isValidResetToken = function(token) {
    if (!this.resetPasswordToken || !this.resetPasswordExpires) {
        return false;
    }
    
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    return this.resetPasswordToken === hashedToken && 
           this.resetPasswordExpires > Date.now();
};

// Método para limpiar tokens de reset
userSchema.methods.clearPasswordResetToken = function() {
    this.resetPasswordToken = null;
    this.resetPasswordExpires = null;
};

// Método para obtener las empresas que puede ver el usuario
userSchema.methods.getAccessibleCompanies = function() {
    // Superadmin puede ver todas las empresas
    if (this.role === 'superadmin' || this.canViewAllCompanies) {
        return 'all'; // Retorna 'all' para indicar acceso a todas las empresas
    }
    
    // Para otros roles, retorna solo las empresas asignadas
    return this.assignedCompanies;
};

// Método para verificar si puede acceder a una empresa específica
userSchema.methods.canAccessCompany = function(companyId) {
    // Superadmin puede acceder a todas las empresas
    if (this.role === 'superadmin' || this.canViewAllCompanies) {
        return true;
    }
    
    // Verificar si la empresa está en la lista de empresas asignadas
    return this.assignedCompanies.some(id => id.toString() === companyId.toString());
};

// Índices para optimización (removidos los duplicados que están definidos como unique: true)
userSchema.index({ role: 1 });
userSchema.index({ active: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ resetPasswordExpires: 1 });

// Exportar constantes junto con el modelo
module.exports = {
    User: mongoose.model('User', userSchema),
    MODULES,
    ACTIONS
};