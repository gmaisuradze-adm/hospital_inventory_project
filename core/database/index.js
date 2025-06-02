const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hospital_inventory',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Store all registered models
const models = {};

/**
 * Register a model with the database abstraction layer
 * @param {string} name - Model name
 * @param {Object} model - Sequelize model
 */
function registerModel(name, model) {
  models[name] = model;
  return model;
}

/**
 * Get a registered model
 * @param {string} name - Model name
 */
function getModel(name) {
  return models[name];
}

/**
 * Connect to the database and sync models
 */
async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Sync all models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database models synchronized');
    
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  Sequelize,
  registerModel,
  getModel,
  connectDatabase
};
