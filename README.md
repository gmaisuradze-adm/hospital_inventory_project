# Version: 1.0 - 2025-05-26 - Initial creation.
# Hospital IT Inventory & Request Management System v1.0

This project is a web application for managing IT equipment, warehouse stock, and user requests in a hospital environment.

## Features

*   User Authentication (Admin, User roles)
*   IT Equipment Inventory Management
*   Warehouse Stock Management
*   User Request System
*   Admin and User Dashboards

## Prerequisites

*   Python 3.8+
*   Pip (Python package installer)

## Installation

1.  **Clone the repository or download the source code.**
    ```bash
    # If you had a git repo, you would clone it.
    # For now, ensure all provided files are in a project directory called 'hospital_inventory'.
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd hospital_inventory
    ```

3.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    ```
    Activate the virtual environment:
    *   On Windows:
        ```bash
        venv\Scripts\activate
        ```
    *   On macOS and Linux:
        ```bash
        source venv/bin/activate
        ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Apply migrations:**
    ```bash
    python manage.py migrate
    ```

6.  **Create a superuser (Admin):**
    ```bash
    python manage.py createsuperuser
    ```
    Follow the prompts to create an admin account. This user will have 'Admin' privileges.

7.  **Start the Django development server:**
    ```bash
    python manage.py runserver
    ```
    The application will be available at `http://127.0.0.1:8000/`.

## Logging In

*   **Admin:**
    *   Navigate to `http://127.0.0.1:8000/admin/` to access the Django admin panel.
    *   Navigate to `http://127.0.0.1:8000/` and log in with the superuser credentials created in step 6. The admin dashboard and functionalities will be available.
*   **User:**
    *   To create a regular user, the Admin can create a new user via the Django admin panel (`http://127.0.0.1:8000/admin/auth/user/add/`). Ensure the "Staff status" is unchecked for regular users.
    *   Alternatively, a registration page can be added as a future enhancement. For v1.0, Admins create user accounts.
    *   Users can log in at `http://127.0.0.1:8000/accounts/login/` (or a custom login URL if implemented) with their credentials. They will see their specific dashboard and be able to submit requests.

## Project Structure

```
hospital_inventory/
├── hospital_inventory/       # Main Django project settings
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/                     # Core app for authentication, base templates
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── migrations/
│   ├── models.py
│   ├── templates/
│   │   └── core/
│   │       └── base.html
│   │       └── login.html
│   │       └── ...
│   ├── urls.py
│   └── views.py
├── inventory/                # IT Equipment Inventory app
│   ├── ...
├── warehouse/                # Warehouse stock app
│   ├── ...
├── requests_app/             # User requests app (named to avoid conflict with 'requests' library)
│   ├── ...
├── static/                   # Global static files (CSS, JS, images)
│   └── css/
│       └── style.css
├── templates/                # Global templates
│   └── admin/                # Custom admin templates (if any)
├── manage.py
├── requirements.txt
└── README.md
```
(Note: App structure will be built out in subsequent steps.)

## Versioning

*   Project Version: v1.0
*   Individual file versions are noted at brisket of each relevant file (e.g., `# Version: 1.0 - YYYY-MM-DD - Initial creation.`).