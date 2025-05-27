# Version: 1.9 (Copilot Full Revamp for core/views.py)
# Includes:
# - Updated DashboardView with Stage 1 enhancements (stat cards, one chart)
# - Added select_related for 'request_type' in DashboardView for staff_recent_active_requests and my_recent_requests
# - Restored authentication views (login, logout, register)
# - Restored placeholder views (Privacy Policy, Terms of Service)
# - Standardized imports and structure

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from django.urls import reverse_lazy
from django.db.models import Q, Count

# Import forms from the current app (core)
from .forms import CustomLoginForm, CustomUserCreationForm

# Import models from other apps
from inventory.models import Equipment
from warehouse.models import StockItem
from requests_app.models import Request # Assuming your Request model is in requests_app

User = get_user_model()

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "core/dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        
        context['welcome_message'] = _("Welcome back, {}! This is your central hub for managing IT resources.").format(user.username)
        context['dashboard_error'] = None

        if user.is_staff:
            context['page_title'] = _("Admin Dashboard")
        else:
            context['page_title'] = _("User Dashboard")
        
        # Define request statuses for reusability
        status_new = 'new'
        status_in_progress = 'assigned' # Assuming 'assigned' is the primary "work in progress" status.
        status_on_hold = 'on_hold'
        
        # Statuses considered "active" for overall counts and lists
        overall_active_statuses_q = Q(status__in=[status_new, status_in_progress, status_on_hold])
        
        try:
            # General Stats visible to all logged-in users
            context['total_equipment'] = Equipment.objects.count()
            context['total_equipment_url'] = reverse_lazy('inventory:equipment_list')
            
            context['total_stock_items'] = StockItem.objects.count()
            context['total_stock_items_url'] = reverse_lazy('warehouse:stockitem_list')
            
            all_requests = Request.objects.all() # Base queryset for requests

            if user.is_staff:
                # --- Admin Specific Stats & Data ---
                new_req_count = all_requests.filter(status=status_new).count()
                in_progress_req_count = all_requests.filter(status=status_in_progress).count()
                on_hold_req_count = all_requests.filter(status=status_on_hold).count()

                context['new_requests_count'] = new_req_count
                context['new_requests_url'] = f"{reverse_lazy('requests_app:admin_request_list')}?status={status_new}"
                
                context['active_requests_count'] = in_progress_req_count + on_hold_req_count
                context['active_requests_url'] = f"{reverse_lazy('requests_app:admin_request_list')}?status={status_in_progress}&status={status_on_hold}"
                
                context['in_progress_requests_count'] = in_progress_req_count
                context['on_hold_requests_count'] = on_hold_req_count

                context['unassigned_requests_count'] = all_requests.filter(
                    assigned_to__isnull=True,
                    status__in=[status_new, status_in_progress, status_on_hold] 
                ).count()
                context['unassigned_requests_url'] = f"{reverse_lazy('requests_app:admin_request_list')}?assigned_to=unassigned"
                
                # Data for Request Status Pie Chart
                context['request_status_chart_data'] = {
                    'labels': [_('New'), _('In Progress'), _('On Hold')],
                    'series': [new_req_count, in_progress_req_count, on_hold_req_count],
                }

                # staff_recent_active_requests:
                # Assuming 'request_type' is a ForeignKey in your Request model.
                # If 'priority' is also a ForeignKey, add 'priority' to select_related.
                # If 'request_type' or 'priority' are CharFields, they don't need to be in select_related.
                context['staff_recent_active_requests'] = all_requests.filter(
                    overall_active_statuses_q
                ).select_related(
                    'requested_by', 
                    'assigned_to',
                    'request_type' # Ensure 'request_type' model is imported if it's a ForeignKey
                ).order_by('-updated_at')[:5]
            
            else: # Regular User Dashboard Data
                my_requests = all_requests.filter(requested_by=user)
                context['my_open_requests_count'] = my_requests.filter(overall_active_statuses_q).count()
                
                # my_recent_requests:
                # Similar assumptions for 'request_type' and 'priority' as above.
                context['my_recent_requests'] = my_requests.select_related(
                    'assigned_to', 
                    'request_type' # Ensure 'request_type' model is imported if it's a ForeignKey
                ).order_by('-created_at')[:5]

        except Exception as e:
            error_message = f"Error in DashboardView data fetching: {e}"
            print(error_message) 
            context['dashboard_error'] = str(e)
            # Fallback values
            context.setdefault('total_equipment', 'N/A')
            context.setdefault('total_equipment_url', '#')
            context.setdefault('total_stock_items', 'N/A')
            context.setdefault('total_stock_items_url', '#')
            if user.is_staff:
                context.setdefault('new_requests_count', 'N/A')
                context.setdefault('new_requests_url', '#')
                context.setdefault('active_requests_count', 'N/A')
                context.setdefault('active_requests_url', '#')
                context.setdefault('in_progress_requests_count', 'N/A')
                context.setdefault('on_hold_requests_count', 'N/A')
                context.setdefault('unassigned_requests_count', 'N/A')
                context.setdefault('unassigned_requests_url', '#')
                context.setdefault('request_status_chart_data', {'labels': [], 'series': []})
                context.setdefault('staff_recent_active_requests', [])
            else:
                context.setdefault('my_open_requests_count', 'N/A')
                context.setdefault('my_recent_requests', [])
        return context

# --- Authentication Views ---
def user_login_view(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard') 
    
    if request.method == 'POST':
        form = CustomLoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, _("Welcome back, {}!").format(user.get_username()))
            next_url = request.GET.get('next')
            if next_url:
                return redirect(next_url)
            return redirect('core:dashboard') 
        else:
            messages.error(request, _("Invalid username or password. Please try again."))
    else:
        form = CustomLoginForm()
    return render(request, 'core/login.html', {'form': form, 'page_title': _('Login')})

def user_logout_view(request):
    logout(request)
    messages.info(request, _("You have been successfully logged out."))
    return redirect('core:login')

def user_register_view(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard') 
    
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, _("Registration successful! You can now log in."))
            return redirect('core:login') 
        else:
            # Form with errors will be re-rendered by the render call below
            pass 
    else:
        form = CustomUserCreationForm()
    return render(request, 'core/register.html', {'form': form, 'page_title': _('Register')})

# --- Placeholder Views ---
class PrivacyPolicyView(LoginRequiredMixin, TemplateView):
    template_name = "core/placeholder_page.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Privacy Policy")
        context['placeholder_content'] = _("This is a placeholder page for the Privacy Policy. Content will be added soon.")
        return context

class TermsServiceView(LoginRequiredMixin, TemplateView):
    template_name = "core/placeholder_page.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Terms of Service")
        context['placeholder_content'] = _("This is a placeholder page for the Terms of Service. Content will be added soon.")
        return context