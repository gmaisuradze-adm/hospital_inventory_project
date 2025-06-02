const { sequelize, Sequelize, registerModel } = require('../../core/database');

// Item model
const Item = sequelize.define('item', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sku: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: Sequelize.TEXT
  },
  category: {
    type: Sequelize.STRING
  },
  manufacturer: {
    type: Sequelize.STRING
  },
  model: {
    type: Sequelize.STRING
  },
  unitPrice: {
    type: Sequelize.DECIMAL(10, 2)
  },
  minimumStockLevel: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  reorderPoint: {
    type: Sequelize.INTEGER,
    defaultValue: 10
  },
  attributes: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
});

// Warehouse model
const Warehouse = sequelize.define('warehouse', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  location: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
});

// Zone model (sections within a warehouse)
const Zone = sequelize.define('zone', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  code: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  }
});

// Shelf/Bin model (specific storage locations within zones)
const StorageLocation = sequelize.define('storage_location', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  code: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.STRING // 'shelf', 'bin', 'rack', etc.
  },
  description: {
    type: Sequelize.TEXT
  },
  capacity: {
    type: Sequelize.INTEGER
  }
});

// Inventory model (tracks stock levels)
const Inventory = sequelize.define('inventory', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  quantity: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  reservedQuantity: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  lastStockCheck: {
    type: Sequelize.DATE
  },
  notes: {
    type: Sequelize.TEXT
  }
});

// Stock Movement model (tracks movement history)
const StockMovement = sequelize.define('stock_movement', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  type: {
    type: Sequelize.STRING, // 'receipt', 'issue', 'transfer', 'adjustment'
    allowNull: false
  },
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  fromQuantity: {
    type: Sequelize.INTEGER
  },
  toQuantity: {
    type: Sequelize.INTEGER
  },
  documentReference: {
    type: Sequelize.STRING // reference number for order, request, etc.
  },
  notes: {
    type: Sequelize.TEXT
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
});

// Relationships
Warehouse.hasMany(Zone);
Zone.belongsTo(Warehouse);

Zone.hasMany(StorageLocation);
StorageLocation.belongsTo(Zone);

Item.hasMany(Inventory);
Inventory.belongsTo(Item);

StorageLocation.hasMany(Inventory);
Inventory.belongsTo(StorageLocation);

Inventory.hasMany(StockMovement);
StockMovement.belongsTo(Inventory);

// User association (who performed the stock movement)
StockMovement.belongsTo(sequelize.models.user, { as: 'performedBy' });

// Register models
registerModel('Item', Item);
registerModel('Warehouse', Warehouse);
registerModel('Zone', Zone);
registerModel('StorageLocation', StorageLocation);
registerModel('Inventory', Inventory);
registerModel('StockMovement', StockMovement);

module.exports = {
  Item,
  Warehouse,
  Zone,
  StorageLocation,
  Inventory,
  StockMovement
};
