const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  changePassword 
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');
const { sanitizeInput, validateUserData } = require('../middleware/validation');
const { loginRateLimit, registerRateLimit, sensitiveRateLimit } = require('../middleware/rateLimiter');

// Rutas públicas
router.post('/login', loginRateLimit, sanitizeInput, loginUser);
router.post('/forgot-password', sensitiveRateLimit, sanitizeInput, forgotPassword);
router.post('/reset-password', sensitiveRateLimit, sanitizeInput, resetPassword);

// Rutas protegidas
router.post('/register', registerRateLimit, sanitizeInput, validateUserData, protect, admin, registerUser);
router.post('/change-password', sensitiveRateLimit, sanitizeInput, protect, changePassword);

module.exports = router;