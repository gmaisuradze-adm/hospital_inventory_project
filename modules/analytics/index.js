const express = require('express');
const routes = require('./routes');
const models = require('./models');
const { sequelize } = require('../../core/database');
const { setupEventSystem, EventTypes } = require('../../core/events');
const configManager = require('../../core/config');

// Default module configuration
const defaultConfig = {
  enableRealTimeReports: true,
  dashboardRefreshIntervalMinutes: 5,
  retentionPeriodDays: {
    auditLogs: 365,
    reports: 90
  },
  defaultCharts: ['assetUtilization', 'requestsByDepartment', 'inventoryValue']
};

/**
 * Register the analytics module with the system
 * @param {ModuleRegistry} moduleRegistry - The module registry
 */
function register(moduleRegistry) {
  // Load or initialize module config
  let moduleConfig = configManager.loadModuleConfig('analytics');
  
  if (Object.keys(moduleConfig).length === 0) {
    configManager.saveModuleConfig('analytics', defaultConfig);
    moduleConfig = defaultConfig;
  }
  
  // Register the module
  moduleRegistry.registerModule({
    name: 'analytics',
    displayName: 'Analytics & Reporting',
    description: 'Analytics and reporting module for hospital inventory system',
    version: '1.0.0',
    enabled: true,
    
    // Register module routes
    routes: (app) => {
      app.use('/api/analytics', routes);
      console.log('Analytics module routes registered');
    },
    
    // Initialize module
    initialize: () => {
      console.log('Analytics module initialized');
      
      // Register event listeners
      const eventSystem = setupEventSystem();
      setupEventListeners(eventSystem);
      
      return Promise.resolve();
    }
  });
  
  console.log('Analytics module registered');
}

// Setup event listeners to track events for analytics
function setupEventListeners(eventSystem) {
  // Listen for inventory events
  eventSystem.on(EventTypes.ASSET_CREATED, (data) => {
    logEvent('inventory', 'asset_created', data);
  });
  
  eventSystem.on(EventTypes.ASSET_UPDATED, (data) => {
    logEvent('inventory', 'asset_updated', data);
  });
  
  eventSystem.on(EventTypes.ASSET_ASSIGNED, (data) => {
    logEvent('inventory', 'asset_assigned', data);
  });
  
  // Listen for warehouse events
  eventSystem.on(EventTypes.STOCK_UPDATED, (data) => {
    logEvent('warehouse', 'stock_updated', data);
  });
  
  eventSystem.on(EventTypes.ITEM_CHECKED_OUT, (data) => {
    logEvent('warehouse', 'item_checked_out', data);
  });
  
  // Listen for service events
  eventSystem.on(EventTypes.INCIDENT_REPORTED, (data) => {
    logEvent('service', 'incident_reported', data);
  });
  
  eventSystem.on(EventTypes.MAINTENANCE_COMPLETED, (data) => {
    logEvent('service', 'maintenance_completed', data);
  });
  
  // Listen for request events
  eventSystem.on(EventTypes.REQUEST_CREATED, (data) => {
    logEvent('requests', 'request_created', data);
  });
  
  eventSystem.on(EventTypes.REQUEST_COMPLETED, (data) => {
    logEvent('requests', 'request_completed', data);
  });
}

// Log an event to the analytics system
async function logEvent(category, action, data) {
  try {
    const { AuditLog } = require('./models');
    await AuditLog.create({
      category,
      action,
      data: JSON.stringify(data),
      timestamp: new Date()
    });
    
    console.log(`Analytics: Logged event ${category}.${action}`);
  } catch (error) {
    console.error(`Error logging analytics event ${category}.${action}:`, error);
  }
}

module.exports = {
  register
};
