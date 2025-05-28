from django.contrib import admin
from .models import RequestType, Request, RequestUpdate
from django.urls import reverse
from django.utils.html import format_html

@admin.register(RequestType)
class RequestTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

class RequestUpdateInline(admin.TabularInline):
    model = RequestUpdate
    fk_name = 'request'
    extra = 0
    readonly_fields = ('updated_by', 'update_time', 'old_status', 'new_status', 'notes')
    can_delete = False

    def has_add_permission(self, request, obj=None):
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
        'request_location',
        'created_at',
        'updated_at',
        'resolved_at',
        'closed_at'
    )
    list_filter = ('status', 'priority', 'request_type', 'created_at', 'assigned_to', 'request_location')
    search_fields = ('id', 'subject', 'description', 'requested_by__username', 'assigned_to__username', 'request_location__name')
    autocomplete_fields = ['requested_by', 'assigned_to', 'related_existing_equipment', 'request_type', 'request_location']
    readonly_fields = ('created_at', 'updated_at', 'resolved_at', 'closed_at', 'date_assigned')
    fieldsets = (
        ("Request Details", {
            'fields': ('subject', 'description', 'request_type', 'related_existing_equipment', 'request_location')
        }),
        ("Status & Priority", {
            'fields': ('status', 'priority')
        }),
        ("Assignment & Requester", {
            'fields': ('requested_by', 'assigned_to', 'date_assigned')
        }),
        ("Resolution", {
            'fields': ('resolution_notes',)
        }),
        ("Timestamps", {
            'fields': ('created_at', 'updated_at', 'resolved_at', 'closed_at'),
            'classes': ('collapse',)
        }),
    )
    inlines = [RequestUpdateInline]

@admin.register(RequestUpdate)
class RequestUpdateAdmin(admin.ModelAdmin):
    list_display = ('request_id_link', 'updated_by', 'update_time', 'notes_summary', 'get_old_status_display_admin', 'get_new_status_display_admin')
    list_filter = ('update_time', 'updated_by')
    search_fields = ('request__id', 'request__subject', 'notes', 'updated_by__username')
    readonly_fields = ('request', 'updated_by', 'update_time', 'old_status', 'new_status', 'notes')

    def request_id_link(self, obj):
        if obj.request:
            link = reverse("admin:requests_app_request_change", args=[obj.request.id])
            return format_html('<a href="{}">REQ-{}</a>', link, obj.request.id)
        return "-"
    request_id_link.short_description = 'Request ID'
    request_id_link.admin_order_field = 'request__id'

    def notes_summary(self, obj):
        return (obj.notes[:75] + '...') if obj.notes and len(obj.notes) > 75 else obj.notes
    notes_summary.short_description = 'Notes'

    def get_old_status_display_admin(self, obj):
        return obj.get_old_status_display_safe()
    get_old_status_display_admin.short_description = 'Old Status'
    get_old_status_display_admin.admin_order_field = 'old_status'

    def get_new_status_display_admin(self, obj):
        return obj.get_new_status_display_safe()
    get_new_status_display_admin.short_description = 'New Status'
    get_new_status_display_admin.admin_order_field = 'new_status'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    # --- START OF CHANGE ---
    def has_delete_permission(self, request, obj=None):
        # Allow superusers to "delete" logs in the context of a cascading delete
        # triggered by deleting a Request object.
        # Regular staff should not be able to delete logs directly.
        if request.user.is_superuser:
            return True
        return False
    # --- END OF CHANGE ---