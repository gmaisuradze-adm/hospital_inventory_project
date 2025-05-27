from django.db import models
from django.conf import settings
from inventory.models import Equipment
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class RequestType(models.Model):
    name = models.CharField(
        _("Request Type Name"),
        max_length=100,
        unique=True,
        help_text=_("e.g., New Equipment, Repair, Software Installation, Access Request")
    )
    description = models.TextField(
        _("Description"),
        blank=True,
        null=True,
        help_text=_("Optional: A brief description of what this request type covers.")
    )
    def __str__(self):
        return self.name
    class Meta:
        verbose_name = _("Request Type")
        verbose_name_plural = _("Request Types")
        ordering = ['name']

class Request(models.Model):
    STATUS_CHOICES = [
        ('new', _('New')),
        ('assigned', _('Assigned')),
        ('pending_user_input', _('Pending User Input')), # NEW STATUS
        ('pending_order', _('Pending Order')),
        ('completed', _('Completed')),
        ('rejected', _('Rejected')),
        ('on_hold', _('On Hold')),
    ]
    PRIORITY_CHOICES = [
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('critical', _('Critical')),
    ]

    subject = models.CharField(_("Subject"), max_length=255, help_text=_("A brief summary of the request."))
    description = models.TextField(_("Detailed Description"), help_text=_("Provide a full description of the issue, need, or reason for the request."))
    request_type = models.ForeignKey(RequestType, verbose_name=_("Request Type"), on_delete=models.SET_NULL, null=True, blank=True, related_name='requests', help_text=_("Select the category that best fits your request."))
    status = models.CharField(_("Status"), max_length=25, choices=STATUS_CHOICES, default='new', help_text=_("Current status of the request.")) # max_length increased
    priority = models.CharField(_("Priority"), max_length=20, choices=PRIORITY_CHOICES, default='medium', help_text=_("Set the urgency of this request."))
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_("Requested By"), on_delete=models.CASCADE, related_name='submitted_requests')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_("Assigned To (IT Staff)"), on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_requests', limit_choices_to={'is_staff': True}, help_text=_("IT staff member responsible for handling this request."))
    related_equipment = models.ForeignKey(Equipment, verbose_name=_("Related Equipment (Optional)"), on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_requests', help_text=_("If this request pertains to a specific piece of existing equipment, select it here."))
    department_location = models.CharField(_("Department / Location for Request"), max_length=150, blank=True, null=True, help_text=_("Specify the department or physical location this request is for (e.g., Cardiology Dept, Room 301)."))
    desired_completion_date = models.DateField(_("Desired Completion Date (Optional)"), null=True, blank=True, help_text=_("If you have a preferred deadline for this request, please indicate it."))
    created_at = models.DateTimeField(_("Date Submitted"), default=timezone.now, editable=False)
    date_assigned = models.DateTimeField(_("Date Assigned"), null=True, blank=True, editable=False) # Managed by form
    resolved_at = models.DateTimeField(_("Date Resolved"), null=True, blank=True, editable=False) # Managed by form
    updated_at = models.DateTimeField(_("Last Updated"), auto_now=True, editable=False)
    resolution_notes = models.TextField(_("Resolution Notes"), blank=True, null=True, help_text=_("Internal notes from IT staff on how the request was resolved, or reasons for rejection/hold."))

    # _original_status and _original_assigned_to are not strictly needed here if all updates
    # that require logging go through the RequestStaffUpdateForm, which uses form.initial for old values.
    # However, keeping them doesn't hurt and might be useful if direct model saves occur elsewhere.
    _original_status = None
    _original_assigned_to = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_status = self.status
        self._original_assigned_to = self.assigned_to

    def save(self, *args, **kwargs):
        # The logic for date_assigned, resolved_at, and creating RequestUpdate
        # is primarily handled in RequestStaffUpdateForm.save().
        # If direct model saves (e.g., from admin or scripts) also need this logic,
        # it should be duplicated here or, preferably, refactored into signals.
        # For now, this save method will be simpler.

        # Example: If you still want date_assigned and resolved_at to be set on any save
        # if 'update_fields' not in kwargs or 'date_assigned' in kwargs.get('update_fields', []):
        #     if self.assigned_to and self._original_assigned_to is None and not self.date_assigned:
        #         self.date_assigned = timezone.now()
        #
        # if 'update_fields' not in kwargs or 'resolved_at' in kwargs.get('update_fields', []):
        #     if self.status in ['completed', 'rejected'] and self._original_status not in ['completed', 'rejected'] and not self.resolved_at:
        #         self.resolved_at = timezone.now()
        #     elif self.status not in ['completed', 'rejected'] and self._original_status in ['completed', 'rejected'] and self.resolved_at:
        #         self.resolved_at = None
        
        super().save(*args, **kwargs)
        
        # Update original values for the next save operation on this instance if it's further manipulated
        self._original_status = self.status
        self._original_assigned_to = self.assigned_to

    def get_status_badge_class(self):
        status_map = {
            'new': 'bg-primary-lt',
            'assigned': 'bg-info-lt',
            'pending_user_input': 'bg-orange-lt', # NEW STATUS
            'pending_order': 'bg-yellow-lt',
            'completed': 'bg-success-lt',
            'rejected': 'bg-danger-lt',
            'on_hold': 'bg-secondary-lt',
        }
        return status_map.get(self.status, 'bg-light text-dark')

    def get_status_badge_color_class_for_value(self, status_value): # For template tag
        status_map = {
            'new': 'primary-lt',
            'assigned': 'info-lt',
            'pending_user_input': 'orange-lt',
            'pending_order': 'yellow-lt',
            'completed': 'success-lt',
            'rejected': 'danger-lt',
            'on_hold': 'secondary-lt',
        }
        return status_map.get(status_value, 'light text-dark') # Returns 'primary-lt'

    def __str__(self):
        return f"REQ-{self.id}: {self.subject} ({self.get_status_display()})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = _("IT Equipment Request")
        verbose_name_plural = _("IT Equipment Requests")
        permissions = [
            ("can_assign_request", _("Can assign IT requests to staff")),
            ("can_change_request_status", _("Can change status of IT requests")),
        ]

class RequestUpdate(models.Model):
    request = models.ForeignKey(Request, verbose_name=_("Associated Request"), on_delete=models.CASCADE, related_name='updates')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_("Updated By"), on_delete=models.SET_NULL, null=True)
    update_time = models.DateTimeField(_("Update Time"), default=timezone.now, editable=False)
    notes = models.TextField(_("Update Notes"), help_text=_("Description of the update or action taken."))
    old_status = models.CharField(_("Old Status"), max_length=50, blank=True, null=True, help_text=_("Status before this update."))
    new_status = models.CharField(_("New Status"), max_length=50, blank=True, null=True, help_text=_("Status after this update."))

    def get_old_status_display(self):
        return dict(Request.STATUS_CHOICES).get(self.old_status, self.old_status if self.old_status else _("N/A"))

    def get_new_status_display(self):
        return dict(Request.STATUS_CHOICES).get(self.new_status, self.new_status if self.new_status else _("N/A"))

    def __str__(self):
        return _("Update for REQ-{req_id} at {time}").format(req_id=self.request.id, time=self.update_time.strftime('%Y-%m-%d %H:%M'))

    class Meta:
        ordering = ['-update_time']
        verbose_name = _("Request Update Log")
        verbose_name_plural = _("Request Update Logs")