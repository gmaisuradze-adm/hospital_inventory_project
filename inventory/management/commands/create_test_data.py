from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from inventory.models import Equipment, Status, Location, Category, Supplier

class Command(BaseCommand):
    help = 'Create test data for Phase 5 functionality testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating test data for Phase 5...')
        
        # Create superuser if not exists
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@hospital.com',
                password='admin123'
            )
            self.stdout.write('Created admin user')
        
        # Create test category
        category, created = Category.objects.get_or_create(
            name='Medical Equipment',
            defaults={'description': 'General medical equipment'}
        )
        if created:
            self.stdout.write('Created Medical Equipment category')
        
        # Create test statuses
        active_status, created = Status.objects.get_or_create(
            name='Active',
            defaults={
                'description': 'Equipment in active use',
                'is_decommissioned': False,
                'is_marked_for_write_off': False
            }
        )
        if created:
            self.stdout.write('Created Active status')
        
        maintenance_status, created = Status.objects.get_or_create(
            name='Maintenance',
            defaults={
                'description': 'Equipment under maintenance',
                'is_decommissioned': False,
                'is_marked_for_write_off': False
            }
        )
        if created:
            self.stdout.write('Created Maintenance status')
        
        # Create test locations
        icu_location, created = Location.objects.get_or_create(
            name='ICU',
            defaults={'notes': 'Intensive Care Unit'}
        )
        if created:
            self.stdout.write('Created ICU location')
        
        er_location, created = Location.objects.get_or_create(
            name='Emergency Room',
            defaults={'notes': 'Emergency Room'}
        )
        if created:
            self.stdout.write('Created Emergency Room location')
        
        # Create multiple test suppliers for better testing
        supplier_names = ['MedTech Supplies', 'HealthCorp Ltd', 'Medical Solutions Inc']
        suppliers = []
        for i, supplier_name in enumerate(supplier_names, 1):
            supplier, created = Supplier.objects.get_or_create(
                name=supplier_name,
                defaults={
                    'contact_person': f"Contact Person {i}",
                    'phone_number': f"+995 555 {100+i:03d}",
                    'email': f"contact{i}@{supplier_name.lower().replace(' ', '')}.com",
                    'website': f"https://www.{supplier_name.lower().replace(' ', '')}.com",
                    'notes': f"Test supplier {supplier_name} for Phase 5 testing."
                }
            )
            suppliers.append(supplier)
            if created:
                self.stdout.write(f'Created {supplier_name} supplier')
        
        # Create additional test statuses for bulk operations
        statuses = [active_status, maintenance_status]
        
        storage_status, created = Status.objects.get_or_create(
            name='Storage',
            defaults={
                'description': 'Equipment in storage',
                'is_decommissioned': False,
                'is_marked_for_write_off': False
            }
        )
        if created:
            self.stdout.write('Created Storage status')
        statuses.append(storage_status)
        
        repair_status, created = Status.objects.get_or_create(
            name='Repair',
            defaults={
                'description': 'Equipment under repair',
                'is_decommissioned': False,
                'is_marked_for_write_off': False
            }
        )
        if created:
            self.stdout.write('Created Repair status')
        statuses.append(repair_status)
        
        # Create additional locations for bulk operations
        locations = [icu_location, er_location]
        
        surgery_location, created = Location.objects.get_or_create(
            name='Surgery',
            defaults={'notes': 'Operating rooms and surgical suites'}
        )
        if created:
            self.stdout.write('Created Surgery location')
        locations.append(surgery_location)
        
        lab_location, created = Location.objects.get_or_create(
            name='Laboratory',
            defaults={'notes': 'Medical laboratory and pathology'}
        )
        if created:
            self.stdout.write('Created Laboratory location')
        locations.append(lab_location)
        
        # Create test equipment with varied properties for bulk operations testing
        equipment_data = [
            {
                'asset_tag': 'MED-1001',
                'name': 'Ventilator Model A',
                'serial_number': 'SN1001',
                'supplier_index': 0,
                'status_index': 0,
                'location_index': 0,
            },
            {
                'asset_tag': 'MED-1002', 
                'name': 'Patient Monitor X1',
                'serial_number': 'SN1002',
                'supplier_index': 1,
                'status_index': 1,
                'location_index': 1,
            },
            {
                'asset_tag': 'MED-1003',
                'name': 'Defibrillator Pro',
                'serial_number': 'SN1003',
                'supplier_index': 2,
                'status_index': 0,
                'location_index': 2,
            },
            {
                'asset_tag': 'MED-1004',
                'name': 'IV Pump Advanced',
                'serial_number': 'SN1004',
                'supplier_index': 0,
                'status_index': 2,
                'location_index': 3,
            },
            {
                'asset_tag': 'MED-1005',
                'name': 'X-Ray Machine Portable',
                'serial_number': 'SN1005',
                'supplier_index': 1,
                'status_index': 3,
                'location_index': 0,
            },
            {
                'asset_tag': 'MED-1006',
                'name': 'Ultrasound Scanner',
                'serial_number': 'SN1006',
                'supplier_index': 2,
                'status_index': 1,
                'location_index': 1,
            },
            {
                'asset_tag': 'MED-1007',
                'name': 'ECG Machine',
                'serial_number': 'SN1007',
                'supplier_index': 0,
                'status_index': 0,
                'location_index': 2,
            },
            {
                'asset_tag': 'MED-1008',
                'name': 'Blood Pressure Monitor',
                'serial_number': 'SN1008',
                'supplier_index': 1,
                'status_index': 2,
                'location_index': 3,
            },
            {
                'asset_tag': 'MED-1009',
                'name': 'Oxygen Concentrator',
                'serial_number': 'SN1009',
                'supplier_index': 2,
                'status_index': 1,
                'location_index': 0,
            },
            {
                'asset_tag': 'MED-1010',
                'name': 'Pulse Oximeter',
                'serial_number': 'SN1010',
                'supplier_index': 0,
                'status_index': 0,
                'location_index': 1,
            }
        ]
        
        created_count = 0
        for data in equipment_data:
            equipment, created = Equipment.objects.get_or_create(
                asset_tag=data['asset_tag'],
                defaults={
                    'name': data['name'],
                    'serial_number': data['serial_number'],
                    'category': category,
                    'status': statuses[data['status_index']],
                    'current_location': locations[data['location_index']],
                    'supplier': suppliers[data['supplier_index']],
                    'purchase_cost': 5000.00 + (data['supplier_index'] * 1000),  # Varied costs
                    'notes': f'Test equipment for Phase 5 functionality - {data["name"]}'
                }
            )
            if created:
                created_count += 1
        
        self.stdout.write(f'Created {created_count} equipment items')
        self.stdout.write(
            self.style.SUCCESS(
                f'Test data creation completed!\n'
                f'- Total Equipment: {Equipment.objects.count()}\n'
                f'- Total Statuses: {Status.objects.count()}\n'
                f'- Total Locations: {Location.objects.count()}\n'
                f'- Total Suppliers: {Supplier.objects.count()}\n'
                f'- Admin user: admin/admin123'
            )
        )
