const routes = require('./routes');
const { EventTypes } = require('../../core/events');
const configManager = require('../../core/config');

// Default module configuration
const defaultConfig = {
  useBusinessHoursForSLA: true,
  businessHours: {
    start: '08:00',
    end: '17:00',
    workDays: [1, 2, 3, 4, 5] // Monday to Friday
  },
  autoAssignIncidents: true,
  maintenanceNotificationEmail: true,
  maintenanceReminderHours: 24,
  defaultIncidentPriority: 'Medium',
  incidentEscalationTimers: {
    High: 60, // minutes
    Medium: 240,
    Low: 480
  },
  maintenanceFrequencies: [
    'daily',
    'weekly',
    'monthly',
    'quarterly', 
    'yearly',
    'custom'
  ]
};

/**
 * Register the service management module with the system
 * @param {ModuleRegistry} moduleRegistry - The module registry
 */
function register(moduleRegistry) {
  // Load or initialize module config
  let moduleConfig = configManager.loadModuleConfig('service-management');
  
  if (Object.keys(moduleConfig).length === 0) {
    configManager.saveModuleConfig('service-management', defaultConfig);
    moduleConfig = defaultConfig;
  }
  
  // Register the module
  moduleRegistry.registerModule({
    name: 'service-management',
    displayName: 'IT Service Management',
    description: 'Manages incidents, maintenance schedules and knowledge base',
    version: '1.0.0',
    enabled: true,
    
    // Register module routes
    routes: (app) => {
      app.use('/api/service-management', routes);
      console.log('Service Management module routes registered');
    },
    
    // Initialize module
    initialize: () => {
      console.log('Service Management module initialized');
      
      // Register event listeners
      const { setupEventSystem } = require('../../core/events');
      const eventSystem = setupEventSystem();
      
      // Set up maintenance reminders
      eventSystem.on(EventTypes.SYSTEM_STARTUP, () => {
        setupMaintenanceReminders(moduleConfig, eventSystem);
      }, 'service-maintenance-startup');
      
      // Setup integrations
      try {
        const inventoryIntegration = require('./integrations/inventory');
        inventoryIntegration.initializeInventoryIntegration();
      } catch (error) {
        console.error('Error initializing inventory integration:', error);
      }
      
      return Promise.resolve();
    }
  });
  
  console.log('Service Management module registered');
}

/**
 * Set up scheduled maintenance reminders
 * @param {Object} config - Module configuration
 * @param {EventSystem} eventSystem - Event system instance
 */
async function setupMaintenanceReminders(config, eventSystem) {
  try {
    const { MaintenanceEvent } = require('./models');
    const { Sequelize } = require('../../core/database');
    
    // Get current date
    const currentDate = new Date('2025-06-01T20:34:54');
    
    // Calculate reminder threshold date
    const reminderThreshold = new Date(currentDate);
    reminderThreshold.setHours(
      reminderThreshold.getHours() + config.maintenanceReminderHours
    );
    
    // Find upcoming maintenance events due for reminder
    const upcomingEvents = await MaintenanceEvent.findAll({
      where: {
        status: 'scheduled',
        scheduledStartDate: {
          [Sequelize.Op.between]: [currentDate, reminderThreshold]
        }
      },
      include: [
        {
          model: sequelize.models.asset
        },
        {
          model: sequelize.models.user,
          as: 'assignee'
        }
      ]
    });
    
    // Process each event for reminder
    for (const event of upcomingEvents) {
      const timeUntilMaintenance = Math.floor(
        (event.scheduledStartDate - currentDate) / (1000 * 60 * 60)
      );
      
      console.log(`Scheduled reminder for maintenance ${event.id} in ${timeUntilMaintenance} hours`);
      
      // Schedule notification (simulated here, would use a real scheduler in production)
      setTimeout(() => {
        // If we had an email service, we would email here
        console.log(`MAINTENANCE REMINDER: ${event.title} scheduled for ${event.scheduledStartDate}`);
        
        // Emit an event that could be handled by a notification service
        eventSystem.emit('maintenance:reminder', {
          maintenanceEventId: event.id,
          title: event.title,
          scheduledStartDate: event.scheduledStartDate,
          assetId: event.assetId,
          assetName: event.asset ? event.asset.name : 'Unknown Asset',
          assigneeId: event.assigneeId,
          assigneeName: event.assignee ? `${event.assignee.firstName} ${event.assignee.lastName}` : 'Unassigned'
        });
      }, 1000); // Immediate for demo purposes
    }
    
    console.log(`Set up ${upcomingEvents.length} maintenance reminders`);
  } catch (error) {
    console.error('Error setting up maintenance reminders:', error);
  }
}

module.exports = {
  register
};
