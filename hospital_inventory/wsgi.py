"""
WSGI config for hospital_inventory project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/stable/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# IMPORTANT: Ensure 'hospital_inventory.settings' matches your project's settings file path.
# If your settings file is hospital_inventory/hospital_inventory/settings.py,
# then 'hospital_inventory.settings' is correct.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_inventory.settings')

application = get_wsgi_application()