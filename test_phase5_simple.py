#!/usr/bin/env python
"""
Simple Phase 5 testing script for the Hospital Inventory Management System
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_inventory.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from inventory.models import Equipment, Status, Location, Supplier

def test_data_counts():
    """Test that we have the expected test data"""
    print("=== Data Count Test ===")
    equipment_count = Equipment.objects.count()
    status_count = Status.objects.count()
    location_count = Location.objects.count()
    supplier_count = Supplier.objects.count()
    user_count = User.objects.count()
    
    print(f"Equipment: {equipment_count}")
    print(f"Statuses: {status_count}")
    print(f"Locations: {location_count}")
    print(f"Suppliers: {supplier_count}")
    print(f"Users: {user_count}")
    
    return equipment_count > 0

def test_equipment_list_view():
    """Test the enhanced equipment list view"""
    print("\n=== Equipment List View Test ===")
    
    # Create or get test user
    user, created = User.objects.get_or_create(
        username='testuser_phase5',
        defaults={
            'is_staff': True,
            'is_superuser': True,
            'email': 'test@example.com'
        }
    )
    if created:
        user.set_password('test123')
        user.save()
    
    client = Client()
    client.force_login(user)
    
    # Test equipment list page
    response = client.get('/inventory/')
    print(f"Equipment list status: {response.status_code}")
    
    if response.status_code == 200:
        context = response.context
        has_status_list = 'status_list' in context
        has_location_list = 'location_list' in context
        
        print(f"Has status_list in context: {has_status_list}")
        print(f"Has location_list in context: {has_location_list}")
        
        if has_status_list:
            print(f"Status list count: {len(context['status_list'])}")
        if has_location_list:
            print(f"Location list count: {len(context['location_list'])}")
    
    return response.status_code == 200

def test_export_functionality():
    """Test export functionality"""
    print("\n=== Export Functionality Test ===")
    
    user = User.objects.filter(is_superuser=True).first()
    client = Client()
    client.force_login(user)
    
    # Test CSV export
    response = client.get('/inventory/', {'export': 'csv'})
    print(f"CSV export status: {response.status_code}")
    if response.status_code == 200:
        content_type = response.get('Content-Type', '')
        print(f"CSV content type: {content_type}")
    
    # Test Excel export
    response = client.get('/inventory/', {'export': 'excel'})
    print(f"Excel export status: {response.status_code}")
    
    # Test PDF export
    response = client.get('/inventory/', {'export': 'pdf'})
    print(f"PDF export status: {response.status_code}")

def test_bulk_operations():
    """Test bulk operations"""
    print("\n=== Bulk Operations Test ===")
    
    equipment_count = Equipment.objects.count()
    if equipment_count == 0:
        print("No equipment to test bulk operations")
        return
    
    user = User.objects.filter(is_superuser=True).first()
    client = Client()
    client.force_login(user)
    
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
        print(f"Bulk status change status: {response.status_code}")
    
    # Test bulk location change
    locations = Location.objects.all()
    if locations.exists():
        new_location = locations.first()
        response = client.post('/inventory/equipment/bulk-operations/location-change/', {
            'equipment_ids': equipment_ids,
            'new_location': new_location.pk
        })
        print(f"Bulk location change status: {response.status_code}")

def main():
    print("Phase 5 Enhanced Inventory Management Interface - Validation Testing")
    print("=" * 70)
    
    try:
        # Run tests
        has_data = test_data_counts()
        if not has_data:
            print("No test data found. Please run create_test_data command first.")
            return
        
        test_equipment_list_view()
        test_export_functionality()
        test_bulk_operations()
        
        print("\n" + "=" * 70)
        print("Phase 5 testing completed successfully!")
        
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
