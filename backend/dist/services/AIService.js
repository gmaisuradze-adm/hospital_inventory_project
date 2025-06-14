"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const database_1 = require("../utils/database");
const errorHandler_1 = require("../middleware/errorHandler");
const AuditService_1 = require("./AuditService");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
class AIService {
    constructor() {
        this.auditService = new AuditService_1.AuditService();
        this.aiModulePath = path.join(__dirname, '..', '..', '..', 'ai-module');
        this.pythonPath = process.env.PYTHON_PATH || 'python3';
    }
    /**
     * Generate demand forecast for inventory items
     */
    async generateDemandForecast(request) {
        try {
            // Get item data from database
            const item = await database_1.prisma.inventoryItem.findUnique({
                where: { id: request.itemId },
                include: {
                    requests: {
                        orderBy: { createdAt: 'desc' },
                        take: 365, // Last year of data
                        select: {
                            quantity: true,
                            createdAt: true,
                            status: true
                        }
                    }
                }
            });
            if (!item) {
                throw (0, errorHandler_1.createError)('Item not found', 404);
            }
            // Check if we have enough historical data
            if (item.requests.length < 30) {
                throw (0, errorHandler_1.createError)('Insufficient historical data for forecasting', 400);
            }
            // Prepare data for Python AI module
            const historicalData = item.requests
                .filter(req => req.status === 'APPROVED')
                .map(req => ({
                date: req.createdAt.toISOString().split('T')[0],
                quantity: req.quantity
            }));
            // Call Python AI module
            const forecastResult = await this.callPythonAI('forecast', {
                item_id: request.itemId,
                item_name: item.name,
                historical_data: historicalData,
                forecast_horizon: request.forecastHorizon,
                model_type: request.modelType || 'auto'
            });
            // Store forecast results in database
            await this.storeForecastResults(request.itemId, forecastResult, request.userId);
            // Create audit log
            await this.auditService.createLog({
                action: 'AI_FORECAST_GENERATED',
                entityType: 'INVENTORY_ITEM',
                entityId: request.itemId,
                userId: request.userId,
                newValues: {
                    forecastHorizon: request.forecastHorizon,
                    modelType: request.modelType,
                    accuracy: forecastResult.accuracy
                }
            });
            return {
                itemId: request.itemId,
                itemName: item.name,
                forecast: forecastResult.predictions,
                modelUsed: forecastResult.model_used,
                accuracy: forecastResult.accuracy,
                confidenceIntervals: forecastResult.confidence_intervals,
                forecastHorizon: request.forecastHorizon,
                generatedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating demand forecast:', error);
            throw (0, errorHandler_1.createError)('Failed to generate demand forecast', 500);
        }
    }
    /**
     * Optimize inventory levels for items
     */
    async optimizeInventoryLevels(request) {
        try {
            const itemIds = request.itemId ? [request.itemId] : request.items || [];
            if (itemIds.length === 0) {
                throw (0, errorHandler_1.createError)('No items specified for optimization', 400);
            }
            // Get items data from database
            const items = await database_1.prisma.inventoryItem.findMany({
                where: { id: { in: itemIds } },
                include: {
                    requests: {
                        where: { status: 'APPROVED' },
                        orderBy: { createdAt: 'desc' },
                        take: 365,
                        select: {
                            quantity: true,
                            createdAt: true
                        }
                    }
                }
            });
            if (items.length === 0) {
                throw (0, errorHandler_1.createError)('No valid items found', 404);
            }
            // Prepare data for optimization
            const itemsData = items.map(item => ({
                item_id: item.id,
                item_name: item.name,
                category: item.category,
                unit_cost: item.cost || 0,
                current_stock: item.quantity,
                lead_time_days: 7, // Default lead time, could be made configurable
                annual_demand: this.calculateAnnualDemand(item.requests),
                supplier: item.manufacturer || 'Unknown'
            }));
            // Call Python AI module for optimization
            const optimizationResult = await this.callPythonAI('optimize', {
                items_data: itemsData,
                service_level: request.serviceLevel,
                holding_cost_rate: request.holdingCostRate,
                ordering_cost: request.orderingCost
            });
            // Store optimization results
            await this.storeOptimizationResults(optimizationResult, request.userId);
            // Create audit log
            await this.auditService.createLog({
                action: 'AI_OPTIMIZATION_PERFORMED',
                entityType: 'INVENTORY_OPTIMIZATION',
                entityId: itemIds.join(','),
                userId: request.userId,
                newValues: {
                    itemCount: items.length,
                    serviceLevel: request.serviceLevel,
                    totalPotentialSavings: optimizationResult.potential_savings
                }
            });
            return {
                optimizedItems: optimizationResult.optimized_items,
                businessImpact: optimizationResult.business_impact,
                recommendations: optimizationResult.recommendations,
                optimizedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error optimizing inventory levels:', error);
            throw (0, errorHandler_1.createError)('Failed to optimize inventory levels', 500);
        }
    }
    /**
     * Get AI recommendations for a specific item
     */
    async getItemRecommendations(itemId) {
        try {
            // Check if we have recent recommendations
            const existingRec = await database_1.prisma.aIRecommendation.findUnique({
                where: { itemId },
                include: { item: true }
            });
            // If recommendations are fresh (less than 24 hours old), return them
            if (existingRec && existingRec.updatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
                return {
                    itemId: existingRec.itemId,
                    itemName: existingRec.item.name,
                    currentStock: existingRec.item.quantity,
                    optimalOrderQuantity: existingRec.optimalOrderQuantity,
                    reorderPoint: existingRec.reorderPoint,
                    safetyStock: existingRec.safetyStock,
                    forecastAccuracy: existingRec.forecastAccuracy,
                    abcCategory: existingRec.abcCategory,
                    recommendations: existingRec.recommendations,
                    lastUpdated: existingRec.updatedAt
                };
            }
            // Generate fresh recommendations
            const forecast = await this.generateDemandForecast({
                itemId,
                forecastHorizon: 30,
                userId: 'system'
            });
            const optimization = await this.optimizeInventoryLevels({
                itemId,
                serviceLevel: 0.95,
                holdingCostRate: 0.25,
                orderingCost: 150,
                userId: 'system'
            });
            // Return the first (and only) optimized item
            const optimizedItem = optimization.optimizedItems[0];
            if (optimizedItem) {
                return {
                    itemId: optimizedItem.itemId,
                    itemName: optimizedItem.itemName,
                    currentStock: optimizedItem.currentStock,
                    optimalOrderQuantity: optimizedItem.optimalOrderQuantity,
                    reorderPoint: optimizedItem.reorderPoint,
                    safetyStock: optimizedItem.safetyStock,
                    forecastAccuracy: forecast.accuracy,
                    abcCategory: optimizedItem.abcCategory,
                    recommendations: optimizedItem.recommendations,
                    lastUpdated: new Date()
                };
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error getting item recommendations:', error);
            return null;
        }
    }
    /**
     * Analyze demand patterns across all items
     */
    async analyzeDemandPatterns() {
        try {
            // Get aggregated demand data
            const demandData = await database_1.prisma.iTRequest.groupBy({
                by: ['itemId', 'createdAt'],
                where: {
                    status: 'APPROVED',
                    createdAt: {
                        gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
                    }
                },
                _sum: {
                    quantity: true
                }
            });
            // Call Python AI module for pattern analysis
            const patternsResult = await this.callPythonAI('analyze_patterns', {
                demand_data: demandData
            });
            return patternsResult;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing demand patterns:', error);
            throw (0, errorHandler_1.createError)('Failed to analyze demand patterns', 500);
        }
    }
    /**
     * Analyze inventory performance metrics
     */
    async analyzeInventoryPerformance() {
        try {
            // Get inventory metrics
            const items = await database_1.prisma.inventoryItem.findMany({
                include: {
                    requests: {
                        where: { status: 'APPROVED' },
                        orderBy: { createdAt: 'desc' },
                        take: 365
                    }
                }
            });
            // Calculate performance metrics
            const performance = items.map(item => {
                const totalDemand = item.requests.reduce((sum, req) => sum + req.quantity, 0);
                const averageMonthlyDemand = totalDemand / 12;
                const turnoverRate = item.cost ? (totalDemand * (item.cost || 0)) / ((item.quantity * (item.cost || 0)) || 1) : 0;
                return {
                    itemId: item.id,
                    itemName: item.name,
                    category: item.category,
                    currentStock: item.quantity,
                    totalAnnualDemand: totalDemand,
                    averageMonthlyDemand,
                    turnoverRate,
                    stockValue: item.quantity * (item.cost || 0),
                    lastRequestDate: item.requests[0]?.createdAt || null
                };
            });
            return {
                totalItems: items.length,
                totalStockValue: performance.reduce((sum, item) => sum + item.stockValue, 0),
                averageTurnoverRate: performance.reduce((sum, item) => sum + item.turnoverRate, 0) / performance.length,
                itemPerformance: performance.sort((a, b) => b.turnoverRate - a.turnoverRate)
            };
        }
        catch (error) {
            logger_1.logger.error('Error analyzing inventory performance:', error);
            throw (0, errorHandler_1.createError)('Failed to analyze inventory performance', 500);
        }
    }
    /**
     * Retrain AI models with latest data
     */
    async retrainModels(userId) {
        try {
            // Call Python AI module for model retraining
            const retrainResult = await this.callPythonAI('retrain', {
                include_all_data: true,
                update_existing_models: true
            });
            // Create audit log
            await this.auditService.createLog({
                action: 'AI_MODELS_RETRAINED',
                entityType: 'AI_MODEL',
                entityId: 'all',
                userId,
                newValues: {
                    modelsRetrained: retrainResult.models_updated,
                    dataPointsUsed: retrainResult.data_points,
                    trainingTime: retrainResult.training_time
                }
            });
            return retrainResult;
        }
        catch (error) {
            logger_1.logger.error('Error retraining models:', error);
            throw (0, errorHandler_1.createError)('Failed to retrain models', 500);
        }
    }
    /**
     * Get AI model performance metrics
     */
    async getModelPerformance() {
        try {
            // Call Python AI module for performance metrics
            const performanceResult = await this.callPythonAI('get_performance', {});
            return performanceResult;
        }
        catch (error) {
            logger_1.logger.error('Error getting model performance:', error);
            throw (0, errorHandler_1.createError)('Failed to get model performance', 500);
        }
    }
    /**
     * Check AI service health
     */
    async checkHealth() {
        try {
            // Check if Python AI module is accessible
            const healthResult = await this.callPythonAI('health_check', {});
            // Check database connectivity for AI tables
            const recentRecommendations = await database_1.prisma.aIRecommendation.count({
                where: {
                    updatedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
                    }
                }
            });
            return {
                aiModuleStatus: healthResult.status,
                databaseConnectivity: 'healthy',
                recentRecommendations,
                lastHealthCheck: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('AI health check failed:', error);
            return {
                aiModuleStatus: 'unhealthy',
                databaseConnectivity: 'unknown',
                recentRecommendations: 0,
                lastHealthCheck: new Date(),
                error: error.message
            };
        }
    }
    /**
     * Call Python AI module with given action and data
     */
    async callPythonAI(action, data) {
        return new Promise((resolve, reject) => {
            try {
                const scriptPath = path.join(this.aiModulePath, 'integration_bridge.py');
                const pythonProcess = (0, child_process_1.spawn)(this.pythonPath, [scriptPath, action]);
                let stdout = '';
                let stderr = '';
                // Send data to Python process
                pythonProcess.stdin.write(JSON.stringify(data));
                pythonProcess.stdin.end();
                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                pythonProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                pythonProcess.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const result = JSON.parse(stdout);
                            resolve(result);
                        }
                        catch (parseError) {
                            reject(new Error(`Failed to parse AI module response: ${parseError.message}`));
                        }
                    }
                    else {
                        reject(new Error(`AI module exited with code ${code}: ${stderr}`));
                    }
                });
                pythonProcess.on('error', (error) => {
                    reject(new Error(`Failed to start AI module: ${error.message}`));
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Store forecast results in database
     */
    async storeForecastResults(itemId, forecastResult, userId) {
        // Implementation would store forecast results in a dedicated table
        // For now, we'll just log the action
        logger_1.logger.info(`Storing forecast results for item ${itemId}`);
    }
    /**
     * Store optimization results in database
     */
    async storeOptimizationResults(optimizationResult, userId) {
        try {
            // Store or update recommendations for each optimized item
            for (const item of optimizationResult.optimized_items) {
                await database_1.prisma.aIRecommendation.upsert({
                    where: { itemId: item.itemId },
                    update: {
                        optimalOrderQuantity: item.optimalOrderQuantity,
                        reorderPoint: item.reorderPoint,
                        safetyStock: item.safetyStock,
                        forecastAccuracy: item.forecastAccuracy || 0.85,
                        abcCategory: item.abcCategory,
                        recommendations: item.recommendations,
                        updatedAt: new Date()
                    },
                    create: {
                        itemId: item.itemId,
                        optimalOrderQuantity: item.optimalOrderQuantity,
                        reorderPoint: item.reorderPoint,
                        safetyStock: item.safetyStock,
                        forecastAccuracy: item.forecastAccuracy || 0.85,
                        abcCategory: item.abcCategory,
                        recommendations: item.recommendations
                    }
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error storing optimization results:', error);
        }
    }
    /**
     * Calculate annual demand from request history
     */
    calculateAnnualDemand(requests) {
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const recentRequests = requests.filter(req => new Date(req.createdAt) > oneYearAgo);
        return recentRequests.reduce((sum, req) => sum + req.quantity, 0);
    }
}
exports.AIService = AIService;
//# sourceMappingURL=AIService.js.map