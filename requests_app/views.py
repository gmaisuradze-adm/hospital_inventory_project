# Version: 1.X - 2025-05-27 - Copilot Edit
# - Updated AdminRequestListView for Tabler styling and filtering.
# - Added context variables for filters.
# - Implemented filtering logic in get_queryset.
# - Corrected RequestUpdateView to use RequestStaffUpdateForm.
# - Passed acting_user to RequestStaffUpdateForm.

from django.shortcuts import render, redirect
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.contrib import messages
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import Request, RequestType
# Ensure RequestStaffUpdateForm is imported
from .forms import RequestCreateForm, RequestStaffUpdateForm # UPDATED IMPORT

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
        # Pass current filter values to context to repopulate form fields in template
        context['current_q'] = self.request.GET.get('q', '')
        context['current_status'] = self.request.GET.get('status', '')
        context['current_type'] = self.request.GET.get('type', '')
        context['current_assigned_to'] = self.request.GET.get('assigned_to', '')
        return context

class RequestCreateView(LoginRequiredMixin, CreateView):
    model = Request
    form_class = RequestCreateForm
    template_name = 'requests_app/request_form.html' # This template is used by both Create and Update

    def get_success_url(self):
        messages.success(self.request, _('Your IT request has been submitted successfully!'))
        # Redirect to detail view of the newly created request if it's a non-staff user
        # or if staff user wants to see the detail of what they just created.
        # For now, keeping original logic.
        if self.request.user.is_staff:
            # Maybe redirect to the detail of the newly created request?
            # return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})
            return reverse_lazy('requests_app:admin_request_list')
        else:
            # user_request_list is fine, or detail view of their new request
            return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})


    def form_valid(self, form):
        form.instance.requested_by = self.request.user
        # If RequestCreateForm needs the user for any internal logic (it doesn't seem to currently)
        # you could pass it: form = RequestCreateForm(self.request.POST, user=self.request.user)
        # but for just setting requested_by, this is fine.
        return super().form_valid(form)
    
    def get_form_kwargs(self):
        """Pass user to form if RequestCreateForm needs it."""
        kwargs = super().get_form_kwargs()
        # RequestCreateForm's __init__ takes 'user', so we can pass it.
        # This is useful if the form needs to customize fields based on the user.
        kwargs['user'] = self.request.user
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Submit New IT Equipment Request")
        context['form_title'] = _("New IT Request Form")
        context['submit_button_text'] = _("Submit Request")
        return context

class RequestUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Request
    form_class = RequestStaffUpdateForm # CHANGED to RequestStaffUpdateForm
    template_name = 'requests_app/request_form.html' # Assuming this template can handle both forms
    context_object_name = 'object' # 'object' is the default, but good to be explicit

    def test_func(self):
        # Only staff can access this specific update view (which uses RequestStaffUpdateForm)
        return self.request.user.is_staff

    def get_form_kwargs(self):
        """Pass the acting user (request.user) to the form."""
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user # RequestStaffUpdateForm expects 'user' as acting_user
        return kwargs

    def form_valid(self, form):
        messages.success(self.request, _('Request #%(request_id)s has been updated successfully!') % {'request_id': self.object.id})
        # The form's save method already handles creating RequestUpdate entries
        # and setting date_assigned/resolved_at.
        return super().form_valid(form) # This will call form.save()

    def get_success_url(self):
        # After staff updates, usually good to go back to the detail view or list
        return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})
        # Or back to the admin list:
        # return reverse_lazy('requests_app:admin_request_list')

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
    context_object_name = 'request_obj'

    def test_func(self):
        request_instance = self.get_object()
        # Staff can see any request, requester can see their own.
        return self.request.user.is_staff or self.request.user == request_instance.requested_by

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        truncated_subject_for_title = Truncator(self.object.subject).words(7, truncate='...')
        context['page_title'] = _("Request Details: #%(request_id)s - %(subject)s") % {'request_id': self.object.id, 'subject': truncated_subject_for_title}
        # If you want to add a simple comment/update form directly on detail page for staff:
        # if self.request.user.is_staff:
        #     context['staff_update_form'] = RequestStaffUpdateForm(instance=self.object, user=self.request.user, initial={'update_notes': ''})
        return context

class UserRequestListView(LoginRequiredMixin, ListView):
    model = Request
    template_name = 'requests_app/user_request_list.html' 
    context_object_name = 'user_requests'
    paginate_by = 10

    def get_queryset(self):
        return Request.objects.filter(requested_by=self.request.user).select_related(
            'request_type',
            'assigned_to',
            'related_equipment' # Ensure this related_name is correct in Equipment model or Request model FK
        ).order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _('My IT Requests')
        return context