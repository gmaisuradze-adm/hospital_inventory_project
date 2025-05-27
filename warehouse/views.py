# Version: 1.5 - 2025-05-26 - Added StockItemDeleteView.
# User: gmaisuradze-adm

from django.urls import reverse_lazy
from django.contrib.messages.views import SuccessMessageMixin
from django.views.generic import ListView, DetailView
from django.views.generic.edit import CreateView, UpdateView, DeleteView # Import DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from .models import StockItem
from .forms import StockItemForm
from django.utils.translation import gettext_lazy as _
# from django.db.models import F


# StockItemListView ... (existing code)
class StockItemListView(LoginRequiredMixin, UserPassesTestMixin, ListView):
    model = StockItem
    template_name = 'warehouse/stockitem_list.html'
    context_object_name = 'stock_items'
    paginate_by = 10

    def test_func(self):
        return self.request.user.is_staff

    def get_queryset(self):
        return StockItem.objects.select_related('category', 'supplier').order_by('name')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Warehouse Stock Items")
        return context

# StockItemCreateView ... (existing code)
class StockItemCreateView(LoginRequiredMixin, UserPassesTestMixin, SuccessMessageMixin, CreateView):
    model = StockItem
    form_class = StockItemForm
    template_name = 'warehouse/stock_item_form.html'
    success_url = reverse_lazy('warehouse:stockitem_list')
    success_message = _("Stock item \"%(name)s\" (%(item_id)s) was created successfully.") # name and item_id from form

    def test_func(self):
        return self.request.user.is_staff

    def form_valid(self, form):
        # self.object is available after super().form_valid() for CreateView
        # but for success_message, it's better to use cleaned_data if object is not yet saved
        # or override get_success_message as done
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _("Add New Stock Item")
        context['form_title'] = _("Create a New Stock Item")
        context['submit_button_text'] = _("Add Item")
        return context
    
    def get_success_message(self, cleaned_data):
        return self.success_message % {
            'name': self.object.name, # self.object is the saved instance
            'item_id': self.object.item_id
        }

# StockItemUpdateView ... (existing code)
class StockItemUpdateView(LoginRequiredMixin, UserPassesTestMixin, SuccessMessageMixin, UpdateView):
    model = StockItem
    form_class = StockItemForm
    template_name = 'warehouse/stock_item_form.html'
    success_url = reverse_lazy('warehouse:stockitem_list')
    success_message = _("Stock item \"%(name)s\" (%(item_id)s) was updated successfully.") # name and item_id from self.object

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

# New StockItemDeleteView
class StockItemDeleteView(LoginRequiredMixin, UserPassesTestMixin, SuccessMessageMixin, DeleteView):
    model = StockItem
    template_name = 'warehouse/stock_item_confirm_delete.html' # We will create this template next
    success_url = reverse_lazy('warehouse:stockitem_list')
    # success_message is handled by get_success_message to access the object before deletion
    # context_object_name = 'item' # Default is 'object' or 'stockitem'

    def test_func(self):
        # Only staff users can delete stock items
        return self.request.user.is_staff

    def get_success_message(self, cleaned_data):
        # self.object is the object that was deleted.
        # Translators: Success message after deleting a stock item. %(name)s is item name, %(item_id)s is item ID.
        return _("Stock item \"%(name)s\" (%(item_id)s) was deleted successfully.") % {
            'name': self.object.name,
            'item_id': self.object.item_id
        }

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Translators: Page title for the confirmation page before deleting a stock item.
        context['page_title'] = _("Confirm Delete")
        # Translators: Title for the confirmation message. %(name)s is item name, %(item_id)s is item ID.
        context['confirmation_title'] = _("Delete Stock Item: {} ({})?").format(self.object.name, self.object.item_id)
        return context