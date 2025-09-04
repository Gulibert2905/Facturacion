// src/controllers/rolePermissionController.js
const RolePermission = require('../models/RolePermissions');
const logger = require('../utils/logger');

// @desc    Obtener todos los permisos de roles
// @route   GET /api/role-permissions
// @access  Admin
const getAllRolePermissions = async (req, res) => {
  try {
    const rolePermissions = await RolePermission.find({ isActive: true })
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName')
      .sort({ roleName: 1 });

    res.json({
      success: true,
      data: rolePermissions
    });
  } catch (error) {
    logger.error('Error obteniendo permisos de roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener permisos de un rol específico
// @route   GET /api/role-permissions/:roleName
// @access  Admin
const getRolePermissions = async (req, res) => {
  try {
    const { roleName } = req.params;
    
    const rolePermission = await RolePermission.findOne({ 
      roleName, 
      isActive: true 
    })
    .populate('createdBy', 'username fullName')
    .populate('updatedBy', 'username fullName');

    if (!rolePermission) {
      return res.status(404).json({
        success: false,
        message: 'Permisos de rol no encontrados'
      });
    }

    res.json({
      success: true,
      data: rolePermission
    });
  } catch (error) {
    logger.error('Error obteniendo permisos del rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar permisos de un rol
// @route   PUT /api/role-permissions/:roleName
// @access  Admin
const updateRolePermissions = async (req, res) => {
  try {
    const { roleName } = req.params;
    const { modules, description } = req.body;
    const userId = req.user._id;

    const rolePermission = await RolePermission.findOneAndUpdate(
      { roleName },
      {
        modules,
        description,
        updatedBy: userId
      },
      { new: true, runValidators: true }
    );

    if (!rolePermission) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    logger.info({
      type: 'role_permissions_updated',
      roleName,
      updatedBy: req.user.username,
      modulesCount: modules.length
    });

    res.json({
      success: true,
      message: 'Permisos actualizados correctamente',
      data: rolePermission
    });
  } catch (error) {
    logger.error('Error actualizando permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener módulos disponibles para asignar
// @route   GET /api/role-permissions/available-modules
// @access  Admin
const getAvailableModules = async (req, res) => {
  try {
    // Obtener todos los módulos únicos de todos los roles
    const allRoles = await RolePermission.find({ isActive: true });
    const moduleMap = new Map();

    allRoles.forEach(role => {
      role.modules.forEach(module => {
        if (!moduleMap.has(module.moduleId)) {
          moduleMap.set(module.moduleId, {
            moduleId: module.moduleId,
            moduleName: module.moduleName,
            path: module.path,
            icon: module.icon,
            category: module.category,
            description: module.description
          });
        }
      });
    });

    const availableModules = Array.from(moduleMap.values())
      .sort((a, b) => a.moduleName.localeCompare(b.moduleName));

    res.json({
      success: true,
      data: availableModules
    });
  } catch (error) {
    logger.error('Error obteniendo módulos disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Inicializar permisos por defecto
// @route   POST /api/role-permissions/initialize
// @access  SuperAdmin
const initializeDefaultPermissions = async (req, res) => {
  try {
    await RolePermission.initializeDefaultPermissions();
    
    logger.info({
      type: 'permissions_initialized',
      initializedBy: req.user.username
    });

    res.json({
      success: true,
      message: 'Permisos por defecto inicializados correctamente'
    });
  } catch (error) {
    logger.error('Error inicializando permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener permisos para el usuario actual (para construir menú)
// @route   GET /api/role-permissions/my-permissions
// @access  Private
const getMyPermissions = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    const rolePermission = await RolePermission.findOne({ 
      roleName: userRole, 
      isActive: true 
    });

    if (!rolePermission) {
      return res.status(404).json({
        success: false,
        message: 'Permisos no encontrados para tu rol'
      });
    }

    const enabledModules = rolePermission.getEnabledModules();

    res.json({
      success: true,
      data: {
        role: userRole,
        roleDisplayName: rolePermission.roleDisplayName,
        modules: enabledModules
      }
    });
  } catch (error) {
    logger.error('Error obteniendo permisos del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getAllRolePermissions,
  getRolePermissions,
  updateRolePermissions,
  getAvailableModules,
  initializeDefaultPermissions,
  getMyPermissions
};