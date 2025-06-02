# Modular IT Management System

This is a modular IT management system designed for hospital environments, providing comprehensive inventory and asset management features.

## Architecture

The system follows a modular architecture:

```
┌────────────────────────────────────────────────────────────────┐
│                         Core Framework                          │
├────────────┬────────────┬────────────────┬────────────┬────────┤
│ Module     │ Event      │ Configuration  │ Database   │ Auth   │
│ Registry   │ Management │ Management     │ Abstraction│ System │
└────────────┴────────────┴────────────────┴────────────┴────────┘
                                 ▲
                                 │
            ┌──────────────────────────────────────────┐
            │        Module Interface/API Layer        │
            └──────────────────────────────────────────┘
                 ▲           ▲           ▲          ▲
                 │           │           │          │
      ┌──────────┴─┐   ┌─────┴────┐ ┌────┴─────┐ ┌─┴──────────┐
      │ Inventory  │   │ Warehouse│ │ Requests │ │ IT Service │
      │ Management │   │ Management│ │ Workflow │ │ Management │
      └────────────┘   └──────────┘ └──────────┘ └────────────┘
                                                       ▲
      ┌────────────────────────────────────────────────┘
      │
┌─────┴────────┐
│ Analytics &  │
│ Reporting    │
└──────────────┘
```

## Core Features

- **Module Registry System:** Provides dynamic module loading and registration
- **Event System:** Enables inter-module communication through events
- **Configuration Management:** Centralized configuration with environment-specific settings
- **Database Abstraction:** Sequelize-based ORM for PostgreSQL
- **Authentication & Authorization:** JWT-based authentication with role-based access control

## Modules

### 1. Inventory Management
- Track IT assets with detailed information
- Asset assignment and location tracking
- Category management and custom attributes

### 2. Warehouse Management
- Manage multiple warehouses, zones, and storage locations
- Item tracking with stock levels and movements
- Transfer items between locations

### 3. Requests & Workflows
- Request management for equipment, software, and services
- Customizable approval workflows
- Request tracking and notifications

### 4. IT Service Management (Coming Soon)
- Incident and problem management
- Service level agreements
- IT service catalog

### 5. Analytics & Reporting (Coming Soon)
- Dashboards for key metrics
- Custom reports
- Data visualization

## Technology Stack

- **Backend:** Node.js with Express
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Authentication:** JWT with bcrypt
- **Docker:** Containerization for development and deployment

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

### Setup

1. Clone the repository
2. Run Docker Compose:

```bash
docker-compose up -d
```

3. Seed the database:

```bash
docker-compose exec app node seed.js
```

### Default Login

- Username: `admin`
- Password: `admin123`

## Development

Each module follows a standardized structure:

```
modules/[module-name]/
├── index.js        # Module registration and initialization
├── models.js       # Database models
├── controllers.js  # Route controllers
└── routes.js       # API routes
```

## API Documentation

API endpoints follow RESTful conventions:

- `/api/auth/*` - Authentication endpoints
- `/api/inventory/*` - Inventory management
- `/api/warehouse/*` - Warehouse management
- `/api/requests/*` - Request management and workflows

## License

MIT
