#!/usr/bin/env python3
"""
Quick test and demo of the AI Monitoring Dashboard
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from ai_monitoring_dashboard import AIMonitoringDashboard
import time

def main():
    print("🏥 AI MONITORING DASHBOARD - DEMO")
    print("=" * 40)
    
    # Create dashboard instance
    dashboard = AIMonitoringDashboard()
    print("✅ Dashboard initialized")
    
    # Test health checks
    print("\n🔍 Testing health checks...")
    
    backend_health = dashboard.check_backend_health()
    print(f"Backend Status: {backend_health['status']}")
    
    ai_health = dashboard.check_ai_module_health()  
    print(f"AI Module Status: {ai_health['status']}")
    
    # Log some sample metrics
    print("\n📊 Logging sample metrics...")
    dashboard.log_performance_metric("/api/ai/optimize", 150.5, True, request_size=1024)
    dashboard.log_model_metric("optimization", 0.95, 145.2, 10, 1.0, 25)
    dashboard.log_system_health("backend", "healthy", 3600, 512.0, 15.5, 45.2, 150.0)
    
    # Generate report
    print("\n📋 Generating monitoring report...")
    report = dashboard.generate_report(1)  # Last 1 hour
    print(report)
    
    print("\n✅ Demo completed successfully!")

if __name__ == "__main__":
    main()
