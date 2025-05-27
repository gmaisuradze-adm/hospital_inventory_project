from django.db import models
from django.conf import settings # For added_by/updated_by
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils import timezone # For default date_added

class StockItemCategory(models.Model):
    name = models.CharField(
        _("Category Name"),
        max_length=100,
        unique=True,
        help_text=_("Category of the stock item (e.g., Cables, Toners, Peripherals).")
    )
    description = models.TextField(
        _("Description"),
        blank=True,
        null=True,
        help_text=_("Optional: A brief description of the category.")
    )

    class Meta:
        verbose_name = _("Stock Item Category")
        verbose_name_plural = _("Stock Item Categories")
        ordering = ['name']

    def __str__(self):
        return self.name

class StockItemSupplier(models.Model):
    name = models.CharField(
        _("Supplier Name"),
        max_length=150,
        unique=True
    )
    contact_person = models.CharField(
        _("Contact Person"),
        max_length=100,
        blank=True,
        null=True,
        help_text=_("Primary contact person at the supplier.")
    )
    phone_number = models.CharField(
        _("Phone Number"),
        max_length=20,
        blank=True,
        null=True
    )
    email = models.EmailField(
        _("Email Address"),
        blank=True,
        null=True
    )
    address = models.TextField( # Consider splitting into structured address fields if needed
        _("Address"),
        blank=True,
        null=True,
        help_text=_("Full address of the supplier.")
    )

    class Meta:
        verbose_name = _("Stock Item Supplier")
        verbose_name_plural = _("Stock Item Suppliers")
        ordering = ['name']

    def __str__(self):
        return self.name

class StockItem(models.Model):
    item_id = models.CharField(
        _("Item ID / SKU"),
        max_length=50,
        unique=True,
        help_text=_("Unique identifier for the stock item (e.g., SKU, part number).")
    )
    name = models.CharField(
        _("Item Name"),
        max_length=200,
        help_text=_("Name of the stock item (e.g., USB-C Cable, HP 85A Toner Cartridge).")
    )
    description = models.TextField(
        _("Description"),
        blank=True,
        null=True
    )
    
    category = models.ForeignKey(
        StockItemCategory,
        verbose_name=_("Category"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True, # Making it optional
        related_name="stock_items",
        help_text=_("Select the category for this item.")
    )
    supplier = models.ForeignKey(
        StockItemSupplier,
        verbose_name=_("Supplier"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True, # Making it optional
        related_name="supplied_stock_items",
        help_text=_("Select the supplier for this item.")
    )
    
    quantity_on_hand = models.PositiveIntegerField(
        _("Quantity on Hand"),
        default=0,
        help_text=_("Current quantity in stock.")
    )
    minimum_stock_level = models.PositiveIntegerField(
        _("Minimum Stock Level"),
        default=1, # Or 0 if items can have no minimum
        help_text=_("Minimum quantity before reordering is needed.")
    )
    
    unit_price = models.DecimalField(
        _("Unit Price"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Price per unit. Enter 0 if not applicable or free.")
    )
    
    storage_location = models.CharField(
        _("Storage Location"),
        max_length=100,
        blank=True,
        null=True,
        help_text=_("Physical location in the warehouse (e.g., Shelf A1, Bin 3).")
    )
    
    last_restocked_date = models.DateField(
        _("Last Restocked Date"),
        null=True,
        blank=True,
        help_text=_("Date when the item was last restocked.")
    )
    expiry_date = models.DateField(
        _("Expiry Date"),
        null=True,
        blank=True,
        help_text=_("For perishable items. Leave blank if not applicable.")
    )
    
    notes = models.TextField(
        _("Notes"),
        blank=True,
        null=True,
        help_text=_("Any additional notes about this stock item.")
    )
    
    # Auto-managed fields (date_added was auto_now_add, which is good)
    date_added = models.DateTimeField(
        _("Date Added"),
        default=timezone.now, # Changed from auto_now_add to default for consistency with Equipment, still acts similarly on creation
        editable=False
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Added By"),
        related_name='added_stock_items',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False
    )
    last_updated = models.DateTimeField(
        _("Last Updated"),
        auto_now=True, # This is correct for updates
        editable=False
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Last Updated By"),
        related_name='updated_stock_items',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False
    )

    class Meta:
        verbose_name = _("Stock Item")
        verbose_name_plural = _("Stock Items")
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.item_id}) - Qty: {self.quantity_on_hand}"

    @property
    def is_below_minimum_stock(self):
        return self.quantity_on_hand < self.minimum_stock_level

    def clean(self):
        # Model-level validation (PositiveIntegerField already handles > 0)
        # The clean methods for quantity_on_hand and minimum_stock_level in the original were redundant
        # because PositiveIntegerField enforces non-negativity at the database level.
        # However, if you wanted custom messages or checks (e.g. min_stock < some_other_field), clean() is the place.
        if self.expiry_date and self.last_restocked_date and self.expiry_date < self.last_restocked_date:
            raise ValidationError({
                'expiry_date': _("Expiry date cannot be before the last restocked date."),
                'last_restocked_date': _("Last restocked date cannot be after the expiry date.")
            })
        super().clean()


    def get_absolute_url(self):
        return reverse('warehouse:stockitem_detail', kwargs={'pk': self.pk})
