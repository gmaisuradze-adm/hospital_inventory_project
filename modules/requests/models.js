const { sequelize, Sequelize, registerModel } = require('../../core/database');

// Request model
const Request = sequelize.define('request', {
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
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'New'
  },
  priority: {
    type: Sequelize.STRING,
    defaultValue: 'Medium'
  },
  submitDate: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  dueDate: {
    type: Sequelize.DATE
  },
  completedDate: {
    type: Sequelize.DATE
  },
  notes: {
    type: Sequelize.TEXT
  },
  metadata: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
});

// RequestItem model (for item requests)
const RequestItem = sequelize.define('request_item', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  quantity: {
    type: Sequelize.INTEGER,
    defaultValue: 1
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'Pending'
  },
  notes: {
    type: Sequelize.TEXT
  },
  fulfilled: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  fulfilledDate: {
    type: Sequelize.DATE
  }
});

// Workflow model
const Workflow = sequelize.define('workflow', {
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
    type: Sequelize.STRING
  },
  active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
});

// WorkflowStep model
const WorkflowStep = sequelize.define('workflow_step', {
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
  stepOrder: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  requiredRole: {
    type: Sequelize.STRING
  },
  action: {
    type: Sequelize.STRING
  },
  autoProgress: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
});

// RequestProgress model (tracks request through workflow)
const RequestProgress = sequelize.define('request_progress', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'Pending'
  },
  startDate: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  completedDate: {
    type: Sequelize.DATE
  },
  result: {
    type: Sequelize.STRING
  },
  notes: {
    type: Sequelize.TEXT
  },
  metadata: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
});

// RequestComment model
const RequestComment = sequelize.define('request_comment', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  comment: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  isPrivate: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});

// Define relationships
Request.belongsTo(sequelize.models.user, { as: 'requester' });
Request.belongsTo(sequelize.models.user, { as: 'assignee' });
Request.belongsTo(Workflow);

RequestItem.belongsTo(Request);
Request.hasMany(RequestItem);

// Link to Warehouse Item model if exists
if (sequelize.models.item) {
  RequestItem.belongsTo(sequelize.models.item, { foreignKey: 'itemId' });
}

Workflow.hasMany(WorkflowStep);
WorkflowStep.belongsTo(Workflow);

RequestProgress.belongsTo(Request);
RequestProgress.belongsTo(WorkflowStep);
RequestProgress.belongsTo(sequelize.models.user, { as: 'assignee' });
RequestProgress.belongsTo(sequelize.models.user, { as: 'completedBy' });

Request.hasMany(RequestProgress);
WorkflowStep.hasMany(RequestProgress);

RequestComment.belongsTo(Request);
RequestComment.belongsTo(sequelize.models.user, { as: 'author' });
Request.hasMany(RequestComment);

// Register models
registerModel('Request', Request);
registerModel('RequestItem', RequestItem);
registerModel('Workflow', Workflow);
registerModel('WorkflowStep', WorkflowStep);
registerModel('RequestProgress', RequestProgress);
registerModel('RequestComment', RequestComment);

module.exports = {
  Request,
  RequestItem,
  Workflow,
  WorkflowStep,
  RequestProgress,
  RequestComment
};
