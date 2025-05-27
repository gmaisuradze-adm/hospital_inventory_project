from django import forms
from .models import Request, RequestType, RequestUpdate # Removed Equipment, handled by model's FK
from inventory.models import Equipment # Correct import for Equipment queryset
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta

# Assuming BootstrapFormMixin is available (e.g., from a core app or defined here)
class BootstrapFormMixin: # Copied from inventory/forms.py for this example
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            current_class = field.widget.attrs.get('class', '')
            new_classes = []
            if isinstance(field.widget, forms.CheckboxInput):
                new_classes.append('form-check-input')
            elif isinstance(field.widget, forms.RadioSelect):
                pass # Needs custom template or widget for Bootstrap
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

class RequestTypeForm(BootstrapFormMixin, forms.ModelForm): # Added form for RequestType
    class Meta:
        model = RequestType
        fields = ['name', 'description']
        labels = {
            'name': _("მოთხოვნის ტიპის სახელი"),
            'description': _("აღწერა"),
        }
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': _("მაგ., ახალი მოწყობილობა, შეკეთება")}),
            'description': forms.Textarea(attrs={'rows': 3}),
        }

class RequestCreateForm(BootstrapFormMixin, forms.ModelForm):
    desired_completion_date = forms.DateField(
        label=_("სასურველი დასრულების თარიღი"),
        widget=forms.DateInput(attrs={'type': 'date'}),
        required=False,
        help_text=_("მიუთითეთ, თუ გაქვთ სასურველი ვადა.")
    )
    related_equipment = forms.ModelChoiceField(
        label=_("დაკავშირებული მოწყობილობა (არსებული)"),
        queryset=Equipment.objects.select_related('status').filter(
            status__is_decommissioned=False # Example: Show only non-decommissioned equipment
        ).order_by('name'),
        required=False,
        help_text=_("აირჩიეთ, თუ მოთხოვნა ეხება არსებულ კონკრეტულ მოწყობილობას.")
    )

    class Meta:
        model = Request
        fields = [
            'subject', 
            'description', 
            'request_type', 
            'priority',
            'related_equipment',
            'department_location',
            'desired_completion_date',
        ]
        labels = {
            'subject': _("თემა"),
            'description': _("დეტალური აღწერა"),
            'request_type': _("მოთხოვნის ტიპი"),
            'priority': _("პრიორიტეტი"),
            # 'related_equipment' and 'desired_completion_date' labels are set on the field itself
            'department_location': _("დეპარტამენტი / ლოკაცია"),
        }
        widgets = {
            'subject': forms.TextInput(attrs={'placeholder': _("მოკლედ აღწერეთ მოთხოვნის არსი")}),
            'description': forms.Textarea(attrs={'rows': 5, 'placeholder': _("შეიყვანეთ მოთხოვნის სრული აღწერა, მიზეზები, საჭიროებები...")}),
            'department_location': forms.TextInput(attrs={'placeholder': _("მაგ., კარდიოლოგია, ექიმის კაბინეტი")}),
        }
        help_texts = {
            # Help texts defined on fields or can be overridden here
            'request_type': _("აირჩიეთ თქვენი მოთხოვნის ზოგადი კატეგორია."),
            'priority': _("აირჩიეთ მოთხოვნის აქტუალურობა."),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None) # Capture the user if passed
        super().__init__(*args, **kwargs)
        
        if not self.instance or not self.instance.pk: # New request
            self.fields['desired_completion_date'].initial = timezone.now().date() + timedelta(days=7) # Default to 1 week from now

        # Order choices for ForeignKey fields
        if 'request_type' in self.fields:
            self.fields['request_type'].queryset = RequestType.objects.order_by('name')
            self.fields['request_type'].empty_label = _("--------- (აირჩიეთ ტიპი) ---------")
        
        # Make fields optional based on model's blank=True
        for field_name in self.Meta.fields:
            if field_name in self.fields:
                model_field = self.Meta.model._meta.get_field(field_name)
                if model_field.blank:
                    self.fields[field_name].required = False
        
        # Set empty label for priority if it's a choice field
        if 'priority' in self.fields:
            self.fields['priority'].choices = [('', _("--------- (აირჩიეთ პრიორიტეტი) ---------"))] + list(self.fields['priority'].choices)[1:]


class RequestStaffUpdateForm(BootstrapFormMixin, forms.ModelForm):
    """
    Form for IT staff to update a request (status, assignment, resolution).
    """
    # These fields are for display only in the form, populated from the instance
    requested_by_display = forms.CharField(label=_("მოითხოვა"), required=False, disabled=True)
    created_at_display = forms.CharField(label=_("გაგზავნის თარიღი"), required=False, disabled=True)
    
    # Field for adding an update note, which will create a RequestUpdate entry
    update_notes = forms.CharField(
        label=_("განახლების კომენტარი / შენიშვნა"),
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': _("აღწერეთ განხორციელებული ცვლილება ან მოქმედება")}),
        required=False # Not always required to add a note if only changing status/assignee
    )

    class Meta:
        model = Request
        fields = [
            # Display fields first (can be ordered with crispy-forms layout)
            'requested_by_display', 'created_at_display',
            # Editable fields for staff
            'status', 'assigned_to', 'priority', 'resolution_notes',
            # Field for new update
            'update_notes',
        ]
        labels = {
            'status': _("სტატუსი"),
            'assigned_to': _("მიმნიჭებელი (IT პერსონალი)"),
            'priority': _("პრიორიტეტი"),
            'resolution_notes': _("დახურვის/შესრულების კომენტარი"),
        }
        widgets = {
            'resolution_notes': forms.Textarea(attrs={'rows': 4, 'placeholder': _("როგორ შესრულდა მოთხოვნა, ან რატომ დაიხურა/უარყოფილ იქნა.")}),
        }
        help_texts = {
            'status': _("აირჩიეთ მოთხოვნის მიმდინარე სტატუსი."),
            'assigned_to': _("აირჩიეთ IT პერსონალი, რომელიც ამ მოთხოვნაზე იმუშავებს."),
            'resolution_notes': _("შეავსეთ, როდესაც მოთხოვნა სრულდება ან უარყოფილდება."),
        }

    def __init__(self, *args, **kwargs):
        self.acting_user = kwargs.pop('user', None) # User performing the update
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.pk:
            self.fields['requested_by_display'].initial = str(self.instance.requested_by)
            self.fields['created_at_display'].initial = self.instance.created_at.strftime("%Y-%m-%d %H:%M")
            
            # Limit assigned_to choices to staff users (model already does this, but good for forms too)
            if 'assigned_to' in self.fields:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                self.fields['assigned_to'].queryset = User.objects.filter(is_staff=True).order_by('username')
                self.fields['assigned_to'].empty_label = _("--------- (არ არის მინიჭებული) ---------")
        else: # Should not happen for an update form, but as a safeguard
            self.fields.pop('requested_by_display', None)
            self.fields.pop('created_at_display', None)

        # Make fields optional based on model's blank=True
        # (Excluding our custom 'update_notes' and display fields)
        model_bound_fields = ['status', 'assigned_to', 'priority', 'resolution_notes']
        for field_name in model_bound_fields:
            if field_name in self.fields:
                model_field = self.Meta.model._meta.get_field(field_name)
                if model_field.blank:
                    self.fields[field_name].required = False
        
        if 'status' in self.fields: # Ensure status choices are correctly set up
             self.fields['status'].choices = [('', _("--------- (აირჩიეთ სტატუსი) ---------"))] + list(self.fields['status'].choices)[1:]


    def save(self, commit=True):
        # Override save to handle RequestUpdate creation
        instance = super().save(commit=False) # Get the Request instance
        
        update_notes_text = self.cleaned_data.get('update_notes')
        old_status_val = self.initial.get('status', instance.status) # Get status before change
        new_status_val = instance.status # Status after potential change from form

        # Track if status actually changed or if notes are provided
        status_changed = old_status_val != new_status_val
        notes_provided = bool(update_notes_text)

        if self.acting_user: # Ensure user is available
            if not instance.pk: # If it's a new request (shouldn't happen for *this* form)
                pass # Or handle error
            
            # Set date_assigned if 'assigned_to' is set for the first time and was previously None
            if 'assigned_to' in self.changed_data and instance.assigned_to and not self.initial.get('assigned_to'):
                instance.date_assigned = timezone.now()
            
            # Set resolved_at if status changes to 'completed' or 'rejected'
            if 'status' in self.changed_data and instance.status in ['completed', 'rejected'] and not instance.resolved_at:
                instance.resolved_at = timezone.now()
            elif 'status' in self.changed_data and instance.status not in ['completed', 'rejected']: # Clear if moved away from resolved
                instance.resolved_at = None


        if commit:
            instance.save() # Save the Request instance first
            # Now, create a RequestUpdate log entry if status changed or notes were provided
            if (status_changed or notes_provided) and self.acting_user:
                RequestUpdate.objects.create(
                    request=instance,
                    updated_by=self.acting_user,
                    notes=update_notes_text if notes_provided else _("Status changed from '{old}' to '{new}'.").format(old=dict(self.Meta.model.STATUS_CHOICES).get(old_status_val, old_status_val), new=instance.get_status_display()),
                    old_status=old_status_val if status_changed else None,
                    new_status=new_status_val if status_changed else None
                )
        return instance

# Form for manually adding a RequestUpdate (less common, but could be useful for admins)
class RequestUpdateLogForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = RequestUpdate
        fields = ['request', 'notes', 'old_status', 'new_status'] # updated_by and update_time are auto/view handled
        labels = {
            'request': _("მოთხოვნა"),
            'notes': _("კომენტარი/შენიშვნა"),
            'old_status': _("ძველი სტატუსი (თუ შეიცვალა)"),
            'new_status': _("ახალი სტატუსი (თუ შეიცვალა)"),
        }
        widgets = {
            'notes': forms.Textarea(attrs={'rows': 3}),
            'request': forms.Select(attrs={'class': 'form-select custom-select-class-if-needed'}), # Example of adding more classes
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None) # User adding the log
        super().__init__(*args, **kwargs)
        self.fields['request'].queryset = Request.objects.order_by('-created_at')
        self.fields['old_status'].choices = [('', '---------')] + Request.STATUS_CHOICES
        self.fields['new_status'].choices = [('', '---------')] + Request.STATUS_CHOICES