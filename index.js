require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { connectDatabase } = require('./core/database');
const authRoutes = require('./core/auth/routes');
const { registerAllModules } = require('./modules');

const app = express();
const PORT = process.env.PORT || 3003; // Changed port to 3003

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize core components
connectDatabase();
const moduleRegistry = registerAllModules();

// Core routes
app.use('/api/auth', authRoutes);

// Root route - API status
app.get('/', (req, res) => {
  res.json({
    message: 'Hospital Inventory Management System API',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    modules: moduleRegistry.getModuleNames(),
    endpoints: {
      auth: '/api/auth',
      inventory: '/api/inventory',
      warehouse: '/api/warehouse',
      requests: '/api/requests',
      serviceManagement: '/api/service-management'
    }
  });
});

// API status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    modules: moduleRegistry.getModuleNames(),
    uptime: process.uptime()
  });
});

// Register module routes
moduleRegistry.registerRoutes(app);

// Serve static files from frontend build directory (if available)
const frontendBuildPath = path.join(__dirname, 'frontend', 'build');
app.use(express.static(frontendBuildPath));

// Catch all handler for frontend routing (SPA support)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Try to serve the frontend index.html for SPA routing
  const indexPath = path.join(frontendBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If no built frontend, show the API response
      res.json({
        message: 'Hospital Inventory Management System API',
        status: 'operational',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        modules: moduleRegistry.getModuleNames(),
        endpoints: {
          auth: '/api/auth',
          inventory: '/api/inventory',
          warehouse: '/api/warehouse',
          requests: '/api/requests',
          serviceManagement: '/api/service-management'
        },
        note: 'Frontend not built yet. Build the React frontend in /frontend directory to serve the full application.'
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Initialized modules: ${moduleRegistry.getModuleNames().join(', ')}`);
});

module.exports = app;