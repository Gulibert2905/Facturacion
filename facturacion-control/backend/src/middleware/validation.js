// src/middleware/validation.js
const logger = require('../utils/logger');

/**
 * Middleware de validación de entrada para proteger contra inyecciones y datos maliciosos
 */

/**
 * Sanitiza una cadena de texto eliminando caracteres peligrosos
 * @param {string} str - Cadena a sanitizar
 * @returns {string} - Cadena sanitizada
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Eliminar caracteres de control y scripts potencialmente peligrosos
  return str
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, '') // Eliminar eventos onclick, onload, etc.
    .replace(/[\x00-\x1f\x7f]/g, '') // Eliminar caracteres de control
    .trim();
};

/**
 * Valida y sanitiza un email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} - {valid: boolean, message: string}
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Contraseña requerida' };
  }

  if (password.length < 12) {
    return { valid: false, message: 'Contraseña debe tener al menos 12 caracteres' };
  }

  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!regex.test(password)) {
    return { 
      valid: false, 
      message: 'Contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial' 
    };
  }

  return { valid: true, message: '' };
};

/**
 * Valida un número de identificación colombiano
 * @param {string} id - Número de identificación
 * @returns {boolean} - True si es válido
 */
const validateColombianId = (id) => {
  if (!id || typeof id !== 'string') return false;
  
  // Eliminar espacios y guiones
  const cleanId = id.replace(/[\s-]/g, '');
  
  // Debe ser numérico y tener entre 6 y 12 dígitos
  return /^\d{6,12}$/.test(cleanId);
};

/**
 * Valida códigos CUPS (Clasificación Única de Procedimientos en Salud)
 * @param {string} cups - Código CUPS
 * @returns {boolean} - True si es válido
 */
const validateCupsCode = (cups) => {
  if (!cups || typeof cups !== 'string') return false;
  
  // Formato CUPS: números, letras y algunos caracteres especiales
  return /^[0-9A-Za-z\-\.]{3,10}$/.test(cups);
};

/**
 * Sanitiza recursivamente un objeto
 * @param {any} obj - Objeto a sanitizar
 * @returns {any} - Objeto sanitizado
 */
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizar tanto la clave como el valor
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware para sanitizar el cuerpo de las peticiones
 */
const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Error en sanitización de entrada:', error);
    res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos'
    });
  }
};

/**
 * Middleware para validar datos de usuario
 */
const validateUserData = (req, res, next) => {
  const { username, email, password, fullName } = req.body;
  const errors = [];

  // Validar username
  if (!username || typeof username !== 'string' || username.length < 3 || username.length > 50) {
    errors.push('Nombre de usuario debe tener entre 3 y 50 caracteres');
  }

  // Validar email
  if (!email || !validateEmail(email)) {
    errors.push('Email inválido');
  }

  // Validar contraseña (solo en creación o cambio de contraseña)
  if (password) {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.message);
    }
  }

  // Validar nombre completo
  if (!fullName || typeof fullName !== 'string' || fullName.length < 2 || fullName.length > 100) {
    errors.push('Nombre completo debe tener entre 2 y 100 caracteres');
  }

  if (errors.length > 0) {
    logger.warn('Validación de usuario falló:', { errors, username, email });
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors
    });
  }

  next();
};

/**
 * Middleware para validar datos de paciente
 */
const validatePatientData = (req, res, next) => {
  const { tipoDocumento, numeroDocumento, primerNombre, primerApellido } = req.body;
  const errors = [];

  // Validar tipo de documento
  const validIdTypes = ['CC', 'TI', 'CE', 'PA', 'RC', 'AS', 'MS'];
  if (!tipoDocumento || !validIdTypes.includes(tipoDocumento)) {
    errors.push('Tipo de documento inválido');
  }

  // Validar número de documento
  if (!numeroDocumento || !validateColombianId(numeroDocumento)) {
    errors.push('Número de documento inválido');
  }

  // Validar nombres
  if (!primerNombre || typeof primerNombre !== 'string' || primerNombre.length < 2 || primerNombre.length > 50) {
    errors.push('Primer nombre debe tener entre 2 y 50 caracteres');
  }

  if (!primerApellido || typeof primerApellido !== 'string' || primerApellido.length < 2 || primerApellido.length > 50) {
    errors.push('Primer apellido debe tener entre 2 y 50 caracteres');
  }

  if (errors.length > 0) {
    logger.warn('Validación de paciente falló:', { errors, numeroDocumento });
    return res.status(400).json({
      success: false,
      message: 'Datos de paciente inválidos',
      errors
    });
  }

  next();
};

/**
 * Middleware para validar datos de servicio médico
 */
const validateServiceData = (req, res, next) => {
  const { codigoCups, descripcion, valorUnitario } = req.body;
  const errors = [];

  // Validar código CUPS
  if (!codigoCups || !validateCupsCode(codigoCups)) {
    errors.push('Código CUPS inválido');
  }

  // Validar descripción
  if (!descripcion || typeof descripcion !== 'string' || descripcion.length < 5 || descripcion.length > 500) {
    errors.push('Descripción debe tener entre 5 y 500 caracteres');
  }

  // Validar valor unitario
  if (valorUnitario !== undefined) {
    const valor = parseFloat(valorUnitario);
    if (isNaN(valor) || valor < 0 || valor > 10000000) {
      errors.push('Valor unitario inválido');
    }
  }

  if (errors.length > 0) {
    logger.warn('Validación de servicio falló:', { errors, codigoCups });
    return res.status(400).json({
      success: false,
      message: 'Datos de servicio inválidos',
      errors
    });
  }

  next();
};

/**
 * Middleware para validar parámetros de paginación
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Página inválida (1-10000)'
      });
    }
    req.query.page = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Límite inválido (1-1000)'
      });
    }
    req.query.limit = limitNum;
  }

  next();
};

module.exports = {
  sanitizeInput,
  validateUserData,
  validatePatientData,
  validateServiceData,
  validatePagination,
  sanitizeString,
  validateEmail,
  validatePassword,
  validateColombianId,
  validateCupsCode
};