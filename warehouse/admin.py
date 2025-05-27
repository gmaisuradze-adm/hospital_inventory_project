# Version: 1.1 - 2025-05-26 09:11:55 UTC - gmaisuradze-adm - Corrected list_filter for is_below_minimum_stock.
from django.contrib import admin
from .models import StockItem, StockItemCategory, StockItemSupplier
from django.utils.translation import gettext_lazy as _

@admin.register(StockItemCategory)
class StockItemCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(StockItemSupplier)
class StockItemSupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone_number', 'email')
    search_fields = ('name', 'contact_person', 'email')

# Custom filter for is_below_minimum_stock
class IsBelowMinimumStockFilter(admin.SimpleListFilter):
    title = _('stock level') # Title for the filter
    parameter_name = 'stock_level' # URL parameter

    def lookups(self, request, model_admin):
        """
        Returns a list of tuples. The first element in each
        tuple is the coded value for the option that will
        appear in the URL query. The second element is the
        human-readable name for the option that will appear
        in the right sidebar.
        """
        return (
            ('below', _('Below minimum stock')),
            ('at_or_above', _('At or above minimum stock')),
        )

    def queryset(self, request, queryset):
        """
        Returns the filtered queryset based on the value
        provided in the query string and retrievable via
        `self.value()`.
        """
        if self.value() == 'below':
            # This requires comparing two fields, which can be done using F expressions
            from django.db.models import F
            return queryset.filter(quantity_on_hand__lt=F('minimum_stock_level'))
        if self.value() == 'at_or_above':
            from django.db.models import F
            return queryset.filter(quantity_on_hand__gte=F('minimum_stock_level'))
        return queryset


@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = (
        'item_id', 
        'name', 
        'category', 
        'quantity_on_hand', 
        'minimum_stock_level', 
        'is_below_minimum_stock', # This is fine for display
        'supplier',
        'storage_location',
        'last_updated'
    )
    # Corrected list_filter: removed 'is_below_minimum_stock' and added the custom filter
    list_filter = ('category', 'supplier', IsBelowMinimumStockFilter, 'last_restocked_date')
    search_fields = ('item_id', 'name', 'description', 'supplier__name')
    autocomplete_fields = ['category', 'supplier']
    readonly_fields = ('date_added', 'last_updated', 'is_below_minimum_stock') # is_below_minimum_stock is fine in readonly_fields
    
    fieldsets = (
        ("Item Identification", {
            'fields': ('item_id', 'name', 'description', 'category')
        }),
        ("Stock Management", {
            'fields': ('quantity_on_hand', 'minimum_stock_level', 'is_below_minimum_stock', 'storage_location')
        }),
        ("Supplier & Pricing", {
            'fields': ('supplier', 'unit_price', 'last_restocked_date', 'expiry_date')
        }),
        ("Additional Information", {
            'fields': ('notes',)
        }),
        ("Timestamps", {
            'fields': ('date_added', 'last_updated'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'supplier')