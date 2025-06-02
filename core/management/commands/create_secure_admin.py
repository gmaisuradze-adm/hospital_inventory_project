import secrets
import string
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


class Command(BaseCommand):
    help = 'Create a secure admin user with a strong password'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Username for the admin user (default: admin)'
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email for the admin user'
        )
        parser.add_argument(
            '--auto-password',
            action='store_true',
            help='Generate a secure password automatically'
        )

    def generate_secure_password(self):
        """Generate a secure password with mixed case, numbers, and symbols"""
        length = 16
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(characters) for _ in range(length))
        
        # Ensure password has at least one of each required character type
        if not any(c.islower() for c in password):
            password = password[:-1] + secrets.choice(string.ascii_lowercase)
        if not any(c.isupper() for c in password):
            password = password[:-1] + secrets.choice(string.ascii_uppercase)
        if not any(c.isdigit() for c in password):
            password = password[:-1] + secrets.choice(string.digits)
        if not any(c in "!@#$%^&*" for c in password):
            password = password[:-1] + secrets.choice("!@#$%^&*")
            
        return password

    def handle(self, *args, **options):
        username = options['username']
        email = options.get('email')
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.ERROR(f'User "{username}" already exists!')
            )
            return

        # Generate or get password
        if options['auto_password']:
            password = self.generate_secure_password()
            self.stdout.write(
                self.style.WARNING(f'Generated password: {password}')
            )
            self.stdout.write(
                self.style.WARNING('Please save this password securely!')
            )
        else:
            password = input('Enter password for admin user: ')
            
        # Validate password
        try:
            validate_password(password)
        except ValidationError as e:
            self.stdout.write(
                self.style.ERROR(f'Password validation failed: {", ".join(e.messages)}')
            )
            return

        # Create user
        try:
            user = User.objects.create_superuser(
                username=username,
                email=email or f'{username}@hospital.local',
                password=password
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created admin user "{username}"')
            )
            
            if email:
                self.stdout.write(f'Email: {email}')
            else:
                self.stdout.write(f'Email: {username}@hospital.local')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create user: {str(e)}')
            )
