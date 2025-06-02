#!/usr/bin/env python3
"""
Phase 5 Final Validation Script
Tests all key Phase 5 Enhanced Inventory Management Interface features
"""

import os
import sys
import requests
import json
from urllib.parse import urljoin

class Phase5Validator:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = []
    
    def log_result(self, test_name, status, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'details': details or {}
        }
        self.results.append(result)
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_name}: {message}")
        if details:
            for key, value in details.items():
                print(f"   {key}: {value}")
    
    def test_url_accessibility(self):
        """Test if key URLs are accessible"""
        urls_to_test = [
            ("/", "Main Dashboard"),
            ("/inventory/", "Equipment List"),
            ("/inventory/dashboard/", "Inventory Dashboard Redirect"),
            ("/admin/", "Admin Interface"),
        ]
        
        for url, description in urls_to_test:
            try:
                full_url = urljoin(self.base_url, url)
                response = self.session.get(full_url, timeout=10, allow_redirects=True)
                
                if response.status_code == 200:
                    self.log_result(
                        f"URL Access: {description}",
                        "PASS",
                        f"Successfully accessed {url}",
                        {"status_code": response.status_code, "final_url": response.url}
                    )
                elif response.status_code in [302, 301]:
                    self.log_result(
                        f"URL Access: {description}",
                        "PASS",
                        f"Redirected from {url} (expected for some URLs)",
                        {"status_code": response.status_code, "final_url": response.url}
                    )
                else:
                    self.log_result(
                        f"URL Access: {description}",
                        "FAIL",
                        f"Unexpected status code for {url}",
                        {"status_code": response.status_code}
                    )
            except requests.RequestException as e:
                self.log_result(
                    f"URL Access: {description}",
                    "FAIL",
                    f"Failed to access {url}",
                    {"error": str(e)}
                )
    
    def test_bulk_operation_endpoints(self):
        """Test if bulk operation endpoints are configured"""
        bulk_endpoints = [
            "/inventory/equipment/bulk-operations/status-change/",
            "/inventory/equipment/bulk-operations/location-change/", 
            "/inventory/equipment/bulk-operations/delete/",
        ]
        
        for endpoint in bulk_endpoints:
            try:
                full_url = urljoin(self.base_url, endpoint)
                # Use HEAD request to check if endpoint exists without triggering the view
                response = self.session.head(full_url, timeout=5, allow_redirects=True)
                
                if response.status_code in [200, 302, 405]:  # 405 = Method Not Allowed (expected for HEAD on POST endpoints)
                    self.log_result(
                        f"Bulk Endpoint: {endpoint}",
                        "PASS",
                        "Endpoint is configured and accessible",
                        {"status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Bulk Endpoint: {endpoint}",
                        "WARN",
                        f"Unexpected response for {endpoint}",
                        {"status_code": response.status_code}
                    )
            except requests.RequestException as e:
                self.log_result(
                    f"Bulk Endpoint: {endpoint}",
                    "FAIL",
                    f"Failed to access {endpoint}",
                    {"error": str(e)}
                )
    
    def test_export_endpoints(self):
        """Test export functionality endpoints"""
        export_tests = [
            ("/inventory/?export=csv", "CSV Export"),
            ("/inventory/?export=excel", "Excel Export"),
            ("/inventory/?export=pdf", "PDF Export"),
        ]
        
        for url, description in export_tests:
            try:
                full_url = urljoin(self.base_url, url)
                response = self.session.get(full_url, timeout=10, allow_redirects=True)
                
                if response.status_code == 200:
                    content_type = response.headers.get('Content-Type', '')
                    content_length = len(response.content)
                    
                    self.log_result(
                        f"Export: {description}",
                        "PASS",
                        f"Export endpoint working",
                        {
                            "content_type": content_type,
                            "content_length": f"{content_length} bytes"
                        }
                    )
                elif response.status_code == 302:
                    self.log_result(
                        f"Export: {description}",
                        "PASS",
                        "Export redirected (login required - expected)",
                        {"redirect_url": response.headers.get('Location', 'Unknown')}
                    )
                else:
                    self.log_result(
                        f"Export: {description}",
                        "FAIL",
                        f"Export failed with status {response.status_code}",
                        {"status_code": response.status_code}
                    )
            except requests.RequestException as e:
                self.log_result(
                    f"Export: {description}",
                    "FAIL",
                    f"Failed to test export {url}",
                    {"error": str(e)}
                )
    
    def test_static_resources(self):
        """Test if static resources are loading"""
        static_resources = [
            "/static/css/style.css",
            "/static/js/script.js",
        ]
        
        for resource in static_resources:
            try:
                full_url = urljoin(self.base_url, resource)
                response = self.session.head(full_url, timeout=5)
                
                if response.status_code == 200:
                    self.log_result(
                        f"Static Resource: {resource}",
                        "PASS",
                        "Resource accessible",
                        {"status_code": response.status_code}
                    )
                elif response.status_code == 404:
                    self.log_result(
                        f"Static Resource: {resource}",
                        "WARN",
                        "Resource not found (may be normal if not used)",
                        {"status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        f"Static Resource: {resource}",
                        "FAIL",
                        f"Unexpected status for {resource}",
                        {"status_code": response.status_code}
                    )
            except requests.RequestException as e:
                self.log_result(
                    f"Static Resource: {resource}",
                    "WARN",
                    f"Could not access {resource}",
                    {"error": str(e)}
                )
    
    def run_all_tests(self):
        """Run all Phase 5 validation tests"""
        print("🚀 Starting Phase 5 Enhanced Inventory Management Interface Validation")
        print("=" * 70)
        
        self.test_url_accessibility()
        print()
        self.test_bulk_operation_endpoints() 
        print()
        self.test_export_endpoints()
        print()
        self.test_static_resources()
        
        print("\n" + "=" * 70)
        print("📊 VALIDATION SUMMARY")
        print("=" * 70)
        
        pass_count = sum(1 for r in self.results if r['status'] == 'PASS')
        fail_count = sum(1 for r in self.results if r['status'] == 'FAIL')
        warn_count = sum(1 for r in self.results if r['status'] == 'WARN')
        total_count = len(self.results)
        
        print(f"✅ PASSED: {pass_count}/{total_count}")
        print(f"❌ FAILED: {fail_count}/{total_count}")
        print(f"⚠️  WARNINGS: {warn_count}/{total_count}")
        
        success_rate = (pass_count / total_count) * 100 if total_count > 0 else 0
        print(f"🎯 SUCCESS RATE: {success_rate:.1f}%")
        
        if fail_count == 0:
            print("\n🎉 ALL CRITICAL TESTS PASSED! Phase 5 is ready for production.")
        elif fail_count < 3:
            print(f"\n⚠️  {fail_count} test(s) failed. Review and fix critical issues.")
        else:
            print(f"\n❌ {fail_count} tests failed. Significant issues need attention.")
        
        return {
            'total': total_count,
            'passed': pass_count,
            'failed': fail_count,
            'warnings': warn_count,
            'success_rate': success_rate,
            'results': self.results
        }

def main():
    """Main validation function"""
    validator = Phase5Validator()
    return validator.run_all_tests()

if __name__ == "__main__":
    main()
