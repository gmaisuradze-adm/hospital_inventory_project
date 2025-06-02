// Module Registry System
const path = require('path');
const fs = require('fs');

class ModuleRegistry {
  constructor() {
    this.modules = {};
  }

  /**
   * Register a module with the system
   * @param {string} name - Module name
   * @param {Object} module - Module definition
   */
  registerModule(name, module) {
    if (this.modules[name]) {
      throw new Error(`Module ${name} is already registered`);
    }
    
    this.modules[name] = {
      ...module,
      name,
      enabled: true
    };
    
    console.log(`Module ${name} registered successfully`);
    return this.modules[name];
  }

  /**
   * Get a registered module
   * @param {string} name - Module name
   */
  getModule(name) {
    return this.modules[name];
  }

  /**
   * Get all registered modules
   */
  getAllModules() {
    return Object.values(this.modules);
  }

  /**
   * Enable a module
   * @param {string} name - Module name
   */
  enableModule(name) {
    if (!this.modules[name]) {
      throw new Error(`Module ${name} is not registered`);
    }
    this.modules[name].enabled = true;
  }

  /**
   * Disable a module
   * @param {string} name - Module name
   */
  disableModule(name) {
    if (!this.modules[name]) {
      throw new Error(`Module ${name} is not registered`);
    }
    this.modules[name].enabled = false;
  }

  /**
   * Auto-discover modules from the modules directory
   */
  discoverModules() {
    const modulesDir = path.join(__dirname, '../../modules');
    
    try {
      const items = fs.readdirSync(modulesDir, { withFileTypes: true });
      
      // Filter for directories only
      const moduleFolders = items.filter(item => item.isDirectory());
      
      for (const folder of moduleFolders) {
        const moduleName = folder.name;
        const modulePath = path.join(modulesDir, moduleName);
        
        // Check if module has an index.js file
        const indexPath = path.join(modulePath, 'index.js');
        if (fs.existsSync(indexPath)) {
          try {
            // Import the module
            const moduleDefinition = require(indexPath);
            this.registerModule(moduleName, moduleDefinition);
          } catch (err) {
            console.error(`Error loading module ${moduleName}:`, err);
          }
        }
      }
      
      console.log(`Discovered ${Object.keys(this.modules).length} modules`);
    } catch (err) {
      console.error('Error discovering modules:', err);
    }
  }
}

// Singleton instance
let registry;

/**
 * Initialize the module registry
 */
function initializeModuleRegistry() {
  if (!registry) {
    registry = new ModuleRegistry();
  }
  return registry;
}

module.exports = {
  initializeModuleRegistry
};
