from django.urls import path
from . import views

app_name = 'requests_app'

urlpatterns = [
    path('admin-list/', views.AdminRequestListView.as_view(), name='admin_request_list'),
    path('new/', views.RequestCreateView.as_view(), name='request_create'),
    path('<int:pk>/edit/', views.RequestUpdateView.as_view(), name='request_edit'), # Staff edit
    path('<int:pk>/', views.RequestDetailView.as_view(), name='request_detail'),

    path('my-requests/', views.UserRequestListView.as_view(), name='user_request_list'),

    # --- NEW URLS FOR USER ACTIONS (CLOSE/REOPEN) ---
    path('<int:pk>/close/', views.request_close_by_user, name='request_close_by_user'),
    path('<int:pk>/reopen/', views.request_reopen_by_user, name='request_reopen_by_user'),
]