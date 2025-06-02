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
from django.db.models import Q, Count, F
from django.db import models

# Import forms from the current app (core)
from .forms import CustomLoginForm, CustomUserCreationForm

# Import models from other apps
from inventory.models import Equipment
from warehouse.models import StockItem
from requests_app.models import Request # Assuming your Request model is in requests_app

# Rate limiting imports
from django_ratelimit.decorators import ratelimit

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
            context['page_title'] = _("User Dashboard")          # Define request statuses for reusability (using actual Request status choices)
        status_new = 'new'
        status_in_progress = 'in_progress'  # Changed from 'assigned' to actual status
        status_on_hold = 'on_hold_internal'  # Changed to actual status
        status_assigned = 'assigned'  # Add assigned status
        
        # Statuses considered "active" for overall counts and lists
        overall_active_statuses_q = Q(status__in=[status_new, status_assigned, status_in_progress, status_on_hold])
        
        try:
            # General Stats visible to all logged-in users
            context['total_equipment'] = Equipment.objects.count()
            context['total_equipment_url'] = reverse_lazy('inventory:equipment_list')
            
            context['total_stock_items'] = StockItem.objects.count()
            context['total_stock_items_url'] = reverse_lazy('warehouse:stockitem_list')
            
            all_requests = Request.objects.all() # Base queryset for requests

            if user.is_staff:                # --- Admin Specific Stats & Data ---
                new_req_count = all_requests.filter(status=status_new).count()
                assigned_req_count = all_requests.filter(status=status_assigned).count()
                in_progress_req_count = all_requests.filter(status=status_in_progress).count()
                on_hold_req_count = all_requests.filter(status=status_on_hold).count()

                context['new_requests_count'] = new_req_count
                context['new_requests_url'] = f"{reverse_lazy('requests_app:admin_request_list')}?status={status_new}"
                
                context['active_requests_count'] = assigned_req_count + in_progress_req_count + on_hold_req_count
                context['active_requests_url'] = f"{reverse_lazy('requests_app:admin_request_list')}?status={status_assigned}&status={status_in_progress}&status={status_on_hold}"
                
                context['in_progress_requests_count'] = in_progress_req_count
                context['on_hold_requests_count'] = on_hold_req_count

                context['unassigned_requests_count'] = all_requests.filter(
                    assigned_to__isnull=True,
                    status__in=[status_new, status_assigned, status_in_progress, status_on_hold] 
                ).count()
                context['unassigned_requests_url'] = f"{reverse_lazy('requests_app:admin_request_list')}?assigned_to=unassigned"
                  # Equipment status breakdown
                from inventory.models import Status
                # Use filter().first() instead of get() to avoid MultipleObjectsReturned error
                operational_status = Status.objects.filter(name__icontains='use').first()  # "In Use"
                context['operational_equipment_count'] = Equipment.objects.filter(status=operational_status).count() if operational_status else 0
                # Use filter().first() instead of get() to avoid MultipleObjectsReturned error
                maintenance_status = Status.objects.filter(name__icontains='repair').first()  # "Under Repair"
                context['maintenance_equipment_count'] = Equipment.objects.filter(status=maintenance_status).count() if maintenance_status else 0
                # Use filter().first() instead of get() to avoid MultipleObjectsReturned error
                decommissioned_status = Status.objects.filter(name__icontains='decommissioned').first()  # "Decommissioned"
                context['decommissioned_equipment_count'] = Equipment.objects.filter(status=decommissioned_status).count() if decommissioned_status else 0
                context['retired_equipment_count'] = context['decommissioned_equipment_count']  # Alias for retired
                # Use filter().first() instead of get() to avoid MultipleObjectsReturned error
                writeoff_status = Status.objects.filter(name__icontains='written').first()  # "To Be Written Off"
                context['writeoff_equipment_count'] = Equipment.objects.filter(status=writeoff_status).count() if writeoff_status else 0
                # Try to get broken/out of order equipment
                broken_status = Status.objects.filter(name__icontains='broken').first()
                if broken_status:
                    context['broken_equipment_count'] = Equipment.objects.filter(status=broken_status).count()
                else:
                    # Try alternative names for broken status
                    broken_status = Status.objects.filter(name__icontains='order').first()
                    context['broken_equipment_count'] = Equipment.objects.filter(status=broken_status).count() if broken_status else 0
                
                # System users count
                context['total_users'] = User.objects.count()
                context['active_users_count'] = User.objects.filter(is_staff=True, is_active=True).count()
                
                # Categories and locations count
                from inventory.models import Category, Location
                context['total_categories'] = Category.objects.count()
                context['total_locations'] = Location.objects.count()
                
                # Recent completion stats
                from django.utils import timezone
                from datetime import datetime, timedelta
                today = timezone.now().date()
                week_ago = today - timedelta(days=7)
                  # Recent completion stats - using actual completed statuses
                context['requests_completed_today'] = all_requests.filter(
                    status__in=['closed_confirmed', 'closed_auto', 'resolved_awaiting_confirmation'],
                    updated_at__date=today
                ).count()
                
                context['requests_completed_week'] = all_requests.filter(
                    status__in=['closed_confirmed', 'closed_auto', 'resolved_awaiting_confirmation'],
                    updated_at__date__gte=week_ago
                ).count()
                  # Low stock items
                context['low_stock_items'] = StockItem.objects.filter(
                    quantity_on_hand__lte=F('minimum_stock_level')
                ).exclude(minimum_stock_level__isnull=True)[:10]
                
                context['low_stock_items_count'] = StockItem.objects.filter(
                    quantity_on_hand__lte=F('minimum_stock_level')
                ).exclude(minimum_stock_level__isnull=True).count()                # Recent equipment activity (recently updated equipment)
                context['recent_equipment_activity'] = Equipment.objects.select_related(
                    'category', 'current_location'
                ).order_by('-last_updated')[:8]                # Data for Request Status Pie Chart
                context['request_status_chart_data'] = {
                    'labels': [str(_('New')), str(_('Assigned')), str(_('In Progress')), str(_('On Hold'))],
                    'series': [new_req_count, assigned_req_count, in_progress_req_count, on_hold_req_count],
                }
                
                # Phase 4: Advanced Analytics Chart Data
                from datetime import datetime, timedelta
                import json
                
                # Generate last 30 days of data for requests chart
                today = timezone.now().date()
                thirty_days_ago = today - timedelta(days=30)
                
                # Create labels for the last 30 days
                chart_labels = []
                chart_data = []
                
                for i in range(30):
                    date = thirty_days_ago + timedelta(days=i)
                    chart_labels.append(date.strftime('%m/%d'))
                    # Count requests created on this date
                    daily_count = all_requests.filter(created_at__date=date).count()
                    chart_data.append(daily_count)
                
                context['requests_chart_data'] = {
                    'labels': json.dumps(chart_labels),
                    'data': json.dumps(chart_data),
                }
                
                # Equipment status chart data
                context['equipment_chart_data'] = {
                    'labels': json.dumps([str(_('Operational')), str(_('Maintenance')), str(_('Broken')), str(_('Retired'))]),
                    'data': json.dumps([
                        context.get('operational_equipment_count', 0),
                        context.get('maintenance_equipment_count', 0),
                        context.get('broken_equipment_count', 0),
                        context.get('retired_equipment_count', 0),
                    ]),
                }
                
                # Additional analytics data
                context['total_requests_week'] = all_requests.filter(
                    created_at__date__gte=week_ago
                ).count()

                # staff_recent_active_requests:
                context['staff_recent_active_requests'] = all_requests.filter(
                    overall_active_statuses_q
                ).select_related(
                    'requested_by', 
                    'assigned_to',
                    'request_type'
                ).order_by('-updated_at')[:5]
            
            else: # Regular User Dashboard Data
                my_requests = all_requests.filter(requested_by=user)
                context['my_open_requests_count'] = my_requests.filter(overall_active_statuses_q).count()
                context['my_total_requests_count'] = my_requests.count()
                
                # my_recent_requests:
                context['my_recent_requests'] = my_requests.select_related(
                    'assigned_to', 
                    'request_type'
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
@ratelimit(key='ip', rate='5/m', method='POST', block=True)
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

@ratelimit(key='ip', rate='3/m', method='POST', block=True)
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