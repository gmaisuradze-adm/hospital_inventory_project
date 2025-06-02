const { sequelize, Sequelize, registerModel } = require('../../core/database');

// Asset Category model
const AssetCategory = sequelize.define('asset_category', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: Sequelize.TEXT
  },
  icon: {
    type: Sequelize.STRING
  }
});

// Asset model
const Asset = sequelize.define('asset', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  serialNumber: {
    type: Sequelize.STRING,
    unique: true
  },
  assetTag: {
    type: Sequelize.STRING,
    unique: true
  },
  manufacturer: {
    type: Sequelize.STRING
  },
  model: {
    type: Sequelize.STRING
  },
  purchaseDate: {
    type: Sequelize.DATEONLY
  },
  purchaseCost: {
    type: Sequelize.DECIMAL(10, 2)
  },
  warrantyExpiration: {
    type: Sequelize.DATEONLY
  },
  notes: {
    type: Sequelize.TEXT
  },
  status: {
    type: Sequelize.ENUM('available', 'assigned', 'maintenance', 'retired'),
    defaultValue: 'available'
  }
});

// Location model
const Location = sequelize.define('location', {
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
  address: {
    type: Sequelize.TEXT
  },
  floor: {
    type: Sequelize.STRING
  },
  room: {
    type: Sequelize.STRING
  }
});

// Asset Assignment model
const AssetAssignment = sequelize.define('asset_assignment', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  assignedDate: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  returnDate: {
    type: Sequelize.DATE
  },
  notes: {
    type: Sequelize.TEXT
  }
});

// Relationships
AssetCategory.hasMany(Asset);
Asset.belongsTo(AssetCategory);

Location.hasMany(Asset);
Asset.belongsTo(Location);

Asset.hasMany(AssetAssignment);
AssetAssignment.belongsTo(Asset);

// Get User model from the core auth module
const { User } = require('../../core/auth/models');

// Relationship between User and AssetAssignment
User.hasMany(AssetAssignment);
AssetAssignment.belongsTo(User);

// Register models
registerModel('AssetCategory', AssetCategory, 'inventory');
registerModel('Asset', Asset, 'inventory');
registerModel('Location', Location, 'inventory');
registerModel('AssetAssignment', AssetAssignment, 'inventory');

module.exports = {
  AssetCategory,
  Asset,
  Location,
  AssetAssignment
};