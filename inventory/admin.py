from django.contrib import admin
from django.urls import reverse
from .models import Category, Status, Location, Supplier, Equipment, StockItem, EquipmentLog, StockTransaction, DecommissionLog
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon_display', 'description_summary')
    search_fields = ('name', 'description')

    def description_summary(self, obj):
        return (obj.description[:75] + '...') if obj.description and len(obj.description) > 75 else obj.description
    description_summary.short_description = _('Description')

    def icon_display(self, obj):
        if obj.icon:
            return format_html('<i class="{}"></i> ({})', obj.icon, obj.icon)
        return "-"
    icon_display.short_description = _('Icon')

    def has_module_permission(self, request):
        """
        Show in admin index if user has any permission for this specific model.
        """
        return (
            request.user.has_perm(f'{self.opts.app_label}.view_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.add_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.change_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.delete_{self.opts.model_name}')
        )

@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'description_summary', 'is_active_for_use', 'is_marked_for_write_off', 'is_decommissioned', 'is_in_storage')
    list_filter = ('is_active_for_use', 'is_marked_for_write_off', 'is_decommissioned', 'is_in_storage')
    search_fields = ('name', 'description')

    def description_summary(self, obj):
        return (obj.description[:75] + '...') if obj.description and len(obj.description) > 75 else obj.description
    description_summary.short_description = _('Description')

    def has_module_permission(self, request):
        """
        Show in admin index if user has any permission for this specific model.
        """
        return (
            request.user.has_perm(f'{self.opts.app_label}.view_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.add_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.change_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.delete_{self.opts.model_name}')
        )

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_full_path_admin', 'address_summary', 'notes_summary')
    search_fields = ('name', 'address', 'notes')
    list_filter = ('parent_location',)
    autocomplete_fields = ['parent_location']

    # ... (სხვა მეთოდები, როგორიცაა address_summary, notes_summary, get_full_path_admin) ...
    def address_summary(self, obj): # დავამატე ეს მეთოდები, რადგან ისინი თქვენს წინა კოდში იყო
        return (obj.address[:75] + '...') if obj.address and len(obj.address) > 75 else obj.address
    address_summary.short_description = _('Address')

    def notes_summary(self, obj):
        return (obj.notes[:75] + '...') if obj.notes and len(obj.notes) > 75 else obj.notes
    notes_summary.short_description = _('Notes')

    def get_full_path_admin(self, obj):
        return obj.get_full_path()
    get_full_path_admin.short_description = _('Full Path')


    def has_module_permission(self, request):
        """
        Show in admin index if user has any permission for this specific model.
        """
        return (
            request.user.has_perm(f'{self.opts.app_label}.view_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.add_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.change_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.delete_{self.opts.model_name}')
        )

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone_number', 'email', 'website_link')
    search_fields = ('name', 'contact_person', 'phone_number', 'email')

    # ... (სხვა მეთოდები, როგორიცაა website_link) ...
    def website_link(self, obj): # დავამატე ეს მეთოდი
        if obj.website:
            return format_html('<a href="{0}" target="_blank">{0}</a>', obj.website)
        return "-"
    website_link.short_description = _('Website')

    def has_module_permission(self, request):
        """
        Show in admin index if user has any permission for this specific model.
        """
        return (
            request.user.has_perm(f'{self.opts.app_label}.view_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.add_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.change_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.delete_{self.opts.model_name}')
        )

# --- EquipmentAdmin, StockItemAdmin, EquipmentLogAdmin, StockTransactionAdmin, DecommissionLogAdmin ---
# ამ კლასებსაც შეგიძლიათ დაამატოთ იგივე has_module_permission მეთოდი, თუ გსურთ,
# რომ მათი ჩვენებაც კონკრეტულ უფლებებზე იყოს დამოკიდებული.
# მაგალითად, EquipmentAdmin-ისთვის:

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    # ... (თქვენი არსებული EquipmentAdmin-ის კონფიგურაცია) ...
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
    # ... fieldsets, inlines, save_model, save_formset ...

    def has_module_permission(self, request):
        """
        Show in admin index if user has any permission for this specific model.
        """
        return (
            request.user.has_perm(f'{self.opts.app_label}.view_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.add_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.change_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.delete_{self.opts.model_name}')
        )

# დანარჩენი ModelAdmin კლასები (StockItemAdmin, EquipmentLogAdmin, StockTransactionAdmin, DecommissionLogAdmin)
# უცვლელი რჩება, თუ მათთვის ამ ეტაპზე არ გსურთ has_module_permission-ის გადაფარვა,
# ან შეგიძლიათ დაამატოთ იგივე ლოგიკა მათთვისაც.
# ქვემოთ მოცემულია თქვენი ფაილის დანარჩენი ნაწილი უცვლელად, გარდა იმისა, რომ დავამატე
# hi_module_permission მეთოდები ზემოთ ხსენებულ კლასებში.

class EquipmentLogInline(admin.TabularInline):
    model = EquipmentLog
    extra = 0
    readonly_fields = ('user', 'timestamp', 'field_changed', 'old_value', 'new_value', 'change_type', 'notes')
    can_delete = False
    def has_add_permission(self, request, obj=None): return False
    def has_change_permission(self, request, obj=None): return False

# EquipmentAdmin-ს ზემოთ დავამატე has_module_permission

class StockTransactionInline(admin.TabularInline):
    model = StockTransaction
    extra = 0
    readonly_fields = ('user', 'timestamp', 'transaction_type', 'quantity_changed', 'related_request_link', 'notes')
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
    autocomplete_fields = ['category', 'supplier', 'managed_by', 'storage_location']
    readonly_fields = ('last_restocked_date', 'created_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('name', 'sku', 'description', 'category', 'is_active')}),
        (_("Stock Control"), {'fields': ('current_quantity', 'reorder_level', 'minimum_stock_level', 'maximum_stock_level')}),
        (_("Location & Management"), {'fields': ('storage_location', 'managed_by')}),
        (_("Financial & Supplier"), {'fields': ('unit_price', 'supplier')}),
        (_("Dates"), {'fields': ('last_restocked_date', 'created_at', 'updated_at'), 'classes': ('collapse',)})
    )
    inlines = [StockTransactionInline]

    # def save_model(self, request, obj, form, change): # ეს მეთოდი თქვენს ბოლო ვერსიაში არ იყო StockItemAdmin-ში
    #     super().save_model(request, obj, form, change)

    def has_module_permission(self, request): # დავამატე StockItemAdmin-საც
        """
        Show in admin index if user has any permission for this specific model.
        """
        return (
            request.user.has_perm(f'{self.opts.app_label}.view_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.add_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.change_{self.opts.model_name}') or
            request.user.has_perm(f'{self.opts.app_label}.delete_{self.opts.model_name}')
        )


@admin.register(EquipmentLog)
class EquipmentLogAdmin(admin.ModelAdmin):
    list_display = ('equipment_link', 'user', 'timestamp', 'field_changed', 'old_value', 'new_value', 'get_change_type_display_name') # შევცვალე სახელი
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

    def get_change_type_display_name(self, obj): # შევცვალე სახელი get_change_type_display-დან
        return obj.get_change_type_display()
    get_change_type_display_name.short_description = _('Change Type')
    get_change_type_display_name.admin_order_field = 'change_type'


    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False # თქვენს ბოლო ვერსიაში ეს True იყო, დავაბრუნე False-ზე ლოგებისთვის
    def has_delete_permission(self, request, obj=None): return False

    def has_module_permission(self, request): # დავამატე EquipmentLogAdmin-საც
        """
        Show in admin index if user has any permission for this specific model.
        Logs might often be view-only for certain staff.
        """
        return request.user.has_perm(f'{self.opts.app_label}.view_{self.opts.model_name}')


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ('stock_item_link', 'get_transaction_type_display_name', 'quantity_changed', 'user', 'timestamp', 'related_request_link') # შევცვალე სახელი
    list_filter = ('timestamp', 'transaction_type', 'user', 'stock_item__category')
    search_fields = ('stock_item__name', 'stock_item__sku', 'user__username', 'notes', 'related_request__id')
    readonly_fields = ('stock_item', 'user', 'timestamp', 'transaction_type', 'quantity_changed', 'related_request', 'notes')

    def stock_item_link(self, obj):
        if obj.stock_item:
            link = reverse("admin:inventory_stockitem_change", args=[obj.stock_item.id])
            return format_html('<a href="{}">{}</a>', link, obj.stock_item.name)
        return "-"
    stock_item_link.short_description = _('Stock Item')
    stock_item_link.admin_order_field = 'stock_item'

    def get_transaction_type_display_name(self, obj): # შევცვალე სახელი get_transaction_type_display-დან
        return obj.get_transaction_type_display()
    get_transaction_type_display_name.short_description = _('Transaction Type')
    get_transaction_type_display_name.admin_order_field = 'transaction_type'

    def related_request_link(self, obj):
        if obj.related_request:
            link = reverse("admin:requests_app_request_change", args=[obj.related_request.id])
            return format_html('<a href="{}">REQ-{}</a>', link, obj.related_request.id)
        return "-"
    related_request_link.short_description = _('Related Request')

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False # თქვენს ბოლო ვერსიაში ეს True იყო, დავაბრუნე False-ზე ლოგებისთვის
    def has_delete_permission(self, request, obj=None): return False

    def has_module_permission(self, request): # დავამატე StockTransactionAdmin-საც
        """
        Show in admin index if user has any permission for this specific model.
        Logs might often be view-only for certain staff.
        """
        return request.user.has_perm(f'{self.opts.app_label}.view_{self.opts.model_name}')


@admin.register(DecommissionLog)
class DecommissionLogAdmin(admin.ModelAdmin):
    list_display = ('equipment_link', 'decommission_date', 'reason_summary', 'decommissioned_by_user_display', 'method_of_disposal_display')
    list_filter = ('decommission_date', 'decommissioned_by', 'method_of_disposal')
    search_fields = ('equipment__asset_tag', 'equipment__name', 'reason', 'decommissioned_by__username', 'notes', 'disposal_certificate_id')
    readonly_fields = ('equipment', 'decommission_date', 'reason', 'decommissioned_by', 'notes', 'method_of_disposal', 'disposal_certificate_id')
    autocomplete_fields = ['equipment', 'decommissioned_by']

    def equipment_link(self, obj):
        if obj.equipment:
            link = reverse("admin:inventory_equipment_change", args=[obj.equipment.id])
            return format_html('<a href="{}">{}</a>', link, obj.equipment.asset_tag_or_name())
        return "-"
    equipment_link.short_description = _('Equipment (Asset Tag)')
    equipment_link.admin_order_field = 'equipment__asset_tag'

    def reason_summary(self, obj):
        return (obj.reason[:75] + '...') if obj.reason and len(obj.reason) > 75 else obj.reason
    reason_summary.short_description = _('Reason')

    def decommissioned_by_user_display(self, obj):
        return obj.decommissioned_by.username if obj.decommissioned_by else "-"
    decommissioned_by_user_display.short_description = _('Decommissioned By')
    decommissioned_by_user_display.admin_order_field = 'decommissioned_by__username'

    def method_of_disposal_display(self, obj):
        return obj.method_of_disposal if obj.method_of_disposal else "-"
    method_of_disposal_display.short_description = _('Method of Disposal')
    method_of_disposal_display.admin_order_field = 'method_of_disposal'


    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        # Allow viewing but not changing existing logs through admin
        return True # თქვენს ბოლო ვერსიაში True იყო, ვტოვებ ასე
    def has_delete_permission(self, request, obj=None):
        return False

    def has_module_permission(self, request): # დავამატე DecommissionLogAdmin-საც
        """
        Show in admin index if user has any permission for this specific model.
        Logs might often be view-only for certain staff.
        """
        return request.user.has_perm(f'{self.opts.app_label}.view_{self.opts.model_name}')
