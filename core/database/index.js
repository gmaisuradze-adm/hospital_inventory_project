const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Get database connection info from environment variables
const {
  DB_HOST = 'db',
  DB_PORT = 5432,
  DB_NAME = 'itms',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres'
} = process.env;

// Create Sequelize instance using PostgreSQL
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

/**
 * Connect to the database
 */
async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Sync models with database (in development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized');
    }
    
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

// Model registry to keep track of all models across modules
const modelRegistry = new Map();

/**
 * Register a model with the system
 * @param {string} modelName - The model name
 * @param {Object} model - The Sequelize model
 * @param {string} moduleName - The module name
 */
function registerModel(modelName, model, moduleName) {
  if (modelRegistry.has(modelName)) {
    throw new Error(`Model ${modelName} is already registered`);
  }
  
  modelRegistry.set(modelName, {
    model,
    moduleName
  });
  
  console.log(`Model registered: ${modelName} (from module ${moduleName})`);
  return model;
}

/**
 * Get a registered model
 * @param {string} modelName - The model name
 * @returns {Object} - The Sequelize model
 */
function getModel(modelName) {
  const entry = modelRegistry.get(modelName);
  if (!entry) {
    throw new Error(`Model ${modelName} is not registered`);
  }
  
  return entry.model;
}

// Use PostgreSQL native ARRAY type
Sequelize.ARRAY = DataTypes.ARRAY;

module.exports = {
  sequelize,
  connectDatabase,
  registerModel,
  getModel,
  Sequelize
};