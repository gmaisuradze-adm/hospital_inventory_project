const routes = require('./routes');
const { EventTypes } = require('../../core/events');
const configManager = require('../../core/config');

// Default module configuration
const defaultConfig = {
  enableLowStockAlerts: true,
  lowStockThresholdPercent: 20,
  enableStockExpiryTracking: false,
  enableAutomaticReordering: false,
  stockMovementHistoryRetentionDays: 365
};

/**
 * Register the warehouse module with the system
 * @param {ModuleRegistry} moduleRegistry - The module registry
 */
function register(moduleRegistry) {
  // Load or initialize module config
  let moduleConfig = configManager.loadModuleConfig('warehouse');
  
  if (Object.keys(moduleConfig).length === 0) {
    configManager.saveModuleConfig('warehouse', defaultConfig);
    moduleConfig = defaultConfig;
  }
  
  // Register the module
  moduleRegistry.registerModule({
    name: 'warehouse',
    displayName: 'Warehouse Management',
    description: 'Manages inventory warehouse storage and stock movements',
    version: '1.0.0',
    enabled: true,
    
    // Register module routes
    routes: (app) => {
      app.use('/api/warehouse', routes);
      console.log('Warehouse module routes registered');
    },
    
    // Initialize module
    initialize: () => {
      console.log('Warehouse module initialized');
      
      // Register event listeners for low stock alerts
      if (moduleConfig.enableLowStockAlerts) {
        const eventSystem = require('../../core/events').setupEventSystem();
        
        // Listen for stock updates to check for low stock
        eventSystem.on(EventTypes.STOCK_UPDATED, async (data) => {
          try {
            const { Inventory, Item } = require('./models');
            const inventory = await Inventory.findByPk(data.inventoryId, {
              include: [{ model: Item }]
            });
            
            if (inventory && inventory.item) {
              const { quantity } = inventory;
              const { reorderPoint } = inventory.item;
              
              // Check if stock is at or below reorder point
              if (quantity <= reorderPoint) {
                console.log(`Low stock alert: ${inventory.item.name} (${inventory.item.sku}) - Quantity: ${quantity}, Reorder Point: ${reorderPoint}`);
                
                // Emit low stock event
                eventSystem.emit('warehouse:stock:low', {
                  inventoryId: inventory.id,
                  itemId: inventory.itemId,
                  itemName: inventory.item.name,
                  sku: inventory.item.sku,
                  currentQuantity: quantity,
                  reorderPoint: reorderPoint
                });
              }
            }
          } catch (err) {
            console.error('Error processing low stock alert:', err);
          }
        }, 'warehouse-low-stock');
      }
      
      return Promise.resolve();
    }
  });
  
  console.log('Warehouse module registered');
}

module.exports = {
  register
};
