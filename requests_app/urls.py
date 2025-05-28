from django.urls import path
from . import views # views.py შეიცვლება ქვემოთ მოცემული ლოგიკის მიხედვით

app_name = 'requests_app'

urlpatterns = [
    # AdminRequestListView (ახალი სახელით RequestListView) გახდება მთავარი სია
    path('', views.RequestListView.as_view(), name='request_list'),
    path('new/', views.RequestCreateView.as_view(), name='request_create'),
    path('<int:pk>/', views.RequestDetailView.as_view(), name='request_detail'),
    path('<int:pk>/edit/', views.RequestUpdateView.as_view(), name='request_edit'),
    # შეგიძლიათ დაამატოთ DeleteView, თუ გსურთ პირდაპირი წაშლა UI-დან,
    # path('<int:pk>/delete/', views.RequestDeleteView.as_view(), name='request_delete'),

    # მოქმედებები კონკრეტულ მოთხოვნაზე
    path('<int:pk>/close/', views.request_close_action, name='request_close_action'),
    path('<int:pk>/reopen/', views.request_reopen_action, name='request_reopen_action'),
]