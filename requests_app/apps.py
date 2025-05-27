# Version: 1.0 - 2025-05-26 - Initial app config.
# Version: 1.1 - 2025-05-27 - Copilot Edit - Added ready method for signals.
from django.apps import AppConfig

class RequestsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'requests_app'
    verbose_name = "IT Requests Management"

    def ready(self):
        # This imports signals so they are connected when the app is ready.
        import requests_app.signals # noqa F401