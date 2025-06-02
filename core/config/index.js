const fs = require('fs');
const path = require('path');

/**
 * Configuration management class
 */
class ConfigManager {
  constructor() {
    this.configs = new Map();
    this.defaultConfigsDir = path.join(__dirname, '../../config');
  }

  /**
   * Load configuration for a module
   * @param {string} moduleName - The module name
   * @returns {Object} - The module configuration
   */
  loadModuleConfig(moduleName) {
    // Check if config is already loaded
    if (this.configs.has(moduleName)) {
      return this.configs.get(moduleName);
    }
    
    // First try to load from environment variables
    const envPrefix = `${moduleName.toUpperCase()}_`;
    const envConfig = {};
    
    Object.keys(process.env).forEach(key => {
      if (key.startsWith(envPrefix)) {
        const configKey = key.substring(envPrefix.length).toLowerCase();
        envConfig[configKey] = process.env[key];
      }
    });
    
    // Then try to load from config files
    let fileConfig = {};
    const configPath = path.join(this.defaultConfigsDir, `${moduleName}.json`);
    
    if (fs.existsSync(configPath)) {
      try {
        fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        console.error(`Error loading config file for module ${moduleName}:`, error);
      }
    }
    
    // Merge configs, with env vars taking precedence
    const config = { ...fileConfig, ...envConfig };
    
    // Cache the config
    this.configs.set(moduleName, config);
    
    return config;
  }

  /**
   * Save configuration for a module
   * @param {string} moduleName - The module name
   * @param {Object} config - The module configuration
   */
  saveModuleConfig(moduleName, config) {
    // Update cache
    this.configs.set(moduleName, config);
    
    // Save to file
    if (!fs.existsSync(this.defaultConfigsDir)) {
      fs.mkdirSync(this.defaultConfigsDir, { recursive: true });
    }
    
    const configPath = path.join(this.defaultConfigsDir, `${moduleName}.json`);
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`Configuration saved for module ${moduleName}`);
    } catch (error) {
      console.error(`Error saving config file for module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Get a configuration value
   * @param {string} moduleName - The module name
   * @param {string} key - The configuration key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} - The configuration value
   */
  get(moduleName, key, defaultValue = null) {
    const config = this.loadModuleConfig(moduleName);
    return key in config ? config[key] : defaultValue;
  }

  /**
   * Set a configuration value
   * @param {string} moduleName - The module name
   * @param {string} key - The configuration key
   * @param {any} value - The configuration value
   */
  set(moduleName, key, value) {
    const config = this.loadModuleConfig(moduleName);
    config[key] = value;
    this.saveModuleConfig(moduleName, config);
  }
}

// Singleton instance
const configManager = new ConfigManager();

module.exports = configManager;