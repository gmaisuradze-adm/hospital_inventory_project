# Version: 1.X - 2025-05-27 - Copilot Edit
# - Updated AdminRequestListView for Tabler styling and filtering.
# - Added context variables for filters.
# - Implemented filtering logic in get_queryset.

from django.shortcuts import render, redirect
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.contrib import messages
from django.utils.text import Truncator
from django.utils.translation import gettext_lazy as _
from django.db.models import Q
from django.contrib.auth import get_user_model # For staff users filter

from .models import Request, RequestType # Assuming RequestType is your model for types
from .forms import RequestCreateForm

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
        ).order_by('status', '-created_at') # Default ordering

        search_query = self.request.GET.get('q')
        status_filter = self.request.GET.get('status')
        type_filter = self.request.GET.get('type')
        assigned_to_filter = self.request.GET.get('assigned_to')

        if search_query:
            queryset = queryset.filter(
                Q(id__icontains=search_query) | # Search by ID
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
        
        # Sorting can be added here if needed, e.g., based on GET parameters
        # For example:
        # sort_by = self.request.GET.get('sort', '-created_at') # Default sort by newest
        # if sort_by in ['created_at', '-created_at', 'status', '-status']: # Validate sort parameter
        #     queryset = queryset.order_by(sort_by)
        
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("All IT Requests (Admin View)")
        context['status_choices_for_filter'] = Request.STATUS_CHOICES 
        context['types_for_filter'] = RequestType.objects.all().order_by('name')
        context['staff_users_for_filter'] = User.objects.filter(is_staff=True).order_by('username')
        return context

# RequestCreateView, RequestUpdateView, RequestDetailView, UserRequestListView ...
# (დანარჩენი views კლასები უცვლელია ამ ეტაპზე, თუ ცვლილებები არ მოგითხოვიათ)
# Please ensure the rest of your views.py file is present if I need to refer to it later.

class RequestCreateView(LoginRequiredMixin, CreateView):
    model = Request
    form_class = RequestCreateForm
    template_name = 'requests_app/request_form.html'

    def get_success_url(self):
        messages.success(self.request, _('Your IT request has been submitted successfully!'))
        if self.request.user.is_staff:
            return reverse_lazy('requests_app:admin_request_list')
        else:
            if hasattr(self, 'object') and self.object and self.object.pk:
                 return reverse_lazy('requests_app:user_request_list')
            else:
                return reverse_lazy('requests_app:user_request_list')


    def form_valid(self, form):
        form.instance.requested_by = self.request.user
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Submit New IT Equipment Request")
        context['form_title'] = _("New IT Request Form")
        context['submit_button_text'] = _("Submit Request")
        return context

class RequestUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Request
    form_class = RequestCreateForm 
    template_name = 'requests_app/request_form.html' 
    context_object_name = 'object'

    def get_success_url(self):
        messages.success(self.request, _('Request #%(request_id)s has been updated successfully!') % {'request_id': self.object.id})
        if self.request.user.is_staff:
            return reverse_lazy('requests_app:admin_request_list')
        else:
            return reverse_lazy('requests_app:request_detail', kwargs={'pk': self.object.pk})


    def test_func(self):
        request_instance = self.get_object()
        if self.request.user.is_staff:
            return True
        return False 

    def form_valid(self, form):
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        subject = self.object.subject
        truncated_subject = Truncator(subject).words(5, truncate=' ...')
        context['page_title'] = _("Edit IT Request #%(request_id)s") % {'request_id': self.object.id}
        context['form_title'] = _("Edit IT Request: %(subject)s") % {'subject': truncated_subject}
        context['submit_button_text'] = _("Save Changes")
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
        truncated_subject_for_title = Truncator(self.object.subject).words(7, truncate='...')
        context['page_title'] = _("Request Details: #%(request_id)s - %(subject)s") % {'request_id': self.object.id, 'subject': truncated_subject_for_title}
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
            'related_equipment'
        ).order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _('My IT Requests')
        return context