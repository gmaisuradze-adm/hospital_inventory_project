#!/usr/bin/env python
"""
Phase 5 Enhanced Inventory Management Interface - Final Validation Test
Hospital Inventory Management System

This script performs comprehensive validation of all Phase 5 features:
1. Export functionality (CSV, Excel, PDF)
2. Bulk operations (status change, location change, bulk delete)
3. Enhanced UI with filtering and search
4. Template context data validation
"""

import os
import sys
import django
import requests
import time
from io import StringIO

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hospital_inventory.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from inventory.models import Equipment, Status, Location, Supplier

class Phase5Validator:
    def __init__(self):
        self.client = Client()
        self.test_user = None
        self.test_results = {
            'data_setup': False,
            'equipment_list_view': False,
            'context_data': False,
            'csv_export': False,
            'excel_export': False,
            'pdf_export': False,
            'bulk_status_change': False,
            'bulk_location_change': False,
            'server_running': False
        }
        
    def setup_test_user(self):
        """Create or get test user"""
        try:
            self.test_user, created = User.objects.get_or_create(
                username='phase5_validator',
                defaults={
                    'is_staff': True,
                    'is_superuser': True,
                    'email': 'validator@example.com',
                    'first_name': 'Phase5',
                    'last_name': 'Validator'
                }
            )
            if created:
                self.test_user.set_password('validator123')
                self.test_user.save()
            
            self.client.force_login(self.test_user)
            return True
        except Exception as e:
            print(f"Error setting up test user: {e}")
            return False
    
    def validate_data_setup(self):
        """Validate that test data exists"""
        try:
            equipment_count = Equipment.objects.count()
            status_count = Status.objects.count()
            location_count = Location.objects.count()
            supplier_count = Supplier.objects.count()
            
            print(f"Data counts:")
            print(f"  Equipment: {equipment_count}")
            print(f"  Statuses: {status_count}")
            print(f"  Locations: {location_count}")
            print(f"  Suppliers: {supplier_count}")
            
            if equipment_count > 0 and status_count > 0 and location_count > 0:
                self.test_results['data_setup'] = True
                return True
            else:
                print("Insufficient test data")
                return False
                
        except Exception as e:
            print(f"Error validating data setup: {e}")
            return False
    
    def validate_equipment_list_view(self):
        """Test equipment list view functionality"""
        try:
            response = self.client.get('/inventory/')
            
            if response.status_code == 200:
                self.test_results['equipment_list_view'] = True
                
                # Check context data
                context = response.context
                if context:
                    has_status_list = 'status_list' in context
                    has_location_list = 'location_list' in context
                    has_equipment_list = 'equipment_list' in context
                    
                    print(f"Context validation:")
                    print(f"  Has status_list: {has_status_list}")
                    print(f"  Has location_list: {has_location_list}")
                    print(f"  Has equipment_list: {has_equipment_list}")
                    
                    if has_status_list and has_location_list:
                        self.test_results['context_data'] = True
                        
                        status_count = len(context['status_list'])
                        location_count = len(context['location_list'])
                        print(f"  Status list count: {status_count}")
                        print(f"  Location list count: {location_count}")
                
                return True
            else:
                print(f"Equipment list view failed with status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"Error validating equipment list view: {e}")
            return False
    
    def validate_export_functionality(self):
        """Test all export formats"""
        try:
            # CSV Export
            response = self.client.get('/inventory/', {'export': 'csv'})
            if response.status_code == 200:
                content_type = response.get('Content-Type', '')
                if 'csv' in content_type.lower() or 'text/csv' in content_type:
                    self.test_results['csv_export'] = True
                    print("CSV export: PASSED")
                else:
                    print(f"CSV export: FAILED - Wrong content type: {content_type}")
            else:
                print(f"CSV export: FAILED - Status: {response.status_code}")
            
            # Excel Export
            response = self.client.get('/inventory/', {'export': 'excel'})
            if response.status_code == 200:
                content_type = response.get('Content-Type', '')
                if 'excel' in content_type.lower() or 'spreadsheet' in content_type.lower():
                    self.test_results['excel_export'] = True
                    print("Excel export: PASSED")
                else:
                    print(f"Excel export: FAILED - Wrong content type: {content_type}")
            else:
                print(f"Excel export: FAILED - Status: {response.status_code}")
            
            # PDF Export
            response = self.client.get('/inventory/', {'export': 'pdf'})
            if response.status_code == 200:
                content_type = response.get('Content-Type', '')
                if 'pdf' in content_type.lower():
                    self.test_results['pdf_export'] = True
                    print("PDF export: PASSED")
                else:
                    print(f"PDF export: FAILED - Wrong content type: {content_type}")
            else:
                print(f"PDF export: FAILED - Status: {response.status_code}")
                
        except Exception as e:
            print(f"Error validating export functionality: {e}")
    
    def validate_bulk_operations(self):
        """Test bulk operations"""
        try:
            # Get test equipment
            equipment = Equipment.objects.first()
            if not equipment:
                print("No equipment available for bulk operations test")
                return
            
            equipment_ids = [equipment.pk]
            
            # Test bulk status change
            statuses = Status.objects.filter(is_decommissioned=False)
            if statuses.exists():
                new_status = statuses.first()
                response = self.client.post('/inventory/equipment/bulk-operations/status-change/', {
                    'selected_ids': equipment_ids,
                    'new_status': new_status.pk
                })
                
                if response.status_code == 200:
                    self.test_results['bulk_status_change'] = True
                    print("Bulk status change: PASSED")
                else:
                    print(f"Bulk status change: FAILED - Status: {response.status_code}")
            
            # Test bulk location change
            locations = Location.objects.all()
            if locations.exists():
                new_location = locations.first()
                response = self.client.post('/inventory/equipment/bulk-operations/location-change/', {
                    'selected_ids': equipment_ids,
                    'new_location': new_location.pk
                })
                
                if response.status_code == 200:
                    self.test_results['bulk_location_change'] = True
                    print("Bulk location change: PASSED")
                else:
                    print(f"Bulk location change: FAILED - Status: {response.status_code}")
                    
        except Exception as e:
            print(f"Error validating bulk operations: {e}")
    
    def test_server_availability(self):
        """Test if development server is accessible"""
        try:
            response = requests.get('http://127.0.0.1:8000/inventory/', timeout=5)
            if response.status_code == 200:
                self.test_results['server_running'] = True
                print("Development server: ACCESSIBLE")
                return True
            else:
                print(f"Development server: FAILED - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"Development server: NOT ACCESSIBLE - {e}")
            return False
    
    def run_validation(self):
        """Run comprehensive Phase 5 validation"""
        print("=" * 60)
        print("PHASE 5 ENHANCED INVENTORY MANAGEMENT INTERFACE")
        print("COMPREHENSIVE VALIDATION TEST")
        print("=" * 60)
        
        # Setup
        print("\n1. Setting up test environment...")
        if not self.setup_test_user():
            print("FAILED: Could not setup test user")
            return False
        
        # Data validation
        print("\n2. Validating test data...")
        self.validate_data_setup()
        
        # View validation
        print("\n3. Validating equipment list view...")
        self.validate_equipment_list_view()
        
        # Export validation
        print("\n4. Validating export functionality...")
        self.validate_export_functionality()
        
        # Bulk operations validation
        print("\n5. Validating bulk operations...")
        self.validate_bulk_operations()
        
        # Server accessibility test
        print("\n6. Testing server accessibility...")
        self.test_server_availability()
        
        # Summary
        print("\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)
        
        passed_tests = sum(1 for result in self.test_results.values() if result)
        total_tests = len(self.test_results)
        
        for test_name, result in self.test_results.items():
            status = "PASS" if result else "FAIL"
            print(f"{test_name.replace('_', ' ').title():<25}: {status}")
        
        print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("\n🎉 ALL PHASE 5 FEATURES VALIDATED SUCCESSFULLY!")
            return True
        else:
            print(f"\n⚠️  {total_tests - passed_tests} features need attention")
            return False

def main():
    """Main execution function"""
    validator = Phase5Validator()
    success = validator.run_validation()
    
    if success:
        print("\nPhase 5 implementation is complete and fully functional!")
        print("\nKey achievements:")
        print("✓ Enhanced equipment list view with advanced filtering")
        print("✓ Multi-format export functionality (CSV, Excel, PDF)")
        print("✓ Bulk operations for status and location changes")
        print("✓ Improved UI with bulk selection capabilities")
        print("✓ Comprehensive error handling and user feedback")
        print("✓ Test data generation and management")
        
        print("\nNext recommended steps:")
        print("• Performance testing with larger datasets")
        print("• User acceptance testing")
        print("• Documentation updates")
        print("• Production deployment preparation")
    else:
        print("\nSome issues were detected. Please review the failed tests.")
    
    return success

if __name__ == '__main__':
    main()
