const routes = require('./routes');
const { EventTypes } = require('../../core/events');
const configManager = require('../../core/config');

// Default module configuration
const defaultConfig = {
  enableEmailNotifications: true,
  defaultAssignmentRole: 'manager',
  autoApproveThreshold: 0,  // Amount in $ that doesn't need approval, 0 means all need approval
  defaultWorkflowByRequestType: {
    'Equipment': 'equipment-request',
    'Software': 'software-request',
    'Access': 'access-request',
    'Service': 'service-request'
  }
};

/**
 * Register the requests module with the system
 * @param {ModuleRegistry} moduleRegistry - The module registry
 */
function register(moduleRegistry) {
  // Load or initialize module config
  let moduleConfig = configManager.loadModuleConfig('requests');
  
  if (Object.keys(moduleConfig).length === 0) {
    configManager.saveModuleConfig('requests', defaultConfig);
    moduleConfig = defaultConfig;
  }
  
  // Register the module
  moduleRegistry.registerModule({
    name: 'requests',
    displayName: 'Requests & Workflows',
    description: 'Manages service requests and approval workflows',
    version: '1.0.0',
    enabled: true,
    
    // Register module routes
    routes: (app) => {
      app.use('/api/requests', routes);
      console.log('Requests module routes registered');
      console.log('Requests module routes registered');
    },
    
    // Initialize module
    initialize: () => {
      console.log('Requests module initialized');
      
      // Register event listeners
      const eventSystem = require('../../core/events').setupEventSystem();
      
      // Listen for request creation to set up initial workflow
      eventSystem.on(EventTypes.REQUEST_CREATED, async (data) => {
        try {
          const { Request, Workflow } = require('./models');
          const request = await Request.findByPk(data.requestId);
          
          if (request && !request.workflowId) {
            const defaultWorkflowName = moduleConfig.defaultWorkflowByRequestType[request.type];
            
            if (defaultWorkflowName) {
              const workflow = await Workflow.findOne({
                where: { 
                  name: defaultWorkflowName,
                  active: true
                }
              });
              
              if (workflow) {
                await request.update({ workflowId: workflow.id });
                console.log(`Assigned default workflow '${defaultWorkflowName}' to request ${request.id}`);
              }
            }
          }
        } catch (err) {
          console.error('Error processing request creation event:', err);
        }
      }, 'requests-workflow-assignment');
      
      return Promise.resolve();
    }
  });
  
  console.log('Requests module registered');
}

module.exports = {
  register
};
