# Version: 1.3.4 - 2025-05-28 - Copilot Edit
# - Added PermissionRequiredMixin to EquipmentListView and EquipmentDetailView.
# - Ensured other views using PermissionRequiredMixin have appropriate permissions.

from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse_lazy, reverse
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.views.generic.edit import FormView
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib import messages
from django.utils import timezone
# from django.http import HttpResponseForbidden # Not used

from .models import Equipment, Category, Status, Location, Supplier, EquipmentLog, DecommissionLog
from .forms import (
    EquipmentForm, CategoryForm, StatusForm, LocationForm, SupplierForm,
    EquipmentMarkForWriteOffForm, DecommissionConfirmForm, EquipmentRestoreForm
)
from django.utils.translation import gettext_lazy as _
from django.db.models import Q

# Helper function to get specific statuses
def get_status_instance(status_name_key, is_decommissioned_flag=None, is_marked_flag=None):
    query_params = {}
    if is_decommissioned_flag is not None:
        query_params['is_decommissioned'] = is_decommissioned_flag
    if is_marked_flag is not None:
        query_params['is_marked_for_write_off'] = is_marked_flag

    if not query_params:
        if status_name_key == 'Marked for Write-Off':
            query_params['is_marked_for_write_off'] = True
            query_params['is_decommissioned'] = False
        elif status_name_key == 'Decommissioned':
            query_params['is_decommissioned'] = True
        else:
            query_params['name__iexact'] = _(status_name_key)
            
    try:
        if not query_params:
            print(f"CRITICAL: Status lookup failed for key '{status_name_key}' and flags. No query parameters were set.")
            return None
        return Status.objects.get(**query_params)
    except Status.DoesNotExist:
        print(f"CRITICAL: Status with params {query_params} not found for key '{status_name_key}'!")
        return None
    except Status.MultipleObjectsReturned:
        print(f"CRITICAL: Multiple statuses found for params {query_params} for key '{status_name_key}'! Returning the first one.")
        return Status.objects.filter(**query_params).first()


# Equipment Views
class EquipmentListView(LoginRequiredMixin, PermissionRequiredMixin, ListView): # Added PermissionRequiredMixin
    model = Equipment
    template_name = 'inventory/equipment_list.html'
    context_object_name = 'equipment_list'
    paginate_by = 15
    permission_required = 'inventory.view_equipment' # Added permission

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'category', 'status', 'current_location', 'assigned_to', 'supplier'
        )
        
        status_filter_value = self.request.GET.get('status_filter')

        if status_filter_value == 'marked':
            marked_status = get_status_instance('Marked for Write-Off', is_marked_flag=True, is_decommissioned_flag=False)
            if marked_status:
                queryset = queryset.filter(status__is_marked_for_write_off=True, status__is_decommissioned=False)
            else: 
                queryset = queryset.none()
                messages.warning(self.request, _("The 'Marked for Write-Off' status is not configured correctly or no items match."))
        elif status_filter_value == 'decommissioned':
            decommissioned_status = get_status_instance('Decommissioned', is_decommissioned_flag=True)
            if decommissioned_status:
                 queryset = queryset.filter(status__is_decommissioned=True)
            else:
                queryset = queryset.none()
                messages.warning(self.request, _("The 'Decommissioned' status is not configured correctly or no items match."))
        elif status_filter_value and status_filter_value.isdigit():
            queryset = queryset.filter(status_id=int(status_filter_value))
        elif not status_filter_value or status_filter_value == 'active': 
            queryset = queryset.filter(status__is_decommissioned=False, status__is_marked_for_write_off=False)
        
        category_id_str = self.request.GET.get('category')
        if category_id_str and category_id_str.isdigit():
            queryset = queryset.filter(category_id=int(category_id_str))
        
        search_query = self.request.GET.get('q')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(asset_tag__icontains=search_query) |
                Q(serial_number__icontains=search_query) |
                Q(notes__icontains=search_query)
            )
            
        return queryset.order_by('name')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Equipment Inventory")
        context['categories_for_filter'] = Category.objects.all().order_by('name')
        context['statuses_for_filter'] = Status.objects.all().order_by('name')
        context['current_status_filter'] = self.request.GET.get('status_filter', 'active')
        
        context['status_active_filter_value'] = 'active'
        context['status_marked_filter_value'] = 'marked'
        context['status_decommissioned_filter_value'] = 'decommissioned'
        
        # Permissions used to show/hide links in template
        # These should align with permissions required by the target views
        context['can_add_equipment'] = self.request.user.has_perm('inventory.add_equipment')
        context['can_view_marked_list'] = self.request.user.has_perm('inventory.view_equipment') # Assuming MarkedForWriteOffListView requires this
        context['can_view_decommissioned_list'] = self.request.user.has_perm('inventory.view_equipment') # Assuming DecommissionedEquipmentListView requires this
        return context

class MarkedForWriteOffListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = Equipment
    template_name = 'inventory/marked_for_write_off_list.html'
    context_object_name = 'equipment_list'
    permission_required = 'inventory.view_equipment' # Or a more specific perm like 'inventory.view_marked_equipment'
    paginate_by = 15

    def get_queryset(self):
        queryset = Equipment.objects.filter(
            status__is_marked_for_write_off=True, 
            status__is_decommissioned=False
        ).select_related(
            'category', 'status', 'current_location', 'assigned_to', 'supplier'
        ).order_by('-last_updated')
        
        search_query = self.request.GET.get('q')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(asset_tag__icontains=search_query) |
                Q(serial_number__icontains=search_query)
            )
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Equipment Marked for Write-Off")
        context['list_type_description'] = _("This list shows equipment items that have been flagged for future decommissioning and are awaiting final action.")
        context['can_add_equipment'] = self.request.user.has_perm('inventory.add_equipment') # For consistency if you have a general "add" button
        return context

class DecommissionedEquipmentListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = Equipment
    template_name = 'inventory/decommissioned_equipment_list.html'
    context_object_name = 'equipment_list'
    permission_required = 'inventory.view_equipment' # Or 'inventory.view_decommissioned_equipment'
    paginate_by = 15

    def get_queryset(self):
        queryset = Equipment.objects.filter(
            status__is_decommissioned=True
        ).select_related(
            'category', 'status', 'current_location', 'assigned_to', 'supplier', 'decommission_details'
        ).order_by('-decommission_details__decommission_date', '-last_updated')
        
        search_query = self.request.GET.get('q')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(asset_tag__icontains=search_query) |
                Q(serial_number__icontains=search_query)
            )
        return queryset
        
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Decommissioned Equipment Archive")
        context['list_type_description'] = _("This list shows all equipment items that have been permanently decommissioned and removed from active service.")
        context['can_add_equipment'] = self.request.user.has_perm('inventory.add_equipment')
        return context


class EquipmentDetailView(LoginRequiredMixin, PermissionRequiredMixin, DetailView): # Added PermissionRequiredMixin
    model = Equipment
    template_name = 'inventory/equipment_detail.html'
    context_object_name = 'equipment'
    permission_required = 'inventory.view_equipment' # Added permission

    def get_queryset(self):
        return super().get_queryset().select_related(
            'category', 'status', 'current_location', 'assigned_to', 
            'supplier', 'added_by', 'updated_by'
        ).prefetch_related('decommission_details')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        equipment = self.object
        context['page_title'] = f"{equipment.name} ({_('Details')})"
        
        can_mark_for_write_off = False
        can_decommission = False
        can_restore = False

        # Check permissions for actions
        perm_change = self.request.user.has_perm('inventory.change_equipment')
        # Using 'delete_equipment' for decommission as per your current setup, 
        # but a specific 'decommission_equipment' perm would be better.
        perm_decommission = self.request.user.has_perm('inventory.delete_equipment') 
        # Using 'add_equipment' for restore as per your current setup,
        # but a specific 'restore_equipment' perm would be better.
        perm_restore = self.request.user.has_perm('inventory.add_equipment')

        if equipment.status:
            if not equipment.status.is_decommissioned and not equipment.status.is_marked_for_write_off:
                can_mark_for_write_off = perm_change
            if equipment.status.is_marked_for_write_off and not equipment.status.is_decommissioned:
                can_decommission = perm_decommission
            if equipment.status.is_decommissioned:
                can_restore = perm_restore
        
        context['can_edit_equipment'] = perm_change # For general edit button
        context['can_delete_equipment'] = self.request.user.has_perm('inventory.delete_equipment') # For general delete button (if applicable)

        context['can_mark_for_write_off'] = can_mark_for_write_off
        context['can_decommission'] = can_decommission
        context['can_restore'] = can_restore
        
        return context

class EquipmentCreateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, CreateView):
    model = Equipment
    form_class = EquipmentForm
    template_name = 'inventory/equipment_form.html' 
    permission_required = 'inventory.add_equipment'
    success_url = reverse_lazy('inventory:equipment_list')
    success_message = _("Equipment '%(name)s' was created successfully.")

    def form_valid(self, form):
        form.instance.save(user=self.request.user) 
        return super().form_valid(form)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Add New Equipment")
        context['form_title'] = _("Create Equipment Item")
        context['submit_button_text'] = _("Create Equipment")
        return context

class EquipmentUpdateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Equipment
    form_class = EquipmentForm 
    template_name = 'inventory/equipment_form.html'
    permission_required = 'inventory.change_equipment'
    success_message = _("Equipment '%(name)s' was updated successfully.")

    def form_valid(self, form):
        new_status = form.cleaned_data.get('status')
        if new_status and (new_status.is_decommissioned or new_status.is_marked_for_write_off):
            if self.object.status != new_status:
                messages.error(self.request, _("Cannot set 'Decommissioned' or 'Marked for Write-Off' status directly. Please use the dedicated processes."))
                return self.form_invalid(form)
        
        form.instance.save(user=self.request.user)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('inventory:equipment_detail', kwargs={'pk': self.object.pk})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Update {equipment_name}").format(equipment_name=self.object.name)
        context['form_title'] = _("Editing Equipment: {equipment_name}").format(equipment_name=self.object.name)
        context['submit_button_text'] = _("Save Changes")
        return context

class EquipmentDeleteView(LoginRequiredMixin, PermissionRequiredMixin, DeleteView):
    model = Equipment
    template_name = 'inventory/equipment_confirm_delete.html'
    permission_required = 'inventory.delete_equipment'
    success_url = reverse_lazy('inventory:equipment_list')
    context_object_name = 'equipment'

    def dispatch(self, request, *args, **kwargs):
        equipment = self.get_object()
        if equipment.status and equipment.status.is_decommissioned:
            messages.error(request, _("Decommissioned equipment cannot be deleted. It serves as an archive record."))
            return redirect(equipment.get_absolute_url())
        if equipment.status and equipment.status.is_marked_for_write_off:
            messages.error(request, _("Equipment marked for write-off should be decommissioned, not deleted directly."))
            return redirect(equipment.get_absolute_url())
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        equipment_name = self.get_object().name
        messages.success(self.request, _("Equipment '{equipment_name}' has been successfully deleted.").format(equipment_name=equipment_name))
        return super().post(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {equipment_name}").format(equipment_name=self.object.name)
        return context

class EquipmentMarkForWriteOffView(LoginRequiredMixin, PermissionRequiredMixin, FormView):
    template_name = 'inventory/equipment_mark_for_write_off_form.html'
    form_class = EquipmentMarkForWriteOffForm
    permission_required = 'inventory.change_equipment' # Consider 'inventory.mark_equipment_for_write_off'

    def setup(self, request, *args, **kwargs):
        super().setup(request, *args, **kwargs)
        self.equipment_instance = get_object_or_404(Equipment, pk=self.kwargs['pk'])

    def dispatch(self, request, *args, **kwargs):
        if not self.equipment_instance.status or \
           self.equipment_instance.status.is_decommissioned or \
           self.equipment_instance.status.is_marked_for_write_off:
            messages.error(request, _("This equipment cannot be marked for write-off as it's already decommissioned, marked, or has no status."))
            return redirect(self.equipment_instance.get_absolute_url())
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['equipment'] = self.equipment_instance
        context['page_title'] = _("Mark for Write-Off: {equipment_name}").format(equipment_name=self.equipment_instance.name)
        context['form_title'] = _("Reason for Marking for Write-Off")
        context['submit_button_text'] = _("Mark for Write-Off")
        return context

    def form_valid(self, form):
        reason = form.cleaned_data['write_off_reason']
        marked_status = get_status_instance('Marked for Write-Off', is_marked_flag=True, is_decommissioned_flag=False)
        if not marked_status:
            messages.error(self.request, _("Critical Error: The 'Marked for Write-Off' status is not configured correctly in the system."))
            return redirect(self.equipment_instance.get_absolute_url())

        timestamp = timezone.now().strftime("%Y-%m-%d %H:%M")
        user_performing_action = self.request.user.username
        note_prefix = _("Marked for write-off on %(date)s by %(user)s.") % {'date': timestamp, 'user': user_performing_action}
        new_note_entry = f"{note_prefix}\n{_('Reason:')} {reason}"
        
        if self.equipment_instance.notes:
            self.equipment_instance.notes = f"{self.equipment_instance.notes}\n\n{new_note_entry}"
        else:
            self.equipment_instance.notes = new_note_entry
        
        self.equipment_instance.status = marked_status
        self.equipment_instance.save(user=self.request.user)

        EquipmentLog.objects.create(
             equipment=self.equipment_instance,
             user=self.request.user,
             change_type='marked_for_write_off',
             notes=_("Marked for write-off. Reason: {reason}").format(reason=reason)
        )
        messages.success(self.request, _("Equipment '{item_name}' has been successfully marked for write-off.").format(item_name=self.equipment_instance.name))
        return redirect(self.get_success_url())

    def get_success_url(self):
        return self.equipment_instance.get_absolute_url()


class EquipmentDecommissionView(LoginRequiredMixin, PermissionRequiredMixin, FormView):
    template_name = 'inventory/equipment_decommission_form.html'
    form_class = DecommissionConfirmForm
    permission_required = 'inventory.delete_equipment' # Consider 'inventory.decommission_equipment'

    def setup(self, request, *args, **kwargs):
        super().setup(request, *args, **kwargs)
        self.equipment_instance = get_object_or_404(Equipment, pk=self.kwargs['pk'])

    def dispatch(self, request, *args, **kwargs):
        if not (self.equipment_instance.status and self.equipment_instance.status.is_marked_for_write_off and not self.equipment_instance.status.is_decommissioned):
            messages.error(request, _("This equipment cannot be decommissioned. It must be 'Marked for Write-Off' first and not already decommissioned."))
            return redirect(self.equipment_instance.get_absolute_url())
        return super().dispatch(request, *args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['equipment_instance'] = self.equipment_instance
        try:
            kwargs['instance'] = DecommissionLog.objects.get(equipment=self.equipment_instance)
        except DecommissionLog.DoesNotExist:
            pass
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['equipment'] = self.equipment_instance
        context['page_title'] = _("Decommission Equipment: {equipment_name}").format(equipment_name=self.equipment_instance.name)
        context['form_title'] = _("Confirm Decommissioning and Record Details")
        context['submit_button_text'] = _("Confirm Decommission")
        return context

    def form_valid(self, form):
        decommissioned_status = get_status_instance('Decommissioned', is_decommissioned_flag=True)
        if not decommissioned_status:
            messages.error(self.request, _("Critical Error: The 'Decommissioned' status is not configured correctly."))
            return redirect(self.equipment_instance.get_absolute_url())
        
        self.equipment_instance._decommission_form_data = form.cleaned_data
        self.equipment_instance.status = decommissioned_status
        self.equipment_instance.save(user=self.request.user)

        EquipmentLog.objects.create(
            equipment=self.equipment_instance,
            user=self.request.user,
            change_type='decommissioned',
            notes=_("Equipment decommissioned. Reason: {reason}").format(reason=form.cleaned_data.get('reason', _('N/A')))
        )
        messages.success(self.request, _("Equipment '{item_name}' has been successfully decommissioned.").format(item_name=self.equipment_instance.name))
        return redirect(self.get_success_url())

    def get_success_url(self):
        return self.equipment_instance.get_absolute_url()

class EquipmentRestoreView(LoginRequiredMixin, PermissionRequiredMixin, FormView):
    template_name = 'inventory/equipment_restore_form.html'
    form_class = EquipmentRestoreForm
    permission_required = 'inventory.add_equipment' # Consider 'inventory.restore_equipment'

    def setup(self, request, *args, **kwargs):
        super().setup(request, *args, **kwargs)
        self.equipment_instance = get_object_or_404(Equipment, pk=self.kwargs['pk'])

    def dispatch(self, request, *args, **kwargs):
        if not (self.equipment_instance.status and self.equipment_instance.status.is_decommissioned):
            messages.error(request, _("This equipment is not decommissioned and cannot be restored."))
            return redirect(self.equipment_instance.get_absolute_url())
        return super().dispatch(request, *args, **kwargs)
        
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['equipment'] = self.equipment_instance
        context['page_title'] = _("Restore Decommissioned Equipment: {equipment_name}").format(equipment_name=self.equipment_instance.name)
        context['form_title'] = _("Restore Equipment to Active Service")
        context['submit_button_text'] = _("Restore Equipment")
        return context

    def form_valid(self, form):
        restoration_reason = form.cleaned_data['restoration_reason']
        new_status = form.cleaned_data['new_status']

        timestamp = timezone.now().strftime("%Y-%m-%d %H:%M")
        user_performing_action = self.request.user.username
        note_prefix = _("Restored to service on %(date)s by %(user)s.") % {'date': timestamp, 'user': user_performing_action}
        new_note_entry = f"{note_prefix}\n{_('Restoration Reason:')} {restoration_reason}"
        
        if self.equipment_instance.notes:
            self.equipment_instance.notes = f"{self.equipment_instance.notes}\n\n{new_note_entry}"
        else:
            self.equipment_instance.notes = new_note_entry
        
        self.equipment_instance.status = new_status
        self.equipment_instance.save(user=self.request.user)

        EquipmentLog.objects.create(
            equipment=self.equipment_instance,
            user=self.request.user,
            change_type='restored',
            notes=_("Equipment restored. Reason: {reason}. New status: {status_name}").format(
                reason=restoration_reason, status_name=new_status.name
            )
        )
        messages.success(self.request, _("Equipment '{item_name}' has been successfully restored to status '{status_name}'.").format(
            item_name=self.equipment_instance.name, status_name=new_status.name
        ))
        return redirect(self.get_success_url())

    def get_success_url(self):
        return self.equipment_instance.get_absolute_url()

# --- CRUD Views for Category, Status, Location, Supplier ---

class CategoryListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = Category
    template_name = 'inventory/category_list.html'
    context_object_name = 'categories'
    permission_required = 'inventory.view_category'
    paginate_by = 10
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Equipment Categories")
        context['can_add_category'] = self.request.user.has_perm('inventory.add_category')
        return context

class CategoryCreateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, CreateView):
    model = Category
    form_class = CategoryForm
    template_name = 'inventory/generic_form.html'
    permission_required = 'inventory.add_category'
    success_url = reverse_lazy('inventory:category_list')
    success_message = _("Category '%(name)s' created successfully.")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Create New Category")
        context['form_title'] = _("Add Category")
        context['submit_button_text'] = _("Create Category")
        return context

class CategoryUpdateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Category
    form_class = CategoryForm
    template_name = 'inventory/generic_form.html'
    permission_required = 'inventory.change_category'
    success_url = reverse_lazy('inventory:category_list')
    success_message = _("Category '%(name)s' updated successfully.")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Update Category: {object_name}").format(object_name=self.object.name)
        context['form_title'] = _("Edit Category: {object_name}").format(object_name=self.object.name)
        context['submit_button_text'] = _("Save Changes")
        return context

class CategoryDeleteView(LoginRequiredMixin, PermissionRequiredMixin, DeleteView):
    model = Category
    template_name = 'inventory/generic_confirm_delete.html'
    permission_required = 'inventory.delete_category'
    success_url = reverse_lazy('inventory:category_list')
    context_object_name = 'object_to_delete' 
    
    def post(self, request, *args, **kwargs):
        object_name = self.get_object().name
        if self.get_object().equipment_items.exists() or self.get_object().stock_items.exists():
            messages.error(request, _("Category '{object_name}' cannot be deleted because it is currently in use by equipment or stock items.").format(object_name=object_name))
            return redirect('inventory:category_list')
        messages.success(self.request, _("Category '{object_name}' has been deleted.").format(object_name=object_name))
        return super().post(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {object_name}").format(object_name=self.object.name)
        context['type_of_object'] = _("Category")
        if self.object.equipment_items.exists() or self.object.stock_items.exists():
            context['deletion_warning'] = _("This category is in use and cannot be deleted.")
        return context

class StatusListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = Status
    template_name = 'inventory/status_list.html' 
    context_object_name = 'statuses'
    permission_required = 'inventory.view_status'
    paginate_by = 10
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Equipment Statuses")
        context['can_add_status'] = self.request.user.has_perm('inventory.add_status')
        return context

class StatusCreateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, CreateView):
    model = Status
    form_class = StatusForm
    template_name = 'inventory/generic_form.html'
    permission_required = 'inventory.add_status'
    success_url = reverse_lazy('inventory:status_list')
    success_message = _("Status '%(name)s' created successfully.")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Create New Status")
        context['form_title'] = _("Add Status")
        context['submit_button_text'] = _("Create Status")
        return context

class StatusUpdateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Status
    form_class = StatusForm
    template_name = 'inventory/generic_form.html'
    permission_required = 'inventory.change_status'
    success_url = reverse_lazy('inventory:status_list')
    success_message = _("Status '%(name)s' updated successfully.")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Update Status: {object_name}").format(object_name=self.object.name)
        context['form_title'] = _("Edit Status: {object_name}").format(object_name=self.object.name)
        context['submit_button_text'] = _("Save Changes")
        return context

class StatusDeleteView(LoginRequiredMixin, PermissionRequiredMixin, DeleteView):
    model = Status
    template_name = 'inventory/generic_confirm_delete.html'
    permission_required = 'inventory.delete_status'
    success_url = reverse_lazy('inventory:status_list')
    context_object_name = 'object_to_delete'

    def post(self, request, *args, **kwargs):
        object_name = self.get_object().name
        if self.get_object().equipment_items_with_status.exists(): # Assuming related_name is 'equipment_items_with_status'
            messages.error(request, _("Status '{object_name}' cannot be deleted because it is currently in use by equipment items.").format(object_name=object_name))
            return redirect('inventory:status_list')
        messages.success(self.request, _("Status '{object_name}' has been deleted.").format(object_name=object_name))
        return super().post(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {object_name}").format(object_name=self.object.name)
        context['type_of_object'] = _("Status")
        if self.get_object().equipment_items_with_status.exists():
            context['deletion_warning'] = _("This status is in use and cannot be deleted.")
        return context

class LocationListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = Location
    template_name = 'inventory/location_list.html' 
    context_object_name = 'locations'
    permission_required = 'inventory.view_location'
    paginate_by = 10
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Locations")
        context['can_add_location'] = self.request.user.has_perm('inventory.add_location')
        return context

class LocationCreateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, CreateView):
    model = Location
    form_class = LocationForm
    template_name = 'inventory/generic_form.html'
    permission_required = 'inventory.add_location'
    success_url = reverse_lazy('inventory:location_list')
    success_message = _("Location '%(name)s' created successfully.")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Create New Location")
        context['form_title'] = _("Add Location")
        context['submit_button_text'] = _("Create Location")
        return context

class LocationUpdateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Location
    form_class = LocationForm
    template_name = 'inventory/generic_form.html'
    permission_required = 'inventory.change_location'
    success_url = reverse_lazy('inventory:location_list')
    success_message = _("Location '%(name)s' updated successfully.")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Update Location: {object_name}").format(object_name=self.object.name)
        context['form_title'] = _("Edit Location: {object_name}").format(object_name=self.object.name)
        context['submit_button_text'] = _("Save Changes")
        return context

class LocationDeleteView(LoginRequiredMixin, PermissionRequiredMixin, DeleteView):
    model = Location
    template_name = 'inventory/generic_confirm_delete.html'
    permission_required = 'inventory.delete_location'
    success_url = reverse_lazy('inventory:location_list')
    context_object_name = 'object_to_delete'

    def post(self, request, *args, **kwargs):
        object_name = self.get_object().name
        if self.get_object().equipment_at_location.exists() or \
           self.get_object().stock_items_at_location.exists() or \
           self.get_object().child_locations.exists():
            messages.error(request, _("Location '{object_name}' cannot be deleted because it is in use or has child locations.").format(object_name=object_name))
            return redirect('inventory:location_list')
        messages.success(self.request, _("Location '{object_name}' has been deleted.").format(object_name=object_name))
        return super().post(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {object_name}").format(object_name=self.object.name)
        context['type_of_object'] = _("Location")
        if self.get_object().equipment_at_location.exists() or \
           self.get_object().stock_items_at_location.exists() or \
           self.get_object().child_locations.exists():
            context['deletion_warning'] = _("This location is in use or has child locations and cannot be deleted.")
        return context

class SupplierListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = Supplier
    template_name = 'inventory/supplier_list.html'
    context_object_name = 'suppliers'
    permission_required = 'inventory.view_supplier'
    paginate_by = 10
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Suppliers")
        context['can_add_supplier'] = self.request.user.has_perm('inventory.add_supplier')
        return context

class SupplierCreateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, CreateView):
    model = Supplier
    form_class = SupplierForm
    template_name = 'inventory/generic_form.html'
    permission_required = 'inventory.add_supplier'
    success_url = reverse_lazy('inventory:supplier_list')
    success_message = _("Supplier '%(name)s' created successfully.")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Create New Supplier")
        context['form_title'] = _("Add Supplier")
        context['submit_button_text'] = _("Create Supplier")
        return context

class SupplierUpdateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Supplier
    form_class = SupplierForm
    template_name = 'inventory/generic_form.html'
    permission_required = 'inventory.change_supplier'
    success_url = reverse_lazy('inventory:supplier_list')
    success_message = _("Supplier '%(name)s' updated successfully.")
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Update Supplier: {object_name}").format(object_name=self.object.name)
        context['form_title'] = _("Edit Supplier: {object_name}").format(object_name=self.object.name)
        context['submit_button_text'] = _("Save Changes")
        return context

class SupplierDeleteView(LoginRequiredMixin, PermissionRequiredMixin, DeleteView):
    model = Supplier
    template_name = 'inventory/generic_confirm_delete.html'
    permission_required = 'inventory.delete_supplier'
    success_url = reverse_lazy('inventory:supplier_list')
    context_object_name = 'object_to_delete'
    
    def post(self, request, *args, **kwargs): 
        object_name = self.get_object().name
        if self.get_object().supplied_equipment.exists() or self.get_object().supplied_stock_items.exists():
            messages.error(request, _("Supplier '{object_name}' cannot be deleted because it is linked to equipment or stock items.").format(object_name=object_name))
            return redirect('inventory:supplier_list')
        messages.success(self.request, _("Supplier '{object_name}' has been deleted.").format(object_name=object_name))
        return super().post(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {object_name}").format(object_name=self.object.name)
        context['type_of_object'] = _("Supplier")
        if self.get_object().supplied_equipment.exists() or self.get_object().supplied_stock_items.exists():
            context['deletion_warning'] = _("This supplier is linked to equipment or stock items and cannot be deleted.")
        return context
