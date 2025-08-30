const jwt = require('jsonwebtoken');
const { User, MODULES, ACTIONS } = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware de protección de rutas - Verifica JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.warn({
        type: 'auth_failed',
        reason: 'no_token',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ 
        message: 'No autorizado, token no proporcionado',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      logger.warn({
        type: 'auth_failed',
        reason: 'user_not_found',
        userId: decoded.id,
        ip: req.ip
      });
      return res.status(401).json({ 
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.active) {
      logger.warn({
        type: 'auth_failed',
        reason: 'user_inactive',
        userId: user._id,
        username: user.username
      });
      return res.status(401).json({ 
        message: 'Usuario desactivado',
        code: 'USER_INACTIVE'
      });
    }

    if (user.isLocked()) {
      logger.warn({
        type: 'auth_failed',
        reason: 'user_locked',
        userId: user._id,
        username: user.username
      });
      return res.status(401).json({ 
        message: 'Usuario bloqueado temporalmente',
        code: 'USER_LOCKED'
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    req.user = user;
    next();
  } catch (error) {
    logger.error({
      type: 'auth_error',
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado',
        code: 'EXPIRED_TOKEN'
      });
    }
    
    res.status(401).json({ 
      message: 'Error de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({
        type: 'authorization_failed',
        reason: 'insufficient_role',
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        route: req.originalUrl
      });
      
      return res.status(403).json({ 
        message: `Acceso denegado. Roles requeridos: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar permisos específicos en módulos
 */
const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Superadmin siempre tiene acceso
    if (req.user.role === 'superadmin') {
      return next();
    }

    if (!req.user.hasPermission(module, action)) {
      logger.warn({
        type: 'permission_denied',
        userId: req.user._id,
        username: req.user.username,
        userRole: req.user.role,
        requiredModule: module,
        requiredAction: action,
        route: req.originalUrl,
        method: req.method
      });
      
      return res.status(403).json({ 
        message: `Sin permisos para ${action} en módulo ${module}`,
        code: 'PERMISSION_DENIED',
        required: { module, action }
      });
    }

    next();
  };
};

/**
 * Middleware para verificar múltiples permisos (OR logic)
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Superadmin siempre tiene acceso
    if (req.user.role === 'superadmin') {
      return next();
    }

    const hasAnyPermission = permissions.some(({ module, action }) => 
      req.user.hasPermission(module, action)
    );

    if (!hasAnyPermission) {
      logger.warn({
        type: 'permission_denied',
        userId: req.user._id,
        username: req.user.username,
        userRole: req.user.role,
        requiredPermissions: permissions,
        route: req.originalUrl,
        method: req.method
      });
      
      return res.status(403).json({ 
        message: 'Sin permisos suficientes para esta operación',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions
      });
    }

    next();
  };
};

/**
 * Middleware legacy para compatibilidad con código existente
 */
const admin = (req, res, next) => {
  return requireRole('superadmin', 'admin')(req, res, next);
};

/**
 * Middleware para verificar si es el mismo usuario o admin
 */
const ownerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Si es admin o el mismo usuario
  if (['superadmin', 'admin'].includes(req.user.role) || 
      req.user._id.toString() === req.params.userId) {
    return next();
  }

  return res.status(403).json({ 
    message: 'Solo puedes acceder a tu propia información',
    code: 'OWNER_OR_ADMIN_REQUIRED'
  });
};

module.exports = { 
  protect, 
  admin,
  requireRole,
  requirePermission,
  requireAnyPermission,
  ownerOrAdmin,
  MODULES,
  ACTIONS
};