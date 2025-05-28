# Version: 1.X - 2025-05-28 - Copilot Edit
# - Changed UserPassesTestMixin test_func to use specific model permissions
#   instead of just is_staff for more granular control in relevant views.
# - Added PermissionRequiredMixin to RequestCreateView.
# Version: 2.0 - 2025-05-28 - Proposed Changes by AI
# - Added UserPassesTestMixin to all views to restrict access to staff users only.
# - Ensured UserPassesTestMixin uses raise_exception = True for direct 403.
# - Combined is_staff check with specific permissions where appropriate.

from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin, PermissionRequiredMixin
from django.contrib.auth.decorators import login_required, user_passes_test
from django.urls import reverse_lazy, reverse
from django.contrib import messages
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.http import HttpResponseNotAllowed
from django.core.exceptions import PermissionDenied # Import PermissionDenied

from .models import Request, RequestType, RequestUpdate
from .forms import RequestCreateForm, RequestStaffUpdateForm, UserRequestCommentForm

User = get_user_model()

# Helper function for user_passes_test decorator
def staff_required(login_url=None, raise_exception=True):
    def check_staff(user):
        if user.is_staff:
            return True
        if raise_exception:
            raise PermissionDenied
        return False
    return user_passes_test(check_staff, login_url=login_url)

class StaffRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    """
    Mixin to ensure the user is logged in and is a staff member.
    Shows 403 page if not staff.
    """
    raise_exception = True # For UserPassesTestMixin to show 403

    def test_func(self):
        return self.request.user.is_staff

class AdminRequestListView(StaffRequiredMixin, ListView): # Now inherits StaffRequiredMixin
    model = Request
    template_name = 'requests_app/request_admin_list.html'
    context_object_name = 'requests'
    paginate_by = 15

    def test_func(self): # Overrides StaffRequiredMixin's test_func for more specific check
        return super().test_func() and self.request.user.has_perm('requests_app.view_request')

    def get_queryset(self):
        queryset = Request.objects.select_related(
            'request_type',
            'requested_by',
            'assigned_to',
            'related_existing_equipment',
            'request_location'
        ).order_by('status', '-priority', '-created_at')

        search_query = self.request.GET.get('q', '').strip()
        status_filter = self.request.GET.get('status', '')
        type_filter = self.request.GET.get('type', '')
        assigned_to_filter = self.request.GET.get('assigned_to', '')

        if search_query:
            queryset = queryset.filter(
                Q(id__icontains=search_query) |
                Q(subject__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(requested_by__username__icontains=search_query) |
                Q(requested_by__first_name__icontains=search_query) |
                Q(requested_by__last_name__icontains=search_query) |
                Q(related_existing_equipment__asset_tag__icontains=search_query) |
                Q(related_existing_equipment__name__icontains=search_query)
            )
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        if type_filter:
            queryset = queryset.filter(request_type_id=type_filter)
            
        if assigned_to_filter:
            if assigned_to_filter == 'unassigned':
                queryset = queryset.filter(assigned_to__isnull=True)
            else:
                queryset = queryset.filter(assigned_to_id=assigned_to_filter)
        
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("All IT Requests (Admin View)")
        context['status_choices_for_filter'] = Request.STATUS_CHOICES
        context['types_for_filter'] = RequestType.objects.all().order_by('name')
        context['staff_users_for_filter'] = User.objects.filter(is_staff=True).order_by('username')
        
        context['current_q'] = self.request.GET.get('q', '')
        context['current_status'] = self.request.GET.get('status', '')
        context['current_type'] = self.request.GET.get('type', '')
        context['current_assigned_to'] = self.request.GET.get('assigned_to', '')
        # User must be staff to see this page, so can_add_request only needs to check the permission
        context['can_add_request'] = self.request.user.has_perm('requests_app.add_request')
        return context

class RequestCreateView(StaffRequiredMixin, PermissionRequiredMixin, CreateView): # Now inherits StaffRequiredMixin
    model = Request
    form_class = RequestCreateForm
    template_name = 'requests_app/request_form.html'
    permission_required = 'requests_app.add_request'
    # raise_exception is handled by StaffRequiredMixin and PermissionRequiredMixin

    def test_func(self): # Overrides StaffRequiredMixin's test_func
        # User must be staff (from StaffRequiredMixin) AND have the 'add_request' permission
        return super().test_func() # This already checks is_staff

    def get_success_url(self):
        return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        form.instance.requested_by = self.request.user # Staff member is creating it
        response = super().form_valid(form)
        messages.success(self.request, _('IT request (#%(request_id)s) has been submitted successfully!') % {'request_id': self.object.id})
        return response
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Submit New IT Request")
        context['form_title'] = _("New IT Request Form")
        context['submit_button_text'] = _("Submit Request")
        # If a non-staff user somehow got here, cancel_url should be a safe place
        # However, StaffRequiredMixin should prevent non-staff access.
        # Defaulting to admin list as only staff can create.
        context['cancel_url'] = reverse_lazy('requests_app:admin_request_list')
        return context

class RequestUpdateView(StaffRequiredMixin, PermissionRequiredMixin, UpdateView): # Now inherits StaffRequiredMixin
    model = Request
    form_class = RequestStaffUpdateForm
    template_name = 'requests_app/request_form.html'
    context_object_name = 'request_obj' 
    permission_required = 'requests_app.change_request'

    def test_func(self): # Overrides StaffRequiredMixin's test_func
        return super().test_func() # This already checks is_staff

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user 
        return kwargs

    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, _('Request #%(request_id)s has been updated successfully!') % {'request_id': self.object.id})
        return response

    def get_success_url(self):
        return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        request_instance = self.object 
        truncated_subject = Truncator(request_instance.subject).words(5, truncate=' ...')
        context['page_title'] = _("Edit IT Request #%(request_id)s") % {'request_id': request_instance.id}
        context['form_title'] = _("Update IT Request: %(subject)s") % {'subject': truncated_subject}
        context['submit_button_text'] = _("Save Changes")
        context['cancel_url'] = self.object.get_absolute_url() 
        return context

class RequestDetailView(StaffRequiredMixin, DetailView): # Now inherits StaffRequiredMixin
    model = Request
    template_name = 'requests_app/request_detail.html'
    context_object_name = 'request_obj'

    def test_func(self): # Overrides StaffRequiredMixin's test_func
        # User must be staff (from StaffRequiredMixin) AND have 'view_request' permission
        # OR be the requester (though this part is now redundant if only staff can access)
        # For consistency, we'll ensure staff has view_request perm.
        # If the original intent was for requesters (even non-staff) to see their own, this logic changes.
        # Based on the new requirement (only staff access), this simplifies.
        if not super().test_func(): # Checks is_staff
            return False
        
        # Staff users need 'view_request' to see details.
        # The original 'is_requester' check becomes less relevant if non-staff cannot access any request page.
        return self.request.user.has_perm('requests_app.view_request')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        request_instance = self.object

        truncated_subject_for_title = Truncator(request_instance.subject).words(7, truncate='...')
        context['page_title'] = _("Request Details: #%(request_id)s - %(subject)s") % {
            'request_id': request_instance.id,
            'subject': truncated_subject_for_title
        }
        
        commentable_statuses = [
            Request.STATUS_NEW, Request.STATUS_ASSIGNED, Request.STATUS_IN_PROGRESS,
            Request.STATUS_PENDING_USER_INPUT, Request.STATUS_PENDING_ORDER,
            Request.STATUS_PENDING_THIRD_PARTY, Request.STATUS_ON_HOLD_INTERNAL,
            Request.STATUS_REOPENED,
            Request.STATUS_RESOLVED_AWAITING_CONFIRMATION
        ]
        
        # Only staff can comment now, and they need 'change_request' permission
        can_comment = self.request.user.has_perm('requests_app.change_request') and \
                      request_instance.status in commentable_statuses

        if can_comment:
            if 'user_comment_form' not in context:
                 context['user_comment_form'] = UserRequestCommentForm()
        
        context['request_updates'] = request_instance.updates_history.all().order_by('-update_time')
        context['can_update_request'] = self.request.user.has_perm('requests_app.change_request')
        # 'is_requester' is less relevant if only staff access, but kept for now if template uses it.
        context['is_requester'] = self.request.user == request_instance.requested_by
        # Closing/Reopening logic might also need adjustment if only staff manage this.
        # Assuming for now that staff with 'change_request' can perform these actions.
        context['can_close_request'] = request_instance.status == Request.STATUS_RESOLVED_AWAITING_CONFIRMATION and \
                                     self.request.user.has_perm('requests_app.change_request')
        
        allowed_to_reopen = [
            Request.STATUS_CLOSED_CONFIRMED, 
            Request.STATUS_CLOSED_AUTO,
            Request.STATUS_RESOLVED_AWAITING_CONFIRMATION
        ]
        context['can_reopen_request'] = request_instance.status in allowed_to_reopen and \
                                      self.request.user.has_perm('requests_app.change_request')
        
        return context

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        
        # Only staff with 'change_request' permission can add comments
        if not (self.request.user.is_staff and self.request.user.has_perm('requests_app.change_request')):
            messages.error(request, _("You are not authorized to add comments to this request."))
            return redirect(self.object.get_absolute_url())

        if 'submit_user_comment' in request.POST:
            form = UserRequestCommentForm(request.POST)
            if form.is_valid():
                comment_text = form.cleaned_data['comment_text']
                
                RequestUpdate.objects.create(
                    request=self.object,
                    updated_by=request.user,
                    notes=comment_text
                )
                
                # This logic might change: if user is always staff, PENDING_USER_INPUT might be handled differently
                # For now, keeping it, assuming staff might put it to PENDING_USER_INPUT for another staff.
                if self.request.user == self.object.requested_by and self.object.status == Request.STATUS_PENDING_USER_INPUT:
                    old_status_for_log = self.object.status
                    self.object.status = Request.STATUS_REOPENED 
                    self.object.save(update_fields=['status']) 
                    
                    RequestUpdate.objects.create(
                        request=self.object,
                        updated_by=request.user, 
                        notes=_("Status changed to '%(new_status)s' after user provided input.") % {'new_status': self.object.get_status_display()},
                        old_status=old_status_for_log,
                        new_status=self.object.status
                    )

                messages.success(request, _("Your comment has been added successfully."))
                return redirect(self.object.get_absolute_url())
            else:
                messages.error(request, _("There was an error with your comment. Please check the form."))
                context = self.get_context_data(**kwargs)
                context['user_comment_form'] = form
                return self.render_to_response(context)
        
        return HttpResponseNotAllowed(['GET'])


class UserRequestListView(StaffRequiredMixin, ListView): # Now inherits StaffRequiredMixin
    model = Request
    # This template might need to be renamed or its content adjusted
    # as it's no longer for "user's own requests" but for "staff viewing requests they made"
    # Or, this view could be removed if AdminRequestListView covers all staff needs.
    # For now, let's assume it's for staff to see requests they personally created.
    template_name = 'requests_app/user_request_list.html' 
    context_object_name = 'user_requests'
    paginate_by = 10

    def test_func(self): # Overrides StaffRequiredMixin's test_func
        # User must be staff (from StaffRequiredMixin)
        # No additional permission check here, as it's for their *own* requests.
        return super().test_func()

    def get_queryset(self):
        # Filters for requests made by the current staff user
        return Request.objects.filter(requested_by=self.request.user).select_related(
            'request_type',
            'assigned_to',
            'related_existing_equipment',
            'request_location'
        ).order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _('My Submitted IT Requests (Staff)') # Title changed
        # Button to add new requests is still relevant if staff can add requests
        context['can_add_request'] = self.request.user.has_perm('requests_app.add_request')
        return context

# Decorator to ensure only staff can access these function-based views
@staff_required(raise_exception=True)
@login_required # login_required is somewhat redundant due to staff_required but good for clarity
def request_close_by_user(request, pk): # Renaming might be considered, e.g., request_close_by_staff
    request_obj = get_object_or_404(Request, pk=pk)

    # Now, only staff can access. Further checks if only specific staff can close (e.g., assignee or admin)
    # For simplicity, assume any staff with 'change_request' can close if status is correct.
    if not request.user.has_perm('requests_app.change_request'):
        messages.error(request, _("You do not have permission to close requests."))
        return redirect('requests_app:request_detail', pk=pk)
    
    if request_obj.status == Request.STATUS_RESOLVED_AWAITING_CONFIRMATION:
        old_status_for_log = request_obj.status
        request_obj.status = Request.STATUS_CLOSED_CONFIRMED
        request_obj.save(update_fields=['status'])

        RequestUpdate.objects.create(
            request=request_obj,
            updated_by=request.user,
            notes=_("Request closed by staff confirmation."), # Changed message
            old_status=old_status_for_log,
            new_status=request_obj.status
        )
        messages.success(request, _("Request #%(request_id)s has been closed.") % {'request_id': pk})
    else:
        messages.warning(request, _("This request cannot be closed from its current status (%(status)s). It must be resolved and awaiting confirmation.") % {'status': request_obj.get_status_display()})
    
    return redirect('requests_app:request_detail', pk=pk)

@staff_required(raise_exception=True)
@login_required
def request_reopen_by_user(request, pk): # Renaming might be considered
    request_obj = get_object_or_404(Request, pk=pk)

    if not request.user.has_perm('requests_app.change_request'):
        messages.error(request, _("You do not have permission to reopen requests."))
        return redirect('requests_app:request_detail', pk=pk)

    allowed_statuses_to_reopen = [
        Request.STATUS_CLOSED_CONFIRMED, 
        Request.STATUS_CLOSED_AUTO,
        Request.STATUS_RESOLVED_AWAITING_CONFIRMATION
    ]
    if request_obj.status in allowed_statuses_to_reopen:
        original_status_for_log = request_obj.status
        request_obj.status = Request.STATUS_REOPENED
        request_obj.save(update_fields=['status'])

        RequestUpdate.objects.create(
            request=request_obj,
            updated_by=request.user,
            notes=_("Request reopened by staff."), # Changed message
            old_status=original_status_for_log,
            new_status=request_obj.status
        )
        messages.success(request, _("Request #%(request_id)s has been reopened.") % {'request_id': pk})
    else:
        messages.warning(request, _("This request cannot be reopened from its current status (%(status)s).") % {'status': request_obj.get_status_display()})
        
    return redirect('requests_app:request_detail', pk=pk)
