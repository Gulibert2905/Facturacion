const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const { validatePassword } = require('../middleware/validation');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Token de corta duración para operaciones sensibles
const generateShortToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Admin
const registerUser = async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password: hashedPassword,
      fullName,
      role: role || 'user'
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Log detallado del intento de login
    logger.info({
      type: 'login_attempt',
      username: username ? username.substring(0, 3) + '***' : 'undefined',
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      hasPassword: !!password
    });

    if (!username || !password) {
      logger.warn({
        type: 'login_failed',
        reason: 'missing_credentials',
        username: username ? username.substring(0, 3) + '***' : 'undefined',
        ip: clientIP
      });
      return res.status(400).json({ 
        message: 'Username y password son requeridos',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar usuario (insensible a mayúsculas)
    const user = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!user) {
      logger.warn({
        type: 'login_failed',
        reason: 'user_not_found',
        username: username ? username.substring(0, 3) + '***' : 'undefined', // Partially hide username
        ip: clientIP,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ 
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar si está activo
    if (!user.active) {
      logger.warn({
        type: 'login_failed',
        reason: 'user_inactive',
        userId: user._id,
        username: user.username.substring(0, 3) + '***', // Partially hide username
        ip: clientIP
      });
      return res.status(401).json({ 
        message: 'Usuario desactivado',
        code: 'USER_INACTIVE'
      });
    }

    // Verificar si está bloqueado
    if (user.isLocked()) {
      logger.warn({
        type: 'login_failed',
        reason: 'user_locked',
        userId: user._id,
        username: user.username.substring(0, 3) + '***', // Partially hide username
        lockedUntil: user.lockedUntil,
        ip: clientIP
      });
      return res.status(401).json({ 
        message: 'Usuario bloqueado temporalmente por múltiples intentos fallidos',
        code: 'USER_LOCKED',
        lockedUntil: user.lockedUntil
      });
    }

    // Verificar password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Incrementar intentos fallidos
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Bloquear después de 5 intentos por 15 minutos
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      }
      
      await user.save({ validateBeforeSave: false });

      logger.warn({
        type: 'login_failed',
        reason: 'invalid_password',
        userId: user._id,
        username: user.username.substring(0, 3) + '***', // Partially hide username
        loginAttempts: user.loginAttempts,
        ip: clientIP,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({ 
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS',
        attemptsRemaining: Math.max(0, 5 - user.loginAttempts)
      });
    }

    // Login exitoso - resetear intentos fallidos
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockedUntil = null;
    }
    
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Obtener permisos del usuario
    const permissions = user.getPermissions();

    logger.info({
      type: 'login_success',
      userId: user._id,
      username: user.username,
      role: user.role,
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        permissions,
        lastLogin: user.lastLogin
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    logger.error({
      type: 'login_error',
      error: error.message,
      stack: error.stack,
      username: req.body.username,
      ip: req.ip
    });
    res.status(500).json({ 
      message: 'Error en el servidor',
      code: 'SERVER_ERROR'
    });
  }
};

// @desc    Solicitar reset de contraseña
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requerido'
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      active: true 
    });

    if (!user) {
      // Por seguridad, siempre responder que el email fue enviado
      logger.warn(`Intento de reset con email inexistente: ${email.substring(0, 3)}***`);
      return res.status(200).json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    // Generar token de reset
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Enviar email
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.fullName);
      
      logger.info({
        type: 'password_reset_requested',
        userId: user._id,
        email: user.email.substring(0, 3) + '***'
      });

      res.status(200).json({
        success: true,
        message: 'Instrucciones enviadas a tu email'
      });
    } catch (error) {
      // Limpiar token si falló el envío
      user.clearPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      logger.error('Error enviando email de reset:', error);
      res.status(500).json({
        success: false,
        message: 'Error enviando email. Intenta más tarde'
      });
    }
  } catch (error) {
    logger.error('Error en forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Reset de contraseña con token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña requeridos'
      });
    }

    // Validar nueva contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Buscar usuario con token válido
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
      active: true
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Actualizar contraseña
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.passwordChangedAt = new Date();
    user.clearPasswordResetToken();
    
    // Resetear intentos de login
    user.loginAttempts = 0;
    user.lockedUntil = null;

    await user.save();

    // Enviar confirmación
    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.fullName);
    } catch (emailError) {
      logger.warn('Error enviando confirmación de cambio:', emailError);
    }

    logger.info({
      type: 'password_reset_completed',
      userId: user._id,
      email: user.email.substring(0, 3) + '***'
    });

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    logger.error('Error en reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Cambiar contraseña (usuario autenticado)
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña requeridas'
      });
    }

    // Validar nueva contraseña
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Obtener usuario
    const user = await User.findById(userId);
    if (!user || !user.active) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      logger.warn({
        type: 'password_change_failed',
        reason: 'invalid_current_password',
        userId: user._id
      });

      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Actualizar contraseña
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    user.updatedBy = userId;

    await user.save();

    // Enviar confirmación
    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.fullName);
    } catch (emailError) {
      logger.warn('Error enviando confirmación de cambio:', emailError);
    }

    logger.info({
      type: 'password_changed',
      userId: user._id,
      changedBy: userId
    });

    res.status(200).json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    logger.error('Error en change password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  changePassword 
};