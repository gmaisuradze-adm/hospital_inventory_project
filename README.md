# Hospital IT Inventory Management System

A comprehensive web-based system for managing hospital IT inventory, procurement, and requests.

## Features

- **User Management**: Registration, authentication, role-based access control
- **IT Inventory Management**: Track equipment in use and storage
- **IT Procurement**: Manage procurement requests and processes
- **IT Requests**: Submit and track IT service requests
- **Form Management**: Dynamic form creation and management
- **Reporting & Analytics**: Generate reports and visualize data
- **Audit Trail**: Track all system activities

## Technology Stack

### Frontend
- React 18 with TypeScript
- Redux Toolkit for state management
- RTK Query for API calls
- Tailwind CSS for styling
- React Hook Form for form handling
- Recharts for data visualization

### Backend
- Node.js with Express.js
- TypeScript
- SQLite with Prisma ORM (PostgreSQL-compatible for production)
- JWT for authentication
- Zod for validation
- Winston for logging

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the database connection string and other variables

4. Set up the database:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. Start the development servers:
   ```bash
   npm run dev
   ```

## Project Structure

```
hospital-inventory-management/
├── frontend/          # React TypeScript frontend
├── backend/           # Node.js Express backend
├── shared/           # Shared types and utilities
└── docs/             # Documentation
```

## Default Admin User

- Username: admin@hospital.com
- Password: admin123

## API Documentation

The API documentation is available at `/api/docs` when running the backend server.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License
