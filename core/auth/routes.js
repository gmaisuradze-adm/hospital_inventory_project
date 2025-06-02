const express = require('express');
const { login, register, getProfile } = require('./controllers');
const { authenticate, authorize } = require('./middleware');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', authenticate, authorize('admin'), register);

// Protected routes
router.get('/profile', authenticate, getProfile);

module.exports = router;