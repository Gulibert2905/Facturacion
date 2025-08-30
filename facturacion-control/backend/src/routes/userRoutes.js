const express = require('express');
const { 
    protect, 
    requireRole, 
    requirePermission, 
    ownerOrAdmin,
    MODULES, 
    ACTIONS 
} = require('../middleware/auth');
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    changePassword,
    toggleUserStatus,
    getSystemInfo
} = require('../controllers/userController');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

/**
 * @route   GET /api/users/system-info
 * @desc    Obtener información del sistema (roles, módulos, acciones)
 * @access  Authenticated users
 */
router.get('/system-info', getSystemInfo);

/**
 * @route   GET /api/users
 * @desc    Obtener lista de usuarios
 * @access  Superadmin, Admin
 */
router.get('/', 
    requirePermission(MODULES.USERS, ACTIONS.READ),
    getUsers
);

/**
 * @route   POST /api/users
 * @desc    Crear nuevo usuario
 * @access  Superadmin, Admin
 */
router.post('/', 
    requirePermission(MODULES.USERS, ACTIONS.CREATE),
    createUser
);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener usuario específico
 * @access  Owner or Admin
 */
router.get('/:id', 
    ownerOrAdmin,
    getUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar usuario
 * @access  Superadmin, Admin (o el mismo usuario para datos básicos)
 */
router.put('/:id', 
    requirePermission(MODULES.USERS, ACTIONS.UPDATE),
    updateUser
);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Cambiar password de usuario
 * @access  Owner or Admin
 */
router.put('/:id/password', 
    ownerOrAdmin,
    changePassword
);

/**
 * @route   PUT /api/users/:id/toggle-status
 * @desc    Activar/Desactivar usuario
 * @access  Superadmin, Admin
 */
router.put('/:id/toggle-status', 
    requirePermission(MODULES.USERS, ACTIONS.UPDATE),
    toggleUserStatus
);

module.exports = router;