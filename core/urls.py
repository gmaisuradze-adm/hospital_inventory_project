# Version: 1.1 (Added privacy_policy and terms_service URLs)
# User: gmaisuradze-adm (as per Copilot's edit)
from django.urls import path
from . import views # Imports all views from the current directory's views.py

app_name = 'core'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('login/', views.user_login_view, name='login'),
    path('logout/', views.user_logout_view, name='logout'),
    path('register/', views.user_register_view, name='register'),
    
    # NEW URLS for Privacy Policy and Terms of Service
    path('privacy-policy/', views.PrivacyPolicyView.as_view(), name='privacy_policy'),
    path('terms-of-service/', views.TermsServiceView.as_view(), name='terms_service'),
]