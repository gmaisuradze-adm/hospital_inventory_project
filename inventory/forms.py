# inventory/forms.py

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
                # Ensure type="date" is set for DateInput widgets if not already specified
                if field.widget.input_type != 'date': # Check current input_type
                    field.widget.input_type = 'date'


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
        fields = ['name', 'description', 'is_active_for_use', 'is_decommissioned', 'is_in_storage']
        labels = {
            'name': _("სტატუსის სახელი"),
            'description': _("აღწერა"),
            'is_active_for_use': _("აქტიურია გამოყენებისთვის"),
            'is_decommissioned': _("ჩამოწერილია"),
            'is_in_storage': _("საწყობშია (ხელმისაწვდომია გასაცემად)"),
        }
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3, 'placeholder': _("მაგ., მოწყობილობა გამართულად მუშაობს...")}),
        }

class LocationForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Location
        fields = ['name', 'parent_location', 'address', 'notes']
        labels = {
            'name': _("ლოკაციის/დეპარტამენტის სახელი"),
            'parent_location': _("მშობელი ლოკაცია (არასავალდებულო)"),
            'address': _("მისამართი (არასავალდებულო)"),
            'notes': _("შენიშვნები (არასავალდებულო)"),
        }
        widgets = {
            'address': forms.Textarea(attrs={'rows': 2, 'placeholder': _("მაგ., ქ. თბილისი, ჭავჭავაძის გამზ. 1")}),
            'notes': forms.Textarea(attrs={'rows': 3}),
            'name': forms.TextInput(attrs={'placeholder': _("მაგ., მთავარი შენობა, IT განყოფილება, ოთახი 301")}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'parent_location' in self.fields:
            # Ensure instance exists and has a pk before excluding
            instance_pk = self.instance.pk if self.instance and self.instance.pk else None
            self.fields['parent_location'].queryset = Location.objects.exclude(pk=instance_pk).order_by('name')
            self.fields['parent_location'].empty_label = _("--------- (მშობელი არ არის არჩეული) ---------")


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
    date_added_display = forms.CharField(label=_("დამატების თარიღი"), required=False, disabled=True)
    added_by_display = forms.CharField(label=_("დამამატებელი"), required=False, disabled=True)
    last_updated_display = forms.CharField(label=_("ბოლო განახლება"), required=False, disabled=True)
    updated_by_display = forms.CharField(label=_("ბოლოს განაახლა"), required=False, disabled=True)
    # asset_tag_display - ახალი ველი, რომელიც გამოჩნდება რედაქტირებისას (თუ გსურთ)
    asset_tag_display = forms.CharField(label=_("საინვენტარო ნომერი (შიდა ID)"), required=False, disabled=True)


    class Meta:
        model = Equipment
        fields = [
            'name', 'serial_number', # 'asset_tag' ამოღებულია აქედან
            'category', 'status', 
            'current_location', 'assigned_to',
            'supplier', 'purchase_date', 'purchase_cost', 'warranty_expiry_date',
            'notes',
            # Display fields for read-only info
            'asset_tag_display', # დავამატოთ asset_tag_display თუ გვინდა მისი ჩვენება რედაქტირებისას
            'date_added_display', 'added_by_display', 'last_updated_display', 'updated_by_display'
        ]
        labels = {
            'name': _("მოწყობილობის სახელი/მოდელი"),
            # 'asset_tag': _("საინვენტარო ნომერი (შიდა ID)"), # ეს ლეიბლი ახლა asset_tag_display-სთვის იქნება, თუ მას დაამატებთ
            'serial_number': _("სერიული ნომერი (არასავალდებულო)"),
            'category': _("კატეგორია"),
            'status': _("სტატუსი"),
            'current_location': _("მიმდინარე ლოკაცია (არასავალდებულო)"),
            'assigned_to': _("მინიჭებული მომხმარებელი (არასავალდებულო)"),
            'supplier': _("მომწოდებელი (არასავალდებულო)"),
            'purchase_date': _("შეძენის თარიღი (არასავალდებულო)"),
            'purchase_cost': _("შეძენის ღირებულება (₾) (არასავალდებულო)"),
            'warranty_expiry_date': _("გარანტიის ვადა (არასავალდებულო)"),
            'notes': _("შენიშვნები (არასავალდებულო)"),
        }
        widgets = {
            'purchase_date': forms.DateInput(attrs={'type': 'date'}),
            'warranty_expiry_date': forms.DateInput(attrs={'type': 'date'}),
            'notes': forms.Textarea(attrs={'rows': 4, 'placeholder': _("დამატებითი ინფორმაცია მოწყობილობაზე...")}),
            'purchase_cost': forms.NumberInput(attrs={'placeholder': _("მაგ., 1500.00")}),
            'name': forms.TextInput(attrs={'placeholder': _("მაგ., ლეპტოპი Dell XPS 13")}),
            # 'asset_tag': forms.TextInput(attrs={'placeholder': _("უნიკალური შიდა საინვენტარო ნომერი")}), # ეს ვიჯეტიც აღარ არის საჭირო
            'serial_number': forms.TextInput(attrs={'placeholder': _("მწარმოებლის სერიული ნომერი")}),
        }
        help_texts = {
            # 'asset_tag': _("უნდა იყოს უნიკალური სისტემაში."), # ეს help_text-იც აღარ არის საჭირო
            'serial_number': _("თუ არსებობს, შეიყვანეთ."),
            'purchase_cost': _("შეიყვანეთ მხოლოდ ციფრები."),
            'status': _("აირჩიეთ მოწყობილობის მიმდინარე მდგომარეობა."),
            'notes': _("აქ შეგიძლიათ შეიყვანოთ ზოგადი შენიშვნები."),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        is_new_instance = not self.instance or not self.instance.pk
        # ამოვიღოთ _display ველები model_bound_fields-დან
        display_fields_to_remove_on_create = ['asset_tag_display', 'date_added_display', 'added_by_display', 'last_updated_display', 'updated_by_display']

        if is_new_instance:
            if 'purchase_date' in self.fields:
                 self.fields['purchase_date'].initial = timezone.now().date()
            for field_name in display_fields_to_remove_on_create:
                if field_name in self.fields: # შევამოწმოთ, რომ ველი არსებობს სანამ წავშლით
                    self.fields.pop(field_name)
        else: # რედაქტირების რეჟიმი
            if 'asset_tag_display' in self.fields and self.instance and self.instance.asset_tag:
                self.fields['asset_tag_display'].initial = self.instance.asset_tag
            else: # თუ asset_tag_display არ არის ფორმის ველებში (მაგ. ახალზე წაიშალა), ან asset_tag არ არსებობს
                if 'asset_tag_display' in self.fields: # თუ რედაქტირებისას ველი არსებობს, მაგრამ asset_tag ცარიელია
                    self.fields['asset_tag_display'].initial = _("ჯერ არ არის გენერირებული")


            if 'date_added_display' in self.fields:
                self.fields['date_added_display'].initial = self.instance.date_added.strftime("%Y-%m-%d %H:%M") if self.instance.date_added else "-"
            if 'added_by_display' in self.fields:
                self.fields['added_by_display'].initial = str(self.instance.added_by) if self.instance.added_by else "-"
            if 'last_updated_display' in self.fields:
                self.fields['last_updated_display'].initial = self.instance.last_updated.strftime("%Y-%m-%d %H:%M") if self.instance.last_updated else "-"
            if 'updated_by_display' in self.fields:
                self.fields['updated_by_display'].initial = str(self.instance.updated_by) if self.instance.updated_by else "-"

        # ველების required სტატუსის დაყენება მოდელის blank ატრიბუტის მიხედვით
        # ამჯერად, ჩვენ ვივლით ფორმის ველებზე და არა Meta.fields-ზე, რადგან Meta.fields შეიცვალა
        for field_name, field_obj in self.fields.items():
            if not field_name.endswith('_display'): # გამოვრიცხოთ ჩვენი display ველები
                try:
                    model_field = self.Meta.model._meta.get_field(field_name)
                    if model_field.blank and not model_field.has_default(): # თუ მოდელში blank=True და არ აქვს default
                        field_obj.required = False
                except Exception: # forms.models.FieldDoesNotExist ან AttributeError
                    pass 
        
        fk_fields_with_empty_label = ['category', 'status', 'current_location', 'supplier', 'assigned_to']
        for fk_field_name in fk_fields_with_empty_label:
            if fk_field_name in self.fields and isinstance(self.fields[fk_field_name], forms.ModelChoiceField):
                if not self.fields[fk_field_name].required:
                    self.fields[fk_field_name].empty_label = _("--------- (არ არის არჩეული) ---------")
                else:
                    self.fields[fk_field_name].empty_label = _("აირჩიეთ...") 
        
        if 'status' in self.fields and isinstance(self.fields['status'], forms.ModelChoiceField):
            if self.fields['status'].required:
                 self.fields['status'].empty_label = _("აირჩიეთ სტატუსი...")
            # რედაქტირებისას, თუ მიმდინარე სტატუსი is_decommissioned=True, ის მაინც უნდა გამოჩნდეს სიაში
            current_status_pk = self.instance.status_id if self.instance and self.instance.status_id else None
            status_queryset = Status.objects.filter(is_decommissioned=False)
            if current_status_pk:
                current_status_obj = Status.objects.filter(pk=current_status_pk).first()
                if current_status_obj and current_status_obj.is_decommissioned:
                    status_queryset = status_queryset | Status.objects.filter(pk=current_status_pk)
            
            self.fields['status'].queryset = status_queryset.order_by('name')


class EquipmentMarkForWriteOffForm(BootstrapFormMixin, forms.ModelForm):
    write_off_reason = forms.CharField(
        label=_("ჩამოწერის მიზეზი"),
        widget=forms.Textarea(attrs={'rows': 4, 'placeholder': _("მოკლედ აღწერეთ დაზიანების ან ჩამოწერის მიზეზი...")}),
        required=True,
        help_text=_("ეს ინფორმაცია შეინახება მოწყობილობის შენიშვნებში, არსებულის დამატებით.")
    )

    class Meta:
        model = Equipment
        fields = ['write_off_reason'] # მხოლოდ ეს ველი გვჭირდება ამ ფორმისთვის