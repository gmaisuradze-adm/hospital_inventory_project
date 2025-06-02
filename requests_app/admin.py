# Version: 1.0 - 2025-05-26 09:41:57 UTC - gmaisuradze-adm - Initial admin setup for requests_app
# Updated: 2025-05-28 - To align with model changes
from django.contrib import admin
from .models import RequestType, Request, RequestUpdate # Ensure InventoryLocation is not needed here unless used directly
from django.urls import reverse # It's good practice to have imports at the top
from django.utils.html import format_html # Also good practice

@admin.register(RequestType)
class RequestTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

class RequestUpdateInline(admin.TabularInline): # Or admin.StackedInline for a different layout
    model = RequestUpdate
    fk_name = 'request'
    extra = 0 # Number of empty forms to display
    # Making fields readonly in the inline if they are auto-set or should not be changed here
    readonly_fields = ('updated_by', 'update_time', 'old_status', 'new_status', 'notes')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        # Updates should ideally be created programmatically when a Request is saved with changes,
        # or via a specific action, not manually added via inline in this manner.
        return False

@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'subject',
        'request_type',
        'status',
        'priority',
        'requested_by',
        'assigned_to',
        'request_location', # Added request_location
        'created_at',
        'updated_at',
        'resolved_at', # Added resolved_at
        'closed_at'    # Added closed_at
    )
    list_filter = ('status', 'priority', 'request_type', 'created_at', 'assigned_to', 'request_location') # Added request_location
    search_fields = ('id', 'subject', 'description', 'requested_by__username', 'assigned_to__username', 'request_location__name') # Added request_location__name

    # Corrected 'related_equipment' to 'related_existing_equipment'
    # Added 'request_location' to autocomplete fields as it's a ForeignKey
    autocomplete_fields = ['requested_by', 'assigned_to', 'related_existing_equipment', 'request_type', 'request_location']

    # Added 'date_assigned' to readonly_fields as it's auto-set by model's save method
    readonly_fields = ('created_at', 'updated_at', 'resolved_at', 'closed_at', 'date_assigned')

    fieldsets = (
        ("Request Details", {
            'fields': ('subject', 'description', 'request_type', 'related_existing_equipment', 'request_location') # Corrected and added fields
        }),
        ("Status & Priority", {
            'fields': ('status', 'priority')
        }),
        ("Assignment & Requester", { # Renamed section for clarity
            'fields': ('requested_by', 'assigned_to', 'date_assigned') # Added date_assigned (readonly)
        }),
        ("Resolution", { # This section might be for notes related to how it was resolved
            'fields': ('resolution_notes',) # resolved_at is now in Timestamps
        }),
        ("Timestamps", {
            'fields': ('created_at', 'updated_at', 'resolved_at', 'closed_at'), # Added resolved_at, closed_at
            'classes': ('collapse',)
        }),
    )
    inlines = [RequestUpdateInline]

    # Optional: Add actions, e.g., to quickly change status
    # actions = ['mark_as_in_progress', 'mark_as_resolved']

    # def mark_as_in_progress(self, request, queryset):
    #     queryset.update(status='in_progress')
    # mark_as_in_progress.short_description = "Mark selected requests as In Progress"

    # def mark_as_resolved(self, request, queryset):
    #     for req in queryset:
    #         req.status = 'resolved_awaiting_confirmation' # Or your appropriate resolved status
    #         req.save() # This will trigger the model's save logic for resolved_at
    # mark_as_resolved.short_description = "Mark selected requests as Resolved"

    # As has_delete_permission is not defined and set to False,
    # users with 'delete_request' permission (like superusers) can delete Request objects.

@admin.register(RequestUpdate)
class RequestUpdateAdmin(admin.ModelAdmin):
    list_display = ('request_id_link', 'updated_by', 'update_time', 'notes_summary', 'get_old_status_display_admin', 'get_new_status_display_admin') # Changed to _admin suffix for clarity if model has same name methods
    list_filter = ('update_time', 'updated_by')
    search_fields = ('request__id', 'request__subject', 'notes', 'updated_by__username')
    # All fields are essentially read-only as updates are logged programmatically
    readonly_fields = ('request', 'updated_by', 'update_time', 'old_status', 'new_status', 'notes')

    def request_id_link(self, obj):
        # from django.urls import reverse # Moved to top
        # from django.utils.html import format_html # Moved to top
        if obj.request:
            link = reverse("admin:requests_app_request_change", args=[obj.request.id])
            return format_html('<a href="{}">REQ-{}</a>', link, obj.request.id)
        return "-"
    request_id_link.short_description = 'Request ID'
    request_id_link.admin_order_field = 'request__id'

    def notes_summary(self, obj):
        return (obj.notes[:75] + '...') if obj.notes and len(obj.notes) > 75 else obj.notes
    notes_summary.short_description = 'Notes'

    # Use methods from the model for displaying status choices
    def get_old_status_display_admin(self, obj): # Renamed for clarity
        return obj.get_old_status_display_safe() # Assuming this method exists on the model
    get_old_status_display_admin.short_description = 'Old Status'
    get_old_status_display_admin.admin_order_field = 'old_status'

    def get_new_status_display_admin(self, obj): # Renamed for clarity
        return obj.get_new_status_display_safe() # Assuming this method exists on the model
    get_new_status_display_admin.short_description = 'New Status'
    get_new_status_display_admin.admin_order_field = 'new_status'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        # Allow viewing but not changing via admin.
        # Changes are logged, not edited.
        return False # Changed to False as per your original file for strict read-only of logs

    def has_delete_permission(self, request, obj=None):
        return False # Log entries should generally not be deleted