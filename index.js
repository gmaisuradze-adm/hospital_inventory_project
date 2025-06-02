require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initializeModuleRegistry } = require('./core/module-registry');
const { connectDatabase } = require('./core/database');
const { setupEventSystem } = require('./core/events');
const { loadConfiguration } = require('./core/config');
const authRoutes = require('./core/auth/routes');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load system configuration
const config = loadConfiguration();

// Initialize core components
const moduleRegistry = initializeModuleRegistry();
const eventSystem = setupEventSystem();

// Connect to database
connectDatabase()
  .then(() => {
    console.log('Database connected successfully');
    
    // Register core routes
    app.use('/api/auth', authRoutes);
    
    // Register all modules
    const modules = moduleRegistry.getAllModules();
    modules.forEach(module => {
      if (module.routes) {
        app.use(`/api/${module.name}`, module.routes);
      }
    });
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        error: true,
        message: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
    
    // Start the server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      // Emit system startup event
      eventSystem.emit('system:startup');
    });
  })
  .catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });
