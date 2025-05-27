# Version: 1.3.1 - 2025-05-27 - Copilot Edit
# - Adjusted EquipmentListView context for Tabler-styled filters.
# - No change to core logic, only context for equipment_list.html template.

from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.views.generic.edit import FormView 
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin, UserPassesTestMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib import messages
from django.utils import timezone

from .models import Equipment, Category, Status, Location, Supplier
from .forms import (
    EquipmentForm, CategoryForm, StatusForm, LocationForm, SupplierForm,
    EquipmentMarkForWriteOffForm
)
from django.utils.translation import gettext_lazy as _
from django.db.models import Q # Import Q for more complex queries if needed later

# Equipment Views
class EquipmentListView(LoginRequiredMixin, ListView):
    model = Equipment
    template_name = 'inventory/equipment_list.html'
    context_object_name = 'equipment_list'
    paginate_by = 15

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'category', 'status', 'current_location', 'assigned_to', 'supplier'
        )
        
        # Default filter: Do not show items whose status is 'is_decommissioned=True'
        # UNLESS a specific 'status' filter is applied that might include them
        # OR we are on a specific "written-off" view (handled by EquipmentWriteOffListView)
        status_id_str = self.request.GET.get('status')
        if not status_id_str: # If no specific status is filtered, exclude decommissioned by default
            queryset = queryset.filter(status__is_decommissioned=False)
        elif status_id_str.isdigit():
             queryset = queryset.filter(status_id=int(status_id_str))


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
        context['page_title'] = _("Equipment Inventory") # This is used by base.html for the header
        context['categories_for_filter'] = Category.objects.all().order_by('name')
        context['statuses_for_filter'] = Status.objects.all().order_by('name')
        # Optional: Add a flag or link to view decommissioned/written-off items
        context['can_view_write_off_list'] = self.request.user.is_staff 
        return context

# ... (დანარჩენი views კლასები უცვლელია ამ ეტაპზე) ...
# Category Views, Status Views, Location Views, Supplier Views, Write-Off Views
# PLEASE PASTE THE REST OF YOUR views.py FILE HERE if you want me to include them in future responses.
# For now, I will only modify EquipmentListView as requested.

class EquipmentDetailView(LoginRequiredMixin, DetailView):
    model = Equipment
    template_name = 'inventory/equipment_detail.html'
    context_object_name = 'equipment'

    def get_queryset(self):
        return super().get_queryset().select_related(
            'category', 'status', 'current_location', 'assigned_to', 
            'supplier', 'added_by', 'updated_by'
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = f"{self.object.name} {_('Details')}"
        return context

class EquipmentCreateView(LoginRequiredMixin, PermissionRequiredMixin, SuccessMessageMixin, CreateView):
    model = Equipment
    form_class = EquipmentForm
    template_name = 'inventory/equipment_form.html' 
    permission_required = 'inventory.add_equipment'
    success_url = reverse_lazy('inventory:equipment_list')
    success_message = _("Equipment '%(name)s' was created successfully.")

    def form_valid(self, form):
        form.instance.added_by = self.request.user
        form.instance.updated_by = self.request.user 
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
        if form.cleaned_data.get('status') and form.cleaned_data.get('status').is_decommissioned:
            messages.error(self.request, _("Cannot set a decommissioned status directly. Use the 'Mark for Write-Off' process."))
            return self.form_invalid(form)

        form.instance.updated_by = self.request.user
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

    def post(self, request, *args, **kwargs):
        equipment_name = self.get_object().name
        messages.success(self.request, _("Equipment '{equipment_name}' has been successfully deleted.").format(equipment_name=equipment_name))
        return super().post(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {equipment_name}").format(equipment_name=self.object.name)
        return context

class EquipmentMarkWriteOffView(LoginRequiredMixin, UserPassesTestMixin, FormView):
    template_name = 'inventory/equipment_mark_write_off_form.html'
    form_class = EquipmentMarkForWriteOffForm
    
    def test_func(self):
        equipment = get_object_or_404(Equipment, pk=self.kwargs['pk'])
        return (self.request.user.is_staff and 
                self.request.user.has_perm('inventory.change_equipment') and
                (not equipment.status or not equipment.status.is_decommissioned))


    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        self.equipment_instance = get_object_or_404(Equipment, pk=self.kwargs['pk'])
        context['equipment'] = self.equipment_instance
        context['page_title'] = _("Prepare Equipment for Write-Off")
        context['form_title'] = _("Record Reason for Write-Off: {equipment_name}").format(equipment_name=self.equipment_instance.name)
        context['submit_button_text'] = _("Mark as 'To Be Written Off'")
        return context

    def form_valid(self, form):
        equipment = get_object_or_404(Equipment, pk=self.kwargs['pk'])
        reason = form.cleaned_data['write_off_reason']
        
        try:
            write_off_status = Status.objects.get(name='To Be Written Off', is_decommissioned=True)
        except Status.DoesNotExist:
            messages.error(self.request, _("Critical Error: The 'To Be Written Off' status is not configured in the system. Please contact an administrator."))
            return redirect('inventory:equipment_detail', pk=equipment.pk)
        except Status.MultipleObjectsReturned:
            messages.error(self.request, _("Critical Error: Multiple 'To Be Written Off' statuses found. Please contact an administrator."))
            return redirect('inventory:equipment_detail', pk=equipment.pk)


        timestamp = timezone.now().strftime("%Y-%m-%d %H:%M")
        new_note = _("--- Marked for Write-Off Reason ({timestamp} by {user}) ---\n{reason}\n---").format(
            timestamp=timestamp, user=self.request.user.username, reason=reason
        )
        
        if equipment.notes:
            equipment.notes = f"{equipment.notes}\n\n{new_note}"
        else:
            equipment.notes = new_note
        
        equipment.status = write_off_status
        equipment.updated_by = self.request.user
        equipment.save()

        messages.success(self.request, _("Equipment '{item_name}' has been successfully marked for write-off.").format(item_name=equipment.name))
        return redirect('inventory:equipment_write_off_list') 

    def get_success_url(self):
        return reverse_lazy('inventory:equipment_list')

class EquipmentWriteOffListView(LoginRequiredMixin, UserPassesTestMixin, ListView):
    model = Equipment
    template_name = 'inventory/equipment_write_off_list.html'
    context_object_name = 'write_off_equipment_list'
    paginate_by = 20

    def test_func(self):
        return self.request.user.is_staff 

    def get_queryset(self):
        try:
            write_off_status = Status.objects.get(name='To Be Written Off', is_decommissioned=True)
            return Equipment.objects.filter(status=write_off_status).select_related(
                'category', 'current_location', 'status', 'added_by', 'updated_by'
            ).order_by('-last_updated')
        except Status.DoesNotExist:
            messages.warning(self.request, _("The 'To Be Written Off' status is not configured. The list may be empty or incomplete."))
            return Equipment.objects.none()
        except Status.MultipleObjectsReturned:
            messages.warning(self.request, _("Multiple 'To Be Written Off' statuses found. The list may be incorrect. Please contact an administrator."))
            return Equipment.objects.none()


    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Equipment Marked for Write-Off")
        return context

class CategoryListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = Category
    template_name = 'inventory/category_list.html'
    context_object_name = 'categories'
    permission_required = 'inventory.view_category'
    paginate_by = 10
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Equipment Categories")
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
        response = super().post(request, *args, **kwargs)
        messages.success(self.request, _("Category '{object_name}' has been deleted.").format(object_name=object_name))
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {object_name}").format(object_name=self.object.name)
        context['type_of_object'] = _("Category")
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
        response = super().post(request, *args, **kwargs)
        messages.success(self.request, _("Status '{object_name}' has been deleted.").format(object_name=object_name))
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {object_name}").format(object_name=self.object.name)
        context['type_of_object'] = _("Status")
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
        response = super().post(request, *args, **kwargs)
        messages.success(self.request, _("Location '{object_name}' has been deleted.").format(object_name=object_name))
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {object_name}").format(object_name=self.object.name)
        context['type_of_object'] = _("Location")
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
        response = super().post(request, *args, **kwargs)
        messages.success(self.request, _("Supplier '{object_name}' has been deleted.").format(object_name=object_name))
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete: {object_name}").format(object_name=self.object.name)
        context['type_of_object'] = _("Supplier")
        return context
