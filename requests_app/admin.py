# Version: 1.0 - 2025-05-26 09:41:57 UTC - gmaisuradze-adm - Initial admin setup for requests_app
from django.contrib import admin
from .models import RequestType, Request, RequestUpdate

@admin.register(RequestType)
class RequestTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

class RequestUpdateInline(admin.TabularInline): # Or admin.StackedInline for a different layout
    model = RequestUpdate
    fk_name = 'request'
    extra = 0 # Number of empty forms to display
    readonly_fields = ('updated_by', 'update_time', 'old_status', 'new_status') # Make fields read-only in inline
    can_delete = False # Optionally prevent deleting updates from the Request admin page

    def has_add_permission(self, request, obj=None):
        return False # Prevent adding new updates directly from the inline on Request page

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
        'created_at', 
        'updated_at'
    )
    list_filter = ('status', 'priority', 'request_type', 'created_at', 'assigned_to')
    search_fields = ('id', 'subject', 'description', 'requested_by__username', 'assigned_to__username')
    autocomplete_fields = ['requested_by', 'assigned_to', 'related_equipment', 'request_type']
    readonly_fields = ('created_at', 'updated_at', 'resolved_at')
    
    fieldsets = (
        ("Request Details", {
            'fields': ('subject', 'description', 'request_type', 'related_equipment')
        }),
        ("Status & Priority", {
            'fields': ('status', 'priority')
        }),
        ("Assignment", {
            'fields': ('requested_by', 'assigned_to')
        }),
        ("Resolution", {
            'fields': ('resolution_notes', 'resolved_at')
        }),
        ("Timestamps", {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',) # Make this section collapsible
        }),
    )
    inlines = [RequestUpdateInline] # Add the updates inline

@admin.register(RequestUpdate)
class RequestUpdateAdmin(admin.ModelAdmin):
    list_display = ('request_id_link', 'updated_by', 'update_time', 'notes_summary', 'old_status', 'new_status')
    list_filter = ('update_time', 'updated_by')
    search_fields = ('request__id', 'request__subject', 'notes', 'updated_by__username')
    readonly_fields = ('request', 'updated_by', 'update_time', 'old_status', 'new_status', 'notes') # Make most fields read-only

    def request_id_link(self, obj):
        from django.urls import reverse
        from django.utils.html import format_html
        link = reverse("admin:requests_app_request_change", args=[obj.request.id])
        return format_html('<a href="{}">{}</a>', link, obj.request.id)
    request_id_link.short_description = 'Request ID'
    request_id_link.admin_order_field = 'request__id'

    def notes_summary(self, obj):
        return (obj.notes[:75] + '...') if len(obj.notes) > 75 else obj.notes
    notes_summary.short_description = 'Notes'

    def has_add_permission(self, request):
        return False # Prevent adding RequestUpdate directly; should be via Request

    def has_change_permission(self, request, obj=None):
        return False # Prevent changing RequestUpdate directly