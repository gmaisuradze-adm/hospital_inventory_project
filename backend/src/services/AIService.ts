import { prisma } from '../utils/database';
import { createError } from '../middleware/errorHandler';
import { AuditService } from './AuditService';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '../utils/logger';

interface ForecastRequest {
  itemId: string;
  forecastHorizon: number;
  modelType?: string;
  userId: string;
}

interface OptimizationRequest {
  itemId?: string;
  items?: string[]; // Allow optimizing for multiple items
  serviceLevel: number;
  holdingCostRate: number;
  orderingCost: number;
  userId: string;
  // Potentially add other parameters like lead time, demand variability if not derived by AI
}

interface AIRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  optimalOrderQuantity: number;
  reorderPoint: number;
  safetyStock: number;
  forecastAccuracy: number;
  abcCategory: string;
  recommendations: string[];
  lastUpdated: Date;
}

export class AIService {
  private auditService = new AuditService();
  private aiModulePath = path.join(__dirname, '..', '..', '..', 'ai-module');
  // Prioritize python3 from PATH, then /usr/bin/python3, then PYTHON_PATH
  private pythonPath = 'python3'; // Default to python3 (from PATH)

  constructor() {
    // Check if 'python3' is accessible, then try '/usr/bin/python3', then process.env.PYTHON_PATH
    this.initializePythonPath();
  }

  private async initializePythonPath() {
    try {
      // Check if 'python3' command works (more robust than just fs.access)
      // This is a simplified check; a more robust check might involve spawn('python3', ['--version'])
      // For now, we assume if it doesn't throw immediately, it might be found in PATH.
      // A proper check would be to use child_process.spawnSync or similar.
      // However, for the purpose of this tool, we'll set it and let it try.
      // The EACCES error suggests the issue is more about the *specific path* /usr/local/python/current
      // rather than python3 not being available at all.
      this.pythonPath = 'python3'; // Default assumption
      logger.info('Attempting to use "python3" from PATH for AI module.');
      
      // Fallback logic if needed, checking specific paths like /usr/bin/python3
      // For now, the EACCES on /usr/local/python/current is the main concern.
      // If 'python3' from PATH fails, the spawn error will indicate it.
      // The previous attempt to use fs.access for /usr/bin/python3 was okay,
      // but the EACCES error points to a different configured path.
      // Let's ensure PYTHON_PATH is the last resort.
      if (process.env.PYTHON_PATH) {
        // Simple check if python3 from PATH might fail, then consider PYTHON_PATH
        // This is tricky without actually trying to spawn.
        // The core issue seems to be the hardcoded or env-set /usr/local/python/current
        // rather than a problem with python3 itself.
      }

    } catch (error) {
      logger.warn('Failed to verify "python3" directly, will rely on system PATH or PYTHON_PATH if set.');
    }
    // Override with PYTHON_PATH if it's set and different from the default 'python3'
    // and if the default 'python3' check was problematic (which is hard to check here without async)
    // The main goal is to avoid /usr/local/python/current if it's causing EACCES.
    // Let's simplify: prioritize 'python3', then '/usr/bin/python3', then ENV.
    
    const potentialPaths = ['python3', '/usr/bin/python3'];
    if (process.env.PYTHON_PATH) {
      potentialPaths.push(process.env.PYTHON_PATH);
    }

    // This check is synchronous, which is not ideal for file system checks.
    // The previous fs.access().catch() was better.
    // Given the EACCES on a specific path, let's try to make the selection more robust.
    // The issue is likely that PYTHON_PATH is set to /usr/local/python/current.
    // We want to avoid that if it's causing EACCES.

    // Revised strategy:
    // 1. Try 'python3' (from PATH). This is often the most flexible.
    // 2. If PYTHON_PATH is set AND it's NOT /usr/local/python/current (the problematic one), try it.
    // 3. Try '/usr/bin/python3'.
    // 4. As a last resort, if PYTHON_PATH is /usr/local/python/current, log a warning.

    let determinedPath = 'python3'; // Default
    logger.info('Initializing Python path for AI Service...');

    if (process.env.PYTHON_PATH && process.env.PYTHON_PATH !== '/usr/local/python/current') {
      determinedPath = process.env.PYTHON_PATH;
      logger.info(`Using PYTHON_PATH: ${determinedPath}`);
    } else if (process.env.PYTHON_PATH === '/usr/local/python/current') {
      logger.warn(`PYTHON_PATH is set to problematic path /usr/local/python/current. Attempting to use 'python3' from PATH instead.`);
      // Keep determinedPath as 'python3'
    }
    // A check for /usr/bin/python3 could be added here if 'python3' and non-problematic PYTHON_PATH are not preferred.
    // For now, 'python3' from PATH is the primary, with a fallback to a non-problematic PYTHON_PATH.
    
    this.pythonPath = determinedPath;
    logger.info(`Final Python path for AI module: ${this.pythonPath}`);
  }


  /**
   * Generate demand forecast for inventory items
   */
  async generateDemandForecast(request: ForecastRequest) {
    try {
      // Get item data from database
      const item = await prisma.inventoryItem.findUnique({
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
        throw createError('Item not found', 404);
      }

      // Check if we have enough historical data
      if (item.requests.length < 30) {
        throw createError('Insufficient historical data for forecasting', 400);
      }

      // Prepare data for Python AI module
      const historicalData = item.requests
        .filter(req => req.status === 'APPROVED')
        .map(req => ({
          date: req.createdAt.toISOString().split('T')[0],
          quantity: req.quantity // This assumes 'quantity' exists on 'requests'
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
          forecastResult: forecastResult // Storing a summary or key metrics
        }
      });

      return forecastResult;
    } catch (error: any) {
      logger.error(`Error generating demand forecast for item ${request.itemId}: ${error.message}`);
      if (error.isCustomError) throw error;
      throw createError('Failed to generate demand forecast', 500, error.message);
    }
  }

  /**
   * Generate inventory optimization recommendations
   */
  async generateInventoryOptimization(request: OptimizationRequest) {
    try {
      let itemsData: any[] = [];

      if (request.itemId) {
        const item = await this.getItemDataForAI(request.itemId);
        if (item) itemsData.push(item);
      } else if (request.items && request.items.length > 0) {
        for (const itemId of request.items) {
          const item = await this.getItemDataForAI(itemId);
          if (item) itemsData.push(item);
        }
      }

      if (itemsData.length === 0) {
        throw createError('No valid items found for optimization', 404);
      }

      // Prepare data for Python AI module
      // This will likely involve sending current stock, demand forecast (or historical data for AI to forecast),
      // lead times, costs, etc. for each item.
      const aiInput = {
        items_data: itemsData.map(item => ({
          item_id: item.id,
          item_name: item.name,
          current_stock: item.quantity, // Assuming item.quantity is current stock
          historical_demand: item.historicalData, // Reusing historical data structure
          // Potentially add lead_time, unit_cost if available directly on item or related models
        })),
        service_level: request.serviceLevel,
        holding_cost_rate: request.holdingCostRate,
        ordering_cost: request.orderingCost,
        // Potentially other global parameters
      };

      // Call Python AI module with 'optimize' command
      const optimizationResult = await this.callPythonAI('optimize', aiInput);

      // Store optimization results/recommendations in database
      // This might involve updating AIRecommendation table or similar
      await this.storeOptimizationResults(optimizationResult, request.userId);

      // Create audit log
      await this.auditService.createLog({
        action: 'AI_OPTIMIZATION_GENERATED',
        entityType: 'INVENTORY_OPTIMIZATION', // Or per item if granular
        entityId: request.itemId || request.items?.join(',') || 'multiple_items',
        userId: request.userId,
        newValues: {
          serviceLevel: request.serviceLevel,
          optimizationParams: { items: request.items, itemId: request.itemId },
          optimizationResult: optimizationResult // Storing a summary or key metrics
        }
      });

      return optimizationResult;
    } catch (error: any) {
      logger.error(`Error generating inventory optimization: ${error.message}`);
      if (error.isCustomError) throw error;
      throw createError('Failed to generate inventory optimization', 500, error.message);
    }
  }

  /**
   * Helper to get item data along with historical demand
   */
  private async getItemDataForAI(itemId: string) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        requests: { // This should be the 'requests' relation on InventoryItem
          orderBy: { createdAt: 'desc' },
          take: 365, 
          select: {
            quantity: true, // This assumes 'quantity' exists on the related Request model
            createdAt: true,
            status: true
          }
        }
      }
    });

    if (!item) return null;

    const historicalData = item.requests
      .filter(req => req.status === 'APPROVED')
      .map(req => ({
        date: req.createdAt.toISOString().split('T')[0],
        quantity: req.quantity
      }));
    
    return { ...item, historicalData };
  }

  /**
   * Optimize inventory levels for items
   */
  async optimizeInventoryLevels(request: OptimizationRequest) {
    try {
      const itemIds = request.itemId ? [request.itemId] : request.items || [];
      
      if (itemIds.length === 0) {
        throw createError('No items specified for optimization', 400);
      }

      // Get items data from database
      const items = await prisma.inventoryItem.findMany({
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
        throw createError('No valid items found', 404);
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

    } catch (error) {
      logger.error('Error optimizing inventory levels:', error);
      throw createError('Failed to optimize inventory levels', 500);
    }
  }

  /**
   * Get AI recommendations for a specific item
   */
  async getItemRecommendations(itemId: string): Promise<AIRecommendation | null> {
    try {
      // Check if we have recent recommendations
      const existingRec = await prisma.aIRecommendation.findUnique({
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

    } catch (error) {
      logger.error('Error getting item recommendations:', error);
      return null;
    }
  }

  /**
   * Analyze demand patterns across all items
   */
  async analyzeDemandPatterns() {
    try {
      // Get aggregated demand data
      const demandData = await prisma.iTRequest.groupBy({
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

    } catch (error) {
      logger.error('Error analyzing demand patterns:', error);
      throw createError('Failed to analyze demand patterns', 500);
    }
  }

  /**
   * Analyze inventory performance metrics
   */
  async analyzeInventoryPerformance() {
    try {
      // Get inventory metrics
      const items = await prisma.inventoryItem.findMany({
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

    } catch (error) {
      logger.error('Error analyzing inventory performance:', error);
      throw createError('Failed to analyze inventory performance', 500);
    }
  }

  /**
   * Retrain AI models with latest data
   */
  async retrainModels(userId: string) {
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

    } catch (error) {
      logger.error('Error retraining models:', error);
      throw createError('Failed to retrain models', 500);
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

    } catch (error) {
      logger.error('Error getting model performance:', error);
      throw createError('Failed to get model performance', 500);
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
      const recentRecommendations = await prisma.aIRecommendation.count({
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

    } catch (error) {
      logger.error('AI health check failed:', error);
      return {
        aiModuleStatus: 'unhealthy',
        databaseConnectivity: 'unknown',
        recentRecommendations: 0,
        lastHealthCheck: new Date(),
        error: (error as Error).message
      };
    }
  }

  /**
   * Call Python AI module with given action and data
   */
  private async callPythonAI(action: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const scriptPath = path.join(this.aiModulePath, 'integration_bridge.py');
        const pythonProcess = spawn(this.pythonPath, [scriptPath, action]);
        
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
            } catch (parseError) {
              reject(new Error(`Failed to parse AI module response: ${(parseError as Error).message}`));
            }
          } else {
            reject(new Error(`AI module exited with code ${code}: ${stderr}`));
          }
        });

        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to start AI module: ${error.message}`));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Store forecast results in database
   */
  private async storeForecastResults(itemId: string, forecastResult: any, userId: string) {
    // Implementation would store forecast results in a dedicated table
    // For now, we'll just log the action
    logger.info(`Storing forecast results for item ${itemId}`);
  }

  /**
   * Store optimization results in the database
   */
  private async storeOptimizationResults(optimizationResult: any, userId: string) {
    // Example: Storing in AIRecommendation model
    // This will depend heavily on the structure of optimizationResult and your Prisma schema
    if (optimizationResult.recommendations && Array.isArray(optimizationResult.recommendations)) {
      for (const rec of optimizationResult.recommendations) {
        // Assuming rec contains itemId, optimalOrderQuantity, reorderPoint, etc.
        // And that AIRecommendation model is set up to store this
        await prisma.aIRecommendation.upsert({
          where: { itemId: rec.itemId }, 
          update: {
            itemName: rec.itemName,
            optimalOrderQuantity: rec.optimalOrderQuantity,
            reorderPoint: rec.reorderPoint,
            safetyStock: rec.safetyStock,
            // forecastAccuracy: rec.forecastAccuracy, // If provided by optimization output
            // abcCategory: rec.abcCategory, // If provided
            recommendations: rec.detailedRecommendations || ['Optimization parameters updated'],
            lastUpdated: new Date(),
            modelVersion: optimizationResult.modelVersion, // Assuming this is part of the response
            // createdBy: userId, // If tracking who initiated the AI run that led to this update
            // updatedBy: userId,
          },
          create: {
            itemId: rec.itemId,
            itemName: rec.itemName,
            currentStock: rec.currentStock || 0, // Need to fetch or pass current stock
            optimalOrderQuantity: rec.optimalOrderQuantity,
            reorderPoint: rec.reorderPoint,
            safetyStock: rec.safetyStock,
            forecastAccuracy: rec.forecastAccuracy || 0,
            abcCategory: rec.abcCategory || 'N/A',
            recommendations: rec.detailedRecommendations || ['Initial optimization parameters set'],
            lastUpdated: new Date(),
            modelVersion: optimizationResult.modelVersion,
            // createdBy: userId,
            // userId: userId // if AIRecommendation has a direct link to user
          }
        });
      }
    }
    logger.info('Stored/Updated AI optimization recommendations in database.');
  }

  /**
   * Calculate annual demand from request history
   */
  private calculateAnnualDemand(requests: any[]): number {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    const recentRequests = requests.filter(req => 
      new Date(req.createdAt) > oneYearAgo
    );

    return recentRequests.reduce((sum, req) => sum + req.quantity, 0);
  }
}
