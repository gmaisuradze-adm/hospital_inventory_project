# Version: 1.X - 2025-05-27 - Copilot Edit
# NEW: Updated RequestDetailView to handle UserRequestCommentForm POST requests.
# Copilot Edit 2025-05-28: Minor refinements, consistency checks, FieldError fix.
# Copilot Edit 2025-05-28 (Fix 2): Corrected AttributeError for STATUS_COMPLETED.
# Copilot Edit 2025-05-28 (Fix 3): Removed 'user' kwarg from model save() calls.

from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.decorators import login_required
from django.urls import reverse_lazy, reverse
from django.contrib import messages
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.http import HttpResponseNotAllowed

from .models import Request, RequestType, RequestUpdate
from .forms import RequestCreateForm, RequestStaffUpdateForm, UserRequestCommentForm

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
        return context

class RequestCreateView(LoginRequiredMixin, CreateView):
    model = Request
    form_class = RequestCreateForm
    template_name = 'requests_app/request_form.html'

    def get_success_url(self):
        return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        form.instance.requested_by = self.request.user
        response = super().form_valid(form) # This will call Request.save() via the form
        messages.success(self.request, _('Your IT request (#%(request_id)s) has been submitted successfully!') % {'request_id': self.object.id})
        return response
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user # Passed to form for potential use, not directly to model.save()
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Submit New IT Request")
        context['form_title'] = _("New IT Request Form")
        context['submit_button_text'] = _("Submit Request")
        # For cancel button in request_form.html
        context['cancel_url'] = reverse_lazy('requests_app:user_request_list') 
        return context

class RequestUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Request
    form_class = RequestStaffUpdateForm
    template_name = 'requests_app/request_form.html'
    context_object_name = 'request_obj' 

    def test_func(self):
        return self.request.user.is_staff

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        # Pass acting user to the form for logging in RequestStaffUpdateForm.save()
        kwargs['user'] = self.request.user 
        return kwargs

    def form_valid(self, form):
        # The form's save method (RequestStaffUpdateForm.save) is responsible for:
        # 1. Saving the Request instance.
        # 2. Creating the RequestUpdate log entry, using the 'user' passed to its __init__.
        response = super().form_valid(form) # This calls form.save()
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
        # For cancel button in request_form.html
        context['cancel_url'] = self.object.get_absolute_url() 
        return context

class RequestDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = Request
    template_name = 'requests_app/request_detail.html'
    context_object_name = 'request_obj'

    def test_func(self):
        request_instance = self.get_object()
        return self.request.user.is_staff or self.request.user == request_instance.requested_by

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
        
        if self.request.user == request_instance.requested_by and \
           request_instance.status in commentable_statuses:
            if 'user_comment_form' not in context:
                 context['user_comment_form'] = UserRequestCommentForm()
        
        # Use the correct related_name from RequestUpdate model
        context['request_updates'] = request_instance.updates_history.all().order_by('-update_time')
        return context

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        
        if 'submit_user_comment' in request.POST:
            if not (self.request.user.is_staff or self.request.user == self.object.requested_by):
                messages.error(request, _("You are not authorized to add comments to this request."))
                return redirect(self.object.get_absolute_url())

            form = UserRequestCommentForm(request.POST)
            if form.is_valid():
                comment_text = form.cleaned_data['comment_text']
                
                RequestUpdate.objects.create(
                    request=self.object,
                    updated_by=request.user,
                    notes=comment_text
                )
                
                if self.object.status == Request.STATUS_PENDING_USER_INPUT:
                    old_status_for_log = self.object.status
                    self.object.status = Request.STATUS_REOPENED 
                    
                    # REMOVED 'user' kwarg
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

class UserRequestListView(LoginRequiredMixin, ListView):
    model = Request
    template_name = 'requests_app/user_request_list.html'
    context_object_name = 'user_requests'
    paginate_by = 10

    def get_queryset(self):
        return Request.objects.filter(requested_by=self.request.user).select_related(
            'request_type',
            'assigned_to',
            'related_existing_equipment',
            'request_location'
        ).order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _('My IT Requests')
        return context

@login_required
def request_close_by_user(request, pk):
    request_obj = get_object_or_404(Request, pk=pk)

    if request.user != request_obj.requested_by:
        messages.error(request, _("You are not authorized to perform this action."))
        return redirect('requests_app:request_detail', pk=pk)
    
    if request_obj.status == Request.STATUS_RESOLVED_AWAITING_CONFIRMATION:
        old_status_for_log = request_obj.status
        request_obj.status = Request.STATUS_CLOSED_CONFIRMED
        
        # REMOVED 'user' kwarg
        request_obj.save(update_fields=['status'])

        RequestUpdate.objects.create(
            request=request_obj,
            updated_by=request.user,
            notes=_("Request closed by user confirmation."),
            old_status=old_status_for_log,
            new_status=request_obj.status
        )
        messages.success(request, _("Request #%(request_id)s has been closed.") % {'request_id': pk})
    else:
        messages.warning(request, _("This request cannot be closed by you from its current status (%(status)s). It must be resolved by IT and awaiting your confirmation.") % {'status': request_obj.get_status_display()})
    
    return redirect('requests_app:request_detail', pk=pk)

@login_required
def request_reopen_by_user(request, pk):
    request_obj = get_object_or_404(Request, pk=pk)

    if request.user != request_obj.requested_by:
        messages.error(request, _("You are not authorized to perform this action."))
        return redirect('requests_app:request_detail', pk=pk)

    allowed_statuses_to_reopen = [
        Request.STATUS_CLOSED_CONFIRMED, 
        Request.STATUS_CLOSED_AUTO,
        Request.STATUS_RESOLVED_AWAITING_CONFIRMATION
    ]
    if request_obj.status in allowed_statuses_to_reopen:
        original_status_for_log = request_obj.status
        request_obj.status = Request.STATUS_REOPENED
        
        # REMOVED 'user' kwarg
        request_obj.save(update_fields=['status'])

        RequestUpdate.objects.create(
            request=request_obj,
            updated_by=request.user,
            notes=_("Request reopened by user."),
            old_status=original_status_for_log,
            new_status=request_obj.status
        )
        messages.success(request, _("Request #%(request_id)s has been reopened.") % {'request_id': pk})
    else:
        messages.warning(request, _("This request cannot be reopened from its current status (%(status)s).") % {'status': request_obj.get_status_display()})
        
    return redirect('requests_app:request_detail', pk=pk)