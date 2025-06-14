"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../schemas");
const InventoryService_1 = require("../services/InventoryService");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.inventoryRoutes = router;
const inventoryService = new InventoryService_1.InventoryService();
// Apply authentication to all routes
router.use(auth_1.authenticate);
const querySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    search: zod_1.z.string().optional()
});
/**
 * @route GET /api/inventory
 * @desc Get all inventory items with filtering and pagination
 * @access Private
 */
router.get('/', (0, validation_1.validateQuery)(querySchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        category: req.query.category,
        status: req.query.status,
        location: req.query.location,
        search: req.query.search
    };
    const result = await inventoryService.getItems(filters);
    res.json(result);
}));
/**
 * @route POST /api/inventory
 * @desc Create a new inventory item
 * @access Private (Manager, Admin)
 */
router.post('/', (0, auth_1.authorize)(['MANAGER', 'ADMIN']), (0, validation_1.validateRequest)(schemas_1.createInventoryItemSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const item = await inventoryService.createItem(req.body, req.user.id);
    res.status(201).json(item);
}));
/**
 * @route GET /api/inventory/:id
 * @desc Get inventory item by ID
 * @access Private
 */
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const item = await inventoryService.getItemById(req.params.id);
    res.json(item);
}));
/**
 * @route PUT /api/inventory/:id
 * @desc Update inventory item
 * @access Private (Manager, Admin)
 */
router.put('/:id', (0, auth_1.authorize)(['MANAGER', 'ADMIN']), (0, validation_1.validateRequest)(schemas_1.updateInventoryItemSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const item = await inventoryService.updateItem(req.params.id, req.body, req.user.id);
    res.json(item);
}));
/**
 * @route DELETE /api/inventory/:id
 * @desc Delete inventory item
 * @access Private (Admin)
 */
router.delete('/:id', (0, auth_1.authorize)(['ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await inventoryService.deleteItem(req.params.id, req.user.id);
    res.json(result);
}));
/**
 * @route GET /api/inventory/stats/categories
 * @desc Get inventory statistics by category
 * @access Private
 */
router.get('/stats/categories', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await inventoryService.getItemsByCategory();
    res.json(stats);
}));
/**
 * @route GET /api/inventory/stats/status
 * @desc Get inventory statistics by status
 * @access Private
 */
router.get('/stats/status', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await inventoryService.getItemsByStatus();
    res.json(stats);
}));
/**
 * @route GET /api/inventory/stats/value
 * @desc Get total inventory value
 * @access Private (Manager, Admin)
 */
router.get('/stats/value', (0, auth_1.authorize)(['MANAGER', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const value = await inventoryService.getInventoryValue();
    res.json(value);
}));
/**
 * @route GET /api/inventory/low-stock
 * @desc Get low stock items
 * @access Private (Manager, Admin)
 */
router.get('/low-stock', (0, auth_1.authorize)(['MANAGER', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const threshold = parseInt(req.query.threshold);
    const items = await inventoryService.getLowStockItems(threshold);
    res.json(items);
}));
/**
 * @route GET /api/inventory/search
 * @desc Search inventory items
 * @access Private
 */
router.get('/search', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 10;
    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }
    const items = await inventoryService.searchItems(query, limit);
    res.json(items);
}));
/**
 * @route PATCH /api/inventory/bulk-status
 * @desc Bulk update item status
 * @access Private (Manager, Admin)
 */
router.patch('/bulk-status', (0, auth_1.authorize)(['MANAGER', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { itemIds, status } = req.body;
    if (!itemIds || !Array.isArray(itemIds) || !status) {
        return res.status(400).json({ message: 'Item IDs and status are required' });
    }
    const result = await inventoryService.bulkUpdateStatus(itemIds, status, req.user.id);
    res.json(result);
}));
//# sourceMappingURL=inventory.js.map