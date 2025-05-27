from django import forms
from .models import StockItem, StockItemCategory, StockItemSupplier
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

# Assuming BootstrapFormMixin is available (e.g., from a core app or defined in this file)
# If it's in another app's forms.py, you might need to move it to a common place.
# For this example, let's assume it's defined here or imported.

class BootstrapFormMixin: # Copied from inventory/forms.py for this example
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            current_class = field.widget.attrs.get('class', '')
            new_classes = []
            if isinstance(field.widget, forms.CheckboxInput):
                new_classes.append('form-check-input')
            elif isinstance(field.widget, forms.RadioSelect):
                pass
            elif isinstance(field.widget, forms.Select):
                new_classes.append('form-select')
            elif isinstance(field.widget, forms.ClearableFileInput):
                new_classes.append('form-control')
            elif isinstance(field.widget, forms.Textarea):
                new_classes.append('form-control')
                if 'rows' not in field.widget.attrs:
                    field.widget.attrs['rows'] = 3
            elif not isinstance(field.widget, (forms.SelectMultiple, forms.CheckboxSelectMultiple)):
                new_classes.append('form-control')
            
            field.widget.attrs['class'] = f'{current_class} {" ".join(new_classes)}'.strip()
            
            if isinstance(field.widget, forms.DateInput):
                if 'form-control' not in field.widget.attrs.get('class', ''):
                    field.widget.attrs['class'] = f"{field.widget.attrs.get('class', '')} form-control".strip()
                if field.widget.attrs.get('type', 'date') == 'date':
                    field.widget.attrs['type'] = 'date'


class StockItemCategoryForm(BootstrapFormMixin, forms.ModelForm): # Added form for Category
    class Meta:
        model = StockItemCategory
        fields = ['name', 'description']
        labels = {
            'name': _("კატეგორიის სახელი"),
            'description': _("აღწერა"),
        }
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': _("მაგ., კაბელები, ტონერები")}),
            'description': forms.Textarea(attrs={'rows': 3}),
        }

class StockItemSupplierForm(BootstrapFormMixin, forms.ModelForm): # Added form for Supplier
    class Meta:
        model = StockItemSupplier
        fields = ['name', 'contact_person', 'phone_number', 'email', 'address']
        labels = {
            'name': _("მომწოდებლის სახელი"),
            'contact_person': _("საკონტაქტო პირი"),
            'phone_number': _("ტელეფონის ნომერი"),
            'email': _("ელ. ფოსტა"),
            'address': _("მისამართი"),
        }
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': _("მაგ., შპს \"ალტა\"")}),
            'email': forms.EmailInput(attrs={'placeholder': _("info@supplier.com")}),
            'address': forms.Textarea(attrs={'rows': 3}),
        }


class StockItemForm(BootstrapFormMixin, forms.ModelForm):
    # Fields for displaying read-only auto-managed data on edit
    date_added_display = forms.CharField(label=_("დამატების თარიღი"), required=False, disabled=True)
    added_by_display = forms.CharField(label=_("დამამატებელი"), required=False, disabled=True)
    last_updated_display = forms.CharField(label=_("ბოლო განახლება"), required=False, disabled=True)
    updated_by_display = forms.CharField(label=_("ბოლოს განაახლა"), required=False, disabled=True)

    class Meta:
        model = StockItem
        fields = [
            'item_id', 'name', 'description', 'category', 'supplier',
            'quantity_on_hand', 'minimum_stock_level', 'unit_price',
            'storage_location', 'last_restocked_date', 'expiry_date', 'notes',
            # Display fields
            'date_added_display', 'added_by_display', 'last_updated_display', 'updated_by_display'
        ]
        labels = {
            'item_id': _('ნივთის ID / SKU'),
            'name': _('ნივთის დასახელება'),
            'description': _('აღწერა'),
            'category': _('კატეგორია'),
            'supplier': _('მომწოდებელი'),
            'quantity_on_hand': _('რაოდენობა მარაგში'),
            'minimum_stock_level': _('მინიმალური მარაგი'),
            'unit_price': _('ერთეულის ფასი'), # Consider removing currency symbol or making it dynamic
            'storage_location': _('შენახვის ლოკაცია'),
            'last_restocked_date': _('ბოლოს შევსების თარიღი'),
            'expiry_date': _('ვარგისიანობის ვადა (თუ აქვს)'),
            'notes': _('დამატებითი შენიშვნები'),
        }
        widgets = {
            # BootstrapFormMixin handles base classes
            'description': forms.Textarea(attrs={'rows': 3, 'placeholder': _('შეიყვანეთ ნივთის მოკლე აღწერა')}),
            'item_id': forms.TextInput(attrs={'placeholder': _('მაგ., SKU00123, PN-ABC001')}),
            'quantity_on_hand': forms.NumberInput(attrs={'min': '0'}),
            'minimum_stock_level': forms.NumberInput(attrs={'min': '0'}),
            'unit_price': forms.NumberInput(attrs={'step': '0.01', 'min': '0.00', 'placeholder': _("0.00")}),
            'storage_location': forms.TextInput(attrs={'placeholder': _('მაგ., თარო A1, უჯრა 3')}),
            'last_restocked_date': forms.DateInput(attrs={'type': 'date'}),
            'expiry_date': forms.DateInput(attrs={'type': 'date'}),
            'notes': forms.Textarea(attrs={'rows': 3, 'placeholder': _('ნებისმიერი დამატებითი ინფორმაცია')}),
        }
        help_texts = { # These will appear below the fields
            'item_id': _("უნიკალური იდენტიფიკატორი მარაგის ერთეულისთვის."),
            'quantity_on_hand': _("მიმდინარე რაოდენობა. უარყოფითი არ შეიძლება იყოს."),
            'minimum_stock_level': _("რაოდენობა, რომლის ქვემოთაც საჭიროა შეკვეთა."),
            'unit_price': _("ფასი ერთ ერთეულზე. შეიყვანეთ 0, თუ უფასოა."),
            'expiry_date': _("მალფუჭებადი პროდუქტებისთვის. დატოვეთ ცარიელი, თუ არ ეხება."),
            'last_restocked_date': _("თარიღი, როდესაც მარაგი ბოლოს შეივსო."),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs) # BootstrapFormMixin init

        # Populate display fields if editing an existing instance
        if self.instance and self.instance.pk:
            self.fields['date_added_display'].initial = self.instance.date_added.strftime("%Y-%m-%d %H:%M") if self.instance.date_added else "-"
            self.fields['added_by_display'].initial = str(self.instance.added_by) if self.instance.added_by else "-"
            self.fields['last_updated_display'].initial = self.instance.last_updated.strftime("%Y-%m-%d %H:%M") if self.instance.last_updated else "-"
            self.fields['updated_by_display'].initial = str(self.instance.updated_by) if self.instance.updated_by else "-"
        else: # New instance
            self.fields['last_restocked_date'].initial = timezone.now().date() # Default for new items

        # Make fields optional in the form if their model field allows blank
        model_bound_fields = [
            'item_id', 'name', 'description', 'category', 'supplier',
            'quantity_on_hand', 'minimum_stock_level', 'unit_price',
            'storage_location', 'last_restocked_date', 'expiry_date', 'notes',
        ]
        for field_name in model_bound_fields:
            if field_name in self.fields:
                model_field = self.Meta.model._meta.get_field(field_name)
                if model_field.blank:
                    self.fields[field_name].required = False
        
        # Customize empty_label for ForeignKey fields
        fk_fields = ['category', 'supplier']
        for fk_field_name in fk_fields:
            if fk_field_name in self.fields and isinstance(self.fields[fk_field_name], forms.ModelChoiceField):
                if not self.fields[fk_field_name].required:
                    self.fields[fk_field_name].empty_label = _("--------- (არ არის არჩეული) ---------")
                else:
                    self.fields[fk_field_name].empty_label = _("აირჩიეთ...")
    
    def clean(self):
        cleaned_data = super().clean()
        # Cross-field validation from model is good, but can be duplicated/enhanced here if needed
        # For example, if last_restocked_date is today, quantity_on_hand should be > 0 (if not a new item)
        
        # Example: If item_id is being changed, ensure it's still unique (ModelForm does this for 'unique=True' fields on save)
        # but you might want to give a cleaner error message earlier.
        
        # The model's clean method already handles expiry_date vs last_restocked_date.
        # If you want to add form-specific errors not tied to a single field, add them to NON_FIELD_ERRORS:
        # if some_condition:
        #     self.add_error(None, "A general form error not tied to a specific field.")
            
        return cleaned_data