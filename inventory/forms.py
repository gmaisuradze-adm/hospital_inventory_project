from django import forms
from .models import Equipment, Category, Status, Location, Supplier, DecommissionLog
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class BootstrapFormMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            current_class = field.widget.attrs.get('class', '')
            new_classes = []

            if isinstance(field.widget, forms.CheckboxInput):
                new_classes.append('form-check-input')
            elif isinstance(field.widget, forms.RadioSelect):
                # For RadioSelect, Bootstrap classes are usually applied to individual inputs
                # or handled by a custom widget/renderer.
                # We'll skip adding a generic class to the main widget here.
                pass
            elif isinstance(field.widget, forms.Select):
                new_classes.append('form-select')
            elif isinstance(field.widget, forms.ClearableFileInput):
                new_classes.append('form-control') # Bootstrap 5 uses form-control for file inputs
            elif isinstance(field.widget, forms.Textarea):
                new_classes.append('form-control')
                if 'rows' not in field.widget.attrs:
                    field.widget.attrs['rows'] = 3
            elif not isinstance(field.widget, (forms.SelectMultiple, forms.CheckboxSelectMultiple)):
                # Apply form-control to most other input types
                new_classes.append('form-control')
            
            field.widget.attrs['class'] = f'{current_class} {" ".join(new_classes)}'.strip()
            
            # Ensure DateInput uses type="date" and has form-control
            if isinstance(field.widget, forms.DateInput):
                if 'form-control' not in field.widget.attrs.get('class', ''):
                    field.widget.attrs['class'] = f"{field.widget.attrs.get('class', '')} form-control".strip()
                if field.widget.input_type != 'date': # Check if it's not already date type
                    field.widget.input_type = 'date'


class CategoryForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'description', 'icon']
        labels = {
            'name': _("Category Name"),
            'description': _("Description"),
            'icon': _("Icon Class (Font Awesome)"),
        }
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3, 'placeholder': _("e.g., Laptops, Printers...")}),
            'icon': forms.TextInput(attrs={'placeholder': _("e.g., fas fa-laptop")}),
        }
        help_texts = {
            'icon': _("Find icons at <a href='https://fontawesome.com/search?m=free' target='_blank'>fontawesome.com</a> (use free icons).")
        }


class StatusForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Status
        fields = ['name', 'description', 'is_active_for_use', 'is_decommissioned', 'is_in_storage', 'is_marked_for_write_off']
        labels = {
            'name': _("Status Name"),
            'description': _("Description"),
            'is_active_for_use': _("Active for use"),
            'is_decommissioned': _("Is Decommissioned"),
            'is_in_storage': _("In storage (available for assignment)"),
            'is_marked_for_write_off': _("Is Marked for Write-Off"),
        }
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3, 'placeholder': _("e.g., Equipment is in good working order...")}),
        }

class LocationForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Location
        fields = ['name', 'parent_location', 'address', 'notes']
        labels = {
            'name': _("Location/Department Name"),
            'parent_location': _("Parent Location (Optional)"),
            'address': _("Address (Optional)"),
            'notes': _("Notes (Optional)"),
        }
        widgets = {
            'address': forms.Textarea(attrs={'rows': 2, 'placeholder': _("e.g., Tbilisi, Chavchavadze Ave. 1")}),
            'notes': forms.Textarea(attrs={'rows': 3}),
            'name': forms.TextInput(attrs={'placeholder': _("e.g., Main Building, IT Department, Room 301")}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'parent_location' in self.fields:
            instance_pk = self.instance.pk if self.instance and self.instance.pk else None
            self.fields['parent_location'].queryset = Location.objects.exclude(pk=instance_pk).order_by('name')
            self.fields['parent_location'].empty_label = _("--------- (No parent selected) ---------")


class SupplierForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Supplier
        fields = ['name', 'contact_person', 'phone_number', 'email', 'website', 'notes']
        labels = {
            'name': _("Supplier Name"),
            'contact_person': _("Contact Person"),
            'phone_number': _("Phone Number"),
            'email': _("Email Address"),
            'website': _("Website URL"),
            'notes': _("Notes"),
        }
        widgets = {
            'notes': forms.Textarea(attrs={'rows': 3}),
            'email': forms.EmailInput(attrs={'placeholder': _("example@domain.com")}),
            'website': forms.URLInput(attrs={'placeholder': _("https://example.com")}),
            'name': forms.TextInput(attrs={'placeholder': _("e.g., TechService Ltd.")}),
            'contact_person': forms.TextInput(attrs={'placeholder': _("e.g., Giorgi Giorgadze")}),
            'phone_number': forms.TextInput(attrs={'placeholder': _("+995 555 123456")}),
        }

class EquipmentForm(BootstrapFormMixin, forms.ModelForm):
    date_added_display = forms.CharField(label=_("Date Added"), required=False, disabled=True)
    added_by_display = forms.CharField(label=_("Added By"), required=False, disabled=True)
    last_updated_display = forms.CharField(label=_("Last Updated"), required=False, disabled=True)
    updated_by_display = forms.CharField(label=_("Last Updated By"), required=False, disabled=True)
    asset_tag_display = forms.CharField(label=_("Asset Tag (Internal ID)"), required=False, disabled=True)

    class Meta:
        model = Equipment
        fields = [
            'name', 'serial_number', 
            'category', 'status', 
            'current_location', 'assigned_to',
            'supplier', 'purchase_date', 'purchase_cost', 'warranty_expiry_date',
            'notes',
            # Display only fields (non-editable, shown on update form)
            'asset_tag_display', 
            'date_added_display', 'added_by_display', 'last_updated_display', 'updated_by_display'
        ]
        labels = {
            'name': _("Equipment Name/Model"),
            'serial_number': _("Serial Number (Optional)"),
            'category': _("Category"),
            'status': _("Status"),
            'current_location': _("Current Location (Optional)"),
            'assigned_to': _("Assigned To (User) (Optional)"),
            'supplier': _("Supplier (Optional)"),
            'purchase_date': _("Purchase Date (Optional)"),
            'purchase_cost': _("Purchase Cost (GEL) (Optional)"),
            'warranty_expiry_date': _("Warranty Expiry Date (Optional)"),
            'notes': _("Notes (Optional)"),
        }
        widgets = {
            'purchase_date': forms.DateInput(), # BootstrapFormMixin will handle type='date'
            'warranty_expiry_date': forms.DateInput(), # BootstrapFormMixin will handle type='date'
            'notes': forms.Textarea(attrs={'rows': 4, 'placeholder': _("Additional information about the equipment...")}),
            'purchase_cost': forms.NumberInput(attrs={'placeholder': _("e.g., 1500.00")}),
            'name': forms.TextInput(attrs={'placeholder': _("e.g., Laptop Dell XPS 13")}),
            'serial_number': forms.TextInput(attrs={'placeholder': _("Manufacturer's serial number")}),
        }
        help_texts = {
            'serial_number': _("Enter if available."),
            'purchase_cost': _("Enter numbers only."),
            'status': _("Select the current condition of the equipment."),
            'notes': _("General notes can be entered here."),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        is_new_instance = not self.instance or not self.instance.pk
        display_fields_to_remove_on_create = [
            'asset_tag_display', 'date_added_display', 'added_by_display', 
            'last_updated_display', 'updated_by_display'
        ]

        if is_new_instance:
            if 'purchase_date' in self.fields:
                 self.fields['purchase_date'].initial = timezone.now().date()
            for field_name in display_fields_to_remove_on_create:
                if field_name in self.fields:
                    self.fields.pop(field_name)
        else: 
            if 'asset_tag_display' in self.fields:
                self.fields['asset_tag_display'].initial = self.instance.asset_tag if self.instance.asset_tag else _("Not yet generated")
            if 'date_added_display' in self.fields:
                self.fields['date_added_display'].initial = self.instance.date_added.strftime("%Y-%m-%d %H:%M") if self.instance.date_added else "-"
            if 'added_by_display' in self.fields:
                self.fields['added_by_display'].initial = str(self.instance.added_by) if self.instance.added_by else "-"
            if 'last_updated_display' in self.fields:
                self.fields['last_updated_display'].initial = self.instance.last_updated.strftime("%Y-%m-%d %H:%M") if self.instance.last_updated else "-"
            if 'updated_by_display' in self.fields:
                self.fields['updated_by_display'].initial = str(self.instance.updated_by) if self.instance.updated_by else "-"

        # Set fields to not required if model field has blank=True and no default
        for field_name, field_obj in self.fields.items():
            if not field_name.endswith('_display'): # Skip our custom display fields
                try:
                    model_field = self.Meta.model._meta.get_field(field_name)
                    if model_field.blank and not model_field.has_default(): # Check if blank is True and no default
                        field_obj.required = False
                except Exception: # FieldDoesNotExist, etc.
                    pass 
        
        # Set empty_label for ForeignKey fields
        fk_fields_with_empty_label = ['category', 'current_location', 'supplier', 'assigned_to']
        for fk_field_name in fk_fields_with_empty_label:
            if fk_field_name in self.fields and isinstance(self.fields[fk_field_name], forms.ModelChoiceField):
                if not self.fields[fk_field_name].required: # If field is not required, allow empty label
                    self.fields[fk_field_name].empty_label = _("--------- (Not selected) ---------")
                # If required, Django's default behavior (no empty label or a first empty choice) is usually fine.
        
        # Special handling for the status field queryset in edit mode
        if 'status' in self.fields and isinstance(self.fields['status'], forms.ModelChoiceField):
            if self.fields['status'].required: # Status is mandatory
                 self.fields['status'].empty_label = _("Select a status...")
            
            current_status = self.instance.status if self.instance and self.instance.pk else None
            
            # Start with all statuses
            status_queryset = Status.objects.all()
            
            # If not editing a decommissioned item, exclude decommissioned statuses
            if not (current_status and current_status.is_decommissioned):
                status_queryset = status_queryset.filter(is_decommissioned=False)
            
            # If not editing an item marked for write-off, exclude marked_for_write_off statuses
            if not (current_status and current_status.is_marked_for_write_off):
                 status_queryset = status_queryset.exclude(is_marked_for_write_off=True)

            # Always include the current status in the queryset if it exists
            if current_status:
                status_queryset = status_queryset | Status.objects.filter(pk=current_status.pk)

            self.fields['status'].queryset = status_queryset.distinct().order_by('name')


class EquipmentMarkForWriteOffForm(BootstrapFormMixin, forms.Form):
    write_off_reason = forms.CharField(
        label=_("Reason for Marking for Write-Off"),
        widget=forms.Textarea(attrs={'rows': 4, 'placeholder': _("Briefly describe the damage or reason for write-off...")}),
        required=True,
        help_text=_("This information will be appended to the equipment's notes.")
    )

class DecommissionConfirmForm(BootstrapFormMixin, forms.ModelForm):
    decommission_date = forms.DateField(
        label=_("Decommission Date"),
        widget=forms.DateInput(), # BootstrapFormMixin handles type='date'
        required=True,
        initial=timezone.now().date
    )
    confirm_decommission = forms.BooleanField(
        label=_("I confirm the final decommissioning of this equipment."),
        required=True,
        # BootstrapFormMixin handles 'form-check-input'
    )
    class Meta:
        model = DecommissionLog
        fields = [
            'decommission_date', 'reason', 'method_of_disposal', 
            'disposal_certificate_id', 'notes', 'confirm_decommission'
        ]
        labels = {
            'reason': _("Final Reason for Decommissioning"),
            'method_of_disposal': _("Method of Disposal"),
            'disposal_certificate_id': _("Disposal Certificate/Act ID"),
            'notes': _("Additional Notes on Decommissioning"),
        }
        widgets = {
            'reason': forms.Textarea(attrs={'rows': 3, 'placeholder': _("Final reason (may be pre-filled from marking stage)")}),
            'notes': forms.Textarea(attrs={'rows': 3, 'placeholder': _("Any other relevant details")}),
            'method_of_disposal': forms.TextInput(attrs={'placeholder': _("e.g., Recycled, Sold, Scrapped")}),
            'disposal_certificate_id': forms.TextInput(attrs={'placeholder': _("Certificate or act number, if any")}),
        }
    
    def __init__(self, *args, **kwargs):
        self.equipment_instance = kwargs.pop('equipment_instance', None) # Get equipment from view
        super().__init__(*args, **kwargs)
        
        # Pre-fill 'reason' if equipment_instance has notes from marking stage
        if self.equipment_instance and self.equipment_instance.notes:
            if 'reason' in self.fields and not self.initial.get('reason'):
                notes_content = self.equipment_instance.notes
                # Attempt to find the last "Reason:" entry, supporting multiple languages
                reason_keywords = { 
                    'en': "Reason:", 
                    'ka': "მიზეზი:"  # Assuming "მიზეზი:" is the Georgian translation
                }
                
                last_reason_entry_pos = -1
                found_keyword = ""

                for lang_code, keyword in reason_keywords.items():
                    current_pos = notes_content.rfind(keyword)
                    if current_pos > last_reason_entry_pos:
                        last_reason_entry_pos = current_pos
                        found_keyword = keyword
                
                if last_reason_entry_pos != -1:
                    start_index = last_reason_entry_pos + len(found_keyword)
                    # Extract text until the next double newline or end of string
                    end_index_double_newline = notes_content.find("\n\n", start_index)
                    extracted_reason = ""
                    if end_index_double_newline != -1:
                        extracted_reason = notes_content[start_index:end_index_double_newline].strip()
                    else:
                        # If no double newline, try single newline
                        end_index_single_newline = notes_content.find("\n", start_index)
                        if end_index_single_newline != -1:
                             extracted_reason = notes_content[start_index:end_index_single_newline].strip()
                        else: # If no newline at all, take to the end
                            extracted_reason = notes_content[start_index:].strip()
                    
                    if extracted_reason:
                        self.fields['reason'].initial = extracted_reason


class EquipmentRestoreForm(BootstrapFormMixin, forms.Form):
    restoration_reason = forms.CharField(
        label=_("Reason for Restoration"),
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': _("Explain why this equipment is being restored...")}),
        required=True
    )
    new_status = forms.ModelChoiceField(
        label=_("New Status After Restoration"),
        queryset=Status.objects.filter(is_decommissioned=False, is_marked_for_write_off=False).order_by('name'),
        required=True,
        empty_label=None, # Required, so no empty option
        # BootstrapFormMixin will add 'form-select'
    )

    def __init__(self, *args, **kwargs):
        # Pop equipment_instance before calling super if it's passed, though not used in this form currently.
        kwargs.pop('equipment_instance', None) 
        super().__init__(*args, **kwargs)
        if 'new_status' in self.fields:
            # The default __str__ method of Status model (which returns self.name) is usually sufficient.
            # self.fields['new_status'].label_from_instance = lambda obj: f"{obj.name}"
            # This line is not strictly necessary if Status.__str__ returns the name.
            # If you want to customize the display further, you can uncomment and modify it.
            pass
