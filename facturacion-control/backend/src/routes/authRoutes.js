const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

router.post('/register', protect, admin, registerUser);
router.post('/login', loginUser);

module.exports = router;