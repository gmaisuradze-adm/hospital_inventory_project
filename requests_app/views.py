# Version: 1.X - 2025-05-27 - Copilot Edit
# ... (previous comments)
# NEW: Updated RequestDetailView to handle UserRequestCommentForm POST requests.

from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.decorators import login_required # permission_required removed as not used directly now
from django.urls import reverse_lazy, reverse
from django.contrib import messages
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Request, RequestType, RequestUpdate
from .forms import RequestCreateForm, RequestStaffUpdateForm, UserRequestCommentForm # UPDATED: Added UserRequestCommentForm

User = get_user_model()

class AdminRequestListView(LoginRequiredMixin, UserPassesTestMixin, ListView):
    model = Request
    template_name = 'requests_app/request_admin_list.html'
    context_object_name = 'requests'
    paginate_by = 15

    def test_func(self):
        return self.request.user.is_staff

    def get_queryset(self):
        queryset = Request.objects.select_related(
            'request_type',
            'requested_by',
            'assigned_to',
            'related_equipment'
        ).order_by('status', '-created_at')

        search_query = self.request.GET.get('q')
        status_filter = self.request.GET.get('status')
        type_filter = self.request.GET.get('type')
        assigned_to_filter = self.request.GET.get('assigned_to')

        if search_query:
            queryset = queryset.filter(
                Q(id__icontains=search_query) |
                Q(subject__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(requested_by__username__icontains=search_query) |
                Q(requested_by__first_name__icontains=search_query) |
                Q(requested_by__last_name__icontains=search_query)
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
        return context

class RequestCreateView(LoginRequiredMixin, CreateView):
    model = Request
    form_class = RequestCreateForm
    template_name = 'requests_app/request_form.html'

    def get_success_url(self):
        messages.success(self.request, _('Your IT request has been submitted successfully!'))
        # Always redirect to detail view for clarity
        return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        form.instance.requested_by = self.request.user
        return super().form_valid(form)
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Submit New IT Request")
        context['form_title'] = _("New IT Request Form")
        context['submit_button_text'] = _("Submit Request")
        return context

class RequestUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Request
    form_class = RequestStaffUpdateForm
    template_name = 'requests_app/request_form.html'
    context_object_name = 'object'

    def test_func(self):
        return self.request.user.is_staff

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        messages.success(self.request, _('Request #%(request_id)s has been updated successfully!') % {'request_id': self.object.id})
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        subject = self.object.subject
        truncated_subject = Truncator(subject).words(5, truncate=' ...')
        context['page_title'] = _("Edit IT Request #%(request_id)s") % {'request_id': self.object.id}
        context['form_title'] = _("Update IT Request: %(subject)s") % {'subject': truncated_subject}
        context['submit_button_text'] = _("Save Changes")
        return context

class RequestDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = Request
    template_name = 'requests_app/request_detail.html'
    context_object_name = 'request_obj' # request_obj is used in template

    def test_func(self):
        request_instance = self.get_object()
        return self.request.user.is_staff or self.request.user == request_instance.requested_by

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        request_instance = self.object # self.object is the request instance in DetailView

        truncated_subject_for_title = Truncator(request_instance.subject).words(7, truncate='...')
        context['page_title'] = _("Request Details: #%(request_id)s - %(subject)s") % {
            'request_id': request_instance.id, 
            'subject': truncated_subject_for_title
        }
        
        # Add UserRequestCommentForm to context if user is the requester and request is not in a final state
        # Define statuses where user can add comments
        commentable_statuses = ['new', 'assigned', 'pending_user_input', 'pending_order', 
                                'pending_third_party', 'awaiting_parts', 'scheduled_maintenance', 
                                'on_hold', 'reopened', 'completed'] # User might want to comment before closing
        
        if self.request.user == request_instance.requested_by and request_instance.status in commentable_statuses:
            if 'user_comment_form' not in kwargs: # Add if not already passed (e.g. by a failed POST)
                 context['user_comment_form'] = UserRequestCommentForm()
        return context

    def post(self, request, *args, **kwargs):
        self.object = self.get_object() # Get the request object
        
        # Check if the post request is for adding a comment
        # We can use a hidden input in the form or check for a specific button name
        if 'submit_user_comment' in request.POST:
            if request.user != self.object.requested_by:
                messages.error(request, _("You are not authorized to add comments to this request."))
                return redirect(self.object.get_absolute_url() if hasattr(self.object, 'get_absolute_url') else reverse('requests_app:request_detail', kwargs={'pk': self.object.pk}))

            form = UserRequestCommentForm(request.POST)
            if form.is_valid():
                comment_text = form.cleaned_data['comment_text']
                
                # Create RequestUpdate entry for the comment
                RequestUpdate.objects.create(
                    request=self.object,
                    updated_by=request.user,
                    notes=comment_text,
                    # old_status and new_status are None as this is just a comment
                )
                
                # Optional: Change status if it was 'pending_user_input'
                # This is a business logic decision.
                # For now, let's assume staff will review and change status if needed.
                # if self.object.status == 'pending_user_input':
                #     self.object.status = 'reopened' # Or 'assigned' if it was assigned
                #     self.object.save(update_fields=['status'])
                #     RequestUpdate.objects.create(
                #         request=self.object,
                #         updated_by=request.user, # Or system user if automated
                #         notes=_("Status changed to 'Reopened' after user provided input."),
                #         old_status='pending_user_input',
                #         new_status='reopened'
                #     )

                messages.success(request, _("Your comment has been added successfully."))
                return redirect(self.object.get_absolute_url() if hasattr(self.object, 'get_absolute_url') else reverse('requests_app:request_detail', kwargs={'pk': self.object.pk}))
            else:
                # If form is invalid, re-render the page with the form and errors
                messages.error(request, _("There was an error with your comment. Please check the form."))
                context = self.get_context_data(user_comment_form=form) # Pass the invalid form back
                return self.render_to_response(context)
        
        # If it's not a comment submission, let the parent class handle it (though DetailView usually doesn't handle POST)
        # Or, if you have other POST actions on this page, handle them here.
        # For now, we assume only comment submission via POST here.
        # If other POST actions are needed (like the close/reopen buttons if they were forms),
        # those would need to be handled or be separate views as they are now.
        return super().post(request, *args, **kwargs) # Or redirect if POST is not generally supported

class UserRequestListView(LoginRequiredMixin, ListView):
    model = Request
    template_name = 'requests_app/user_request_list.html'
    context_object_name = 'user_requests'
    paginate_by = 10

    def get_queryset(self):
        return Request.objects.filter(requested_by=self.request.user).select_related(
            'request_type',
            'assigned_to',
            'related_equipment'
        ).order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _('My IT Requests')
        return context

# --- USER ACTIONS (CLOSE/REOPEN) ---
@login_required
def request_close_by_user(request, pk):
    request_obj = get_object_or_404(Request, pk=pk)

    if request.user != request_obj.requested_by:
        messages.error(request, _("You are not authorized to perform this action."))
        return redirect('requests_app:request_detail', pk=pk)
    
    if request_obj.status == 'completed':
        request_obj.status = 'closed'
        request_obj.save(update_fields=['status', 'resolved_at'])

        RequestUpdate.objects.create(
            request=request_obj,
            updated_by=request.user,
            notes=_("Request closed by user."),
            old_status='completed',
            new_status='closed'
        )
        messages.success(request, _("Request #%(request_id)s has been closed.") % {'request_id': pk})
    else:
        messages.warning(request, _("This request cannot be closed from its current status (%(status)s).") % {'status': request_obj.get_status_display()})
    
    return redirect('requests_app:request_detail', pk=pk)

@login_required
def request_reopen_by_user(request, pk):
    request_obj = get_object_or_404(Request, pk=pk)

    if request.user != request_obj.requested_by:
        messages.error(request, _("You are not authorized to perform this action."))
        return redirect('requests_app:request_detail', pk=pk)

    allowed_statuses_to_reopen = ['completed', 'closed']
    if request_obj.status in allowed_statuses_to_reopen:
        original_status_for_log = request_obj.status
        request_obj.status = 'reopened'
        request_obj.save(update_fields=['status', 'resolved_at'])

        RequestUpdate.objects.create(
            request=request_obj,
            updated_by=request.user,
            notes=_("Request reopened by user."),
            old_status=original_status_for_log,
            new_status='reopened'
        )
        messages.success(request, _("Request #%(request_id)s has been reopened.") % {'request_id': pk})
    else:
        messages.warning(request, _("This request cannot be reopened from its current status (%(status)s).") % {'status': request_obj.get_status_display()})
        
    return redirect('requests_app:request_detail', pk=pk)