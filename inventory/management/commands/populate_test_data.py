# Version: 1.0 - 2025-05-26 10:14:56 UTC - gmaisuradze-adm - Command to populate test data
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

# ვცდილობთ მოდელების იმპორტს inventory აპლიკაციიდან
try:
    from inventory.models import Category, Status, Location, Supplier, Equipment
except ImportError:
    print("Error: Could not import models from inventory app. Make sure the app and models exist.")
    # ამ შემთხვევაში ბრძანება ვერ გააგრძელებს მუშაობას
    raise 

# ვცდილობთ Request მოდელის იმპორტს requests_app აპლიკაციიდან
# თუ თქვენი Request მოდელი სხვაგვარადაა განსაზღვრული, შეიძლება დაგჭირდეთ ამ ნაწილის შესწორება
try:
    from requests_app.models import Request
    REQUEST_APP_AVAILABLE = True
except ImportError:
    print("Warning: Could not import Request model from requests_app. Request data will not be populated.")
    REQUEST_APP_AVAILABLE = False


class Command(BaseCommand):
    help = 'Populates the database with initial test data for inventory and requests.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to populate test data...'))

        # --- მომხმარებლის შექმნა ან პოვნა ---
        # ვიყენებთ მომხმარებლის სახელს 'adm', რომელიც წინა ლოგებში ჩანდა
        # თუ თქვენი ადმინისტრატორის მომხმარებლის სახელი სხვაა, შეცვალეთ 'adm'
        # ან თუ გსურთ ახალი მომხმარებლის შექმნა ტესტირებისთვის
        test_user, created = User.objects.get_or_create(
            username='adm', 
            defaults={'first_name': 'Admin', 'last_name': 'User', 'email': 'admin@example.com'}
        )
        if created:
            test_user.set_password('testpassword123') # დააყენეთ სასურველი პაროლი
            test_user.is_staff = True
            test_user.is_superuser = True # სატესტო მიზნებისთვის
            test_user.save()
            self.stdout.write(self.style.SUCCESS(f"Created test user: {test_user.username}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Found existing user: {test_user.username}"))

        # --- კატეგორიები ---
        cat1, _ = Category.objects.get_or_create(name='Laptops', defaults={'description': 'Portable computers', 'icon': 'fas fa-laptop'})
        cat2, _ = Category.objects.get_or_create(name='Monitors', defaults={'description': 'Display screens', 'icon': 'fas fa-desktop'})
        cat3, _ = Category.objects.get_or_create(name='Printers', defaults={'description': 'Printing devices', 'icon': 'fas fa-print'})
        cat4, _ = Category.objects.get_or_create(name='Medical Devices', defaults={'description': 'Specialized medical equipment', 'icon': 'fas fa-heartbeat'})
        self.stdout.write(self.style.SUCCESS('Populated Categories'))

        # --- სტატუსები ---
        stat1, _ = Status.objects.get_or_create(name='In Use', defaults={'is_active': True})
        stat2, _ = Status.objects.get_or_create(name='In Storage', defaults={'is_active': True})
        stat3, _ = Status.objects.get_or_create(name='Under Repair', defaults={'is_active': False})
        stat4, _ = Status.objects.get_or_create(name='Decommissioned', defaults={'is_active': False, 'is_decommissioned': True})
        self.stdout.write(self.style.SUCCESS('Populated Statuses'))

        # --- ლოკაციები ---
        loc1, _ = Location.objects.get_or_create(name='Main Building - Floor 1', defaults={'address': '123 Health St.', 'floor': '1', 'room_number': '101A'})
        loc2, _ = Location.objects.get_or_create(name='Surgery Wing - Floor 2', defaults={'address': '123 Health St.', 'floor': '2', 'room_number': '205B'})
        loc3, _ = Location.objects.get_or_create(name='Storage Room A', defaults={'address': '125 Service Rd.', 'floor': 'Basement'})
        self.stdout.write(self.style.SUCCESS('Populated Locations'))

        # --- მომწოდებლები ---
        sup1, _ = Supplier.objects.get_or_create(name='Tech Solutions Inc.', defaults={'contact_person': 'John Doe', 'phone_number': '555-1234', 'email': 'sales@techsolutions.example.com'})
        sup2, _ = Supplier.objects.get_or_create(name='MediSupply Co.', defaults={'contact_person': 'Jane Smith', 'phone_number': '555-5678', 'email': 'contact@medisupply.example.com'})
        self.stdout.write(self.style.SUCCESS('Populated Suppliers'))

        # --- აღჭურვილობა ---
        equip1, _ = Equipment.objects.get_or_create(
            asset_tag='LAP001',
            defaults={
                'name': 'Dell XPS 15 Laptop',
                'serial_number': 'SNXPS15001',
                'category': cat1,
                'status': stat1,
                'current_location': loc1,
                'assigned_to': test_user,
                'supplier': sup1,
                'purchase_date': datetime.date(2023, 1, 15),
                'purchase_cost': 1500.00,
                'warranty_expiry_date': datetime.date(2026, 1, 14),
                'added_by': test_user,
                'updated_by': test_user,
                'notes': 'Primary laptop for Dr. Adams'
            }
        )
        equip2, _ = Equipment.objects.get_or_create(
            asset_tag='MON001',
            defaults={
                'name': 'LG 27inch 4K Monitor',
                'serial_number': 'SNLG27K001',
                'category': cat2,
                'status': stat1,
                'current_location': loc1,
                'assigned_to': test_user,
                'supplier': sup1,
                'purchase_date': datetime.date(2023, 2, 20),
                'purchase_cost': 450.00,
                'warranty_expiry_date': datetime.date(2026, 2, 19),
                'added_by': test_user,
                'updated_by': test_user
            }
        )
        equip3, _ = Equipment.objects.get_or_create(
            asset_tag='MEDDEV001',
            defaults={
                'name': 'ECG Machine Model X',
                'serial_number': 'SNECGMX001',
                'category': cat4,
                'status': stat2, # In Storage
                'current_location': loc3,
                # 'assigned_to': None, # Not assigned
                'supplier': sup2,
                'purchase_date': datetime.date(2022, 6, 10),
                'purchase_cost': 12000.00,
                'warranty_expiry_date': datetime.date(2027, 6, 9),
                'added_by': test_user,
                'updated_by': test_user,
                'notes': 'Portable ECG for emergency room.'
            }
        )
        self.stdout.write(self.style.SUCCESS('Populated Equipment'))

        # --- მოთხოვნები (Requests) ---
        # ეს ნაწილი იმუშავებს მხოლოდ იმ შემთხვევაში, თუ requests_app და Request მოდელი არსებობს
        # და აქვს შესაბამისი ველები. საჭიროებისამებრ შეასწორეთ.
        if REQUEST_APP_AVAILABLE and equip1:
            # შევამოწმოთ, რომ Request მოდელს აქვს ეს ველები
            # თუ თქვენს Request მოდელს სხვა ველები აქვს, ეს კოდი შესაცვლელი იქნება
            try:
                req1, _ = Request.objects.get_or_create(
                    subject='Laptop screen flickering',
                    defaults={
                        'requester': test_user,
                        'equipment': equip1,
                        'request_type': 'Repair', # დავუშვათ, რომ request_type ველი არსებობს
                        'description': 'The screen on LAP001 occasionally flickers. Needs checking.',
                        'priority': 'High',       # დავუშვათ, რომ priority ველი არსებობს
                        'status': 'Pending'       # დავუშვათ, რომ status ველი არსებობს (სხვა RequestStatus მოდელის ნაცვლად)
                    }
                )
                self.stdout.write(self.style.SUCCESS('Populated a sample Request'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Could not create sample Request. Your Request model might be different. Error: {e}"))
        
        self.stdout.write(self.style.SUCCESS('Test data population complete!'))