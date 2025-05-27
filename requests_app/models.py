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
        ('pending_user_input', _('Pending User Input')),
        ('pending_order', _('Pending Order')), # Existing
        # NEW: More specific "on hold" type statuses
        ('pending_third_party', _('Pending Third Party')),
        ('awaiting_parts', _('Awaiting Parts')),
        ('scheduled_maintenance', _('Scheduled Maintenance')),
        # END NEW "on hold" types
        ('on_hold', _('On Hold (General)')), # Kept general on_hold, or could be removed if specific ones cover all cases
        # NEW: Statuses for user confirmation and final closure
        ('reopened', _('Reopened')),
        ('completed', _('Completed')), # This now means "Technically Resolved, Awaiting User Confirmation"
        ('closed', _('Closed')),      # User confirmed or auto-closed
        ('rejected', _('Rejected')),
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
    status = models.CharField(_("Status"), max_length=25, choices=STATUS_CHOICES, default='new', help_text=_("Current status of the request.")) # max_length is 25, 'scheduled_maintenance' is 22 chars, ok.
    priority = models.CharField(_("Priority"), max_length=20, choices=PRIORITY_CHOICES, default='medium', help_text=_("Set the urgency of this request."))
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_("Requested By"), on_delete=models.CASCADE, related_name='submitted_requests')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_("Assigned To (IT Staff)"), on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_requests', limit_choices_to={'is_staff': True}, help_text=_("IT staff member responsible for handling this request."))
    related_equipment = models.ForeignKey(Equipment, verbose_name=_("Related Equipment (Optional)"), on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_requests', help_text=_("If this request pertains to a specific piece of existing equipment, select it here."))
    department_location = models.CharField(_("Department / Location for Request"), max_length=150, blank=True, null=True, help_text=_("Specify the department or physical location this request is for (e.g., Cardiology Dept, Room 301)."))
    desired_completion_date = models.DateField(_("Desired Completion Date (Optional)"), null=True, blank=True, help_text=_("If you have a preferred deadline for this request, please indicate it."))
    created_at = models.DateTimeField(_("Date Submitted"), default=timezone.now, editable=False)
    date_assigned = models.DateTimeField(_("Date Assigned"), null=True, blank=True, editable=False)
    resolved_at = models.DateTimeField(_("Date Resolved/Closed"), null=True, blank=True, editable=False) # UPDATED: "Date Resolved/Closed"
    updated_at = models.DateTimeField(_("Last Updated"), auto_now=True, editable=False)
    resolution_notes = models.TextField(_("Resolution Notes"), blank=True, null=True, help_text=_("Internal notes from IT staff on how the request was resolved, or reasons for rejection/hold."))

    _original_status = None
    _original_assigned_to = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_status = self.status
        self._original_assigned_to = self.assigned_to

    def save(self, *args, **kwargs):
        # UPDATED: Basic logic for resolved_at based on status changes
        # This can be enhanced or primarily handled by forms/views that manage status transitions.
        is_new_instance = self.pk is None

        if not is_new_instance:
            # If status changes to 'completed', 'closed', or 'rejected' and resolved_at is not set
            if self.status in ['completed', 'closed', 'rejected'] and self._original_status not in ['completed', 'closed', 'rejected'] and not self.resolved_at:
                self.resolved_at = timezone.now()
            # If status changes FROM 'completed', 'closed', or 'rejected' (e.g., to 'reopened') and resolved_at is set
            elif self.status not in ['completed', 'closed', 'rejected'] and self._original_status in ['completed', 'closed', 'rejected'] and self.resolved_at:
                self.resolved_at = None # Clear resolved_at if reopened or moved to another active state

        super().save(*args, **kwargs)
        
        self._original_status = self.status
        self._original_assigned_to = self.assigned_to

    # UPDATED: get_status_badge_class to include new statuses
    def get_status_badge_class(self):
        status_map = {
            'new': 'bg-primary-lt',
            'assigned': 'bg-info-lt',
            'pending_user_input': 'bg-orange-lt',
            'pending_order': 'bg-yellow-lt',
            'reopened': 'bg-indigo-lt',          # NEW
            'completed': 'bg-success-lt',        # Represents "Resolved, Awaiting Confirmation"
            'closed': 'bg-dark-lt',              # NEW: Final closed state
            'rejected': 'bg-danger-lt',
            'on_hold': 'bg-secondary-lt',        # General on_hold
            'pending_third_party': 'bg-lime-lt', # NEW
            'awaiting_parts': 'bg-pink-lt',      # NEW
            'scheduled_maintenance': 'bg-cyan-lt',# NEW
        }
        return status_map.get(self.status, 'bg-light text-dark')

    # UPDATED: get_status_badge_color_class_for_value to include new statuses
    def get_status_badge_color_class_for_value(self, status_value):
        status_map = {
            'new': 'primary-lt',
            'assigned': 'info-lt',
            'pending_user_input': 'orange-lt',
            'pending_order': 'yellow-lt',
            'reopened': 'indigo-lt',            # NEW
            'completed': 'success-lt',
            'closed': 'dark-lt',                # NEW
            'rejected': 'danger-lt',
            'on_hold': 'secondary-lt',
            'pending_third_party': 'lime-lt',   # NEW
            'awaiting_parts': 'pink-lt',        # NEW
            'scheduled_maintenance': 'cyan-lt', # NEW
        }
        return status_map.get(status_value, 'light text-dark')

    # NEW: Method to determine if staff can edit the request (used in request_detail.html)
    def can_be_edited_by_staff(self):
        # Staff cannot edit if status is 'closed' or 'rejected'
        # 'completed' might still be editable by staff to add final notes before user closes, or to change to closed.
        # This logic can be adjusted based on exact workflow.
        # For now, let's assume staff can edit 'completed' but not 'closed' or 'rejected'.
        non_editable_statuses = ['closed', 'rejected']
        return self.status not in non_editable_statuses

    # NEW: Method for priority badge (consistent with previous discussions)
    def get_priority_badge_class(self):
        if self.priority == 'critical': return 'bg-danger-lt'
        elif self.priority == 'high': return 'bg-warning-lt'
        elif self.priority == 'medium': return 'bg-info-lt' # Or another color if 'assigned' uses info
        else: return 'bg-secondary-lt' # Low priority

    def __str__(self):
        return f"REQ-{self.id}: {self.subject} ({self.get_status_display()})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = _("IT Request") # UPDATED: More generic name
        verbose_name_plural = _("IT Requests") # UPDATED
        permissions = [
            ("can_assign_request", _("Can assign IT requests to staff")),
            ("can_change_request_status", _("Can change status of IT requests")),
            ("can_view_all_requests", _("Can view all IT requests")), # NEW: Example permission
            ("can_close_request", _("Can close/reopen own IT requests as user")), # NEW: For user actions
        ]

class RequestUpdate(models.Model):
    request = models.ForeignKey(Request, verbose_name=_("Associated Request"), on_delete=models.CASCADE, related_name='updates')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_("Updated By"), on_delete=models.SET_NULL, null=True)
    update_time = models.DateTimeField(_("Update Time"), default=timezone.now, editable=False)
    notes = models.TextField(_("Update Notes"), help_text=_("Description of the update or action taken."))
    old_status = models.CharField(_("Old Status"), max_length=25, blank=True, null=True, help_text=_("Status before this update.")) # max_length consistent with Request.status
    new_status = models.CharField(_("New Status"), max_length=25, blank=True, null=True, help_text=_("Status after this update.")) # max_length consistent with Request.status

    # These methods will now correctly pick up new status display names from Request.STATUS_CHOICES
    def get_old_status_display(self):
        return dict(Request.STATUS_CHOICES).get(self.old_status, self.old_status if self.old_status else _("N/A"))

    def get_new_status_display(self):
        return dict(Request.STATUS_CHOICES).get(self.new_status, self.new_status if self.new_status else _("N/A"))

    # NEW: Methods for badge classes in history (consistent with request_detail.html logic)
    def get_old_status_badge_html_class(self):
        if not self.old_status: return "bg-light text-dark"
        color_part = self.request.get_status_badge_color_class_for_value(self.old_status)
        return f"bg-{color_part}" if color_part and color_part != 'light text-dark' else "bg-secondary-lt"

    def get_new_status_badge_html_class(self):
        if not self.new_status: return "bg-light text-dark"
        color_part = self.request.get_status_badge_color_class_for_value(self.new_status)
        return f"bg-{color_part}" if color_part and color_part != 'light text-dark' else "bg-secondary-lt"
    
    # NEW: Safe display methods (used in request_detail.html in previous iteration)
    def get_old_status_display_safe(self):
        return self.get_old_status_display()

    def get_new_status_display_safe(self):
        return self.get_new_status_display()


    def __str__(self):
        return _("Update for REQ-{req_id} at {time}").format(req_id=self.request.id, time=self.update_time.strftime('%Y-%m-%d %H:%M'))

    class Meta:
        ordering = ['-update_time']
        verbose_name = _("Request Update Log")
        verbose_name_plural = _("Request Update Logs")
