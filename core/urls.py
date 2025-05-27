# Version: 1.0 - 2025-05-26 08:06:31 UTC - gmaisuradze-adm - Core URL patterns.
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'), # Root path to dashboard
    path('login/', views.user_login_view, name='login'),
    path('logout/', views.user_logout_view, name='logout'),
    path('register/', views.user_register_view, name='register'),
    # path('register/done/', views.RegistrationDoneView.as_view(), name='registration_done'),
]