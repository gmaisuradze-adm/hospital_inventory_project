from django.db import models, transaction
from django.conf import settings
# from inventory.models import Equipment, StockItem, Location as InventoryLocation # <--- წაშალეთ ეს ხაზი
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.urls import reverse

class RequestType(models.Model):
    name = models.CharField(
        _("Request Type Name"),
        max_length=100,
        unique=True,
        help_text=_("მოთხოვნის/სერვისის ტიპის დასახელება (მაგ., ახალი ტექნიკის მოთხოვნა, ტექნიკის შეკეთება, პროგრამული უზრუნველყოფის ინსტალაცია).")
    )
    description = models.TextField(
        _("Description (Optional)"),
        blank=True,
        null=True,
        help_text=_("მოთხოვნის ტიპის მოკლე აღწერა.")
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Request Type")
        verbose_name_plural = _("Request Types")
        ordering = ['name']

class Request(models.Model):
    STATUS_NEW = 'new'
    STATUS_ASSIGNED = 'assigned'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_PENDING_USER_INPUT = 'pending_user_input'
    STATUS_PENDING_ORDER = 'pending_order'
    STATUS_PENDING_THIRD_PARTY = 'pending_third_party'
    STATUS_ON_HOLD_INTERNAL = 'on_hold_internal'
    STATUS_RESOLVED_AWAITING_CONFIRMATION = 'resolved_awaiting_confirmation'
    STATUS_CLOSED_CONFIRMED = 'closed_confirmed'
    STATUS_CLOSED_AUTO = 'closed_auto'
    STATUS_REOPENED = 'reopened'
    STATUS_REJECTED = 'rejected'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_NEW, _('New')),
        (STATUS_ASSIGNED, _('Assigned')),
        (STATUS_IN_PROGRESS, _('In Progress')),
        (STATUS_PENDING_USER_INPUT, _('Pending User Input')),
        (STATUS_PENDING_ORDER, _('Pending Parts/Equipment Order')),
        (STATUS_PENDING_THIRD_PARTY, _('Pending Third Party Action')),
        (STATUS_ON_HOLD_INTERNAL, _('On Hold (Internal Reasons)')),
        (STATUS_RESOLVED_AWAITING_CONFIRMATION, _('Resolved (Awaiting User Confirmation)')),
        (STATUS_CLOSED_CONFIRMED, _('Closed (User Confirmed)')),
        (STATUS_CLOSED_AUTO, _('Closed (Auto-Closed)')),
        (STATUS_REOPENED, _('Reopened')),
        (STATUS_REJECTED, _('Rejected')),
        (STATUS_CANCELLED, _('Cancelled')),
    ]

    PRIORITY_LOW = 'low'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_HIGH = 'high'
    PRIORITY_CRITICAL = 'critical'

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, _('Low')),
        (PRIORITY_MEDIUM, _('Medium')),
        (PRIORITY_HIGH, _('High')),
        (PRIORITY_CRITICAL, _('Critical')),
    ]

    subject = models.CharField(
        _("Subject"),
        max_length=255,
        help_text=_("მოთხოვნის მოკლე სათაური/შინაარსი.")
    )
    description = models.TextField(
        _("Detailed Description"),
        help_text=_("სრულად აღწერეთ საკითხი, საჭიროება ან მოთხოვნის მიზეზი. მიუთითეთ ნებისმიერი შეცდომის კოდი, დეტალი და ა.შ.")
    )
    request_type = models.ForeignKey(
        RequestType, # This is fine as RequestType is in the same models.py file
        verbose_name=_("Request Type"),
        on_delete=models.PROTECT,
        related_name='requests',
        help_text=_("აირჩიეთ მოთხოვნის შესაბამისი ტიპი.")
    )
    status = models.CharField(
        _("Status"),
        max_length=35,
        choices=STATUS_CHOICES,
        default=STATUS_NEW,
        help_text=_("მოთხოვნის მიმდინარე სტატუსი.")
    )
    priority = models.CharField(
        _("Priority"),
        max_length=20,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MEDIUM,
        help_text=_("აირჩიეთ მოთხოვნის პრიორიტეტი.")
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Requested By"),
        on_delete=models.PROTECT,
        related_name='submitted_requests',
        help_text=_("მომხმარებელი, რომელმაც დაარეგისტრირა მოთხოვნა.")
    )
    request_location = models.ForeignKey(
        'inventory.Location',  # CHANGED TO STRING
        verbose_name=_("Request Location (Department/Room) (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='location_requests',
        help_text=_("მიუთითეთ დეპარტამენტი, შენობა ან ოთახი, რომელსაც ეს მოთხოვნა ეხება.")
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Assigned To (IT Staff) (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_requests',
        limit_choices_to={'is_staff': True},
        help_text=_("IT პერსონალი, რომელიც პასუხისმგებელია ამ მოთხოვნის შესრულებაზე.")
    )
    related_existing_equipment = models.ForeignKey(
        'inventory.Equipment',  # CHANGED TO STRING
        verbose_name=_("Related Existing Equipment (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='maintenance_or_issue_requests',
        help_text=_("თუ მოთხოვნა ეხება კონკრეტულ, სისტემაში უკვე არსებულ ტექნიკას (მაგ., შეკეთება), აირჩიეთ აქ.")
    )
    desired_completion_date = models.DateField(
        _("Desired Completion Date (Optional)"),
        null=True,
        blank=True,
        help_text=_("სასურველი დასრულების თარიღი, თუ არსებობს.")
    )
    created_at = models.DateTimeField(_("Date Submitted"), default=timezone.now, editable=False)
    date_assigned = models.DateTimeField(_("Date Assigned"), null=True, blank=True, editable=False)
    resolved_at = models.DateTimeField(_("Date Technically Resolved"), null=True, blank=True, editable=False)
    closed_at = models.DateTimeField(_("Date Closed"), null=True, blank=True, editable=False)
    updated_at = models.DateTimeField(_("Last Updated"), auto_now=True, editable=False)

    issued_equipment_items = models.ManyToManyField(
        'inventory.Equipment',  # CHANGED TO STRING
        verbose_name=_("Issued Equipment Items (as a result of this request)"),
        blank=True,
        related_name='fulfilled_by_requests',
        help_text=_("ამ მოთხოვნის შესრულების შედეგად გაცემული ინდივიდუალური ტექნიკის ერთეულები.")
    )
    resolution_notes = models.TextField(
        _("Resolution Notes / IT Comments"),
        blank=True,
        null=True,
        help_text=_("IT პერსონალის შიდა კომენტარები მოთხოვნის შესრულების, უარყოფის ან შეჩერების მიზეზების შესახებ.")
    )

    _original_status = None
    _original_assigned_to_id = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_status = self.status
        self._original_assigned_to_id = self.assigned_to_id

    def save(self, *args, **kwargs):
        is_new_instance = self.pk is None
        status_changed = self._original_status != self.status
        assignment_changed = self._original_assigned_to_id != self.assigned_to_id

        if not is_new_instance and assignment_changed:
            if self.assigned_to_id and not self._original_assigned_to_id:
                self.date_assigned = timezone.now()
            elif not self.assigned_to_id and self._original_assigned_to_id:
                self.date_assigned = None
        elif is_new_instance and self.assigned_to_id:
            self.date_assigned = timezone.now()

        final_resolution_statuses = [self.STATUS_RESOLVED_AWAITING_CONFIRMATION]
        final_closure_statuses = [self.STATUS_CLOSED_CONFIRMED, self.STATUS_CLOSED_AUTO, self.STATUS_REJECTED, self.STATUS_CANCELLED]

        if status_changed:
            if self.status in final_resolution_statuses:
                if not self.resolved_at:
                    self.resolved_at = timezone.now()
            elif self._original_status in final_resolution_statuses and self.status not in final_closure_statuses:
                self.resolved_at = None

            if self.status in final_closure_statuses:
                if not self.closed_at:
                    self.closed_at = timezone.now()
                if self.status not in [self.STATUS_REJECTED, self.STATUS_CANCELLED] and not self.resolved_at:
                    self.resolved_at = timezone.now()
            elif self._original_status in final_closure_statuses and self.status not in final_closure_statuses:
                self.closed_at = None
                if self.status not in final_resolution_statuses:
                    self.resolved_at = None
        
        super().save(*args, **kwargs)
        self._original_status = self.status
        self._original_assigned_to_id = self.assigned_to_id

    _status_badge_map = {
        STATUS_NEW: 'primary',
        STATUS_ASSIGNED: 'info',
        STATUS_IN_PROGRESS: 'cyan',
        STATUS_PENDING_USER_INPUT: 'orange',
        STATUS_PENDING_ORDER: 'yellow',
        STATUS_PENDING_THIRD_PARTY: 'lime',
        STATUS_ON_HOLD_INTERNAL: 'secondary',
        STATUS_RESOLVED_AWAITING_CONFIRMATION: 'success',
        STATUS_CLOSED_CONFIRMED: 'dark',
        STATUS_CLOSED_AUTO: 'dark',
        STATUS_REOPENED: 'indigo',
        STATUS_REJECTED: 'danger',
        STATUS_CANCELLED: 'secondary',
    }

    def get_status_badge_class(self):
        return f"bg-{self._status_badge_map.get(self.status, 'light text-dark')}-lt"

    @classmethod
    def get_status_badge_class_for_status_value(cls, status_value):
        return f"bg-{cls._status_badge_map.get(status_value, 'light text-dark')}-lt"

    def get_priority_badge_class(self):
        priority_map = {
            self.PRIORITY_LOW: 'secondary',
            self.PRIORITY_MEDIUM: 'info',
            self.PRIORITY_HIGH: 'warning',
            self.PRIORITY_CRITICAL: 'danger',
        }
        return f"bg-{priority_map.get(self.priority, 'light text-dark')}-lt"

    @property
    def can_be_edited_by_staff(self):
        editable_statuses = [
            self.STATUS_NEW,
            self.STATUS_ASSIGNED,
            self.STATUS_IN_PROGRESS,
            self.STATUS_PENDING_USER_INPUT,
            self.STATUS_PENDING_ORDER,
            self.STATUS_PENDING_THIRD_PARTY,
            self.STATUS_ON_HOLD_INTERNAL,
            self.STATUS_REOPENED,
        ]
        return self.status in editable_statuses

    def get_absolute_url(self):
        return reverse('requests_app:request_detail', kwargs={'pk': self.pk})

    def __str__(self):
        return f"REQ-{self.id}: {self.subject} ({self.get_status_display()})"

    class Meta:
        ordering = ['-created_at', '-priority']
        verbose_name = _("IT Support Request")
        verbose_name_plural = _("IT Support Requests")
        permissions = [
            ("can_assign_request", _("Can assign IT requests to staff")),
            ("can_change_request_status_all", _("Can change status of ANY IT request")),
            ("can_view_all_requests", _("Can view all IT requests")),
            ("can_close_own_submitted_request", _("Can close/confirm own submitted IT requests as user")),
            ("can_reopen_request", _("Can reopen IT requests")),
            ("can_manage_issued_items", _("Can add/remove issued equipment/stock for a request")),
        ]

class IssuedStockLink(models.Model):
    request = models.ForeignKey(
        Request, # This is fine
        on_delete=models.CASCADE,
        verbose_name=_("Request"),
        related_name="issued_stock_links"
    )
    stock_item = models.ForeignKey(
        'inventory.StockItem',  # CHANGED TO STRING
        on_delete=models.PROTECT,
        verbose_name=_("Stock Item Issued")
    )
    quantity_issued = models.PositiveIntegerField(
        _("Quantity Issued"),
        default=1,
        help_text=_("ამ სტოკის ერთეულის რაოდენობა, რომელიც გაიცა ამ მოთხოვნის ფარგლებში.")
    )
    issued_date = models.DateTimeField(_("Issued Date"), default=timezone.now, editable=False)
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Issued By (IT Staff)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_issued_entries',
        limit_choices_to={'is_staff': True},
        help_text=_("IT პერსონალი, რომელმაც გასცა ეს სტოკი.")
    )
    notes = models.CharField(
        _("Notes (Optional)"),
        max_length=255,
        blank=True,
        null=True,
        help_text=_("დამატებითი მოკლე შენიშვნა ამ კონკრეტული გაცემის შესახებ.")
    )

    def save(self, *args, **kwargs):
        from inventory.models import StockTransaction, StockItem # Import StockItem here

        is_new = self.pk is None
        old_quantity_issued = 0
        if not is_new:
            try:
                old_instance = IssuedStockLink.objects.get(pk=self.pk)
                old_quantity_issued = old_instance.quantity_issued
            except IssuedStockLink.DoesNotExist:
                is_new = True

        if is_new: 
            stock_item_instance = StockItem.objects.get(pk=self.stock_item_id)
            if stock_item_instance.current_quantity < self.quantity_issued:
                raise ValueError(
                    _("Not enough stock for %(item)s. Requested: %(qty)s, Available: %(avail)s.") %
                    {'item': stock_item_instance.name, 'qty': self.quantity_issued, 'avail': stock_item_instance.current_quantity }
                )
        
        super().save(*args, **kwargs)

        if is_new:
            with transaction.atomic():
                stock_item_instance_locked = StockItem.objects.select_for_update().get(pk=self.stock_item_id)
                stock_item_instance_locked.current_quantity -= self.quantity_issued
                stock_item_instance_locked.save(update_fields=['current_quantity'])
                StockTransaction.objects.create(
                    stock_item=stock_item_instance_locked,
                    transaction_type='issue',
                    quantity_changed=-self.quantity_issued,
                    user=self.issued_by,
                    related_request=self.request,
                    notes=_("Issued for REQ-{req_id} via IssuedStockLink ID: {link_id}").format(req_id=self.request.id, link_id=self.id)
                )
        elif old_quantity_issued != self.quantity_issued: 
            with transaction.atomic():
                stock_item_instance_locked = StockItem.objects.select_for_update().get(pk=self.stock_item_id)
                difference = self.quantity_issued - old_quantity_issued
                
                if difference > 0 and stock_item_instance_locked.current_quantity < difference:
                     raise ValueError(
                         _("Not enough stock for %(item)s to adjust quantity. Difference: %(diff)s, Available: %(avail)s.") %
                        {'item': stock_item_instance_locked.name, 'diff': difference, 'avail': stock_item_instance_locked.current_quantity }
                    )
                
                stock_item_instance_locked.current_quantity -= difference
                stock_item_instance_locked.save(update_fields=['current_quantity'])
                StockTransaction.objects.create(
                    stock_item=stock_item_instance_locked,
                    transaction_type='adjustment_issue', # Consider a more specific type or use 'issue' with negative for return
                    quantity_changed=-difference, # This will be positive if reducing issued (difference is negative)
                    user=self.issued_by,
                    related_request=self.request,
                    notes=_("Quantity adjustment for REQ-{req_id} on Link ID: {link_id}. Old: {old_q}, New: {new_q}").format(
                        req_id=self.request.id, link_id=self.id, old_q=old_quantity_issued, new_q=self.quantity_issued
                    )
                )

    def delete(self, *args, **kwargs):
        from inventory.models import StockTransaction, StockItem # Import StockItem here
        with transaction.atomic():
            try:
                stock_item_instance = StockItem.objects.select_for_update().get(pk=self.stock_item_id)
                stock_item_instance.current_quantity += self.quantity_issued
                stock_item_instance.save(update_fields=['current_quantity'])
                StockTransaction.objects.create(
                    stock_item=stock_item_instance,
                    transaction_type='return_from_issue', # Consider a more specific type
                    quantity_changed=self.quantity_issued,
                    user=self.issued_by, 
                    related_request=self.request,
                    notes=_("Stock returned from REQ-{req_id} due to deletion of IssuedStockLink ID: {link_id}").format(req_id=self.request.id, link_id=self.id)
                )
            except StockItem.DoesNotExist:
                pass # Or log an error if stock item not found, though unlikely if link exists
        super().delete(*args, **kwargs)

    def __str__(self):
        # Accessing self.stock_item might cause a query if not pre-fetched
        # Consider select_related('stock_item') where IssuedStockLink is queried
        stock_item_name = self.stock_item.name if self.stock_item_id else _("Unknown Stock Item")
        return f"{self.quantity_issued} x {stock_item_name} for REQ-{self.request.id}"

    class Meta:
        verbose_name = _("Issued Stock Item Log")
        verbose_name_plural = _("Issued Stock Item Logs")
        unique_together = [['request', 'stock_item']]

class RequestUpdate(models.Model):
    request = models.ForeignKey(
        Request, # This is fine
        verbose_name=_("Associated Request"),
        on_delete=models.CASCADE,
        related_name='updates_history'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Updated By"),
        on_delete=models.SET_NULL,
        null=True
    )
    update_time = models.DateTimeField(_("Update Time"), default=timezone.now, editable=False)
    notes = models.TextField(
        _("Update Notes / Comment"),
        help_text=_("აღწერა განახლების, მიღებული ზომების ან დატოვებული კომენტარის შესახებ.")
    )
    old_status = models.CharField(
        _("Old Status (if changed)"),
        max_length=35,
        blank=True,
        null=True,
        choices=Request.STATUS_CHOICES, # This is fine
        help_text=_("სტატუსი ამ განახლებამდე (თუ შეიცვალა).")
    )
    new_status = models.CharField(
        _("New Status (if changed)"),
        max_length=35,
        blank=True,
        null=True,
        choices=Request.STATUS_CHOICES, # This is fine
        help_text=_("სტატუსი ამ განახლების შემდეგ (თუ შეიცვალა).")
    )

    def get_old_status_badge_class(self):
        if self.old_status:
            return Request.get_status_badge_class_for_status_value(self.old_status)
        return 'bg-light text-dark-lt'

    def get_new_status_badge_class(self):
        if self.new_status:
            return Request.get_status_badge_class_for_status_value(self.new_status)
        return 'bg-light text-dark-lt'

    def get_old_status_display_safe(self):
        return dict(Request.STATUS_CHOICES).get(self.old_status, self.old_status if self.old_status else _("N/A"))

    def get_new_status_display_safe(self):
        return dict(Request.STATUS_CHOICES).get(self.new_status, self.new_status if self.new_status else _("N/A"))

    def __str__(self):
        user_display = self.updated_by.get_username() if self.updated_by else _("System")
        return _("Update for REQ-{req_id} at {time} by {user}").format(
            req_id=self.request.id,
            time=self.update_time.strftime('%Y-%m-%d %H:%M'),
            user=user_display
        )

    class Meta:
        ordering = ['-update_time']
        verbose_name = _("Request Update Log")
        verbose_name_plural = _("Request Update Logs")
