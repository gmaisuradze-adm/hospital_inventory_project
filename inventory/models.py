from django.db import models
from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _ # Added for translations

class Category(models.Model):
    name = models.CharField(
        _("Category Name"),
        max_length=100,
        unique=True,
        help_text=_("e.g., Laptops, Printers, Monitors")
    )
    description = models.TextField(
        _("Description"),
        blank=True,
        null=True,
        help_text=_("Optional: A brief description of the category.")
    )
    icon = models.CharField(
        _("Icon Class"),
        max_length=50,
        blank=True,
        null=True,
        help_text=_("Font Awesome icon class (e.g., 'fas fa-laptop'). Search icons at fontawesome.com.")
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        ordering = ['name']

class Status(models.Model):
    name = models.CharField(
        _("Status Name"),
        max_length=50,
        unique=True,
        help_text=_("e.g., In Use, In Storage, Under Repair, Decommissioned")
    )
    description = models.TextField(
        _("Description"),
        blank=True,
        null=True,
        help_text=_("Optional: A brief description of the status.")
    )
    is_active = models.BooleanField(
        _("Is Active Status"),
        default=True,
        help_text=_("Designates if this status means the equipment is actively usable.")
    )
    is_decommissioned = models.BooleanField(
        _("Is Decommissioned Status"),
        default=False,
        help_text=_("Designates if this status means the equipment is permanently out of service.")
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Status")
        verbose_name_plural = _("Statuses")
        ordering = ['name']

class Location(models.Model):
    name = models.CharField(
        _("Location Name"),
        max_length=100,
        unique=True,
        help_text=_("e.g., Main Building, West Wing, IT Department")
    )
    address = models.CharField(
        _("Address"),
        max_length=255,
        blank=True,
        null=True,
        help_text=_("Physical address of the location, if applicable.")
    )
    floor = models.CharField(
        _("Floor"),
        max_length=50,
        blank=True,
        null=True,
        help_text=_("Floor number or name.")
    )
    room_number = models.CharField(
        _("Room Number/Name"),
        max_length=50,
        blank=True,
        null=True,
        help_text=_("Specific room number or name within the location.")
    )
    notes = models.TextField(
        _("Notes"),
        blank=True,
        null=True,
        help_text=_("Any additional notes about this location.")
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Location")
        verbose_name_plural = _("Locations")
        ordering = ['name']

class Supplier(models.Model):
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
        max_length=20, # Consider E.164 format or more flexible validation
        blank=True,
        null=True
    )
    email = models.EmailField(
        _("Email Address"),
        blank=True,
        null=True
    )
    website = models.URLField(
        _("Website URL"),
        blank=True,
        null=True
    )
    notes = models.TextField(
        _("Notes"),
        blank=True,
        null=True,
        help_text=_("Any additional notes about this supplier.")
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Supplier")
        verbose_name_plural = _("Suppliers")
        ordering = ['name']

class Equipment(models.Model):
    name = models.CharField(
        _("Equipment Name"),
        max_length=200,
        help_text=_("Descriptive name of the equipment (e.g., Dell Latitude 5590).")
    )
    asset_tag = models.CharField(
        _("Asset Tag"),
        max_length=50,
        unique=True,
        help_text=_("Unique internal identifier for tracking the equipment.")
    )
    serial_number = models.CharField(
        _("Serial Number"),
        max_length=100,
        blank=True,
        null=True,
        unique=True, # Ensure this is desired; if serials can be non-unique or unknown, remove 'unique=True'
        help_text=_("Manufacturer's serial number. Leave blank if not available or applicable.")
    )
    
    category = models.ForeignKey(
        Category,
        verbose_name=_("Category"),
        on_delete=models.SET_NULL, # Consider models.PROTECT if a category should not be deleted if equipment exists
        null=True,
        blank=True, # Making it optional to assign a category initially
        related_name="equipment",
        help_text=_("Select the category this equipment belongs to.")
    )
    status = models.ForeignKey(
        Status,
        verbose_name=_("Status"),
        on_delete=models.SET_NULL, # Consider models.PROTECT
        null=True,
        blank=False, # Typically, status is required. Set a default if possible.
        related_name="equipment",
        help_text=_("Current status of the equipment.")
    )
    
    current_location = models.ForeignKey(
        Location,
        verbose_name=_("Current Location"),
        on_delete=models.SET_NULL, # Consider models.PROTECT
        null=True,
        blank=True, # Optional, as equipment might be in transit or unassigned
        related_name="equipment_at_location",
        help_text=_("Where the equipment is currently located.")
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Assigned To"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_equipment",
        help_text=_("User to whom this equipment is currently assigned.")
    )
    
    supplier = models.ForeignKey(
        Supplier,
        verbose_name=_("Supplier"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supplied_equipment",
        help_text=_("Supplier from whom this equipment was purchased.")
    )
    purchase_date = models.DateField(
        _("Purchase Date"),
        null=True,
        blank=True,
        help_text=_("Date when the equipment was purchased.")
    )
    purchase_cost = models.DecimalField(
        _("Purchase Cost"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Cost of the equipment at the time of purchase.")
    )
    warranty_expiry_date = models.DateField(
        _("Warranty Expiry Date"),
        null=True,
        blank=True,
        help_text=_("Date when the manufacturer's warranty expires.")
    )
    
    notes = models.TextField(
        _("Notes"),
        blank=True,
        null=True,
        help_text=_("Any additional notes or comments about the equipment.")
    )
    
    # Auto-managed fields
    date_added = models.DateTimeField(
        _("Date Added"),
        default=timezone.now,
        editable=False
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Added By"),
        related_name='added_equipment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True, # Should be populated by the view
        editable=False
    )
    last_updated = models.DateTimeField(
        _("Last Updated"),
        auto_now=True,
        editable=False
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Last Updated By"),
        related_name='updated_equipment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True, # Should be populated by the view
        editable=False
    )

    def __str__(self):
        return f"{self.name} ({self.asset_tag})"

    def get_absolute_url(self):
        return reverse('inventory:equipment_detail', kwargs={'pk': self.pk})

    def save(self, *args, **kwargs):
        # Example of potential automation:
        # If status is 'Decommissioned' and warranty_expiry_date is not set,
        # you might want to set it or clear it, depending on business logic.
        # For now, we keep it simple.
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = _("Equipment Item")
        verbose_name_plural = _("Equipment Items")
        ordering = ['name', 'asset_tag']
