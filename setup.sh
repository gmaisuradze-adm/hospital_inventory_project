#!/bin/bash

# Create project root directory
mkdir -p itms
cd itms

# Create core directory structure
mkdir -p core/config core/auth core/module-registry core/database core/events

# Create modules directory structure
mkdir -p modules/inventory modules/warehouse modules/requests modules/service-management modules/analytics

# Create frontend structure
mkdir -p frontend/core frontend/modules frontend/shared

# Create api-gateway directory
mkdir -p api-gateway

# Initialize package.json in root
npm init -y

# Update package.json
cat > package.json << EOF
{
  "name": "itms",
  "version": "0.1.0",
  "description": "Modular IT Management System for Hospital Environments",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "author": "${USER}",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
EOF

# Create .env file
cat > .env << EOF
# Application Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=itms
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=1d

# Logging Configuration
LOG_LEVEL=debug

# Created: ${USER} - $(date -u '+%Y-%m-%d %H:%M:%S')
EOF

# Create .gitignore
cat > .gitignore << EOF
# Dependency directories
node_modules/

# Environment variables
.env

# Build files
dist/
build/

# Logs
logs/
*.log

# OS specific files
.DS_Store
Thumbs.db

# IDE specific files
.vscode/
.idea/
EOF

echo "Project structure created successfully!"