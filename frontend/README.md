# Hospital IT Inventory Management - Frontend

This is the frontend application for the Hospital IT Inventory Management system. It's built using React and uses the Tabler.io design system for UI components.

## Features

- **Dashboard**: Overview of key metrics and alerts
- **Inventory Management**: Track and manage all IT assets
- **Warehouse Management**: Manage storage locations and capacity
- **Request Management**: Handle equipment and supply requests
- **Service Management**: Track incidents, maintenance tasks, and knowledge base
- **Analytics and Reporting**: Generate insights and reports

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher) or yarn (v1.22.x or higher)

### Installation

1. Navigate to the frontend directory:
```bash
cd /path/to/hospital_inventory_project/frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

### Development

To run the application in development mode:

```bash
npm start
# or
yarn start
```

This will start the development server on [http://localhost:3000](http://localhost:3000).

#### Development Features

- **Hot Reloading**: Changes to React components will automatically refresh the browser
- **Error Overlay**: Runtime errors are displayed directly in the browser
- **ESLint Integration**: Code quality issues are reported in the console
- **Development Proxy**: API requests are automatically proxied to the backend server

#### Development Scripts

- `npm start`: Starts the development server
- `npm test`: Runs tests in watch mode
- `npm run lint`: Checks for code quality issues
- `npm run lint:fix`: Automatically fixes code style issues

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

This will create a `build` folder with optimized production build.

## Architecture

The frontend application follows a modular architecture:

- `src/core`: Core components and services (auth, API, layout)
- `src/modules`: Feature modules (dashboard, inventory, warehouse, etc.)
- `src/shared`: Shared components and utilities
- `src/assets`: Static assets like images and icons

### Detailed Structure

```
src/
├── assets/              # Static assets
│   └── images/          # Image files including logos and icons
├── core/                # Core functionality
│   ├── api/             # API service layer
│   ├── auth/            # Authentication components and context
│   └── layout/          # Main layout components
├── modules/             # Feature modules
│   ├── analytics/       # Analytics and reporting features
│   ├── dashboard/       # Main dashboard components
│   ├── inventory/       # Inventory management
│   ├── requests/        # Request workflow management
│   ├── service/         # IT service management
│   ├── settings/        # User and application settings
│   └── warehouse/       # Warehouse management
└── shared/              # Shared components
    └── components/      # Reusable UI components
```

### Module Organization

Each feature module follows a consistent organization pattern:

- **List View**: Displays collections of items with filtering and sorting
- **Detail View**: Shows detailed information about a single item
- **Form Components**: For creating and editing items
- **Module-specific Components**: Specialized components for module features

## Environment Variables

The application uses the following environment variables:

- `REACT_APP_API_URL`: The URL of the backend API (defaults to http://localhost:3001/api)

Create a `.env` file in the frontend directory to customize these values:

```
REACT_APP_API_URL=http://your-api-url
```

## Authentication

The application uses JWT for authentication. The tokens are stored in localStorage and added to API requests via an Axios interceptor.

## UI Components

The application uses the [Tabler.io](https://tabler.io/) design system, which provides a clean and professional look suitable for enterprise applications.

### Tabler.io Components

The frontend implementation uses the following key Tabler.io components and features:

- **Layout Components**: Standard application layout with sidebar navigation, header, and footer
- **Cards**: For displaying content in visually distinct sections
- **Tables**: For data-heavy views with sorting and filtering capabilities
- **Forms**: For data entry with validation and error handling
- **Alerts and Notifications**: For system messages and user feedback
- **Badges and Status Indicators**: For showing equipment status and request approvals
- **Charts and Graphs**: For analytics and reporting visualizations
- **Responsive Design**: The application is fully responsive for desktop, tablet, and mobile views

### Custom Styling

Custom styling is implemented through SCSS files that extend the Tabler.io design system while maintaining consistency with the hospital's branding guidelines.

## Testing

The project uses Jest and React Testing Library for testing components and functionality.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- src/modules/inventory/InventoryList.test.js
```

### Test Organization

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **Snapshot Tests**: Ensure UI components don't change unexpectedly
- **Mock Services**: API services are mocked for consistent testing

## Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Implement changes and add tests
3. Ensure all tests pass
4. Submit a pull request for review

### Coding Standards

- Follow the ESLint configuration for code style
- Write tests for new features
- Update documentation when changing functionality
- Use descriptive commit messages

## License

This project is proprietary software.

## Debugging and Troubleshooting

### Common Issues

- **API Connection Failures**: Ensure the backend API is running and check the `.env` file for correct API URL configuration
- **Authentication Issues**: Clear browser localStorage and try logging in again
- **Missing Components**: Make sure all dependencies are correctly installed with `npm install`
- **Styling Problems**: Check browser console for CSS errors and ensure Tabler.io CSS is properly loaded

### Developer Tools

- **React DevTools**: Install the browser extension for debugging React component hierarchy and props
- **Redux DevTools**: When using Redux for state management (optional extension)
- **Browser Console**: Check for JavaScript errors and network request failures
- **Network Panel**: Monitor API requests and responses

## Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build` folder that can be deployed to any static hosting service.

### Deployment Options

- **Static Hosting**: Deploy to services like Netlify, Vercel, or AWS S3
- **Docker**: Use the provided Dockerfile to create a containerized version
- **CI/CD**: The project supports deployment through CI/CD pipelines with GitHub Actions

## Contact

For any questions or support, please contact the development team.
