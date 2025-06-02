const { sequelize, Sequelize, registerModel } = require('../../core/database');

// Service Category model
const ServiceCategory = sequelize.define('service_category', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  },
  slaResponseTime: {
    type: Sequelize.INTEGER, // in minutes
    defaultValue: 240 // 4 hours default
  },
  slaResolutionTime: {
    type: Sequelize.INTEGER, // in minutes
    defaultValue: 1440 // 24 hours default
  },
  priority: {
    type: Sequelize.STRING,
    defaultValue: 'Medium'
  },
  color: {
    type: Sequelize.STRING // for UI representation
  },
  icon: {
    type: Sequelize.STRING // for UI representation
  }
});

// Incident model
const Incident = sequelize.define('incident', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'Open',
    allowNull: false
  },
  priority: {
    type: Sequelize.STRING,
    defaultValue: 'Medium',
    allowNull: false
  },
  impact: {
    type: Sequelize.STRING,
    defaultValue: 'Medium'
  },
  reportedDate: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  assignedDate: {
    type: Sequelize.DATE
  },
  acknowledgedDate: {
    type: Sequelize.DATE
  },
  resolvedDate: {
    type: Sequelize.DATE
  },
  closedDate: {
    type: Sequelize.DATE
  },
  resolutionSummary: {
    type: Sequelize.TEXT
  },
  rootCause: {
    type: Sequelize.TEXT
  },
  notes: {
    type: Sequelize.TEXT
  },
  isRecurring: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
});

// Maintenance Schedule model
const MaintenanceSchedule = sequelize.define('maintenance_schedule', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  },
  type: {
    type: Sequelize.STRING, // preventive, corrective, etc.
    defaultValue: 'preventive'
  },
  frequency: {
    type: Sequelize.STRING // once, daily, weekly, monthly, quarterly, yearly
  },
  intervalDays: {
    type: Sequelize.INTEGER // used for custom intervals
  },
  priority: {
    type: Sequelize.STRING,
    defaultValue: 'Medium'
  },
  estimatedDuration: {
    type: Sequelize.INTEGER, // in minutes
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  startDate: {
    type: Sequelize.DATE
  },
  endDate: {
    type: Sequelize.DATE // null for indefinite schedules
  },
  notifyBefore: {
    type: Sequelize.INTEGER, // in hours
    defaultValue: 24
  },
  metadata: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
});

// Maintenance Event model (actual maintenance performed)
const MaintenanceEvent = sequelize.define('maintenance_event', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  },
  status: {
    type: Sequelize.STRING, // scheduled, in-progress, completed, cancelled
    defaultValue: 'scheduled'
  },
  scheduledStartDate: {
    type: Sequelize.DATE,
    allowNull: false
  },
  scheduledEndDate: {
    type: Sequelize.DATE,
    allowNull: false
  },
  actualStartDate: {
    type: Sequelize.DATE
  },
  actualEndDate: {
    type: Sequelize.DATE
  },
  outcome: {
    type: Sequelize.TEXT
  },
  actions: {
    type: Sequelize.TEXT
  },
  partsUsed: {
    type: Sequelize.JSON,
    defaultValue: []
  },
  costs: {
    type: Sequelize.DECIMAL(10, 2)
  },
  isEmergency: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
});

// Service Note model (for both incidents and maintenance)
const ServiceNote = sequelize.define('service_note', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  type: {
    type: Sequelize.STRING, // update, resolution, internal, etc.
  },
  isPrivate: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});

// Knowledge Base Article model
const KnowledgeArticle = sequelize.define('knowledge_article', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  tags: {
    type: Sequelize.TEXT,
    allowNull: true,
    get: function() {
      const value = this.getDataValue('tags');
      return value ? JSON.parse(value) : [];
    },
    set: function(val) {
      this.setDataValue('tags', JSON.stringify(val || []));
    }
  },
  category: {
    type: Sequelize.STRING
  },
  status: {
    type: Sequelize.STRING, // draft, published, archived
    defaultValue: 'draft'
  },
  publishedDate: {
    type: Sequelize.DATE
  },
  lastUpdatedDate: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  viewCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  isPublic: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});

// SLA Tracking model
const SLATracking = sequelize.define('sla_tracking', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  targetResponseTime: {
    type: Sequelize.DATE
  },
  targetResolutionTime: {
    type: Sequelize.DATE
  },
  actualResponseTime: {
    type: Sequelize.DATE
  },
  actualResolutionTime: {
    type: Sequelize.DATE
  },
  responseStatus: {
    type: Sequelize.STRING // on-time, breached
  },
  resolutionStatus: {
    type: Sequelize.STRING // on-time, breached
  },
  pauseTime: {
    type: Sequelize.INTEGER, // minutes of paused time
    defaultValue: 0
  },
  businessHoursOnly: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
});

// Define relationships
// Reference User model from auth
const User = sequelize.models.user;
// Reference Asset model from inventory
const Asset = sequelize.models.asset;

// Service Category relationships
Incident.belongsTo(ServiceCategory);
ServiceCategory.hasMany(Incident);
MaintenanceSchedule.belongsTo(ServiceCategory);
ServiceCategory.hasMany(MaintenanceSchedule);

// Incident relationships
Incident.belongsTo(User, { as: 'reporter' });
Incident.belongsTo(User, { as: 'assignee' });
Incident.belongsTo(User, { as: 'resolver' });
Incident.belongsTo(Asset);
Incident.hasOne(SLATracking);
SLATracking.belongsTo(Incident);
Incident.hasMany(ServiceNote);
ServiceNote.belongsTo(Incident);

// Maintenance relationships
MaintenanceSchedule.belongsTo(User, { as: 'createdBy' });
MaintenanceSchedule.belongsTo(Asset);
MaintenanceSchedule.hasMany(MaintenanceEvent);
MaintenanceEvent.belongsTo(MaintenanceSchedule);
MaintenanceEvent.belongsTo(User, { as: 'assignee' });
MaintenanceEvent.belongsTo(User, { as: 'performedBy' });
MaintenanceEvent.belongsTo(Asset);
MaintenanceEvent.hasMany(ServiceNote);
ServiceNote.belongsTo(MaintenanceEvent);

// Knowledge Article relationships
KnowledgeArticle.belongsTo(User, { as: 'author' });
KnowledgeArticle.belongsTo(User, { as: 'lastEditor' });
Incident.belongsToMany(KnowledgeArticle, { through: 'incident_knowledge' });
KnowledgeArticle.belongsToMany(Incident, { through: 'incident_knowledge' });

// Service Note relationship to User
ServiceNote.belongsTo(User, { as: 'author' });

// Register models
registerModel('ServiceCategory', ServiceCategory);
registerModel('Incident', Incident);
registerModel('MaintenanceSchedule', MaintenanceSchedule);
registerModel('MaintenanceEvent', MaintenanceEvent);
registerModel('ServiceNote', ServiceNote);
registerModel('KnowledgeArticle', KnowledgeArticle);
registerModel('SLATracking', SLATracking);

module.exports = {
  ServiceCategory,
  Incident,
  MaintenanceSchedule,
  MaintenanceEvent,
  ServiceNote,
  KnowledgeArticle,
  SLATracking
};
