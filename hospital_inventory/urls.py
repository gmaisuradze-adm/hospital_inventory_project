# Version: 1.2 - 2025-05-26 08:43:56 UTC - gmaisuradze-adm - Main project URLs.
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('accounts/', include('django.contrib.auth.urls')), # Using custom core views for auth

    # App URLs
    path('', include('core.urls')), # Handles root path, login, logout, register, dashboard
    path('inventory/', include('inventory.urls', namespace='inventory')),
    path('warehouse/', include('warehouse.urls', namespace='warehouse')),
    path('requests/', include('requests_app.urls', namespace='requests_app')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) # Handled by STATICFILES_DIRS for devა