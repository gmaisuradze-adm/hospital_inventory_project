#!/bin/bash
# Hospital Inventory System - Production Deployment Script
# Version: 1.0

set -e  # Exit on any error

echo "🏥 Hospital Inventory System - Production Deployment"
echo "=================================================="

# Configuration
PROJECT_DIR="/home/gadmin/hospital_inventory_project"
VENV_DIR="$PROJECT_DIR/venv"
DJANGO_SETTINGS="hospital_inventory.settings"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as correct user
if [ "$USER" != "gadmin" ]; then
    print_error "This script should be run as 'gadmin' user"
    exit 1
fi

# Navigate to project directory
cd "$PROJECT_DIR" || {
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
}

print_status "Activating virtual environment..."
source "$VENV_DIR/bin/activate" || {
    print_error "Failed to activate virtual environment"
    exit 1
}

print_status "Installing/updating dependencies..."
pip install -r requirements.txt

print_status "Collecting static files..."
python manage.py collectstatic --noinput --settings="$DJANGO_SETTINGS"

print_status "Running database migrations..."
python manage.py migrate --settings="$DJANGO_SETTINGS"

print_status "Running security checks..."
python manage.py check --deploy --settings="$DJANGO_SETTINGS"

print_status "Creating logs directory if not exists..."
mkdir -p logs
chmod 755 logs

print_status "Setting file permissions..."
find . -name "*.py" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod +x deploy.sh

print_warning "Production deployment checklist:"
echo "  1. Set DEBUG=False in .env file"
echo "  2. Configure proper database settings"
echo "  3. Set up SSL/HTTPS"
echo "  4. Configure email settings"
echo "  5. Set up proper backup procedures"
echo "  6. Configure monitoring and logging"

print_status "Deployment completed successfully!"
echo "To run the server in production mode:"
echo "  gunicorn --bind 0.0.0.0:8000 hospital_inventory.wsgi:application"
