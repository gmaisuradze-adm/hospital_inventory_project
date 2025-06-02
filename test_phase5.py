#!/usr/bin/env python
"""
Test script for Phase 5 Enhanced Inventory Management Interface
This script tests the key functionality implemented in Phase 5.
"""

import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_inventory.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from django.urls import reverse

from inventory.models import Equipment, Status, Location, Category, Supplier

def create_test_data():
    """Create test data for Phase 5 testing"""
    print("Creating test data...")
    
    # Create test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@hospital.com',
            'first_name': 'Test',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
    
    # Create test category
    category, _ = Category.objects.get_or_create(
        name='Medical Equipment',
        defaults={'description': 'General medical equipment'}
    )
    
    # Create test statuses
    active_status, _ = Status.objects.get_or_create(
        name='Active',
        defaults={
            'description': 'Equipment in active use',
            'is_decommissioned': False,
            'is_marked_for_write_off': False
        }
    )
    
    maintenance_status, _ = Status.objects.get_or_create(
        name='Maintenance',
        defaults={
            'description': 'Equipment under maintenance',
            'is_decommissioned': False,
            'is_marked_for_write_off': False
        }
    )
    
    # Create test location
    location, _ = Location.objects.get_or_create(
        name='ICU',
        defaults={'notes': 'Intensive Care Unit'}
    )
    
    # Create test supplier
    supplier, _ = Supplier.objects.get_or_create(
        name='MedTech Supplies',
        defaults={
            'contact_person': 'John Doe',
            'email': 'john@medtech.com',
            'phone_number': '555-0123'
        }
    )
    
    # Create test equipment
    equipment_list = []
    for i in range(5):
        equipment, created = Equipment.objects.get_or_create(
            asset_tag=f'MED-{1000 + i}',
            defaults={
                'name': f'Test Equipment {i+1}',
                'serial_number': f'SN{1000 + i}',
                'category': category,
                'status': active_status,
                'current_location': location,
                'supplier': supplier,
                'purchase_cost': 1000.00 + (i * 100),
                'notes': f'Test equipment {i+1} for Phase 5 testing'
            }
        )
        equipment_list.append(equipment)
    
    print(f"Created test data: {len(equipment_list)} equipment items")
    return user, equipment_list, active_status, maintenance_status, location

def test_export_functionality():
    """Test CSV, Excel, and PDF export functionality"""
    print("\n=== Testing Export Functionality ===")
    
    client = Client()
    user, equipment_list, active_status, maintenance_status, location = create_test_data()
    
    # Login
    client.force_login(user)
    
    # Test CSV export
    print("Testing CSV export...")
    response = client.get('/inventory/equipment/', {'export': 'csv'})
    print(f"CSV export status: {response.status_code}")
    if response.status_code == 200:
        print(f"CSV content-type: {response.get('Content-Type')}")
        print(f"CSV content length: {len(response.content)}")
    
    # Test Excel export
    print("Testing Excel export...")
    response = client.get('/inventory/equipment/', {'export': 'excel'})
    print(f"Excel export status: {response.status_code}")
    if response.status_code == 200:
        print(f"Excel content-type: {response.get('Content-Type')}")
        print(f"Excel content length: {len(response.content)}")
    
    # Test PDF export
    print("Testing PDF export...")
    response = client.get('/inventory/equipment/', {'export': 'pdf'})
    print(f"PDF export status: {response.status_code}")
    if response.status_code == 200:
        print(f"PDF content-type: {response.get('Content-Type')}")
        print(f"PDF content length: {len(response.content)}")
    
    # Test individual equipment PDF export
    print("Testing individual equipment PDF export...")
    equipment_id = equipment_list[0].pk
    response = client.get(f'/inventory/equipment/{equipment_id}/export-pdf/')
    print(f"Individual PDF export status: {response.status_code}")
    if response.status_code == 200:
        print(f"Individual PDF content-type: {response.get('Content-Type')}")
        print(f"Individual PDF content length: {len(response.content)}")

def test_bulk_operations():
    """Test bulk operations functionality"""
    print("\n=== Testing Bulk Operations ===")
    
    client = Client()
    user, equipment_list, active_status, maintenance_status, location = create_test_data()
    
    # Login
    client.force_login(user)
    
    # Get equipment IDs
    equipment_ids = [eq.pk for eq in equipment_list[:3]]  # Test with first 3 items
    
    # Test bulk status change
    print("Testing bulk status change...")
    response = client.post('/inventory/equipment/bulk-operations/status-change/', {
        'equipment_ids': equipment_ids,
        'new_status': maintenance_status.pk
    })
    print(f"Bulk status change response: {response.status_code}")
    if response.status_code == 200:
        try:
            result = json.loads(response.content)
            print(f"Bulk status change result: {result}")
        except:
            print("Could not parse JSON response")
    
    # Test bulk location change
    print("Testing bulk location change...")
    response = client.post('/inventory/equipment/bulk-operations/location-change/', {
        'equipment_ids': equipment_ids,
        'new_location': location.pk
    })
    print(f"Bulk location change response: {response.status_code}")
    if response.status_code == 200:
        try:
            result = json.loads(response.content)
            print(f"Bulk location change result: {result}")
        except:
            print("Could not parse JSON response")

def test_context_data():
    """Test that context data includes status_list and location_list"""
    print("\n=== Testing Context Data ===")
    
    client = Client()
    user, equipment_list, active_status, maintenance_status, location = create_test_data()
    
    # Login
    client.force_login(user)
    
    # Get equipment list page
    response = client.get('/inventory/equipment/')
    print(f"Equipment list page status: {response.status_code}")
    
    if response.status_code == 200:
        # Check if status_list and location_list are in context
        context = response.context
        if 'status_list' in context:
            print(f"status_list found in context with {len(context['status_list'])} items")
        else:
            print("status_list NOT found in context")
        
        if 'location_list' in context:
            print(f"location_list found in context with {len(context['location_list'])} items")
        else:
            print("location_list NOT found in context")

def main():
    """Run all Phase 5 tests"""
    print("=== Phase 5 Enhanced Inventory Management Interface Tests ===")
    
    try:
        test_export_functionality()
        test_bulk_operations()
        test_context_data()
        print("\n=== All Tests Completed ===")
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
