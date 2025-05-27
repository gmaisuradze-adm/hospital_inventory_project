from django.shortcuts import render, redirect
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.contrib import messages
from django.utils.text import Truncator

from .models import Request
from .forms import RequestCreateForm

class AdminRequestListView(LoginRequiredMixin, UserPassesTestMixin, ListView):
    model = Request
    template_name = 'requests_app/request_admin_list.html' # Assuming this template exists
    context_object_name = 'requests'
    paginate_by = 15

    def test_func(self):
        return self.request.user.is_staff

    def get_queryset(self):
        return Request.objects.select_related(
            'request_type',
            'requested_by',
            'assigned_to',
            'related_equipment'
        ).order_by('status', '-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "All IT Requests (Admin View)"
        return context

class RequestCreateView(LoginRequiredMixin, CreateView):
    model = Request
    form_class = RequestCreateForm
    template_name = 'requests_app/request_form.html' # Assuming this template exists

    def get_success_url(self):
        messages.success(self.request, 'Your IT request has been submitted successfully!')
        # After creating a request, redirect user to their list of requests
        # or to the detail of the newly created request.
        # For staff, admin_request_list is fine.
        # For non-staff, redirect to their new user_request_list.
        if self.request.user.is_staff:
            return reverse_lazy('requests_app:admin_request_list')
        else:
            # Check if self.object (the created request) exists and has a pk
            if hasattr(self, 'object') and self.object and self.object.pk:
                 # Option 1: Redirect to the detail of the newly created request
                 # return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})
                 # Option 2: Redirect to the user's list of requests (more common)
                 return reverse_lazy('requests_app:user_request_list')
            else:
                # Fallback if self.object is not available for some reason
                return reverse_lazy('requests_app:user_request_list')


    def form_valid(self, form):
        form.instance.requested_by = self.request.user
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Submit New IT Equipment Request"
        context['form_title'] = "New IT Request Form"
        context['submit_button_text'] = "Submit Request"
        return context

class RequestUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Request
    form_class = RequestCreateForm # Assuming this form is suitable for updates too
    template_name = 'requests_app/request_form.html' # Reusing the form template
    context_object_name = 'object'

    def get_success_url(self):
        messages.success(self.request, f'Request #{self.object.id} has been updated successfully!')
        # After update, redirect based on user role or to request detail
        if self.request.user.is_staff:
            return reverse_lazy('requests_app:admin_request_list')
        else:
            # If non-staff can edit (e.g. their own requests), redirect to detail or user list
            return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})


    def test_func(self):
        # Allow staff to edit any request.
        # Non-staff might be allowed to edit their own requests under certain conditions.
        request_instance = self.get_object()
        if self.request.user.is_staff:
            return True
        # Example: Allow non-staff to edit their own request if it's in 'new' status
        # return self.request.user == request_instance.requested_by and request_instance.status == 'new'
        return False # For now, only staff can edit via this view by default

    def form_valid(self, form):
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        subject = self.object.subject
        truncated_subject = Truncator(subject).words(5, truncate=' ...')
        context['page_title'] = f"Edit IT Request #{self.object.id}"
        context['form_title'] = f"Edit IT Request: {truncated_subject}"
        context['submit_button_text'] = "Save Changes"
        return context

class RequestDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = Request
    template_name = 'requests_app/request_detail.html' # We will create this template
    context_object_name = 'request_obj'

    def test_func(self):
        # Allow staff to view any request.
        # Allow the requester to view their own request.
        request_instance = self.get_object()
        return self.request.user.is_staff or self.request.user == request_instance.requested_by

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        truncated_subject_for_title = Truncator(self.object.subject).words(7, truncate='...')
        context['page_title'] = f"Request Details: #{self.object.id} - {truncated_subject_for_title}"
        return context

# --- NEW VIEW FOR REGULAR USER'S OWN REQUESTS ---
class UserRequestListView(LoginRequiredMixin, ListView):
    model = Request
    template_name = 'requests_app/user_request_list.html' # This template will be created
    context_object_name = 'user_requests'
    paginate_by = 10

    def get_queryset(self):
        # Return only requests made by the current logged-in user
        return Request.objects.filter(requested_by=self.request.user).select_related(
            'request_type',
            'assigned_to',
            'related_equipment'
        ).order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'My IT Requests'
        return context