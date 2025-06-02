#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_inventory.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from inventory.models import Equipment, Status, Location

def test_basic_functionality():
    """Test basic Phase 5 functionality"""
    print("=== Phase 5 Basic Functionality Test ===")
    
    # Check if we have data
    equipment_count = Equipment.objects.count()
    status_count = Status.objects.count()
    location_count = Location.objects.count()
    
    print(f"Database Status:")
    print(f"- Equipment items: {equipment_count}")
    print(f"- Status items: {status_count}")  
    print(f"- Location items: {location_count}")
    
    if equipment_count == 0:
        print("No equipment found in database. Creating test data...")
        from django.core.management import call_command
        call_command('create_test_data')
        equipment_count = Equipment.objects.count()
        print(f"- Equipment items after creation: {equipment_count}")
    
    # Test client
    client = Client()
    
    # Create and login test user
    user, created = User.objects.get_or_create(
        username='testadmin',
        defaults={
            'email': 'admin@test.com',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        user.set_password('admin123')
        user.save()
        print("Created test admin user")
    
    client.force_login(user)
    print("Logged in test user")
    
    # Test equipment list view
    print("\nTesting Equipment List View...")
    response = client.get('/inventory/')
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Equipment list page loads successfully")
        
        # Check context data (Phase 5 requirement)
        context = response.context
        if 'status_list' in context:
            print(f"✅ status_list found in context ({len(context['status_list'])} items)")
        else:
            print("❌ status_list missing from context")
            
        if 'location_list' in context:
            print(f"✅ location_list found in context ({len(context['location_list'])} items)")
        else:
            print("❌ location_list missing from context")
    else:
        print(f"❌ Equipment list page failed with status {response.status_code}")
    
    # Test export functionality
    print("\nTesting Export Functionality...")
    
    # Test CSV export
    response = client.get('/inventory/', {'export': 'csv'})
    if response.status_code == 200 and 'text/csv' in response.get('Content-Type', ''):
        print("✅ CSV export works")
    else:
        print(f"❌ CSV export failed (status: {response.status_code})")
    
    # Test Excel export
    response = client.get('/inventory/', {'export': 'excel'})
    if response.status_code == 200:
        print("✅ Excel export works")
    else:
        print(f"❌ Excel export failed (status: {response.status_code})")
    
    # Test PDF export
    response = client.get('/inventory/', {'export': 'pdf'})
    if response.status_code == 200:
        print("✅ PDF export works")
    else:
        print(f"❌ PDF export failed (status: {response.status_code})")
    
    # Test bulk operations (if we have equipment)
    if equipment_count > 0:
        print("\nTesting Bulk Operations...")
        
        # Get first equipment item
        equipment = Equipment.objects.first()
        equipment_ids = [equipment.pk]
        
        # Test bulk status change
        statuses = Status.objects.filter(is_decommissioned=False)
        if statuses.exists():
            new_status = statuses.first()
            response = client.post('/inventory/equipment/bulk-operations/status-change/', {
                'equipment_ids': equipment_ids,
                'new_status': new_status.pk
            })
            if response.status_code == 200:
                print("✅ Bulk status change works")
            else:
                print(f"❌ Bulk status change failed (status: {response.status_code})")
        
        # Test bulk location change
        locations = Location.objects.all()
        if locations.exists():
            new_location = locations.first()
            response = client.post('/inventory/equipment/bulk-operations/location-change/', {
                'equipment_ids': equipment_ids,
                'new_location': new_location.pk
            })
            if response.status_code == 200:
                print("✅ Bulk location change works")
            else:
                print(f"❌ Bulk location change failed (status: {response.status_code})")
    
    print("\n=== Test Completed ===")

if __name__ == '__main__':
    test_basic_functionality()
