# Hospital IT Inventory Management System - Setup Guide

## Quick Start Guide

This guide will help you set up and run the Hospital IT Inventory Management System locally.

## Prerequisites

- **Node.js**: Version 18 or higher
- **SQLite**: Built-in database (no separate installation required)
- **Note**: Uses SQLite for development. Can be configured for PostgreSQL in production.
- **npm**: Comes with Node.js
- **Git**: For version control

## Initial Setup

### 1. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### 2. Database Configuration

#### SQLite Database Setup (Development)
No separate database installation required. The database file will be created automatically when you run migrations.

**Note**: For production deployment, you can configure PostgreSQL using the same Prisma schema by changing the datasource provider and DATABASE_URL.

### 3. Environment Configuration

#### Backend Environment
Create `backend/.env` file:
```env
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

#### Frontend Environment
Create `frontend/.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 4. Database Initialization

#### Generate Prisma Client
```bash
cd backend
npx prisma generate
```

#### Run Database Migrations
```bash
cd backend
npx prisma migrate dev --name init
```

#### Seed Database (Optional)
```bash
cd backend
npx prisma db seed
```

### 5. Start the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```
The backend will start on http://localhost:5000

#### Start Frontend Development Server
```bash
cd frontend
npm start
```
The frontend will start on http://localhost:3000

## Default User Accounts

After seeding the database, you can use these accounts:

- **Admin User**
  - Email: admin@hospital.com
  - Password: admin123
  - Role: ADMIN

- **IT Admin**
  - Email: it.admin@hospital.com
  - Password: itadmin123
  - Role: IT_ADMIN

- **Finance Admin**
  - Email: finance.admin@hospital.com
  - Password: financeadmin123
  - Role: FINANCE_ADMIN

- **Regular User**
  - Email: user@hospital.com
  - Password: user123
  - Role: USER

## Project Structure

```
hospital_inventory_project/
├── backend/                 # Node.js + Express backend
│   ├── prisma/             # Database schema and migrations
│   ├── src/
│   │   ├── middleware/     # Authentication, validation, error handling
│   │   ├── routes/         # API endpoint definitions
│   │   ├── services/       # Business logic layer
│   │   ├── utils/          # Helper functions and utilities
│   │   └── index.ts        # Express app entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── store/          # Redux store and API slices
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.tsx         # Main React component
│   ├── package.json
│   └── tailwind.config.js
├── README.md
└── DEVELOPMENT_REPORT.md
```

## Available Scripts

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Frontend Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## API Documentation

The API follows RESTful conventions. Main endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - List users (Admin only)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - Get user by ID

### Inventory
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Create item
- `GET /api/inventory/:id` - Get item details
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item

### IT Requests
- `GET /api/it-requests` - List IT requests
- `POST /api/it-requests` - Create request
- `GET /api/it-requests/:id` - Get request details
- `PUT /api/it-requests/:id` - Update request
- `POST /api/it-requests/:id/assign` - Assign request
- `PATCH /api/it-requests/:id/status` - Update status

### Procurement
- `GET /api/procurement` - List procurement requests
- `POST /api/procurement` - Create request
- `POST /api/procurement/:id/approve` - Approve/reject request
- `PATCH /api/procurement/:id/status` - Update status

## Database Schema

### Key Models
- **User**: Authentication and profile information
- **ITRequest**: IT service requests with workflow
- **ProcurementRequest**: Purchase requests with approval workflow
- **InventoryItem**: Asset and equipment tracking
- **AuditLog**: System activity logging
- **Notification**: Real-time notifications

## Troubleshooting

### Common Issues

#### Database Connection Error
- Check DATABASE_URL in .env file
- Ensure SQLite database file permissions are correct
- For production PostgreSQL: verify PostgreSQL is running and database exists

#### Port Already in Use
- Backend (5000): Change PORT in backend/.env
- Frontend (3000): The dev server will suggest an alternative port

#### Prisma Client Issues
```bash
cd backend
npx prisma generate
npx prisma db push
```

#### CORS Errors
- Verify FRONTEND_URL in backend/.env matches frontend URL
- Check that both servers are running

### Reset Database
```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

## Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement backend API endpoints
   - Create frontend components
   - Test functionality
   - Submit pull request

2. **Database Changes**
   - Modify schema in `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name description`
   - Update services and API endpoints as needed

3. **Testing**
   - Write unit tests for services
   - Test API endpoints
   - Test frontend components
   - Integration testing

## Production Deployment

### Environment Variables
Update production environment variables:
- Use strong JWT_SECRET
- Set NODE_ENV=production
- Configure production database URL
- Set appropriate CORS origins

### Build Commands
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Database Setup
```bash
cd backend
npx prisma migrate deploy
```

## Support and Documentation

- **API Documentation**: Available at `/api/docs` (when implemented)
- **Database Schema**: View with `npx prisma studio`
- **Logs**: Check backend console or log files
- **Issues**: Create GitHub issues for bugs and feature requests

## Security Considerations

- Change default passwords
- Use strong JWT secrets
- Configure CORS properly
- Enable HTTPS in production
- Regular security updates
- Database backup procedures

This setup guide should get you up and running quickly. For detailed development information, see the DEVELOPMENT_REPORT.md file.
