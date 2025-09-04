// src/routes/rolePermissionRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllRolePermissions,
  getRolePermissions,
  updateRolePermissions,
  getAvailableModules,
  initializeDefaultPermissions,
  getMyPermissions
} = require('../controllers/rolePermissionController');
const { protect, admin, superAdmin } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

// Rutas públicas para usuarios autenticados
router.get('/my-permissions', protect, getMyPermissions);

// Rutas de administrador - admin y superadmin pueden gestionar permisos
router.get('/available-modules', protect, admin, getAvailableModules);
router.get('/', protect, admin, getAllRolePermissions);
router.get('/:roleName', protect, admin, getRolePermissions);
router.put('/:roleName', protect, admin, sanitizeInput, updateRolePermissions);

// Rutas de super administrador
router.post('/initialize', protect, superAdmin, initializeDefaultPermissions);

module.exports = router;