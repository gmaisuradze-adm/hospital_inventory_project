from django.contrib import admin
from .models import Category, Status, Location, Supplier, Equipment, StockItem, EquipmentLog, StockTransaction, DecommissionLog
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html # დავამატოთ format_html იმპორტი

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon_display', 'description_summary')
    search_fields = ('name', 'description')

    def description_summary(self, obj):
        return (obj.description[:75] + '...') if obj.description and len(obj.description) > 75 else obj.description
    description_summary.short_description = _('Description')

    def icon_display(self, obj):
        if obj.icon:
            return format_html('<i class="{}"></i> ({})', obj.icon, obj.icon) # გამოვიყენოთ format_html
        return "-"
    icon_display.short_description = _('Icon')
    # icon_display.allow_tags = True # მოძველებულია Django 4.0+ ვერსიებისთვის

@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'description_summary', 'is_active_for_use', 'is_decommissioned', 'is_in_storage')
    list_filter = ('is_active_for_use', 'is_decommissioned', 'is_in_storage')
    search_fields = ('name', 'description')

    def description_summary(self, obj):
        return (obj.description[:75] + '...') if obj.description and len(obj.description) > 75 else obj.description
    description_summary.short_description = _('Description')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_full_path_admin', 'address_summary', 'notes_summary')
    search_fields = ('name', 'address', 'notes')
    list_filter = ('parent_location',)
    autocomplete_fields = ['parent_location']

    def address_summary(self, obj):
        return (obj.address[:75] + '...') if obj.address and len(obj.address) > 75 else obj.address
    address_summary.short_description = _('Address')

    def notes_summary(self, obj):
        return (obj.notes[:75] + '...') if obj.notes and len(obj.notes) > 75 else obj.notes
    notes_summary.short_description = _('Notes')

    def get_full_path_admin(self, obj): # მოდელში გვაქვს get_full_path
        return obj.get_full_path()
    get_full_path_admin.short_description = _('Full Path')


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone_number', 'email', 'website_link')
    search_fields = ('name', 'contact_person', 'phone_number', 'email')

    def website_link(self, obj):
        if obj.website:
            return format_html('<a href="{0}" target="_blank">{0}</a>', obj.website)
        return "-"
    website_link.short_description = _('Website')


class EquipmentLogInline(admin.TabularInline):
    model = EquipmentLog
    extra = 0
    readonly_fields = ('user', 'timestamp', 'field_changed', 'old_value', 'new_value', 'change_type', 'notes')
    can_delete = False
    def has_add_permission(self, request, obj=None): return False
    def has_change_permission(self, request, obj=None): return False

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = (
        'asset_tag',
        'name',
        'category',
        'status',
        'current_location',
        'assigned_to',
        'serial_number',
        'purchase_date',
        'warranty_expiry_date',
    )
    list_filter = ('category', 'status', 'current_location', 'supplier', 'purchase_date', 'warranty_expiry_date')
    search_fields = (
        'name',
        'asset_tag',
        'serial_number',
        'notes',
        'category__name',
        'status__name',
        'current_location__name',
        'assigned_to__username',
        'supplier__name'
    )
    autocomplete_fields = ['category', 'status', 'current_location', 'supplier', 'assigned_to', 'added_by', 'updated_by']
    readonly_fields = ('date_added', 'last_updated', 'added_by', 'updated_by')
    fieldsets = (
        (_("Core Information"), {
            'fields': ('name', 'asset_tag', 'serial_number', 'category', 'status')
        }),
        (_("Assignment & Location"), {
            'fields': ('current_location', 'assigned_to')
        }),
        (_("Purchase & Warranty"), {
            'fields': ('supplier', 'purchase_date', 'purchase_cost', 'warranty_expiry_date')
        }),
        (_("Notes"), {
            'fields': ('notes',)
        }),
        (_("Record Keeping"), {
            'fields': ('date_added', 'added_by', 'last_updated', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    inlines = [EquipmentLogInline]

    def save_model(self, request, obj, form, change):
        if not obj.pk: # Object is being created
            obj.added_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, EquipmentLog): # Check if it's an EquipmentLog instance
                 if not instance.pk and hasattr(request, 'user'): # If new and user exists
                     instance.user = request.user
            instance.save()
        formset.save_m2m()


class StockTransactionInline(admin.TabularInline):
    model = StockTransaction
    extra = 0
    readonly_fields = ('user', 'timestamp', 'transaction_type', 'quantity_changed', 'related_request_link', 'notes') # 'new_quantity_after' ამოღებულია
    can_delete = False
    def has_add_permission(self, request, obj=None): return False
    def has_change_permission(self, request, obj=None): return False

    def related_request_link(self, obj):
        if obj.related_request:
            link = reverse("admin:requests_app_request_change", args=[obj.related_request.id])
            return format_html('<a href="{}">REQ-{}</a>', link, obj.related_request.id)
        return "-"
    related_request_link.short_description = _('Related Request')


@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'current_quantity', 'reorder_level', 'unit_price', 'supplier', 'last_restocked_date')
    list_filter = ('category', 'supplier', 'is_active')
    search_fields = ('name', 'sku', 'description', 'category__name', 'supplier__name')
    autocomplete_fields = ['category', 'supplier', 'managed_by', 'storage_location'] # დავამატე storage_location
    readonly_fields = ('last_restocked_date', 'created_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('name', 'sku', 'description', 'category', 'is_active')}),
        (_("Stock Control"), {'fields': ('current_quantity', 'reorder_level', 'minimum_stock_level', 'maximum_stock_level')}),
        (_("Location & Management"), {'fields': ('storage_location', 'managed_by')}), # დავამატე სექცია
        (_("Financial & Supplier"), {'fields': ('unit_price', 'supplier')}),
        (_("Dates"), {'fields': ('last_restocked_date', 'created_at', 'updated_at'), 'classes': ('collapse',)})
    )
    inlines = [StockTransactionInline]

    def save_model(self, request, obj, form, change):
        # current_quantity-ს განახლება აქ არ ხდება, ეს StockTransaction-ის ლოგიკა უნდა იყოს
        super().save_model(request, obj, form, change)


@admin.register(EquipmentLog)
class EquipmentLogAdmin(admin.ModelAdmin):
    list_display = ('equipment_link', 'user', 'timestamp', 'field_changed', 'old_value', 'new_value', 'get_change_type_display_admin') # შევცვალე change_type_display
    list_filter = ('timestamp', 'user', 'change_type', 'field_changed')
    search_fields = ('equipment__asset_tag', 'equipment__name', 'user__username', 'old_value', 'new_value', 'notes')
    readonly_fields = ('equipment', 'user', 'timestamp', 'field_changed', 'old_value', 'new_value', 'change_type', 'notes')

    def equipment_link(self, obj):
        if obj.equipment:
            link = reverse("admin:inventory_equipment_change", args=[obj.equipment.id])
            return format_html('<a href="{}">{}</a>', link, obj.equipment.asset_tag_or_name())
        return "-"
    equipment_link.short_description = _('Equipment')
    equipment_link.admin_order_field = 'equipment'

    # def change_type_display(self, obj): # ეს მეთოდი მოდელშია
    #     return obj.get_change_type_display()
    # change_type_display.short_description = _('Change Type')
    # change_type_display.admin_order_field = 'change_type'

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ('stock_item_link', 'get_transaction_type_display_admin', 'quantity_changed', 'user', 'timestamp', 'related_request_link') # შევცვალე transaction_type_display
    list_filter = ('timestamp', 'transaction_type', 'user', 'stock_item__category')
    search_fields = ('stock_item__name', 'stock_item__sku', 'user__username', 'notes', 'related_request__id')
    readonly_fields = ('stock_item', 'user', 'timestamp', 'transaction_type', 'quantity_changed', 'related_request', 'notes') # 'new_quantity_after' ამოღებულია

    def stock_item_link(self, obj):
        if obj.stock_item:
            link = reverse("admin:inventory_stockitem_change", args=[obj.stock_item.id])
            return format_html('<a href="{}">{}</a>', link, obj.stock_item.name)
        return "-"
    stock_item_link.short_description = _('Stock Item')
    stock_item_link.admin_order_field = 'stock_item'

    # def transaction_type_display(self, obj): # ეს მეთოდი მოდელშია
    #     return obj.get_transaction_type_display()
    # transaction_type_display.short_description = _('Transaction Type')
    # transaction_type_display.admin_order_field = 'transaction_type'

    def related_request_link(self, obj):
        if obj.related_request:
            link = reverse("admin:requests_app_request_change", args=[obj.related_request.id])
            return format_html('<a href="{}">REQ-{}</a>', link, obj.related_request.id)
        return "-"
    related_request_link.short_description = _('Related Request')

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

@admin.register(DecommissionLog)
class DecommissionLogAdmin(admin.ModelAdmin):
    list_display = ('equipment_link', 'decommission_date', 'reason_summary', 'decommissioned_by', 'method_of_disposal') # დავამატე method_of_disposal
    list_filter = ('decommission_date', 'decommissioned_by', 'method_of_disposal') # დავამატე method_of_disposal
    search_fields = ('equipment__asset_tag', 'equipment__name', 'reason', 'decommissioned_by__username')
    readonly_fields = ('equipment', 'decommission_date', 'reason', 'decommissioned_by', 'notes', 'method_of_disposal', 'disposal_certificate_id') # დავამატე ველები
    autocomplete_fields = ['equipment', 'decommissioned_by']

    def equipment_link(self, obj):
        if obj.equipment:
            link = reverse("admin:inventory_equipment_change", args=[obj.equipment.id])
            return format_html('<a href="{}">{}</a>', link, obj.equipment.asset_tag_or_name())
        return "-"
    equipment_link.short_description = _('Equipment')

    def reason_summary(self, obj):
        return (obj.reason[:75] + '...') if obj.reason and len(obj.reason) > 75 else obj.reason
    reason_summary.short_description = _('Reason')

    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False