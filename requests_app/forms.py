from django import forms
from .models import Request, RequestType, RequestUpdate
from inventory.models import Equipment, Location as InventoryLocation # Assuming Equipment model is here
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

class BootstrapFormMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            current_class = field.widget.attrs.get('class', '')
            new_classes = []

            if isinstance(field.widget, forms.CheckboxInput):
                new_classes.append('form-check-input')
            elif isinstance(field.widget, forms.RadioSelect):
                new_classes.append('custom-radioselect') # Ensure you have CSS for this or use Bootstrap's way
            elif isinstance(field.widget, forms.Select):
                new_classes.append('form-select')
            elif isinstance(field.widget, forms.ClearableFileInput):
                new_classes.append('form-control') # Standard Bootstrap class for file inputs
            elif isinstance(field.widget, forms.Textarea):
                new_classes.append('form-control')
                if 'rows' not in field.widget.attrs: # Default rows if not set
                    field.widget.attrs['rows'] = 3
            # For most other input types, add form-control
            elif not isinstance(field.widget, (forms.SelectMultiple, forms.CheckboxSelectMultiple)):
                new_classes.append('form-control')

            # Special handling for DateInput to ensure correct type and class
            if isinstance(field.widget, forms.DateInput):
                field.widget.input_type = 'date' # Ensure HTML5 date picker
                # Ensure form-control is added if not already present
                if 'form-control' not in current_class and 'form-control' not in new_classes:
                    new_classes.append('form-control')
                # Remove type if already set to avoid conflict with input_type
                if 'type' in field.widget.attrs:
                    del field.widget.attrs['type']
            
            if new_classes:
                field.widget.attrs['class'] = f'{current_class} {" ".join(new_classes)}'.strip()


class RequestTypeForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = RequestType
        fields = ['name', 'description']
        labels = {
            'name': _("მოთხოვნის ტიპის სახელი"),
            'description': _("აღწერა")
        }
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': _("მაგ., ახალი მოწყობილობა, შეკეთება")}),
            'description': forms.Textarea(attrs={'rows': 3, 'placeholder': _("მოთხოვნის ტიპის მოკლე განმარტება...")})
        }

class RequestCreateForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Request
        fields = [
            'subject',
            'description',
            'request_type',
            'priority',
            'related_existing_equipment',
            'request_location',
            'desired_completion_date'
        ]
        labels = {
            'subject': _("თემა / მოკლე აღწერა"),
            'description': _("მოთხოვნის დეტალური აღწერა"),
            'request_type': _("მოთხოვნის ტიპი"),
            'priority': _("პრიორიტეტი"),
            'related_existing_equipment': _("დაკავშირებული არსებული ტექნიკა (თუ ეხება)"),
            'request_location': _("მოთხოვნის ლოკაცია (დეპარტამენტი/ოთახი)"),
            'desired_completion_date': _("სასურველი დასრულების თარიღი"),
        }
        widgets = {
            'subject': forms.TextInput(attrs={'placeholder': _("მაგ., პრინტერი არ ბეჭდავს")}),
            'description': forms.Textarea(attrs={'rows': 5, 'placeholder': _("სრულად აღწერეთ პრობლემა ან საჭიროება...")}),
            'desired_completion_date': forms.DateInput(attrs={'type': 'date'}), # HTML5 date picker
        }
        help_texts = {
            'request_type': _("აირჩიეთ თქვენი მოთხოვნის შესაბამისი კატეგორია."),
            'priority': _("აირჩიეთ რამდენად სწრაფად არის საჭირო მოთხოვნის შესრულება."),
            'request_location': _("აირჩიეთ ფიზიკური ლოკაცია ან დეპარტამენტი."),
            'related_existing_equipment': _("თუ მოთხოვნა ეხება კონკრეტულ ტექნიკას, აირჩიეთ ის აქ."),
            'desired_completion_date': _("მიუთითეთ, თუ გაქვთ მოთხოვნის შესრულების სასურველი ვადა.")
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None) # User passed from view
        super().__init__(*args, **kwargs)

        # Set initial value for desired_completion_date if it's a new request form
        if not self.instance or not self.instance.pk: # Check if it's a new instance
            if 'desired_completion_date' in self.fields and self.fields['desired_completion_date'].initial is None:
                 self.fields['desired_completion_date'].initial = timezone.now().date() + timedelta(days=7)

        if 'request_type' in self.fields:
            self.fields['request_type'].queryset = RequestType.objects.order_by('name')
            self.fields['request_type'].empty_label = _("--------- აირჩიეთ ტიპი ---------")

        if 'priority' in self.fields:
            # Ensure the default empty label is present and correctly ordered
            current_choices = list(self.fields['priority'].choices)
            # Remove Django's default empty choice if present, as we add our own
            current_choices = [choice for choice in current_choices if choice[0] != ''] 
            self.fields['priority'].choices = [('', _("--------- აირჩიეთ პრიორიტეტი ---------"))] + current_choices
            # Set initial value if not already set and a default exists in the model
            if not self.initial.get('priority') and self.Meta.model._meta.get_field('priority').default:
                self.fields['priority'].initial = self.Meta.model._meta.get_field('priority').default

        if 'request_location' in self.fields:
            self.fields['request_location'].queryset = InventoryLocation.objects.order_by('name')
            model_field = self.Meta.model._meta.get_field('request_location')
            if model_field.blank: # Check if the model field allows blank
                self.fields['request_location'].empty_label = _("--------- (ლოკაცია არჩევითია) ---------")
            else:
                self.fields['request_location'].empty_label = _("--------- აირჩიეთ ლოკაცია ---------")
            # self.fields['request_location'].required is automatically set by ModelForm

        if 'related_existing_equipment' in self.fields:
            self.fields['related_existing_equipment'].queryset = Equipment.objects.filter(
                status__is_decommissioned=False
            ).select_related(
                'status', 
                'category', 
                'current_location' # Corrected from 'location'
            ).order_by('asset_tag', 'name')
            
            model_field = self.Meta.model._meta.get_field('related_existing_equipment')
            if model_field.blank:
                self.fields['related_existing_equipment'].empty_label = _("--------- (ტექნიკა არჩევითია) ---------")
            else:
                self.fields['related_existing_equipment'].empty_label = _("--------- აირჩიეთ ტექნიკა ---------")


class RequestStaffUpdateForm(BootstrapFormMixin, forms.ModelForm):
    requested_by_display = forms.CharField(label=_("მოთხოვნის ავტორი"), required=False, widget=forms.TextInput(attrs={'readonly': True, 'class': 'form-control-plaintext'}))
    created_at_display = forms.CharField(label=_("გაგზავნის თარიღი"), required=False, widget=forms.TextInput(attrs={'readonly': True, 'class': 'form-control-plaintext'}))
    request_location_display = forms.CharField(label=_("მოთხოვნის ლოკაცია"), required=False, widget=forms.TextInput(attrs={'readonly': True, 'class': 'form-control-plaintext'}))

    update_notes = forms.CharField(
        label=_("განახლების კომენტარი / შიდა შენიშვნა"),
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': _("ეს კომენტარი შეინახება მოთხოვნის ისტორიაში.")}),
        required=False 
    )

    class Meta:
        model = Request
        fields = [
            # Display fields are added separately
            'status',
            'assigned_to',
            'priority',
            'resolution_notes',
            # 'update_notes' is a form-only field, handled in save()
        ]
        labels = {
            'status': _("სტატუსი"),
            'assigned_to': _("მიმნიჭებელი IT პერსონალი"),
            'priority': _("პრიორიტეტი"),
            'resolution_notes': _("შესრულების/დახურვის კომენტარი (მომხმარებლისთვის ხილული)")
        }
        widgets = {
            'resolution_notes': forms.Textarea(attrs={'rows': 4, 'placeholder': _("შეიყვანეთ ინფორმაცია მოთხოვნის შესრულების შესახებ...")})
        }
        help_texts = {
            'status': _("აირჩიეთ მოთხოვნის მიმდინარე სტატუსი."),
            'assigned_to': _("აირჩიეთ IT პერსონალი ამ მოთხოვნაზე სამუშაოდ."),
            'resolution_notes': _("შეავსეთ, როდესაც მოთხოვნა გადადის საბოლოო სტატუსში (მაგ., Resolved, Closed).")
        }

    def __init__(self, *args, **kwargs):
        self.acting_user = kwargs.pop('user', None) # User performing the update, passed from view
        super().__init__(*args, **kwargs)

        # Populate display-only fields from the instance
        if self.instance and self.instance.pk:
            self.fields['requested_by_display'].initial = str(self.instance.requested_by)
            self.fields['created_at_display'].initial = self.instance.created_at.strftime("%Y-%m-%d %H:%M")
            self.fields['request_location_display'].initial = str(self.instance.request_location) if self.instance.request_location else _("მითითებული არ არის")
        else: # Should not typically happen for an update form, but good practice to handle
            for field_name in ['requested_by_display', 'created_at_display', 'request_location_display']:
                self.fields.pop(field_name, None)


        if 'assigned_to' in self.fields:
            self.fields['assigned_to'].queryset = User.objects.filter(is_staff=True).order_by('username')
            self.fields['assigned_to'].empty_label = _("--------- (არ არის მინიჭებული) ---------")

        if 'status' in self.fields:
            current_choices = list(self.fields['status'].choices)
            current_choices = [choice for choice in current_choices if choice[0] != '']
            self.fields['status'].choices = [('', _("--------- აირჩიეთ სტატუსი ---------"))] + current_choices
            if not self.initial.get('status') and self.instance and self.instance.pk: # Set initial from instance if not already set
                 self.fields['status'].initial = self.instance.status

    def save(self, commit=True):
        instance = super().save(commit=False) 
        update_notes_text = self.cleaned_data.get('update_notes', '')

        original_status_from_db = instance._original_status 
        current_status_from_form = instance.status
        
        status_changed = original_status_from_db != current_status_from_form
        
        if commit:
            instance.save() 

            if (status_changed or update_notes_text) and self.acting_user:
                log_entry_notes = update_notes_text

                if status_changed:
                    old_status_display = dict(Request.STATUS_CHOICES).get(original_status_from_db, original_status_from_db if original_status_from_db else _("N/A"))
                    new_status_display = instance.get_status_display()

                    status_change_text = _("სტატუსი შეიცვალა '{old}' დან '{new}' ზე.").format(
                        old=old_status_display,
                        new=new_status_display
                    )
                    if not update_notes_text:
                        log_entry_notes = status_change_text
                    else:
                        log_entry_notes = f"{status_change_text}\n{_('კომენტარი')}: {update_notes_text}"
                
                RequestUpdate.objects.create(
                    request=instance,
                    updated_by=self.acting_user,
                    notes=log_entry_notes,
                    old_status=original_status_from_db if status_changed else None,
                    new_status=current_status_from_form if status_changed else None
                )
        return instance


class RequestUpdateLogForm(BootstrapFormMixin, forms.ModelForm):
    request_display = forms.CharField(label=_("მოთხოვნა"), required=False, widget=forms.TextInput(attrs={'readonly': True, 'class': 'form-control-plaintext'}))
    updated_by_display = forms.CharField(label=_("განაახლა"), required=False, widget=forms.TextInput(attrs={'readonly': True, 'class': 'form-control-plaintext'}))
    update_time_display = forms.CharField(label=_("განახლების დრო"), required=False, widget=forms.TextInput(attrs={'readonly': True, 'class': 'form-control-plaintext'}))
    old_status_display = forms.CharField(label=_("ძველი სტატუსი"), required=False, widget=forms.TextInput(attrs={'readonly': True, 'class': 'form-control-plaintext'}))
    new_status_display = forms.CharField(label=_("ახალი სტატუსი"), required=False, widget=forms.TextInput(attrs={'readonly': True, 'class': 'form-control-plaintext'}))

    class Meta:
        model = RequestUpdate
        fields = ['notes'] 
        labels = {
            'notes': _("კომენტარი/შენიშვნა შენახული ლოგში"),
        }
        widgets = {
            'notes': forms.Textarea(attrs={'rows': 3, 'readonly': True, 'class':'form-control-plaintext'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields['request_display'].initial = str(self.instance.request)
            self.fields['updated_by_display'].initial = str(self.instance.updated_by) if self.instance.updated_by else _("სისტემა")
            self.fields['update_time_display'].initial = self.instance.update_time.strftime("%Y-%m-%d %H:%M") if self.instance.update_time else "-"
            self.fields['old_status_display'].initial = self.instance.get_old_status_display_safe()
            self.fields['new_status_display'].initial = self.instance.get_new_status_display_safe()
        else:
            for field_name in ['request_display', 'updated_by_display', 'update_time_display', 'old_status_display', 'new_status_display']:
                self.fields.pop(field_name, None)


class UserRequestCommentForm(BootstrapFormMixin, forms.Form):
    comment_text = forms.CharField(
        label=_("თქვენი კომენტარი"),
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': _("დაამატეთ თქვენი შეკითხვა, დამატებითი ინფორმაცია...")}),
        required=True
    )
