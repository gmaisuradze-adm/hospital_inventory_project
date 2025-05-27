# Version: 1.0 - 2025-05-26 08:06:31 UTC - gmaisuradze-adm - Login and Registration forms.
from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User

class CustomLoginForm(AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Username'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder':'Password'}))

class CustomUserCreationForm(UserCreationForm):
    # You can add more fields here if needed and override save method
    # email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email'}))
    class Meta(UserCreationForm.Meta):
        model = User # Or your custom user model if you have one
        fields = UserCreationForm.Meta.fields + ('first_name', 'last_name', 'email',) # Add other fields as needed

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name in self.fields:
            self.fields[field_name].widget.attrs.update({'class': 'form-control'})
            if self.fields[field_name].required:
                 self.fields[field_name].widget.attrs.update({'placeholder': field_name.replace("_", " ").title() + "*"})
            else:
                self.fields[field_name].widget.attrs.update({'placeholder': field_name.replace("_", " ").title()})
