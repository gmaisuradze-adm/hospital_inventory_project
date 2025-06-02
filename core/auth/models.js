const { sequelize, Sequelize, registerModel } = require('../database');
const bcrypt = require('bcrypt');

// User model
const User = sequelize.define('user', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  firstName: {
    type: Sequelize.STRING
  },
  lastName: {
    type: Sequelize.STRING
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: Sequelize.DATE
  }
});

// Role model
const Role = sequelize.define('role', {
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
    type: Sequelize.STRING
  }
});

// UserRole model (many-to-many relationship)
const UserRole = sequelize.define('user_role', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  }
});

// Define relationships
User.belongsToMany(Role, { through: UserRole });
Role.belongsToMany(User, { through: UserRole });

// Hash password before saving user
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Method to verify password
User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Register models
registerModel('User', User);
registerModel('Role', Role);
registerModel('UserRole', UserRole);

module.exports = {
  User,
  Role,
  UserRole
};
