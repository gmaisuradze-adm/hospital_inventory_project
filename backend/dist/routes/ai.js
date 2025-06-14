"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
const AIService_1 = require("../services/AIService");
const router = (0, express_1.Router)();
const aiService = new AIService_1.AIService();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Schema for demand forecasting request
const forecastRequestSchema = zod_1.z.object({
    itemId: zod_1.z.string(),
    forecastHorizon: zod_1.z.number().min(1).max(365).default(30),
    modelType: zod_1.z.enum(['arima', 'prophet', 'lstm', 'random_forest', 'ensemble']).optional()
});
// Schema for inventory optimization request
const optimizeRequestSchema = zod_1.z.object({
    itemId: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.string()).optional(),
    serviceLevel: zod_1.z.number().min(0.1).max(1.0).default(0.95),
    holdingCostRate: zod_1.z.number().min(0.01).max(1.0).default(0.25),
    orderingCost: zod_1.z.number().min(0).default(150)
}).refine(data => data.itemId || (data.items && data.items.length > 0), {
    message: 'Either itemId or items array must be provided'
});
/**
 * @route POST /api/ai/forecast
 * @desc Generate demand forecast for inventory items
 * @access Private (Admin/Manager only)
 */
router.post('/forecast', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), (0, validation_1.validateRequest)(forecastRequestSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { itemId, forecastHorizon, modelType } = req.body;
    const forecast = await aiService.generateDemandForecast({
        itemId,
        forecastHorizon,
        modelType,
        userId: req.user.id
    });
    res.json({
        success: true,
        data: forecast,
        message: 'Demand forecast generated successfully'
    });
}));
/**
 * @route POST /api/ai/optimize
 * @desc Optimize inventory levels for items
 * @access Private (Admin/Manager only)
 */
router.post('/optimize', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), (0, validation_1.validateRequest)(optimizeRequestSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { itemId, items, serviceLevel, holdingCostRate, orderingCost } = req.body;
    const optimization = await aiService.optimizeInventoryLevels({
        itemId,
        items,
        serviceLevel,
        holdingCostRate,
        orderingCost,
        userId: req.user.id
    });
    res.json({
        success: true,
        data: optimization,
        message: 'Inventory optimization completed successfully'
    });
}));
/**
 * @route GET /api/ai/recommendations/:itemId
 * @desc Get AI recommendations for a specific item
 * @access Private
 */
router.get('/recommendations/:itemId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { itemId } = req.params;
    const recommendations = await aiService.getItemRecommendations(itemId);
    res.json({
        success: true,
        data: recommendations
    });
}));
/**
 * @route GET /api/ai/analytics/demand-patterns
 * @desc Get demand pattern analytics
 * @access Private (Admin/Manager only)
 */
router.get('/analytics/demand-patterns', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const patterns = await aiService.analyzeDemandPatterns();
    res.json({
        success: true,
        data: patterns
    });
}));
/**
 * @route GET /api/ai/analytics/inventory-performance
 * @desc Get inventory performance analytics
 * @access Private (Admin/Manager only)
 */
router.get('/analytics/inventory-performance', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const performance = await aiService.analyzeInventoryPerformance();
    res.json({
        success: true,
        data: performance
    });
}));
/**
 * @route POST /api/ai/retrain
 * @desc Retrain AI models with latest data
 * @access Private (Admin only)
 */
router.post('/retrain', (0, auth_1.authorize)(['ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await aiService.retrainModels(req.user.id);
    res.json({
        success: true,
        data: result,
        message: 'Model retraining initiated'
    });
}));
/**
 * @route GET /api/ai/model-performance
 * @desc Get AI model performance metrics
 * @access Private (Admin/Manager only)
 */
router.get('/model-performance', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const performance = await aiService.getModelPerformance();
    res.json({
        success: true,
        data: performance
    });
}));
/**
 * @route GET /api/ai/health
 * @desc Check AI service health
 * @access Private
 */
router.get('/health', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const health = await aiService.checkHealth();
    res.json({
        success: true,
        data: health
    });
}));
exports.default = router;
//# sourceMappingURL=ai.js.map