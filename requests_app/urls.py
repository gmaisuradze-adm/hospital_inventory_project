from django.urls import path
from . import views

app_name = 'requests_app'

urlpatterns = [
    path('admin-list/', views.AdminRequestListView.as_view(), name='admin_request_list'),
    path('new/', views.RequestCreateView.as_view(), name='request_create'),
    path('<int:pk>/edit/', views.RequestUpdateView.as_view(), name='request_edit'),
    path('<int:pk>/', views.RequestDetailView.as_view(), name='request_detail'),

    # --- NEW URL FOR USER'S OWN REQUESTS ---
    path('my-requests/', views.UserRequestListView.as_view(), name='user_request_list'),
]