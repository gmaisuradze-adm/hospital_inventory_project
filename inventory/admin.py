# Version: 1.1 - 2025-05-26 10:07:52 UTC - gmaisuradze-adm - Corrected model import names
from django.contrib import admin
from .models import Equipment, Category, Location, Status, Supplier # Corrected names

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'icon')
    search_fields = ('name', 'description')

@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'is_decommissioned')
    search_fields = ('name', 'description')
    list_filter = ('is_active', 'is_decommissioned')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'floor', 'room_number')
    search_fields = ('name', 'address', 'floor', 'room_number')

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone_number', 'email')
    search_fields = ('name', 'contact_person', 'email')

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = (
        'asset_tag', 
        'name', 
        'category', 
        'status', 
        'current_location', 
        'assigned_to', 
        'purchase_date', 
        'last_updated'
    )
    list_filter = (
        'status', 
        'category', 
        'current_location', 
        'purchase_date', 
        'warranty_expiry_date', 
        'supplier',
        'assigned_to'
    )
    search_fields = (
        'name', 
        'asset_tag', 
        'serial_number', 
        'notes', 
        'assigned_to__username', 
        'supplier__name',
        'current_location__name',
        'category__name',
        'status__name'
    )
    readonly_fields = ('date_added', 'last_updated', 'added_by', 'updated_by')
    autocomplete_fields = ['category', 'status', 'current_location', 'assigned_to', 'supplier', 'added_by', 'updated_by']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'asset_tag', 'serial_number')
        }),
        ('Categorization & Status', {
            'fields': ('category', 'status')
        }),
        ('Assignment & Location', {
            'fields': ('current_location', 'assigned_to')
        }),
        ('Purchase & Supplier Information', {
            'fields': ('supplier', 'purchase_date', 'purchase_cost', 'warranty_expiry_date')
        }),
        ('Auditing', {
            'fields': ('date_added', 'added_by', 'last_updated', 'updated_by'),
            'classes': ('collapse',), # Make this section collapsible
        }),
        ('Notes', {
            'fields': ('notes',),
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk: # If creating new
            obj.added_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
