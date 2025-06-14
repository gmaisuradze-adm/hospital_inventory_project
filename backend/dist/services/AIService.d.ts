interface ForecastRequest {
    itemId: string;
    forecastHorizon: number;
    modelType?: string;
    userId: string;
}
interface OptimizationRequest {
    itemId?: string;
    items?: string[];
    serviceLevel: number;
    holdingCostRate: number;
    orderingCost: number;
    userId: string;
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
export declare class AIService {
    private auditService;
    private aiModulePath;
    private pythonPath;
    /**
     * Generate demand forecast for inventory items
     */
    generateDemandForecast(request: ForecastRequest): Promise<{
        itemId: string;
        itemName: string;
        forecast: any;
        modelUsed: any;
        accuracy: any;
        confidenceIntervals: any;
        forecastHorizon: number;
        generatedAt: Date;
    }>;
    /**
     * Optimize inventory levels for items
     */
    optimizeInventoryLevels(request: OptimizationRequest): Promise<{
        optimizedItems: any;
        businessImpact: any;
        recommendations: any;
        optimizedAt: Date;
    }>;
    /**
     * Get AI recommendations for a specific item
     */
    getItemRecommendations(itemId: string): Promise<AIRecommendation | null>;
    /**
     * Analyze demand patterns across all items
     */
    analyzeDemandPatterns(): Promise<any>;
    /**
     * Analyze inventory performance metrics
     */
    analyzeInventoryPerformance(): Promise<{
        totalItems: number;
        totalStockValue: number;
        averageTurnoverRate: number;
        itemPerformance: {
            itemId: string;
            itemName: string;
            category: string;
            currentStock: number;
            totalAnnualDemand: number;
            averageMonthlyDemand: number;
            turnoverRate: number;
            stockValue: number;
            lastRequestDate: Date;
        }[];
    }>;
    /**
     * Retrain AI models with latest data
     */
    retrainModels(userId: string): Promise<any>;
    /**
     * Get AI model performance metrics
     */
    getModelPerformance(): Promise<any>;
    /**
     * Check AI service health
     */
    checkHealth(): Promise<{
        aiModuleStatus: any;
        databaseConnectivity: string;
        recentRecommendations: number;
        lastHealthCheck: Date;
        error?: undefined;
    } | {
        aiModuleStatus: string;
        databaseConnectivity: string;
        recentRecommendations: number;
        lastHealthCheck: Date;
        error: string;
    }>;
    /**
     * Call Python AI module with given action and data
     */
    private callPythonAI;
    /**
     * Store forecast results in database
     */
    private storeForecastResults;
    /**
     * Store optimization results in database
     */
    private storeOptimizationResults;
    /**
     * Calculate annual demand from request history
     */
    private calculateAnnualDemand;
}
export {};
//# sourceMappingURL=AIService.d.ts.map