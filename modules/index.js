/**
 * Module registration script
 * This script loads and registers all available modules
 */

// Import module registry
const { initializeModuleRegistry } = require('../core/module-registry');

/**
 * Register all available modules
 */
function registerAllModules() {
  console.log('Registering all modules...');
  const moduleRegistry = initializeModuleRegistry();
  
  try {
    // Import and register the inventory module
    const inventoryModule = require('./inventory');
    inventoryModule.register(moduleRegistry);
    
    // Import and register the warehouse module
    const warehouseModule = require('./warehouse');
    warehouseModule.register(moduleRegistry);
    
    // Import and register the requests module
    const requestsModule = require('./requests');
    requestsModule.register(moduleRegistry);
    
    // Import and register the service management module
    const serviceModule = require('./service-management');
    serviceModule.register(moduleRegistry);
    
    // Import and register the analytics module if available
    try {
      const analyticsModule = require('./analytics');
      analyticsModule.register(moduleRegistry);
    } catch (e) {
      console.log('Analytics module not available or not yet implemented');
    }
    
    console.log('All modules registered successfully');
    return moduleRegistry;
  } catch (error) {
    console.error('Error registering modules:', error);
    throw error;
  }
}

module.exports = {
  registerAllModules
};
