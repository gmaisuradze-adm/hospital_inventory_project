# Version: 1.1 (Corrected overall_active_it_requests status filter)
# User: gmaisuradze-adm
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
# from django.contrib.auth.decorators import login_required # Not used directly for views here
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from .forms import CustomLoginForm, CustomUserCreationForm # Assuming these are in the same 'core' app
from django.contrib import messages
from django.utils.translation import gettext_lazy as _

# Import models from other apps
from inventory.models import Equipment
from warehouse.models import StockItem
from requests_app.models import Request
from django.db.models import Q


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "core/dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        context['page_title'] = _("Dashboard")
        context['welcome_message'] = _("Welcome back, {}! This is your central hub for managing IT resources. From here, you can navigate to various sections of the IT inventory and request management system.").format(user.username)
        context['dashboard_error'] = None

        try:
            # General stats for all authenticated users
            context['total_equipment'] = Equipment.objects.count()
            context['total_stock_items'] = StockItem.objects.count()
            # Using 'new', 'assigned', 'pending_order', 'on_hold' as active statuses based on typical model choices
            context['overall_active_it_requests'] = Request.objects.filter(
                status__in=['new', 'assigned', 'pending_order', 'on_hold'] # MODIFIED: Corrected status list
            ).count()

            if user.is_staff:
                # Staff-specific context
                context['new_requests_count'] = Request.objects.filter(status='new').count()
                context['in_progress_requests_count'] = Request.objects.filter(status='assigned').count() # Assuming 'assigned' means 'in_progress' for this context
                context['on_hold_requests_count'] = Request.objects.filter(status='on_hold').count()
                context['unassigned_requests_count'] = Request.objects.filter(
                    assigned_to__isnull=True,
                    status__in=['new', 'assigned', 'pending_order', 'on_hold'] # Also ensure this list is consistent
                ).count()
                context['staff_recent_active_requests'] = Request.objects.filter(
                    ~Q(status__in=['completed', 'rejected']) # Adjusted based on provided STATUS_CHOICES
                ).order_by('-updated_at')[:5]
            else:
                # Non-staff user specific context
                my_open_requests_query = Request.objects.filter(
                    requested_by=user, # Filter by the logged-in user
                    status__in=['new', 'assigned', 'pending_order', 'on_hold'] # MODIFIED: Corrected status list
                )
                context['my_open_requests_count'] = my_open_requests_query.count()
                context['my_recent_requests'] = Request.objects.filter(
                    requested_by=user # Filter by the logged-in user
                ).order_by('-created_at')[:5]

        except Exception as e:
            error_message = f"Error in DashboardView get_context_data: {e}"
            print(error_message) # Keep for console logging
            context['dashboard_error'] = str(e) # Pass the error message to the template
            # Ensure default 'N/A' or 0 values if an error occurs during data fetching
            if 'total_equipment' not in context: context['total_equipment'] = 'N/A'
            if 'total_stock_items' not in context: context['total_stock_items'] = 'N/A'
            if 'overall_active_it_requests' not in context: context['overall_active_it_requests'] = 'N/A'
            if user.is_staff:
                if 'new_requests_count' not in context: context['new_requests_count'] = 'N/A'
                if 'in_progress_requests_count' not in context: context['in_progress_requests_count'] = 'N/A'
                if 'on_hold_requests_count' not in context: context['on_hold_requests_count'] = 'N/A'
                if 'unassigned_requests_count' not in context: context['unassigned_requests_count'] = 'N/A'
                if 'staff_recent_active_requests' not in context: context['staff_recent_active_requests'] = []
            else:
                if 'my_open_requests_count' not in context: context['my_open_requests_count'] = 'N/A'
                if 'my_recent_requests' not in context: context['my_recent_requests'] = []
        return context

# user_login_view, user_logout_view, user_register_view should remain as they are
# (Make sure they are correctly defined in your actual core/views.py file)

def user_login_view(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard')
    if request.method == 'POST':
        form = CustomLoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, _("Welcome back, {}!").format(user.username))
            # Default redirect is to LOGIN_REDIRECT_URL, which is '/' (dashboard)
            # but explicit redirect to 'core:dashboard' is also fine.
            next_url = request.GET.get('next')
            if next_url:
                return redirect(next_url)
            return redirect('core:dashboard')
        else:
            # Iterate over form errors to provide more specific messages if desired
            error_list = []
            for field, errors in form.errors.items():
                for error in errors:
                    error_list.append(f"{form.fields[field].label if field != '__all__' else ''}: {error}")
            messages.error(request, _("Invalid username or password. Please try again. ") + " ".join(error_list))

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
            form.save() # user = form.save()
            messages.success(request, _("Registration successful! You can now log in."))
            return redirect('core:login')
        else:
            # Pass form with errors to the template
            pass
    else:
        form = CustomUserCreationForm()
    return render(request, 'core/register.html', {'form': form, 'page_title': _('Register')})