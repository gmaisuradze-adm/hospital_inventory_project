from django import forms
from .models import Equipment, Category, Status, Location, Supplier # Ensure Status is imported
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
# from django.contrib.auth import get_user_model # For assigned_to if it's settings.AUTH_USER_MODEL
# User = get_user_model()


class BootstrapFormMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            current_class = field.widget.attrs.get('class', '')
            new_classes = []

            if isinstance(field.widget, forms.CheckboxInput):
                new_classes.append('form-check-input')
            elif isinstance(field.widget, forms.RadioSelect):
                # For Bootstrap 5, proper styling needs template changes or a custom widget.
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


class CategoryForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'description', 'icon']
        labels = {
            'name': _("კატეგორიის სახელი"),
            'description': _("აღწერა"),
            'icon': _("ხატულას კლასი (Font Awesome)"),
        }
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3, 'placeholder': _("მაგ., ლეპტოპები, პრინტერები...")}),
            'icon': forms.TextInput(attrs={'placeholder': _("მაგ., fas fa-laptop")}),
        }
        help_texts = {
            'icon': _("მოძებნეთ ხატულები <a href='https://fontawesome.com/search?m=free' target='_blank'>fontawesome.com</a> (გამოიყენეთ უფასო ხატულები).")
        }


class StatusForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Status
        fields = ['name', 'description', 'is_active', 'is_decommissioned']
        labels = {
            'name': _("სტატუსის სახელი"),
            'description': _("აღწერა"),
            'is_active': _("აქტიურია (გამოიყენება მოწყობილობისთვის)"),
            'is_decommissioned': _("ექსპლუატაციიდან გამოსულია"),
        }
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3, 'placeholder': _("მაგ., მოწყობილობა გამართულად მუშაობს...")}),
        }

class LocationForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Location
        fields = ['name', 'address', 'floor', 'room_number', 'notes']
        labels = {
            'name': _("ლოკაციის სახელი"),
            'address': _("მისამართი"),
            'floor': _("სართული"),
            'room_number': _("ოთახის ნომერი/სახელი"),
            'notes': _("შენიშვნები"),
        }
        widgets = {
            'address': forms.Textarea(attrs={'rows': 2, 'placeholder': _("მაგ., ქ. თბილისი, ჭავჭავაძის გამზ. 1")}),
            'notes': forms.Textarea(attrs={'rows': 3}),
            'name': forms.TextInput(attrs={'placeholder': _("მაგ., მთავარი შენობა, IT განყოფილება")}),
            'floor': forms.TextInput(attrs={'placeholder': _("მაგ., 3, ანტრესოლი")}),
            'room_number': forms.TextInput(attrs={'placeholder': _("მაგ., 305, სერვერული")}),
        }

class SupplierForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Supplier
        fields = ['name', 'contact_person', 'phone_number', 'email', 'website', 'notes']
        labels = {
            'name': _("მომწოდებლის სახელი"),
            'contact_person': _("საკონტაქტო პირი"),
            'phone_number': _("ტელეფონის ნომერი"),
            'email': _("ელ. ფოსტა"),
            'website': _("ვებ-გვერდი"),
            'notes': _("შენიშვნები"),
        }
        widgets = {
            'notes': forms.Textarea(attrs={'rows': 3}),
            'email': forms.EmailInput(attrs={'placeholder': _("example@domain.com")}),
            'website': forms.URLInput(attrs={'placeholder': _("https://example.com")}),
            'name': forms.TextInput(attrs={'placeholder': _("მაგ., შპს \"ტექნოსერვისი\"")}),
            'contact_person': forms.TextInput(attrs={'placeholder': _("მაგ., გიორგი გიორგაძე")}),
            'phone_number': forms.TextInput(attrs={'placeholder': _("+995 555 123456")}),
        }

class EquipmentForm(BootstrapFormMixin, forms.ModelForm):
    # Fields for displaying read-only auto-managed data on edit
    date_added_display = forms.CharField(label=_("დამატების თარიღი"), required=False, disabled=True)
    added_by_display = forms.CharField(label=_("დამამატებელი"), required=False, disabled=True)
    last_updated_display = forms.CharField(label=_("ბოლო განახლება"), required=False, disabled=True)
    updated_by_display = forms.CharField(label=_("ბოლოს განაახლა"), required=False, disabled=True)

    class Meta:
        model = Equipment
        fields = [
            'name', 'asset_tag', 'serial_number', 
            'category', 'status', 
            'current_location', 'assigned_to',
            'supplier', 'purchase_date', 'purchase_cost', 'warranty_expiry_date',
            'notes',
            # Display fields for read-only info
            'date_added_display', 'added_by_display', 'last_updated_display', 'updated_by_display'
        ]
        labels = {
            'name': _("მოწყობილობის სახელი"),
            'asset_tag': _("საინვენტარო ნომერი (ტეგი)"),
            'serial_number': _("სერიული ნომერი"),
            'category': _("კატეგორია"),
            'status': _("სტატუსი"),
            'current_location': _("მიმდინარე ლოკაცია"),
            'assigned_to': _("მინიჭებული მომხმარებელი"),
            'supplier': _("მომწოდებელი"),
            'purchase_date': _("შეძენის თარიღი"),
            'purchase_cost': _("შეძენის ღირებულება (₾)"),
            'warranty_expiry_date': _("გარანტიის ვადა"),
            'notes': _("შენიშვნები"),
        }
        widgets = {
            'purchase_date': forms.DateInput(attrs={'type': 'date'}),
            'warranty_expiry_date': forms.DateInput(attrs={'type': 'date'}),
            'notes': forms.Textarea(attrs={'rows': 4, 'placeholder': _("დამატებითი ინფორმაცია მოწყობილობაზე...")}), # Added placeholder
            'purchase_cost': forms.NumberInput(attrs={'placeholder': _("მაგ., 1500.00")}),
            'name': forms.TextInput(attrs={'placeholder': _("მაგ., ლეპტოპი Dell XPS 13")}),
            'asset_tag': forms.TextInput(attrs={'placeholder': _("უნიკალური იდენტიფიკატორი")}),
            'serial_number': forms.TextInput(attrs={'placeholder': _("მწარმოებლის სერიული ნომერი")}),
        }
        help_texts = {
            'asset_tag': _("უნდა იყოს უნიკალური სისტემაში."),
            'serial_number': _("თუ არსებობს, შეიყვანეთ. შეიძლება იყოს უნიკალური."),
            'purchase_cost': _("შეიყვანეთ მხოლოდ ციფრები."),
            'status': _("აირჩიეთ მოწყობილობის მიმდინარე მდგომარეობა."),
            'notes': _("აქ შეგიძლიათ შეიყვანოთ ზოგადი შენიშვნები. ჩამოწერის მიზეზი ცალკე ფორმით დაფიქსირდება."),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if not self.instance or not self.instance.pk:
            self.fields['purchase_date'].initial = timezone.now().date()
            # For new items, remove display fields as they are not applicable
            self.fields.pop('date_added_display', None)
            self.fields.pop('added_by_display', None)
            self.fields.pop('last_updated_display', None)
            self.fields.pop('updated_by_display', None)
            # Adjust Meta.fields if these are dynamically removed, or ensure template handles their absence
        else:
            if 'date_added_display' in self.fields: # Check if field exists before trying to set initial
                self.fields['date_added_display'].initial = self.instance.date_added.strftime("%Y-%m-%d %H:%M") if self.instance.date_added else "-"
            if 'added_by_display' in self.fields:
                self.fields['added_by_display'].initial = str(self.instance.added_by) if self.instance.added_by else "-"
            if 'last_updated_display' in self.fields:
                self.fields['last_updated_display'].initial = self.instance.last_updated.strftime("%Y-%m-%d %H:%M") if self.instance.last_updated else "-"
            if 'updated_by_display' in self.fields:
                self.fields['updated_by_display'].initial = str(self.instance.updated_by) if self.instance.updated_by else "-"

        model_bound_fields = [f for f in self.Meta.fields if not f.endswith('_display')]
        for field_name in model_bound_fields:
            if field_name in self.fields:
                model_field = self.Meta.model._meta.get_field(field_name)
                if model_field.blank:
                    self.fields[field_name].required = False
        
        fk_fields_with_empty_label = ['category', 'status', 'current_location', 'supplier', 'assigned_to']
        for fk_field_name in fk_fields_with_empty_label:
            if fk_field_name in self.fields and isinstance(self.fields[fk_field_name], forms.ModelChoiceField):
                if not self.fields[fk_field_name].required:
                    self.fields[fk_field_name].empty_label = _("--------- (არ არის არჩეული) ---------")
                else:
                    self.fields[fk_field_name].empty_label = _("აირჩიეთ...")
        
        if 'status' in self.fields and self.fields['status'].required:
            self.fields['status'].empty_label = _("აირჩიეთ სტატუსი...")
            # Ensure the write-off status is not directly selectable here if 'is_decommissioned=True'
            # Users should use the 'Mark for Write-Off' flow for that.
            self.fields['status'].queryset = Status.objects.filter(is_decommissioned=False)


class EquipmentMarkForWriteOffForm(BootstrapFormMixin, forms.ModelForm):
    write_off_reason = forms.CharField(
        label=_("ჩამოწერის მიზეზი"),
        widget=forms.Textarea(attrs={'rows': 4, 'placeholder': _("მოკლედ აღწერეთ დაზიანების ან ჩამოწერის მიზეზი...")}),
        required=True,
        help_text=_("ეს ინფორმაცია შეინახება მოწყობილობის შენიშვნებში, არსებულის დამატებით.")
    )

    class Meta:
        model = Equipment
        fields = ['write_off_reason'] # Only the reason is directly from user input here

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # No special init logic needed for this simple form currently.
        # The equipment instance context will be handled in the view.