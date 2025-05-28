from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, CreateView, UpdateView, DetailView # Add DeleteView if you implement it
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.contrib.auth.decorators import login_required, permission_required # Import permission_required
from django.urls import reverse_lazy, reverse
from django.contrib import messages
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
# from django.http import HttpResponseNotAllowed # Might not be needed if POST logic is clean
# from django.core.exceptions import PermissionDenied # Handled by Mixins/Decorators

from .models import Request, RequestType, RequestUpdate
from .forms import RequestCreateForm, RequestStaffUpdateForm, UserRequestCommentForm

User = get_user_model()

class RequestListView(LoginRequiredMixin, PermissionRequiredMixin, ListView): # Renamed from AdminRequestListView
    model = Request
    template_name = 'requests_app/request_list.html' # Consider renaming template if it was admin_list.html
    context_object_name = 'requests'
    paginate_by = 15
    permission_required = 'requests_app.view_request' # Users need this permission

    # raise_exception = True is default for PermissionRequiredMixin

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
        assigned_to_filter = self.request.GET.get('assigned_to', '') # Can be user ID or 'unassigned'

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
            elif assigned_to_filter == 'my_assigned': # New filter option
                 if self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser):
                    queryset = queryset.filter(assigned_to=self.request.user)
            elif assigned_to_filter.isdigit():
                queryset = queryset.filter(assigned_to_id=assigned_to_filter)
        
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("IT Support Requests")
        context['status_choices_for_filter'] = Request.STATUS_CHOICES
        context['types_for_filter'] = RequestType.objects.all().order_by('name')
        # Show staff users for assignment filter if current user can assign
        if self.request.user.has_perm('requests_app.can_assign_request'):
            context['staff_users_for_filter'] = User.objects.filter(is_staff=True).order_by('username')
        
        context['current_q'] = self.request.GET.get('q', '')
        context['current_status'] = self.request.GET.get('status', '')
        context['current_type'] = self.request.GET.get('type', '')
        context['current_assigned_to'] = self.request.GET.get('assigned_to', '')
        context['can_add_request'] = self.request.user.has_perm('requests_app.add_request')
        return context

class RequestCreateView(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    model = Request
    form_class = RequestCreateForm
    template_name = 'requests_app/request_form.html'
    permission_required = 'requests_app.add_request'

    def get_success_url(self):
        # Redirect to the detail view of the newly created request
        return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        form.instance.requested_by = self.request.user # User creating is the requester
        response = super().form_valid(form)
        messages.success(self.request, _('IT request (#%(request_id)s) has been submitted successfully!') % {'request_id': self.object.id})
        # Log creation
        RequestUpdate.objects.create(
            request=self.object,
            updated_by=self.request.user,
            notes=_("Request created."),
            new_status=self.object.status # Log initial status
        )
        return response
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user # Pass user to form if needed
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Submit New IT Request")
        context['form_title'] = _("New IT Request Form")
        context['submit_button_text'] = _("Submit Request")
        context['cancel_url'] = reverse_lazy('requests_app:request_list') # Back to the main list
        return context

class RequestUpdateView(LoginRequiredMixin, PermissionRequiredMixin, UpdateView):
    model = Request
    form_class = RequestStaffUpdateForm # This form is for staff/admin updates
    template_name = 'requests_app/request_form.html'
    context_object_name = 'request_obj' 
    permission_required = 'requests_app.change_request'

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user # Pass user to form
        return kwargs

    def form_valid(self, form):
        # Log changes before saving the main object
        # It's better to log after super().form_valid() to ensure object.pk is available
        # and to compare cleaned_data with the instance *before* it's saved by super()
        old_status = self.object.status # Status before update
        old_assigned_to = self.object.assigned_to

        response = super().form_valid(form) # This saves the object
        
        new_status = self.object.status # Status after update
        new_assigned_to = self.object.assigned_to

        log_notes = []
        if form.changed_data:
            log_notes.append(_("Fields updated: %(fields)s.") % {'fields': ", ".join(form.changed_data)})

        if old_status != new_status:
            log_notes.append(_("Status changed from '%(old_status)s' to '%(new_status)s'.") % {
                'old_status': dict(Request.STATUS_CHOICES).get(old_status, old_status),
                'new_status': self.object.get_status_display()
            })
        if old_assigned_to != new_assigned_to:
            old_assignee_name = old_assigned_to.get_username() if old_assigned_to else _("Unassigned")
            new_assignee_name = new_assigned_to.get_username() if new_assigned_to else _("Unassigned")
            log_notes.append(_("Assignment changed from %(old_assignee)s to %(new_assignee)s.") % {
                'old_assignee': old_assignee_name,
                'new_assignee': new_assignee_name
            })

        if log_notes:
            RequestUpdate.objects.create(
                request=self.object,
                updated_by=self.request.user,
                notes="\n".join(log_notes),
                old_status=old_status if old_status != new_status else None,
                new_status=new_status if old_status != new_status else None
            )

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

class RequestDetailView(LoginRequiredMixin, PermissionRequiredMixin, DetailView):
    model = Request
    template_name = 'requests_app/request_detail.html'
    context_object_name = 'request_obj'
    permission_required = 'requests_app.view_request'

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
        
        # User needs 'change_request' permission to add comments
        can_comment = self.request.user.has_perm('requests_app.change_request') and \
                      request_instance.status in commentable_statuses

        if can_comment:
            if 'user_comment_form' not in context: # Add form only if user can comment
                 context['user_comment_form'] = UserRequestCommentForm()
        
        context['request_updates'] = request_instance.updates_history.select_related('updated_by').order_by('-update_time')
        
        # Permissions for actions
        context['can_update_request'] = self.request.user.has_perm('requests_app.change_request')
        
        # Closing: user needs 'change_request' and status must be 'Resolved (Awaiting Confirmation)'
        context['can_close_request'] = (
            request_instance.status == Request.STATUS_RESOLVED_AWAITING_CONFIRMATION and
            self.request.user.has_perm('requests_app.change_request')
        )
        
        allowed_to_reopen = [
            Request.STATUS_CLOSED_CONFIRMED, 
            Request.STATUS_CLOSED_AUTO,
            # Request.STATUS_RESOLVED_AWAITING_CONFIRMATION # User might want to add more info before confirming closure
        ]
        # Reopening: user needs 'can_reopen_request' permission (custom) or 'change_request' (general)
        # and status must be one of the allowed ones.
        context['can_reopen_request'] = (
            request_instance.status in allowed_to_reopen and
            (self.request.user.has_perm('requests_app.can_reopen_request') or self.request.user.has_perm('requests_app.change_request'))
        )
        return context

    def post(self, request, *args, **kwargs):
        self.object = self.get_object() # Ensure object is loaded
        
        # Check permission for adding comments
        if 'submit_user_comment' in request.POST:
            if not self.request.user.has_perm('requests_app.change_request'):
                messages.error(request, _("You are not authorized to add comments to this request."))
                return redirect(self.object.get_absolute_url())

            form = UserRequestCommentForm(request.POST)
            if form.is_valid():
                comment_text = form.cleaned_data['comment_text']
                
                RequestUpdate.objects.create(
                    request=self.object,
                    updated_by=request.user,
                    notes=comment_text # Just the comment
                )
                
                # If the original requester (who is also staff/superuser now) adds a comment
                # while status is PENDING_USER_INPUT, change status to REOPENED.
                if self.request.user == self.object.requested_by and \
                   self.object.status == Request.STATUS_PENDING_USER_INPUT:
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
                # If form is invalid, re-render detail page with form errors
                messages.error(request, _("There was an error with your comment. Please check the form."))
                context = self.get_context_data(**kwargs) # Get base context
                context['user_comment_form'] = form # Add the invalid form to context
                return self.render_to_response(context)
        
        # If not 'submit_user_comment', it's an invalid POST request to this view
        messages.error(request, _("Invalid action."))
        return redirect(self.object.get_absolute_url())


# UserRequestListView is removed as AdminRequestListView with filters can cover its functionality
# or if regular users are not meant to see any requests.

@login_required # Basic login check
@permission_required('requests_app.change_request', raise_exception=True) # User needs this to change status
def request_close_action(request, pk): # Renamed from request_close_by_user
    request_obj = get_object_or_404(Request, pk=pk)
    
    if request_obj.status == Request.STATUS_RESOLVED_AWAITING_CONFIRMATION:
        old_status_for_log = request_obj.status
        request_obj.status = Request.STATUS_CLOSED_CONFIRMED
        # request_obj.closed_at = timezone.now() # Model's save method handles this
        request_obj.save(update_fields=['status']) # Let model's save() handle closed_at

        RequestUpdate.objects.create(
            request=request_obj,
            updated_by=request.user,
            notes=_("Request closed by user/staff confirmation."),
            old_status=old_status_for_log,
            new_status=request_obj.status
        )
        messages.success(request, _("Request #%(request_id)s has been closed.") % {'request_id': pk})
    else:
        messages.warning(request, _("This request cannot be closed. Status must be 'Resolved (Awaiting User Confirmation)'."))
    
    return redirect('requests_app:request_detail', pk=pk)

@login_required
@permission_required('requests_app.can_reopen_request', raise_exception=True) # Or use 'requests_app.change_request'
def request_reopen_action(request, pk): # Renamed from request_reopen_by_user
    request_obj = get_object_or_404(Request, pk=pk)

    allowed_statuses_to_reopen = [
        Request.STATUS_CLOSED_CONFIRMED, 
        Request.STATUS_CLOSED_AUTO,
        # Request.STATUS_RESOLVED_AWAITING_CONFIRMATION # Allow reopening if it was resolved but not yet closed
    ]
    if request_obj.status in allowed_statuses_to_reopen:
        original_status_for_log = request_obj.status
        request_obj.status = Request.STATUS_REOPENED
        # request_obj.closed_at = None # Model's save method should handle this
        # request_obj.resolved_at = None # Model's save method should handle this
        request_obj.save(update_fields=['status']) # Let model's save() handle timestamps

        RequestUpdate.objects.create(
            request=request_obj,
            updated_by=request.user,
            notes=_("Request reopened."),
            old_status=original_status_for_log,
            new_status=request_obj.status
        )
        messages.success(request, _("Request #%(request_id)s has been reopened.") % {'request_id': pk})
    else:
        messages.warning(request, _("This request cannot be reopened from its current status (%(status)s).") % {'status': request_obj.get_status_display()})
        
    return redirect('requests_app:request_detail', pk=pk)

# If you need a specific view for users to see ONLY their own submitted requests (even if they are not staff)
# you would need a different approach, potentially a separate view that filters by requested_by=request.user
# and does NOT use PermissionRequiredMixin for general model viewing, but rather custom logic.
# However, based on your described needs (staff/superusers see based on perms, regular users see nothing),
# the above structure should suffice.