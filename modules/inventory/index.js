const routes = require('./routes');
const { EventTypes } = require('../../core/events');
const configManager = require('../../core/config');

// Default module configuration
const defaultConfig = {
  enableAutoWarrantyAlerts: true,
  warrantyAlertThresholdDays: 30,
  assetTagPrefix: 'ITMS-',
  enableBarcodeScanning: false
};

/**
 * Register the inventory module with the system
 * @param {ModuleRegistry} moduleRegistry - The module registry
 */
function register(moduleRegistry) {
  // Load or initialize module config
  let moduleConfig = configManager.loadModuleConfig('inventory');
  if (Object.keys(moduleConfig).length === 0) {
    configManager.saveModuleConfig('inventory', defaultConfig);
    moduleConfig = defaultConfig;
  }
  
  // Register the module
  moduleRegistry.registerModule({
    name: 'inventory',
    displayName: 'Inventory Management',
    description: 'Manages IT assets and inventory',
    version: '1.0.0',
    enabled: true,
    
    // Register module routes
    routes: (app) => {
      app.use('/api/inventory', routes);
      console.log('Inventory module routes registered');
    },
    
    // Initialize module
    initialize: () => {
      console.log('Inventory module initialized');
      
      // Register event listeners
      moduleRegistry.on(EventTypes.SYSTEM_STARTUP, () => {
        console.log('Inventory module received system startup event');
      }, 'inventory');
      
      return Promise.resolve();
    }
  });
  
  console.log('Inventory module registered');
}

module.exports = {
  register
};