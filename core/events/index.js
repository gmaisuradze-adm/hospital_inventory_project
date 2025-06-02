/**
 * Event types enum
 */
const EventEmitter = require('events');

/**
 * Event system singleton
 */
let eventSystem;

/**
 * Set up the event system
 * @returns {EventEmitter} The event system instance
 */
function setupEventSystem() {
  if (!eventSystem) {
    eventSystem = new EventEmitter();
    // Increase max listeners to avoid memory leak warnings
    eventSystem.setMaxListeners(50);
  }
  return eventSystem;
}

const EventTypes = {
  // Core events
  SYSTEM_STARTUP: 'system:startup',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  
  // User events
  USER_CREATED: 'user:created',
  USER_UPDATED: 'user:updated',
  USER_DELETED: 'user:deleted',
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  
  // Module events
  MODULE_ENABLED: 'module:enabled',
  MODULE_DISABLED: 'module:disabled',
  
  // Inventory events
  ASSET_CREATED: 'inventory:asset:created',
  ASSET_UPDATED: 'inventory:asset:updated',
  ASSET_DELETED: 'inventory:asset:deleted',
  ASSET_ASSIGNED: 'inventory:asset:assigned',
  ASSET_UNASSIGNED: 'inventory:asset:unassigned',
  
  // Warehouse events
  STOCK_UPDATED: 'warehouse:stock:updated',
  ITEM_CHECKED_OUT: 'warehouse:item:checked-out',
  ITEM_CHECKED_IN: 'warehouse:item:checked-in',
  LOW_STOCK_ALERT: 'warehouse:stock:low-alert',
  REORDER_POINT_REACHED: 'warehouse:stock:reorder-point',
  
  // Request events
  REQUEST_CREATED: 'requests:created',
  REQUEST_UPDATED: 'requests:updated',
  REQUEST_APPROVED: 'requests:approved',
  REQUEST_REJECTED: 'requests:rejected',
  REQUEST_COMPLETED: 'requests:completed',
  REQUEST_ASSIGNED: 'requests:assigned',
  REQUEST_PRIORITY_CHANGED: 'requests:priority:changed',
  REQUEST_ITEM_ADDED: 'requests:item:added',
  REQUEST_ITEM_REMOVED: 'requests:item:removed',
  REQUEST_ITEM_UPDATED: 'requests:item:updated',
  REQUEST_WORKFLOW_STEP_STARTED: 'requests:workflow:step:started',
  REQUEST_WORKFLOW_STEP_COMPLETED: 'requests:workflow:step:completed',
  REQUEST_COMMENT_ADDED: 'requests:comment:added',
  
  // Service events
  MAINTENANCE_SCHEDULED: 'service:maintenance:scheduled',
  MAINTENANCE_COMPLETED: 'service:maintenance:completed',
  MAINTENANCE_CANCELED: 'service:maintenance:canceled',
  MAINTENANCE_RESCHEDULED: 'service:maintenance:rescheduled',
  MAINTENANCE_REMINDER: 'service:maintenance:reminder',
  INCIDENT_REPORTED: 'service:incident:reported',
  INCIDENT_ASSIGNED: 'service:incident:assigned',
  INCIDENT_ACKNOWLEDGED: 'service:incident:acknowledged', 
  INCIDENT_UPDATED: 'service:incident:updated',
  INCIDENT_RESOLVED: 'service:incident:resolved',
  INCIDENT_REOPENED: 'service:incident:reopened',
  INCIDENT_ESCALATED: 'service:incident:escalated',
  SLA_WARNING: 'service:sla:warning',
  SLA_BREACH: 'service:sla:breach',
  KNOWLEDGE_ARTICLE_CREATED: 'service:knowledge:created',
  KNOWLEDGE_ARTICLE_UPDATED: 'service:knowledge:updated',
  KNOWLEDGE_ARTICLE_PUBLISHED: 'service:knowledge:published'
};

module.exports = {
  EventTypes,
  setupEventSystem
};