# Version: 1.3.1 - 2025-05-28 - Copilot Edit
# - Added URLs for MarkedForWriteOffListView and DecommissionedEquipmentListView.
# - Kept existing URLs for decommission and restore processes.
from django.urls import path
from . import views

app_name = 'inventory'

urlpatterns = [
    # Equipment URLs
    path('', views.EquipmentListView.as_view(), name='equipment_list'),
    path('equipment/<int:pk>/', views.EquipmentDetailView.as_view(), name='equipment_detail'),
    path('equipment/new/', views.EquipmentCreateView.as_view(), name='equipment_create'),
    path('equipment/<int:pk>/update/', views.EquipmentUpdateView.as_view(), name='equipment_update'),
    path('equipment/<int:pk>/delete/', views.EquipmentDeleteView.as_view(), name='equipment_delete'),
    
    # --- URLs for Write-Off, Decommission, and Restore Functionality ---
    path('equipment/<int:pk>/mark-for-write-off/', views.EquipmentMarkForWriteOffView.as_view(), name='equipment_mark_for_write_off'),
    path('equipment/<int:pk>/decommission/', views.EquipmentDecommissionView.as_view(), name='equipment_decommission'),
    path('equipment/<int:pk>/restore/', views.EquipmentRestoreView.as_view(), name='equipment_restore'),
    
    # --- NEW URLs for Special Equipment Lists ---
    path('equipment/marked-for-write-off/', views.MarkedForWriteOffListView.as_view(), name='marked_for_write_off_list'),
    path('equipment/decommissioned/', views.DecommissionedEquipmentListView.as_view(), name='decommissioned_list'),
    # --- END: URLs for Special Equipment Lists ---
    
    # URLs for Categories
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    path('category/new/', views.CategoryCreateView.as_view(), name='category_create'),
    path('category/<int:pk>/update/', views.CategoryUpdateView.as_view(), name='category_update'),
    path('category/<int:pk>/delete/', views.CategoryDeleteView.as_view(), name='category_delete'),

    # URLs for Statuses
    path('statuses/', views.StatusListView.as_view(), name='status_list'),
    path('status/new/', views.StatusCreateView.as_view(), name='status_create'),
    path('status/<int:pk>/update/', views.StatusUpdateView.as_view(), name='status_update'),
    path('status/<int:pk>/delete/', views.StatusDeleteView.as_view(), name='status_delete'),

    # URLs for Locations
    path('locations/', views.LocationListView.as_view(), name='location_list'),
    path('location/new/', views.LocationCreateView.as_view(), name='location_create'),
    path('location/<int:pk>/update/', views.LocationUpdateView.as_view(), name='location_update'),
    path('location/<int:pk>/delete/', views.LocationDeleteView.as_view(), name='location_delete'),

    # URLs for Suppliers
    path('suppliers/', views.SupplierListView.as_view(), name='supplier_list'),
    path('supplier/new/', views.SupplierCreateView.as_view(), name='supplier_create'),
    path('supplier/<int:pk>/update/', views.SupplierUpdateView.as_view(), name='supplier_update'),
    path('supplier/<int:pk>/delete/', views.SupplierDeleteView.as_view(), name='supplier_delete'),
]