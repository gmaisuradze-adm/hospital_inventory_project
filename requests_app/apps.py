# Version: 1.0 - 2025-05-26 - Initial app config.
from django.apps import AppConfig

class RequestsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'requests_app'
    verbose_name = "IT Requests Management"