# inventory/models.py

from django.db import models
from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.db import transaction
import re # რეგულარული გამოსახულებებისთვის (დაგვჭირდება ნომრის პარსინგისთვის)

# ... (Category, Status, Location, Supplier მოდელები უცვლელია) ...
class Category(models.Model):
    name = models.CharField(
        _("Category Name"),
        max_length=100,
        unique=True,
        help_text=_("ტექნიკის ფიზიკური კატეგორიის დასახელება (მაგ., ლეპტოპი, პრინტერი, მონიტორი).")
    )
    description = models.TextField(
        _("Description"),
        blank=True,
        null=True,
        help_text=_("კატეგორიის მოკლე აღწერა (არასავალდებულო).")
    )
    icon = models.CharField(
        _("Icon Class (Optional)"),
        max_length=50,
        blank=True,
        null=True,
        help_text=_("Font Awesome ან მსგავსი ბიბლიოთეკის ხატულას კლასი (მაგ., 'fas fa-laptop').")
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Equipment Category")
        verbose_name_plural = _("Equipment Categories")
        ordering = ['name']

class Status(models.Model):
    name = models.CharField(
        _("Status Name"),
        max_length=50,
        unique=True,
        help_text=_("ტექნიკის მიმდინარე მდგომარეობის დასახელება (მაგ., ექსპლუატაციაშია, საწყობშია, რემონტშია, ჩამოწერილია).")
    )
    description = models.TextField(
        _("Description"),
        blank=True,
        null=True,
        help_text=_("სტატუსის მოკლე აღწერა (არასავალდებულო).")
    )
    is_active_for_use = models.BooleanField(
        _("Is Active for Use"),
        default=False,
        help_text=_("აღნიშნავს, რომ ამ სტატუსის მქონე ტექნიკა გამოსაყენებლად ვარგისია/მზადაა (მაგ. 'ექსპლუატაციაშია').")
    )
    is_decommissioned = models.BooleanField(
        _("Is Decommissioned"),
        default=False,
        help_text=_("აღნიშნავს, რომ ამ სტატუსის მქონე ტექნიკა სამუდამოდ გამოსულია მწყობრიდან/ჩამოწერილია.")
    )
    is_in_storage = models.BooleanField(
        _("Is In Storage"),
        default=False,
        help_text=_("აღნიშნავს, რომ ამ სტატუსის მქონე ტექნიკა საწყობში ინახება და ხელმისაწვდომია გასაცემად.")
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Equipment Status")
        verbose_name_plural = _("Equipment Statuses")
        ordering = ['name']

class Location(models.Model):
    name = models.CharField(
        _("Location/Department Name"),
        max_length=100,
        unique=True,
        help_text=_("დეპარტამენტის, შენობის, სართულის ან ოთახის დასახელება (მაგ., მთავარი შენობა, IT დეპარტამენტი, მე-3 სართული, ოთახი 301).")
    )
    parent_location = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='child_locations',
        verbose_name=_("Parent Location (Optional)"),
        help_text=_("თუ ეს ლოკაცია სხვა, უფრო დიდი ლოკაციის ნაწილია (მაგ., ოთახი სართულზე, სართული შენობაში).")
    )
    address = models.CharField(
        _("Address (Optional)"),
        max_length=255,
        blank=True,
        null=True,
        help_text=_("ფიზიკური მისამართი, თუ relevant (მაგ., შენობისთვის).")
    )
    notes = models.TextField(
        _("Notes (Optional)"),
        blank=True,
        null=True,
        help_text=_("დამატებითი შენიშვნები ამ ლოკაციის შესახებ.")
    )

    def __str__(self):
        return self.get_full_path()

    def get_full_path(self):
        path = [self.name]
        current = self.parent_location
        while current:
            path.append(current.name)
            current = current.parent_location
        return " -> ".join(reversed(path))
    get_full_path.short_description = _("Full Path")

    class Meta:
        verbose_name = _("Location/Department")
        verbose_name_plural = _("Locations/Departments")
        ordering = ['name']

class Supplier(models.Model):
    name = models.CharField(
        _("Supplier Name"),
        max_length=150,
        unique=True,
        help_text=_("მომწოდებელი კომპანიის დასახელება.")
    )
    contact_person = models.CharField(
        _("Contact Person (Optional)"),
        max_length=100,
        blank=True,
        null=True,
        help_text=_("მომწოდებლის საკონტაქტო პირი.")
    )
    phone_number = models.CharField(
        _("Phone Number (Optional)"),
        max_length=30,
        blank=True,
        null=True,
        help_text=_("საკონტაქტო ტელეფონის ნომერი.")
    )
    email = models.EmailField(
        _("Email Address (Optional)"),
        blank=True,
        null=True,
        help_text=_("საკონტაქტო ელექტრონული ფოსტა.")
    )
    website = models.URLField(
        _("Website URL (Optional)"),
        blank=True,
        null=True,
        help_text=_("მომწოდებლის ვებ-გვერდი.")
    )
    notes = models.TextField(
        _("Notes (Optional)"),
        blank=True,
        null=True,
        help_text=_("დამატებითი შენიშვნები ამ მომწოდებლის შესახებ.")
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Supplier")
        verbose_name_plural = _("Suppliers")
        ordering = ['name']


class Equipment(models.Model):
    name = models.CharField(
        _("Equipment Name/Model"),
        max_length=200,
        help_text=_("ტექნიკის აღწერითი სახელი ან მოდელი (მაგ., Dell Latitude 5590, HP LaserJet Pro M404dn).")
    )
    asset_tag = models.CharField(
        _("Asset Tag (Internal ID)"),
        max_length=50, # შეიძლება გაზრდა დაგჭირდეთ ფორმატის მიხედვით (მაგ., EQP-2025-00001)
        unique=True,
        blank=True,     # ფორმიდან ცარიელი იქნება, რადგან ავტომატურად გენერირდება
        editable=False, # შენახვის შემდეგ არ იქნება რედაქტირებადი
        help_text=_("ორგანიზაციის შიდა უნიკალური საინვენტარო ნომერი (ავტომატურად გენერირდება).")
    )
    serial_number = models.CharField(
        _("Serial Number (Optional)"),
        max_length=100,
        blank=True,
        null=True,
        help_text=_("მწარმოებლის სერიული ნომერი. დატოვეთ ცარიელი, თუ არ არსებობს ან არ გამოიყენება.")
    )
    category = models.ForeignKey(
        Category,
        verbose_name=_("Category"),
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="equipment_items",
        help_text=_("აირჩიეთ ტექნიკის კატეგორია.")
    )
    status = models.ForeignKey(
        Status,
        verbose_name=_("Status"),
        on_delete=models.PROTECT,
        null=True, # შეიძლება დაგჭირდეთ default სტატუსი
        blank=False,
        related_name="equipment_items_with_status",
        help_text=_("აირჩიეთ ტექნიკის მიმდინარე სტატუსი.")
    )
    current_location = models.ForeignKey(
        Location,
        verbose_name=_("Current Location (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="equipment_at_location",
        help_text=_("აირჩიეთ ტექნიკის მიმდინარე ფიზიკური ლოკაცია ან დეპარტამენტი.")
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Assigned To (User) (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_equipment",
        help_text=_("მომხმარებელი, რომელზეც ეს ტექნიკა ამჟამად არის მინიჭებული.")
    )
    supplier = models.ForeignKey(
        Supplier,
        verbose_name=_("Supplier (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supplied_equipment",
        help_text=_("აირჩიეთ მომწოდებელი, ვისგანაც ეს ტექნიკა იქნა შეძენილი.")
    )
    purchase_date = models.DateField(
        _("Purchase Date (Optional)"),
        null=True,
        blank=True,
        help_text=_("ტექნიკის შეძენის თარიღი.")
    )
    purchase_cost = models.DecimalField(
        _("Purchase Cost (Optional)"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("ტექნიკის შესყიდვის ღირებულება.")
    )
    warranty_expiry_date = models.DateField(
        _("Warranty Expiry Date (Optional)"),
        null=True,
        blank=True,
        help_text=_("მწარმოებლის გარანტიის ვადის ამოწურვის თარიღი.")
    )
    notes = models.TextField(
        _("Notes (Optional)"),
        blank=True,
        null=True,
        help_text=_("დამატებითი შენიშვნები ამ ტექნიკის შესახებ.")
    )
    date_added = models.DateTimeField(_("Date Added to System"), default=timezone.now, editable=False)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Added By"),
        related_name='equipment_added_by_user',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        help_text=_("მომხმარებელი, რომელმაც ეს ტექნიკა სისტემაში დაამატა.")
    )
    last_updated = models.DateTimeField(_("Last Updated"), auto_now=True, editable=False)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Last Updated By"),
        related_name='equipment_updated_by_user',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        help_text=_("მომხმარებელი, რომელმაც ბოლოს განაახლა ინფორმაცია ამ ტექნიკაზე.")
    )

    _original_status_id = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_status_id = self.status_id

    def _generate_asset_tag(self):
        """
        გენერირებს უნიკალურ asset_tag-ს ფორმატით EQP-YYYY-NNNNN.
        """
        current_year = timezone.now().year
        prefix = f"EQP-{current_year}-"
        
        # ვპოულობთ ამ წლის ბოლო ნომერს
        last_equipment_this_year = Equipment.objects.filter(asset_tag__startswith=prefix).order_by('asset_tag').last()
        
        next_number = 1
        if last_equipment_this_year and last_equipment_this_year.asset_tag:
            try:
                # ვცდილობთ ამოვიღოთ რიცხვითი ნაწილი პრეფიქსის შემდეგ
                # მაგალითად, EQP-2025-00123 -> 00123
                numeric_part_str = last_equipment_this_year.asset_tag.split(prefix)[-1]
                if numeric_part_str:
                    next_number = int(numeric_part_str) + 1
            except (ValueError, IndexError, TypeError):
                # თუ პარსირება ვერ მოხერხდა, ვიწყებთ 1-დან
                pass
        
        new_tag = f"{prefix}{next_number:05d}"
        # უნიკალურობის შემოწმება (race condition-ის შემთხვევაში)
        while Equipment.objects.filter(asset_tag=new_tag).exists():
            next_number += 1
            new_tag = f"{prefix}{next_number:05d}"
        return new_tag

    def save(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        is_new = self.pk is None

        if is_new:
            if user and not self.added_by_id:
                self.added_by = user
            if not self.asset_tag: # გენერაცია მხოლოდ მაშინ, თუ ცარიელია
                self.asset_tag = self._generate_asset_tag()
        
        if user and not is_new:
            self.updated_by = user

        current_status_id = self.status_id
        
        super().save(*args, **kwargs) # შენახვა

        # ლოგირების ლოგიკა (თქვენი არსებული კოდი)
        if not is_new and self._original_status_id != current_status_id:
            try:
                old_status_name = Status.objects.get(pk=self._original_status_id).name if self._original_status_id else _("N/A")
            except Status.DoesNotExist:
                old_status_name = _("N/A (Previous status deleted)")
            
            new_status_name = self.status.name if self.status else _("N/A")
            
            EquipmentLog.objects.create(
                equipment=self,
                user=user or self.updated_by, # უმჯობესია, თუ user ცნობილია
                change_type='status_changed',
                field_changed='status',
                old_value=old_status_name,
                new_value=new_status_name,
                notes=_("Status changed from '{old}' to '{new}'.").format(old=old_status_name, new=new_status_name)
            )
            if self.status and self.status.is_decommissioned:
                DecommissionLog.objects.update_or_create(
                    equipment=self,
                    defaults={
                        'decommission_date': timezone.now().date(),
                        'reason': _("Status set to decommissioned: {status_name}").format(status_name=self.status.name),
                        'decommissioned_by': user or self.updated_by,
                        'notes': _("Automatically logged due to status change.")
                    }
                )
        self._original_status_id = current_status_id


    def __str__(self):
        return f"{self.name} (Asset Tag: {self.asset_tag or _('Pending Generation')})"

    def asset_tag_or_name(self):
        return self.asset_tag if self.asset_tag else self.name

    def get_absolute_url(self):
        return reverse('inventory:equipment_detail', kwargs={'pk': self.pk})

    class Meta:
        verbose_name = _("Equipment (Tracked Item)")
        verbose_name_plural = _("Equipment (Tracked Items)")
        ordering = ['name', 'asset_tag']

# ... (StockItem, EquipmentLog, StockTransaction, DecommissionLog მოდელები უცვლელია ან თქვენი ლოგიკით) ...
class StockItem(models.Model):
    name = models.CharField(
        _("Stock Item Name"),
        max_length=200,
        help_text=_("სტოკის ერთეულის სახელწოდება ან მოკლე აღწერა (მაგ., 'მაუსი Logitech M185', 'კაბელი UTP Cat6 3მ', 'ტონერი HP 85A').")
    )
    category = models.ForeignKey(
        Category,
        verbose_name=_("General Category (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_items",
        help_text=_("აირჩიეთ ამ სტოკის ერთეულის ზოგადი კატეგორია.")
    )
    sku = models.CharField(
        _("SKU / Part Number (Optional)"),
        max_length=100,
        blank=True,
        null=True,
        unique=True, # თუ SKU უნიკალური უნდა იყოს, ეს კარგია
        help_text=_("საწყობის უნიკალური კოდი (SKU) ან მწარმოებლის ნაწილის ნომერი, თუ არსებობს.")
    )
    description = models.TextField(
        _("Description (Optional)"),
        blank=True,
        null=True,
        help_text=_("სტოკის ერთეულის დამატებითი აღწერა ან სპეციფიკაციები.")
    )
    current_quantity = models.PositiveIntegerField(
        _("Current Quantity on Hand"),
        default=0,
        help_text=_("ამ სტოკის ერთეულის მიმდინარე რაოდენობა საწყობში.")
    )
    reorder_level = models.PositiveIntegerField(
        _("Reorder Level for Alert"),
        default=0,
        help_text=_("რაოდენობა, რომელზე ჩამოსვლისას საჭიროა მარაგის შევსების შესახებ გაფრთხილება.")
    )
    minimum_stock_level = models.PositiveIntegerField(
        _("Minimum Stock Level (Optional)"),
        default=0,
        help_text=_("მინიმალური დასაშვები რაოდენობა, შეიძლება განსხვავდებოდეს reorder_level-გან.")
    )
    maximum_stock_level = models.PositiveIntegerField(
        _("Maximum Stock Level (Optional)"),
        null=True, blank=True,
        help_text=_("მაქსიმალური სასურველი რაოდენობა საწყობში.")
    )
    storage_location = models.ForeignKey(
        Location,
        verbose_name=_("Storage Location (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_items_at_location",
        help_text=_("აირჩიეთ ფიზიკური ლოკაცია, სადაც ეს სტოკის ერთეული ინახება.")
    )
    unit_price = models.DecimalField(
        _("Unit Price (Optional)"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("ერთი ერთეულის სავარაუდო ფასი, თუ საჭიროა ღირებულების აღრიცხვა.")
    )
    supplier = models.ForeignKey(
        Supplier,
        verbose_name=_("Preferred Supplier (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supplied_stock_items",
        help_text=_("აირჩიეთ ძირითადი მომწოდებელი ამ სტოკის ერთეულისთვის, თუ არსებობს.")
    )
    last_restocked_date = models.DateField(
        _("Last Restock Date (Optional)"),
        null=True,
        blank=True,
        help_text=_("თარიღი, როდესაც ბოლოს შეივსო ამ სტოკის ერთეულის მარაგი.")
    )
    notes = models.TextField(
        _("Notes (Optional)"),
        blank=True,
        null=True,
        help_text=_("დამატებითი შენიშვნები ამ სტოკის ერთეულის შესახებ.")
    )
    is_active = models.BooleanField(_("Is Active"), default=True, help_text=_("აღნიშნავს, გამოიყენება თუ არა ეს სტოკის ერთეული ამჟამად."))
    managed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Managed By (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_stock_items',
        help_text=_("მომხმარებელი, რომელიც პასუხისმგებელია ამ სტოკის ერთეულის მართვაზე.")
    )
    created_at = models.DateTimeField(_("Date Added"), default=timezone.now, editable=False)
    updated_at = models.DateTimeField(_("Last Updated"), auto_now=True, editable=False)

    def __str__(self):
        return f"{self.name} (SKU: {self.sku if self.sku else 'N/A'}) - Qty: {self.current_quantity}"

    class Meta:
        verbose_name = _("Stock Item (Consumable/Bulk)")
        verbose_name_plural = _("Stock Items (Consumables/Bulk)")
        ordering = ['name']

    def is_low_on_stock(self):
        if self.reorder_level == 0: # If reorder level is not set, it's never low.
            return False
        return self.current_quantity <= self.reorder_level

class EquipmentLog(models.Model):
    CHANGE_TYPE_CHOICES = [
        ('created', _('Created')),
        ('updated', _('Updated')),
        ('field_change', _('Field Changed')), # Less specific, prefer more specific types
        ('status_changed', _('Status Changed')),
        ('location_changed', _('Location Changed')),
        ('assigned', _('Assigned/Unassigned')),
        ('decommissioned', _('Decommissioned')), # This could be a specific log from DecommissionLog
        ('archived', _('Archived')), # If you have archiving functionality
        ('notes_added', _('Notes Added/Changed')),
        ('maintenance_log', _('Maintenance Logged')), # Example of a more specific type
        ('warranty_updated', _('Warranty Info Updated')), # Example
        ('other', _('Other')),
    ]
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='logs', verbose_name=_("Equipment"))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, verbose_name=_("User Performing Action"))
    timestamp = models.DateTimeField(default=timezone.now, verbose_name=_("Timestamp"), db_index=True)
    change_type = models.CharField(max_length=20, choices=CHANGE_TYPE_CHOICES, default='updated', verbose_name=_("Type of Change"))
    field_changed = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Field Changed (if applicable)"))
    old_value = models.TextField(blank=True, null=True, verbose_name=_("Old Value"))
    new_value = models.TextField(blank=True, null=True, verbose_name=_("New Value"))
    notes = models.TextField(blank=True, null=True, verbose_name=_("Change Notes or Details"))

    class Meta:
        ordering = ['-timestamp']
        verbose_name = _("Equipment Log Entry")
        verbose_name_plural = _("Equipment Log Entries")

    def __str__(self):
        user_display = self.user.get_username() if self.user else _('System')
        return f"Log for {self.equipment.asset_tag_or_name()} at {self.timestamp.strftime('%Y-%m-%d %H:%M')} by {user_display}"

    def get_change_type_display(self): # <<< ეს მეთოდი დამატებულია
        return dict(self.CHANGE_TYPE_CHOICES).get(self.change_type, self.change_type)

    def get_change_type_display_admin(self):
        return self.get_change_type_display()
    get_change_type_display_admin.short_description = _('Change Type')


class StockTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('initial', _('Initial Stock')),
        ('restock', _('Restock (Purchase/Receipt)')),
        ('issue', _('Issue (Usage/Consumption)')),
        ('adjustment_add', _('Inventory Adjustment (Add)')),
        ('adjustment_remove', _('Inventory Adjustment (Remove)')),
        ('return_to_stock', _('Return to Stock')),
        ('disposal', _('Disposal/Write-off')),
        ('transfer_out', _('Transfer Out')), # For moving between warehouses if you have multiple
        ('transfer_in', _('Transfer In')),   # For moving between warehouses
        ('audit_correction', _('Audit Correction')),
    ]
    stock_item = models.ForeignKey(StockItem, on_delete=models.CASCADE, related_name='transactions', verbose_name=_("Stock Item"))
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES, verbose_name=_("Transaction Type"))
    quantity_changed = models.IntegerField(verbose_name=_("Quantity Changed"), help_text=_("Positive for additions, negative for removals."))
    timestamp = models.DateTimeField(default=timezone.now, verbose_name=_("Transaction Timestamp"), db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, verbose_name=_("User Responsible"))
    related_request = models.ForeignKey(
        'requests_app.Request', # Assuming your requests_app is named 'requests_app'
        null=True, blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_("Related IT Request (if item was issued for a request)"),
        related_name="stock_transactions_for_request"
    )
    notes = models.TextField(blank=True, null=True, verbose_name=_("Transaction Notes or Reference"))

    class Meta:
        ordering = ['-timestamp']
        verbose_name = _("Stock Transaction Log")
        verbose_name_plural = _("Stock Transaction Logs")

    def __str__(self):
        user_display = self.user.get_username() if self.user else _('System/Unknown')
        return f"{self.get_transaction_type_display()} of {self.quantity_changed} for {self.stock_item.name} by {user_display} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

    @transaction.atomic # Ensure atomicity for stock updates
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_quantity_changed = 0
        
        if not is_new:
            try:
                old_instance = StockTransaction.objects.get(pk=self.pk)
                old_quantity_changed = old_instance.quantity_changed
            except StockTransaction.DoesNotExist:
                is_new = True # Treat as new if old instance not found

        # Calculate the net change in stock quantity
        # If it's a new transaction, the net change is self.quantity_changed
        # If it's an update, the net change is (new_quantity - old_quantity)
        net_change = self.quantity_changed
        if not is_new:
            net_change = self.quantity_changed - old_quantity_changed

        # Save the transaction first
        super().save(*args, **kwargs)

        # Update the stock item's quantity
        if net_change != 0 or is_new: # Only update if there's an actual change or it's new
            stock_item_instance = StockItem.objects.select_for_update().get(pk=self.stock_item.pk)
            stock_item_instance.current_quantity += net_change
            
            # Ensure quantity doesn't go below zero
            if stock_item_instance.current_quantity < 0:
                # This indicates an issue, perhaps raise an error or log it
                # For now, just set to 0 to prevent negative stock.
                # Consider raising forms.ValidationError in the form if an issue leads to negative stock
                # or handle this more robustly based on business rules.
                # print(f"Warning: Stock for {stock_item_instance.name} would go negative. Setting to 0.")
                stock_item_instance.current_quantity = 0
            
            stock_item_instance.save(update_fields=['current_quantity'])


    def get_transaction_type_display(self): # <<< ეს მეთოდი დამატებულია
        return dict(self.TRANSACTION_TYPE_CHOICES).get(self.transaction_type, self.transaction_type)

    def get_transaction_type_display_admin(self):
        return self.get_transaction_type_display()
    get_transaction_type_display_admin.short_description = _('Transaction Type')


class DecommissionLog(models.Model):
    equipment = models.OneToOneField( # Ensures one decommission log per equipment
        Equipment,
        on_delete=models.CASCADE,
        related_name='decommission_details', # Allows access via equipment.decommission_details
        verbose_name=_("Decommissioned Equipment")
    )
    decommission_date = models.DateField(default=timezone.now, verbose_name=_("Decommission Date"))
    reason = models.TextField(verbose_name=_("Reason for Decommission"))
    decommissioned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, # Can be null if system decommissioned or user deleted
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_("Decommissioned By")
    )
    method_of_disposal = models.CharField(
        _("Method of Disposal (Optional)"),
        max_length=100, blank=True, null=True,
        help_text=_("მაგ., გადამუშავება, გაყიდვა, განადგურება.")
    )
    disposal_certificate_id = models.CharField(
        _("Disposal Certificate ID (Optional)"),
        max_length=100, blank=True, null=True
    )
    notes = models.TextField(blank=True, null=True, verbose_name=_("Additional Notes on Decommissioning"))

    class Meta:
        verbose_name = _("Decommission Log Entry")
        verbose_name_plural = _("Decommission Log Entries")
        ordering = ['-decommission_date']

    def __str__(self):
        return f"Decommission log for {self.equipment.asset_tag_or_name()} on {self.decommission_date}"