// src/models/RolePermissions.js
const mongoose = require('mongoose');

const modulePermissionSchema = new mongoose.Schema({
  moduleId: {
    type: String,
    required: true
  },
  moduleName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['dashboard', 'operations', 'configuration', 'reports', 'analysis'],
    default: 'operations'
  },
  enabled: {
    type: Boolean,
    default: true
  }
});

const rolePermissionSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
    enum: ['superadmin', 'admin', 'facturador', 'auditor', 'user']
  },
  roleDisplayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  modules: [modulePermissionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Método para obtener módulos habilitados
rolePermissionSchema.methods.getEnabledModules = function() {
  return this.modules.filter(module => module.enabled);
};

// Método estático para inicializar permisos por defecto
rolePermissionSchema.statics.initializeDefaultPermissions = async function() {
  const defaultPermissions = [
    {
      roleName: 'superadmin',
      roleDisplayName: 'Super Administrador',
      description: 'Acceso completo a todos los módulos',
      modules: [
        { moduleId: 'dashboard', moduleName: 'Dashboard', path: '/dashboard', icon: 'DashboardIcon', category: 'dashboard' },
        { moduleId: 'services', moduleName: 'Servicios', path: '/services', icon: 'ServicesIcon', category: 'operations' },
        { moduleId: 'advanced-dashboard', moduleName: 'Dashboard Avanzado', path: '/advanced-dashboard', icon: 'AssessmentIcon', category: 'dashboard' },
        { moduleId: 'companies', moduleName: 'Empresas', path: '/companies', icon: 'BusinessIcon', category: 'configuration' },
        { moduleId: 'contracts', moduleName: 'Contratos', path: '/contracts', icon: 'ContractIcon', category: 'configuration' },
        { moduleId: 'cups', moduleName: 'Catálogo CUPS', path: '/cups', icon: 'MedicalServices', category: 'configuration' },
        { moduleId: 'tariffs', moduleName: 'Tarifas por Contrato', path: '/tariffs', icon: 'AttachMoney', category: 'configuration' },
        { moduleId: 'reports', moduleName: 'Reportes', path: '/reports', icon: 'ReportsIcon', category: 'reports' },
        { moduleId: 'advanced-reports', moduleName: 'Reportes Avanzados', path: '/advanced-reports', icon: 'AssessmentIcon', category: 'reports' },
        { moduleId: 'import', moduleName: 'Importar Datos', path: '/import', icon: 'ImportIcon', category: 'operations' },
        { moduleId: 'financial', moduleName: 'Análisis Financiero', path: '/financial', icon: 'FinancialIcon', category: 'analysis' },
        { moduleId: 'audit', moduleName: 'Auditoría', path: '/audit', icon: 'AuditIcon', category: 'analysis' },
        { moduleId: 'rips', moduleName: 'Generador RIPS', path: '/rips', icon: 'RipsIcon', category: 'operations' },
        { moduleId: 'user-management', moduleName: 'Gestión de Usuarios', path: '/users', icon: 'PeopleIcon', category: 'configuration' },
        { moduleId: 'role-permissions', moduleName: 'Permisos de Roles', path: '/role-permissions', icon: 'SecurityIcon', category: 'configuration' }
      ]
    },
    {
      roleName: 'admin',
      roleDisplayName: 'Administrador',
      description: 'Administrador con acceso a configuración y operaciones',
      modules: [
        { moduleId: 'dashboard', moduleName: 'Dashboard', path: '/dashboard', icon: 'DashboardIcon', category: 'dashboard' },
        { moduleId: 'services', moduleName: 'Servicios', path: '/services', icon: 'ServicesIcon', category: 'operations' },
        { moduleId: 'advanced-dashboard', moduleName: 'Dashboard Avanzado', path: '/advanced-dashboard', icon: 'AssessmentIcon', category: 'dashboard' },
        { moduleId: 'companies', moduleName: 'Empresas', path: '/companies', icon: 'BusinessIcon', category: 'configuration' },
        { moduleId: 'contracts', moduleName: 'Contratos', path: '/contracts', icon: 'ContractIcon', category: 'configuration' },
        { moduleId: 'cups', moduleName: 'Catálogo CUPS', path: '/cups', icon: 'MedicalServices', category: 'configuration' },
        { moduleId: 'tariffs', moduleName: 'Tarifas por Contrato', path: '/tariffs', icon: 'AttachMoney', category: 'configuration' },
        { moduleId: 'reports', moduleName: 'Reportes', path: '/reports', icon: 'ReportsIcon', category: 'reports' },
        { moduleId: 'advanced-reports', moduleName: 'Reportes Avanzados', path: '/advanced-reports', icon: 'AssessmentIcon', category: 'reports' },
        { moduleId: 'import', moduleName: 'Importar Datos', path: '/import', icon: 'ImportIcon', category: 'operations' },
        { moduleId: 'financial', moduleName: 'Análisis Financiero', path: '/financial', icon: 'FinancialIcon', category: 'analysis' },
        { moduleId: 'audit', moduleName: 'Auditoría', path: '/audit', icon: 'AuditIcon', category: 'analysis' },
        { moduleId: 'rips', moduleName: 'Generador RIPS', path: '/rips', icon: 'RipsIcon', category: 'operations' },
        { moduleId: 'user-management', moduleName: 'Gestión de Usuarios', path: '/users', icon: 'PeopleIcon', category: 'configuration' }
      ]
    },
    {
      roleName: 'facturador',
      roleDisplayName: 'Facturador',
      description: 'Usuario de facturación con acceso a operaciones básicas',
      modules: [
        { moduleId: 'dashboard', moduleName: 'Dashboard', path: '/dashboard', icon: 'DashboardIcon', category: 'dashboard' },
        { moduleId: 'services', moduleName: 'Servicios', path: '/services', icon: 'ServicesIcon', category: 'operations' },
        { moduleId: 'reports', moduleName: 'Reportes', path: '/reports', icon: 'ReportsIcon', category: 'reports' },
        { moduleId: 'rips', moduleName: 'Generador RIPS', path: '/rips', icon: 'RipsIcon', category: 'operations' }
      ]
    },
    {
      roleName: 'auditor',
      roleDisplayName: 'Auditor',
      description: 'Usuario de auditoría con acceso a análisis y reportes',
      modules: [
        { moduleId: 'dashboard', moduleName: 'Dashboard', path: '/dashboard', icon: 'DashboardIcon', category: 'dashboard' },
        { moduleId: 'advanced-dashboard', moduleName: 'Dashboard Avanzado', path: '/advanced-dashboard', icon: 'AssessmentIcon', category: 'dashboard' },
        { moduleId: 'advanced-reports', moduleName: 'Reportes Avanzados', path: '/advanced-reports', icon: 'AssessmentIcon', category: 'reports' },
        { moduleId: 'financial', moduleName: 'Análisis Financiero', path: '/financial', icon: 'FinancialIcon', category: 'analysis' },
        { moduleId: 'audit', moduleName: 'Auditoría', path: '/audit', icon: 'AuditIcon', category: 'analysis' }
      ]
    }
  ];

  for (const permission of defaultPermissions) {
    await this.findOneAndUpdate(
      { roleName: permission.roleName },
      permission,
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('RolePermission', rolePermissionSchema);