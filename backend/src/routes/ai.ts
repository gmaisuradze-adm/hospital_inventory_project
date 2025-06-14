import { Router } from 'express';
import { Response } from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { AIService } from '../services/AIService';

const router = Router();
const aiService = new AIService();

// Apply authentication to all routes
router.use(authenticate);

// Schema for demand forecasting request
const forecastRequestSchema = z.object({
  itemId: z.string(),
  forecastHorizon: z.number().min(1).max(365).default(30),
  modelType: z.enum(['arima', 'prophet', 'lstm', 'random_forest', 'ensemble', 'auto']).optional()
});

// Schema for inventory optimization request
const optimizeRequestSchema = z.object({
  itemId: z.string().optional(),
  items: z.array(z.string()).optional(),
  serviceLevel: z.number().min(0.1).max(1.0).default(0.95),
  holdingCostRate: z.number().min(0.01).max(1.0).default(0.25),
  orderingCost: z.number().min(0).default(150)
}).refine(data => data.itemId || (data.items && data.items.length > 0), {
  message: 'Either itemId or items array must be provided'
});

/**
 * @route POST /api/ai/forecast
 * @desc Generate demand forecast for inventory items
 * @access Private (Admin/Manager only)
 */
router.post('/forecast',
  authorize(['ADMIN', 'MANAGER']),
  validateRequest(forecastRequestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { itemId, forecastHorizon, modelType } = req.body;
    
    const forecast = await aiService.generateDemandForecast({
      itemId,
      forecastHorizon,
      modelType,
      userId: req.user!.id
    });
    
    res.status(200).json(forecast);
  })
);

/**
 * @route POST /api/ai/optimize
 * @desc Generate inventory optimization recommendations
 * @access Private (Admin/Manager only)
 */
router.post('/optimize',
  authorize(['ADMIN', 'MANAGER']),
  validateRequest(optimizeRequestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const optimizationParams = req.body; // Contains itemId or items, serviceLevel, etc.
    
    const recommendations = await aiService.generateInventoryOptimization({
      ...optimizationParams,
      userId: req.user!.id
    });
    
    res.status(200).json(recommendations);
  })
);

/**
 * @route GET /api/ai/recommendations/:itemId
 * @desc Get AI recommendations for a specific item
 * @access Private
 */
router.get('/recommendations/:itemId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { itemId } = req.params;
    
    const recommendations = await aiService.getItemRecommendations(itemId);
    
    res.json({
      success: true,
      data: recommendations
    });
  })
);

/**
 * @route GET /api/ai/analytics/demand-patterns
 * @desc Get demand pattern analytics
 * @access Private (Admin/Manager only)
 */
router.get('/analytics/demand-patterns',
  authorize(['ADMIN', 'MANAGER']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const patterns = await aiService.analyzeDemandPatterns();
    
    res.json({
      success: true,
      data: patterns
    });
  })
);

/**
 * @route GET /api/ai/analytics/inventory-performance
 * @desc Get inventory performance analytics
 * @access Private (Admin/Manager only)
 */
router.get('/analytics/inventory-performance',
  authorize(['ADMIN', 'MANAGER']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const performance = await aiService.analyzeInventoryPerformance();
    
    res.json({
      success: true,
      data: performance
    });
  })
);

/**
 * @route POST /api/ai/retrain
 * @desc Retrain AI models with latest data
 * @access Private (Admin only)
 */
router.post('/retrain',
  authorize(['ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await aiService.retrainModels(req.user!.id);
    
    res.json({
      success: true,
      data: result,
      message: 'Model retraining initiated'
    });
  })
);

/**
 * @route GET /api/ai/model-performance
 * @desc Get AI model performance metrics
 * @access Private (Admin/Manager only)
 */
router.get('/model-performance',
  authorize(['ADMIN', 'MANAGER']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const performance = await aiService.getModelPerformance();
    
    res.json({
      success: true,
      data: performance
    });
  })
);

/**
 * @route GET /api/ai/health
 * @desc Check AI service health
 * @access Private
 */
router.get('/health',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const health = await aiService.checkHealth();
    
    res.json({
      success: true,
      data: health
    });
  })
);

export default router;
