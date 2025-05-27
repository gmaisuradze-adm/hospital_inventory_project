# Version: 1.4 - 2025-05-26 - Added URL for StockItemDeleteView.
# User: gmaisuradze-adm
from django.urls import path
from . import views

app_name = 'warehouse'

urlpatterns = [
    path('', views.StockItemListView.as_view(), name='stockitem_list'),
    path('stock-item/add/', views.StockItemCreateView.as_view(), name='stockitem_add'),
    path('stock-item/<int:pk>/edit/', views.StockItemUpdateView.as_view(), name='stockitem_edit'),
    path('stock-item/<int:pk>/', views.StockItemDetailView.as_view(), name='stockitem_detail'),
    path('stock-item/<int:pk>/delete/', views.StockItemDeleteView.as_view(), name='stockitem_delete'), # New URL for delete view
]