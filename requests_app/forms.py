from django import forms
from .models import Request, RequestType, RequestUpdate
from inventory.models import Equipment
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta

class BootstrapFormMixin:
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

class RequestTypeForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = RequestType
        fields = ['name', 'description']
        labels = {'name': _("მოთხოვნის ტიპის სახელი"), 'description': _("აღწერა")}
        widgets = {'name': forms.TextInput(attrs={'placeholder': _("მაგ., ახალი მოწყობილობა, შეკეთება")}), 'description': forms.Textarea(attrs={'rows': 3})}

class RequestCreateForm(BootstrapFormMixin, forms.ModelForm):
    desired_completion_date = forms.DateField(label=_("სასურველი დასრულების თარიღი"), widget=forms.DateInput(attrs={'type': 'date'}), required=False, help_text=_("მიუთითეთ, თუ გაქვთ სასურველი ვადა."))
    related_equipment = forms.ModelChoiceField(label=_("დაკავშირებული მოწყობილობა (არსებული)"), queryset=Equipment.objects.select_related('status').filter(status__is_decommissioned=False).order_by('name'), required=False, help_text=_("აირჩიეთ, თუ მოთხოვნა ეხება არსებულ კონკრეტულ მოწყობილობას."))

    class Meta:
        model = Request
        fields = ['subject', 'description', 'request_type', 'priority', 'related_equipment', 'department_location', 'desired_completion_date']
        labels = {'subject': _("თემა"), 'description': _("დეტალური აღწერა"), 'request_type': _("მოთხოვნის ტიპი"), 'priority': _("პრიორიტეტი"), 'department_location': _("დეპარტამენტი / ლოკაცია")}
        widgets = {'subject': forms.TextInput(attrs={'placeholder': _("მოკლედ აღწერეთ მოთხოვნის არსი")}), 'description': forms.Textarea(attrs={'rows': 5, 'placeholder': _("შეიყვანეთ მოთხოვნის სრული აღწერა, მიზეზები, საჭიროებები...")}), 'department_location': forms.TextInput(attrs={'placeholder': _("მაგ., კარდიოლოგია, ექიმის კაბინეტი")})}
        help_texts = {'request_type': _("აირჩიეთ თქვენი მოთხოვნის ზოგადი კატეგორია."), 'priority': _("აირჩიეთ მოთხოვნის აქტუალურობა.")}

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if not self.instance or not self.instance.pk:
            self.fields['desired_completion_date'].initial = timezone.now().date() + timedelta(days=7)
        if 'request_type' in self.fields:
            self.fields['request_type'].queryset = RequestType.objects.order_by('name')
            self.fields['request_type'].empty_label = _("--------- (აირჩიეთ ტიპი) ---------")
        for field_name in self.Meta.fields:
            if field_name in self.fields:
                model_field = self.Meta.model._meta.get_field(field_name)
                if model_field.blank:
                    self.fields[field_name].required = False
        if 'priority' in self.fields:
            # This ensures that the empty label is added correctly and choices are preserved
            current_choices = list(self.fields['priority'].choices)
            if not (current_choices and current_choices[0][0] == ''): # Add empty label if not already present
                 self.fields['priority'].choices = [('', _("--------- (აირჩიეთ პრიორიტეტი) ---------"))] + current_choices


class RequestStaffUpdateForm(BootstrapFormMixin, forms.ModelForm):
    requested_by_display = forms.CharField(label=_("მოითხოვა"), required=False, disabled=True)
    created_at_display = forms.CharField(label=_("გაგზავნის თარიღი"), required=False, disabled=True)
    update_notes = forms.CharField(label=_("განახლების კომენტარი / შენიშვნა"), widget=forms.Textarea(attrs={'rows': 3, 'placeholder': _("აღწერეთ განხორციელებული ცვლილება ან მოქმედება")}), required=False)

    class Meta:
        model = Request
        fields = ['requested_by_display', 'created_at_display', 'status', 'assigned_to', 'priority', 'resolution_notes', 'update_notes']
        labels = {'status': _("სტატუსი"), 'assigned_to': _("მიმნიჭებელი (IT პერსონალი)"), 'priority': _("პრიორიტეტი"), 'resolution_notes': _("დახურვის/შესრულების კომენტარი")}
        widgets = {'resolution_notes': forms.Textarea(attrs={'rows': 4, 'placeholder': _("როგორ შესრულდა მოთხოვნა, ან რატომ დაიხურა/უარყოფილ იქნა.")})}
        help_texts = {'status': _("აირჩიეთ მოთხოვნის მიმდინარე სტატუსი."), 'assigned_to': _("აირჩიეთ IT პერსონალი, რომელიც ამ მოთხოვნაზე იმუშავებს."), 'resolution_notes': _("შეავსეთ, როდესაც მოთხოვნა სრულდება ან უარყოფილდება.")}

    def __init__(self, *args, **kwargs):
        self.acting_user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields['requested_by_display'].initial = str(self.instance.requested_by)
            self.fields['created_at_display'].initial = self.instance.created_at.strftime("%Y-%m-%d %H:%M")
            if 'assigned_to' in self.fields:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                self.fields['assigned_to'].queryset = User.objects.filter(is_staff=True).order_by('username')
                self.fields['assigned_to'].empty_label = _("--------- (არ არის მინიჭებული) ---------")
        else:
            self.fields.pop('requested_by_display', None)
            self.fields.pop('created_at_display', None)
        
        model_bound_fields = ['status', 'assigned_to', 'priority', 'resolution_notes']
        for field_name in model_bound_fields:
            if field_name in self.fields:
                model_field = self.Meta.model._meta.get_field(field_name)
                if model_field.blank:
                    self.fields[field_name].required = False
        
        if 'status' in self.fields:
            # This ensures that the empty label is added correctly and choices are preserved
            # Model's STATUS_CHOICES will now include 'pending_user_input'
            current_choices = list(self.fields['status'].choices)
            if not (current_choices and current_choices[0][0] == ''): # Add empty label if not already present
                 self.fields['status'].choices = [('', _("--------- (აირჩიეთ სტატუსი) ---------"))] + current_choices


    def save(self, commit=True):
        instance = super().save(commit=False)
        update_notes_text = self.cleaned_data.get('update_notes')
        # Use instance._original_status if available and reliable,
        # otherwise form.initial is the way for changed data in forms.
        old_status_val = self.initial.get('status', instance._original_status if instance.pk else instance.status)
        new_status_val = instance.status

        status_changed = old_status_val != new_status_val
        notes_provided = bool(update_notes_text)

        # Date assigned/resolved logic (kept from your original form)
        if 'assigned_to' in self.changed_data and instance.assigned_to and not self.initial.get('assigned_to'):
            instance.date_assigned = timezone.now()
        
        if 'status' in self.changed_data: # Check if status is part of the changed data from the form
            if instance.status in ['completed', 'rejected'] and not instance.resolved_at:
                instance.resolved_at = timezone.now()
            elif instance.status not in ['completed', 'rejected'] and instance.resolved_at:
                instance.resolved_at = None # Clear if moved away from resolved

        if commit:
            # Pass the acting_user to the instance if model's save() needs it for RequestUpdate
            # However, since form is creating RequestUpdate, this is not strictly needed for model.save()
            # unless model.save() has other logic dependent on the user.
            # For now, we assume model.save() is simple as per our recent model update.
            instance.save() 
            
            if (status_changed or notes_provided) and self.acting_user:
                # Construct notes carefully
                log_notes = update_notes_text
                if status_changed and not notes_provided: # If only status changed, auto-generate note
                    log_notes = _("Status changed from '{old}' to '{new}'.").format(
                        old=dict(self.Meta.model.STATUS_CHOICES).get(old_status_val, old_status_val), 
                        new=instance.get_status_display()
                    )
                elif status_changed and notes_provided: # If status changed AND notes provided, prepend status change to notes
                     log_notes = _("Status changed from '{old}' to '{new}'. \nNotes: {notes}").format(
                        old=dict(self.Meta.model.STATUS_CHOICES).get(old_status_val, old_status_val), 
                        new=instance.get_status_display(),
                        notes=update_notes_text
                    )

                RequestUpdate.objects.create(
                    request=instance,
                    updated_by=self.acting_user,
                    notes=log_notes,
                    old_status=old_status_val if status_changed else None,
                    new_status=new_status_val if status_changed else None
                )
        return instance

class RequestUpdateLogForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = RequestUpdate
        fields = ['request', 'notes', 'old_status', 'new_status']
        labels = {'request': _("მოთხოვნა"), 'notes': _("კომენტარი/შენიშვნა"), 'old_status': _("ძველი სტატუსი (თუ შეიცვალა)"), 'new_status': _("ახალი სტატუსი (თუ შეიცვალა)")}
        widgets = {'notes': forms.Textarea(attrs={'rows': 3}), 'request': forms.Select(attrs={'class': 'form-select'})}

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        self.fields['request'].queryset = Request.objects.order_by('-created_at')
        # Ensure choices for old_status and new_status reflect the updated STATUS_CHOICES from Request model
        status_choices_with_empty = [('', '---------')] + Request.STATUS_CHOICES
        self.fields['old_status'].choices = status_choices_with_empty
        self.fields['new_status'].choices = status_choices_with_empty