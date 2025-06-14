"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../schemas");
const AuthService_1 = require("../services/AuthService");
const router = (0, express_1.Router)();
exports.authRoutes = router;
const authService = new AuthService_1.AuthService();
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', (0, validation_1.validateRequest)(schemas_1.registerSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
}));
/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', (0, validation_1.validateRequest)(schemas_1.loginSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
}));
/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // In a JWT implementation, logout is typically handled client-side
    // Here we could add token to a blacklist if needed
    res.json({ message: 'Logged out successfully' });
}));
/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    await authService.requestPasswordReset(email);
    res.json({ message: 'Password reset email sent if account exists' });
}));
/**
 * @route POST /api/auth/reset-password
 * @desc Reset password
 * @access Public
 */
router.post('/reset-password', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: 'Password reset successfully' });
}));
/**
 * @route GET /api/auth/verify-token
 * @desc Verify JWT token
 * @access Public
 */
router.get('/verify-token', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }
    const isValid = await authService.verifyToken(token);
    res.json({ valid: isValid });
}));
//# sourceMappingURL=auth.js.map