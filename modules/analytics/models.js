const { sequelize, Sequelize, registerModel } = require('../../core/database');

// Report Template model
const ReportTemplate = sequelize.define('report_template', {
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
  type: {
    type: Sequelize.STRING, // 'inventory', 'warehouse', 'service', 'requests', etc.
    allowNull: false
  },
  config: {
    type: Sequelize.JSON,
    defaultValue: {}
  },
  isPublic: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});

// Saved Report model
const SavedReport = sequelize.define('saved_report', {
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
  parameters: {
    type: Sequelize.JSON,
    defaultValue: {}
  },
  results: {
    type: Sequelize.JSON
  },
  generatedDate: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  scheduleConfig: {
    type: Sequelize.JSON,
    defaultValue: null
  }
});

// Dashboard model
const Dashboard = sequelize.define('dashboard', {
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
  layout: {
    type: Sequelize.JSON,
    defaultValue: []
  },
  isDefault: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});

// Dashboard Widget model
const DashboardWidget = sequelize.define('dashboard_widget', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  type: {
    type: Sequelize.STRING, // 'chart', 'metric', 'table', etc.
    allowNull: false
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  config: {
    type: Sequelize.JSON,
    defaultValue: {}
  },
  dataSource: {
    type: Sequelize.STRING
  },
  params: {
    type: Sequelize.JSON,
    defaultValue: {}
  },
  refreshInterval: {
    type: Sequelize.INTEGER, // in minutes
    defaultValue: 60
  },
  position: {
    type: Sequelize.JSON,
    defaultValue: {
      x: 0,
      y: 0,
      w: 6,
      h: 4
    }
  }
});

// Audit Log model for tracking significant activities
const AuditLog = sequelize.define('audit_log', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  eventType: {
    type: Sequelize.STRING,
    allowNull: false
  },
  entityType: {
    type: Sequelize.STRING, // 'asset', 'item', 'request', etc.
    allowNull: false
  },
  entityId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  },
  metadata: {
    type: Sequelize.JSON,
    defaultValue: {}
  },
  ipAddress: {
    type: Sequelize.STRING
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
});

// Alert Subscription model
const AlertSubscription = sequelize.define('alert_subscription', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  alertType: {
    type: Sequelize.STRING, // 'low_stock', 'maintenance_due', 'sla_breach', etc.
    allowNull: false
  },
  conditions: {
    type: Sequelize.JSON,
    defaultValue: {}
  },
  notificationChannel: {
    type: Sequelize.STRING, // 'email', 'sms', 'dashboard', etc.
    allowNull: false,
    defaultValue: 'email'
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
});

// Define relationships
// User associations
const User = sequelize.models.user;

ReportTemplate.belongsTo(User, { as: 'creator' });
SavedReport.belongsTo(User, { as: 'creator' });
SavedReport.belongsTo(ReportTemplate);
Dashboard.belongsTo(User, { as: 'owner' });
DashboardWidget.belongsTo(Dashboard);
Dashboard.hasMany(DashboardWidget);
AlertSubscription.belongsTo(User, { as: 'subscriber' });
AuditLog.belongsTo(User, { as: 'user' });

// Register models
registerModel('ReportTemplate', ReportTemplate);
registerModel('SavedReport', SavedReport);
registerModel('Dashboard', Dashboard);
registerModel('DashboardWidget', DashboardWidget);
registerModel('AuditLog', AuditLog);
registerModel('AlertSubscription', AlertSubscription);

module.exports = {
  ReportTemplate,
  SavedReport,
  Dashboard,
  DashboardWidget,
  AuditLog,
  AlertSubscription
};