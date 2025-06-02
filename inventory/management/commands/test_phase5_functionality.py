from django.core.management.base import BaseCommand
from django.test import Client
from django.contrib.auth.models import User
from inventory.models import Equipment, Status, Location

class Command(BaseCommand):
    help = 'Test Phase 5 functionality'

    def handle(self, *args, **options):
        self.stdout.write('=== Phase 5 Functionality Test ===')
        
        # Check data counts
        equipment_count = Equipment.objects.count()
        status_count = Status.objects.count()
        location_count = Location.objects.count()
        
        self.stdout.write(f'Equipment count: {equipment_count}')
        self.stdout.write(f'Status count: {status_count}')
        self.stdout.write(f'Location count: {location_count}')
        
        # Test client functionality
        client = Client()
        
        # Create test user if needed
        user, created = User.objects.get_or_create(
            username='testuser3',
            defaults={
                'is_staff': True,
                'is_superuser': True,
                'email': 'test@example.com'
            }
        )
        if created:
            user.set_password('test123')
            user.save()
            self.stdout.write('Created test user')
        
        # Login and test
        client.force_login(user)
        
        # Test equipment list view
        response = client.get('/inventory/')
        self.stdout.write(f'Equipment list response status: {response.status_code}')
        
        if response.status_code == 200:
            context = response.context
            has_status_list = 'status_list' in context
            has_location_list = 'location_list' in context
            
            self.stdout.write(f'Context has status_list: {has_status_list}')
            self.stdout.write(f'Context has location_list: {has_location_list}')
            
            if has_status_list:
                status_count_context = len(context['status_list'])
                self.stdout.write(f'Status list count in context: {status_count_context}')
            
            if has_location_list:
                location_count_context = len(context['location_list'])
                self.stdout.write(f'Location list count in context: {location_count_context}')
        
        # Test export functionality
        self.stdout.write('\n--- Testing Export Functionality ---')
        
        # CSV Export
        response = client.get('/inventory/', {'export': 'csv'})
        self.stdout.write(f'CSV export status: {response.status_code}')
        if response.status_code == 200:
            content_type = response.get('Content-Type', '')
            self.stdout.write(f'CSV content type: {content_type}')
        
        # Excel Export
        response = client.get('/inventory/', {'export': 'excel'})
        self.stdout.write(f'Excel export status: {response.status_code}')
        
        # PDF Export
        response = client.get('/inventory/', {'export': 'pdf'})
        self.stdout.write(f'PDF export status: {response.status_code}')
        
        # Test bulk operations if we have data
        if equipment_count > 0:
            self.stdout.write('\n--- Testing Bulk Operations ---')
            
            equipment = Equipment.objects.first()
            equipment_ids = [equipment.pk]
            
            # Test bulk status change
            available_statuses = Status.objects.filter(is_decommissioned=False)
            if available_statuses.exists():
                new_status = available_statuses.first()
                response = client.post('/inventory/equipment/bulk-operations/status-change/', {
                    'equipment_ids': equipment_ids,
                    'new_status': new_status.pk
                })
                self.stdout.write(f'Bulk status change status: {response.status_code}')
            
            # Test bulk location change
            available_locations = Location.objects.all()
            if available_locations.exists():
                new_location = available_locations.first()
                response = client.post('/inventory/equipment/bulk-operations/location-change/', {
                    'equipment_ids': equipment_ids,
                    'new_location': new_location.pk
                })
                self.stdout.write(f'Bulk location change status: {response.status_code}')
        
        self.stdout.write(
            self.style.SUCCESS('Phase 5 functionality test completed!')
        )
