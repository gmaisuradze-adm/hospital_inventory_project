"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../schemas");
const UserService_1 = require("../services/UserService");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.userRoutes = router;
const userService = new UserService_1.UserService();
// Apply authentication to all routes
router.use(auth_1.authenticate);
const querySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.string().optional()
});
/**
 * @route GET /api/users
 * @desc Get all users with filtering and pagination
 * @access Private (Manager, Admin)
 */
router.get('/', (0, auth_1.authorize)(['MANAGER', 'ADMIN']), (0, validation_1.validateQuery)(querySchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        role: req.query.role,
        search: req.query.search,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
    };
    const result = await userService.getUsers(filters);
    res.json(result);
}));
/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await userService.getUserById(req.user.id);
    res.json(user);
}));
/**
 * @route PUT /api/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.put('/profile', (0, validation_1.validateRequest)(schemas_1.updateUserSchema.omit({ role: true, isActive: true })), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await userService.updateUser(req.user.id, req.body, req.user.id);
    res.json(user);
}));
/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (Manager, Admin)
 */
router.get('/:id', (0, auth_1.authorize)(['MANAGER', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
}));
/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private (Admin)
 */
router.put('/:id', (0, auth_1.authorize)(['ADMIN']), (0, validation_1.validateRequest)(schemas_1.updateUserSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body, req.user.id);
    res.json(user);
}));
/**
 * @route DELETE /api/users/:id
 * @desc Deactivate user
 * @access Private (Admin)
 */
router.delete('/:id', (0, auth_1.authorize)(['ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await userService.deactivateUser(req.params.id, req.user.id);
    res.json(result);
}));
/**
 * @route POST /api/users/:id/activate
 * @desc Activate user
 * @access Private (Admin)
 */
router.post('/:id/activate', (0, auth_1.authorize)(['ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await userService.activateUser(req.params.id, req.user.id);
    res.json(result);
}));
/**
 * @route GET /api/users/stats/roles
 * @desc Get user statistics by role
 * @access Private (Manager, Admin)
 */
router.get('/stats/roles', (0, auth_1.authorize)(['MANAGER', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await userService.getUsersByRole();
    res.json(stats);
}));
/**
 * @route POST /api/users/:id/reset-password
 * @desc Reset user password
 * @access Private (Admin)
 */
router.post('/:id/reset-password', (0, auth_1.authorize)(['ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await userService.resetUserPassword(req.params.id, req.user.id);
    res.json(result);
}));
//# sourceMappingURL=users.js.map