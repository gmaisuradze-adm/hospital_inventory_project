from django.db import models
from django.conf import settings
from inventory.models import Equipment # Assuming this is your equipment model
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
        ('pending_order', _('Pending Order')),
        ('completed', _('Completed')),
        ('rejected', _('Rejected')),
        ('on_hold', _('On Hold')),
        # ('cancelled', _('Cancelled')), # Keep commented if not immediately needed
    ]
    PRIORITY_CHOICES = [
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('critical', _('Critical')),
    ]

    subject = models.CharField(
        _("Subject"),
        max_length=255,
        help_text=_("A brief summary of the request.")
    )
    description = models.TextField(
        _("Detailed Description"),
        help_text=_("Provide a full description of the issue, need, or reason for the request.")
    )
    request_type = models.ForeignKey(
        RequestType,
        verbose_name=_("Request Type"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True, # If a type isn't always known at submission
        related_name='requests',
        help_text=_("Select the category that best fits your request.")
    )
    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        help_text=_("Current status of the request.")
    )
    priority = models.CharField(
        _("Priority"),
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text=_("Set the urgency of this request.")
    )
    
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Requested By"),
        on_delete=models.CASCADE, # If user is deleted, their requests are also deleted. Consider models.PROTECT or SET_NULL.
        related_name='submitted_requests'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Assigned To (IT Staff)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_requests',
        limit_choices_to={'is_staff': True},
        help_text=_("IT staff member responsible for handling this request.")
    )
    
    related_equipment = models.ForeignKey(
        Equipment,
        verbose_name=_("Related Equipment (Optional)"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='maintenance_requests', # Changed from 'requests' to avoid conflict if RequestType also uses 'requests'
        help_text=_("If this request pertains to a specific piece of existing equipment, select it here.")
    )
    
    department_location = models.CharField(
        _("Department / Location for Request"),
        max_length=150,
        blank=True,
        null=True, # Changed from blank=True only to allow null in DB
        help_text=_("Specify the department or physical location this request is for (e.g., Cardiology Dept, Room 301).")
    )
    desired_completion_date = models.DateField(
        _("Desired Completion Date (Optional)"),
        null=True,
        blank=True,
        help_text=_("If you have a preferred deadline for this request, please indicate it.")
    )
    
    created_at = models.DateTimeField(
        _("Date Submitted"),
        default=timezone.now,
        editable=False # Ensure it's not editable in forms/admin directly
    )
    date_assigned = models.DateTimeField(
        _("Date Assigned"),
        null=True,
        blank=True,
        editable=False, # Should be set programmatically
        help_text=_("Date and time when the request was assigned to an IT staff member.")
    )
    resolved_at = models.DateTimeField(
        _("Date Completed/Resolved"),
        null=True,
        blank=True,
        editable=False, # Should be set programmatically
        help_text=_("Date and time when the request was marked as completed or rejected.")
    )
    updated_at = models.DateTimeField(
        _("Last Updated"),
        auto_now=True, # Automatically updates on every save
        editable=False
    )

    resolution_notes = models.TextField(
        _("Resolution Notes"),
        blank=True,
        null=True,
        help_text=_("Internal notes from IT staff on how the request was resolved, or reasons for rejection/hold.")
    )

    def get_status_badge_class(self):
        # Using verbose names from choices for more robust mapping if keys change
        status_map = {
            _('New'): 'secondary',
            _('Assigned'): 'info text-dark',
            _('Pending Order'): 'warning text-dark',
            _('Completed'): 'success',
            _('Rejected'): 'danger',
            _('On Hold'): 'secondary',
            # _('Cancelled'): 'dark',
        }
        return status_map.get(self.get_status_display(), 'light text-dark')

    def __str__(self):
        return f"REQ-{self.id}: {self.subject} ({self.get_status_display()})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = _("IT Equipment Request")
        verbose_name_plural = _("IT Equipment Requests")
        permissions = [ # Example custom permission
            ("can_assign_request", _("Can assign IT requests to staff")),
            ("can_change_request_status", _("Can change status of IT requests")),
        ]

class RequestUpdate(models.Model):
    request = models.ForeignKey(
        Request,
        verbose_name=_("Associated Request"),
        on_delete=models.CASCADE,
        related_name='updates'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Updated By"),
        on_delete=models.SET_NULL, # So update log remains if user is deleted
        null=True
    )
    update_time = models.DateTimeField(
        _("Update Time"),
        default=timezone.now,
        editable=False
    )
    notes = models.TextField(
        _("Update Notes"),
        help_text=_("Description of the update or action taken.")
    )
    old_status = models.CharField(
        _("Old Status"),
        max_length=50,
        blank=True,
        null=True,
        help_text=_("Status before this update.")
    )
    new_status = models.CharField(
        _("New Status"),
        max_length=50,
        blank=True,
        null=True,
        help_text=_("Status after this update.")
    )

    # Consider adding fields for other significant changes, e.g., old_priority, new_priority

    def __str__(self):
        return _("Update for REQ-{req_id} at {time}").format(req_id=self.request.id, time=self.update_time.strftime('%Y-%m-%d %H:%M'))

    class Meta:
        ordering = ['-update_time']
        verbose_name = _("Request Update Log")
        verbose_name_plural = _("Request Update Logs")
