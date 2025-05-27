# Version: 1.5.1 - 2025-05-27 - Copilot Edit
# - Updated StockItemListView for Tabler styling and filtering.
# - Added categories_for_filter and suppliers_for_filter to context.
# - Implemented filtering logic in get_queryset.

from django.urls import reverse_lazy
from django.contrib.messages.views import SuccessMessageMixin
from django.views.generic import ListView, DetailView
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from .models import StockItem
# Assuming Category and Supplier models are accessible, if not, they need to be imported
# from inventory.models import Category, Supplier # Example if they are in inventory app
# For this example, let's assume they are in the same app or correctly related
from inventory.models import Category as InventoryCategory # Assuming you use categories from inventory
from inventory.models import Supplier as InventorySupplier # Assuming you use suppliers from inventory
from .forms import StockItemForm
from django.utils.translation import gettext_lazy as _
from django.db.models import Q, F # F for comparing model fields

class StockItemListView(LoginRequiredMixin, UserPassesTestMixin, ListView):
    model = StockItem
    template_name = 'warehouse/stockitem_list.html'
    context_object_name = 'stock_items'
    paginate_by = 10 # You can adjust this

    def test_func(self):
        return self.request.user.is_staff # Or any other permission check

    def get_queryset(self):
        queryset = StockItem.objects.select_related('category', 'supplier').order_by('name')
        
        search_query = self.request.GET.get('q')
        category_id = self.request.GET.get('category')
        supplier_id = self.request.GET.get('supplier')
        stock_status = self.request.GET.get('stock_status')

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(item_id__icontains=search_query) |
                Q(description__icontains=search_query)
            )
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
            
        if stock_status:
            if stock_status == 'in_stock':
                # In stock and not below minimum (or minimum is 0/null)
                queryset = queryset.filter(quantity_on_hand__gt=F('minimum_stock_level'))
            elif stock_status == 'below_minimum':
                # Below minimum but not out of stock
                queryset = queryset.filter(quantity_on_hand__lte=F('minimum_stock_level'), quantity_on_hand__gt=0)
            elif stock_status == 'out_of_stock':
                queryset = queryset.filter(quantity_on_hand=0)
                
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Warehouse Stock Items")
        # Make sure Category and Supplier models are correctly imported for these queries
        # These might come from another app, e.g., 'inventory'
        # Ensure InventoryCategory and InventorySupplier are the correct models for your project
        context['categories_for_filter'] = InventoryCategory.objects.all().order_by('name')
        context['suppliers_for_filter'] = InventorySupplier.objects.all().order_by('name')
        return context

# StockItemCreateView ... (existing code, ensure imports for Category, Supplier if needed in form)
class StockItemCreateView(LoginRequiredMixin, UserPassesTestMixin, SuccessMessageMixin, CreateView):
    model = StockItem
    form_class = StockItemForm
    template_name = 'warehouse/stock_item_form.html'
    success_url = reverse_lazy('warehouse:stockitem_list')
    success_message = _("Stock item \"%(name)s\" (%(item_id)s) was created successfully.")

    def test_func(self):
        return self.request.user.is_staff

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Add New Stock Item")
        context['form_title'] = _("Create a New Stock Item")
        context['submit_button_text'] = _("Add Item")
        return context
    
    def get_success_message(self, cleaned_data):
        return self.success_message % {
            'name': self.object.name, 
            'item_id': self.object.item_id
        }

# StockItemUpdateView ... (existing code)
class StockItemUpdateView(LoginRequiredMixin, UserPassesTestMixin, SuccessMessageMixin, UpdateView):
    model = StockItem
    form_class = StockItemForm
    template_name = 'warehouse/stock_item_form.html'
    success_url = reverse_lazy('warehouse:stockitem_list')
    success_message = _("Stock item \"%(name)s\" (%(item_id)s) was updated successfully.")

    def test_func(self):
        return self.request.user.is_staff

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Edit Stock Item")
        context['form_title'] = _("Edit Details for: {} ({})").format(self.object.name, self.object.item_id)
        context['submit_button_text'] = _("Save Changes")
        return context

    def get_success_message(self, cleaned_data):
        return self.success_message % {
            'name': self.object.name,
            'item_id': self.object.item_id
        }

# StockItemDetailView ... (existing code)
class StockItemDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = StockItem
    template_name = 'warehouse/stock_item_detail.html'
    context_object_name = 'item'

    def test_func(self):
        return self.request.user.is_staff

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Details for {} ({})").format(self.object.name, self.object.item_id)
        return context

# StockItemDeleteView ... (existing code)
class StockItemDeleteView(LoginRequiredMixin, UserPassesTestMixin, SuccessMessageMixin, DeleteView):
    model = StockItem
    template_name = 'warehouse/stock_item_confirm_delete.html' 
    success_url = reverse_lazy('warehouse:stockitem_list')

    def test_func(self):
        return self.request.user.is_staff

    def get_success_message(self, cleaned_data):
        return _("Stock item \"%(name)s\" (%(item_id)s) was deleted successfully.") % {
            'name': self.object.name,
            'item_id': self.object.item_id
        }

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Confirm Delete")
        context['confirmation_title'] = _("Delete Stock Item: {} ({})?").format(self.object.name, self.object.item_id)
        return context