from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.urls import reverse # To build absolute URLs

from .models import Request

@receiver(post_save, sender=Request)
def send_new_request_notification(sender, instance, created, **kwargs):
    """
    Sends a notification email when a new request is created.
    """
    if created: # Only send email if the request was just created
        request = instance
        
        # Prepare context for email templates
        # For absolute URLs, you need a request object. Since signals don't have one,
        # we need to construct it. Ensure your settings have SITE_ID and you have
        # a domain set up in Sites framework or construct URL manually.
        # For simplicity, let's assume a base URL. You might need to make this more robust.
        # A common way is to get it from settings or construct with request.build_absolute_uri()
        # if you had a request object.
        
        # TODO: Make this more robust for production. Consider using django.contrib.sites
        # or defining a SITE_BASE_URL in your settings.
        # For development with runserver, 'http://127.0.0.1:8000' is often the base.
        # Ensure your ALLOWED_HOSTS in settings.py includes the domain if not in DEBUG mode.
        
        # We will construct the path and assume the domain.
        # For a real application, especially if using different domains/ports,
        # this needs to be handled more carefully.
        try:
            # Assuming your request detail URL is named 'request_detail' in requests_app/urls.py
            path_to_detail = reverse('requests_app:request_detail', kwargs={'pk': request.pk})
            # THIS IS A SIMPLIFIED WAY AND MIGHT NEED ADJUSTMENT FOR PRODUCTION
            # Best practice would be to get domain from Sites framework or settings
            # For now, let's assume the server runs on localhost for development links
            # You should replace 'http://127.0.0.1:8000' with your actual domain in production
            # or use request.build_absolute_uri() if you can pass a request object to a utility function.
            if settings.DEBUG:
                base_url = "http://127.0.0.1:8000" # Common for local dev server
            else:
                # TODO: Set this to your actual production domain in settings.py
                # e.g., base_url = "https://yourdomain.com"
                # For now, as a placeholder if not in DEBUG, we'll still use localhost.
                # It's better to have a setting like SITE_URL = "https://yourdomain.com"
                base_url = getattr(settings, 'SITE_URL', 'http://127.0.0.1:8000')


            request_detail_url = f"{base_url}{path_to_detail}"
        except Exception as e:
            # Log this error or handle it; for now, a placeholder URL
            print(f"Error generating URL for email: {e}") # Log this
            request_detail_url = "Could not generate link. Please check the request in the system."

        email_context = {
            'request': request,
            'request_detail_url': request_detail_url,
        }

        # Render email subject and body from templates
        subject = render_to_string('requests_app/emails/new_request_notification_subject.txt', email_context).strip()
        body = render_to_string('requests_app/emails/new_request_notification_body.txt', email_context)

        recipients = []
        # 1. Add default IT email
        if settings.DEFAULT_IT_EMAIL:
            recipients.append(settings.DEFAULT_IT_EMAIL)
        
        # 2. If assigned on creation, add assignee's email
        if request.assigned_to and request.assigned_to.email:
            if request.assigned_to.email not in recipients: # Avoid duplicate if IT email is assignee
                 recipients.append(request.assigned_to.email)

        if recipients:
            try:
                send_mail(
                    subject,
                    body,
                    settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com', # Sender
                    recipients, # List of recipients
                    fail_silently=False, # If True, errors will not be raised
                )
                print(f"Notification email sent for new request #{request.id} to {recipients}") # For console backend
            except Exception as e:
                # Log the error (e.g., using Python's logging module)
                print(f"Error sending email for new request #{request.id}: {e}")
        else:
            print(f"No recipients found for new request #{request.id} notification.")
