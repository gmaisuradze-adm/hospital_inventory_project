#!/usr/bin/env python3
"""
AI Performance Monitoring Dashboard
Real-time monitoring and analytics for the Hospital Inventory AI Module
"""

import sys
import os
import json
import time
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import sqlite3
import threading
import subprocess
import requests
from pathlib import Path

class AIMonitoringDashboard:
    """
    Comprehensive monitoring dashboard for AI module performance
    """
    
    def __init__(self, db_path="ai_monitoring.db"):
        self.db_path = db_path
        self.monitoring_active = False
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database for monitoring data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Performance metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                endpoint VARCHAR(100),
                response_time_ms REAL,
                success BOOLEAN,
                error_message TEXT,
                request_size INTEGER,
                memory_usage_mb REAL,
                cpu_usage_percent REAL
            )
        ''')
        
        # AI model metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                model_type VARCHAR(50),
                accuracy_score REAL,
                processing_time_ms REAL,
                items_processed INTEGER,
                optimization_success_rate REAL,
                recommendation_count INTEGER
            )
        ''')
        
        # System health table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_health (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                service_name VARCHAR(50),
                status VARCHAR(20),
                uptime_seconds INTEGER,
                memory_usage_mb REAL,
                cpu_usage_percent REAL,
                disk_usage_percent REAL,
                response_time_ms REAL
            )
        ''')
        
        # Error logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS error_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                service VARCHAR(50),
                error_type VARCHAR(100),
                error_message TEXT,
                stack_trace TEXT,
                severity VARCHAR(20)
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def log_performance_metric(self, endpoint: str, response_time: float, 
                             success: bool, error_message: str = None,
                             request_size: int = 0, memory_usage: float = 0,
                             cpu_usage: float = 0):
        """Log performance metrics to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO performance_metrics 
            (endpoint, response_time_ms, success, error_message, request_size, memory_usage_mb, cpu_usage_percent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (endpoint, response_time, success, error_message, request_size, memory_usage, cpu_usage))
        
        conn.commit()
        conn.close()
        
    def log_model_metric(self, model_type: str, accuracy: float, 
                        processing_time: float, items_processed: int,
                        success_rate: float, recommendation_count: int):
        """Log AI model performance metrics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO model_metrics 
            (model_type, accuracy_score, processing_time_ms, items_processed, 
             optimization_success_rate, recommendation_count)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (model_type, accuracy, processing_time, items_processed, success_rate, recommendation_count))
        
        conn.commit()
        conn.close()
        
    def log_system_health(self, service_name: str, status: str, uptime: int,
                         memory_usage: float, cpu_usage: float, 
                         disk_usage: float, response_time: float):
        """Log system health metrics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO system_health 
            (service_name, status, uptime_seconds, memory_usage_mb, 
             cpu_usage_percent, disk_usage_percent, response_time_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (service_name, status, uptime, memory_usage, cpu_usage, disk_usage, response_time))
        
        conn.commit()
        conn.close()
        
    def log_error(self, service: str, error_type: str, error_message: str,
                 stack_trace: str = None, severity: str = "ERROR"):
        """Log error information"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO error_logs 
            (service, error_type, error_message, stack_trace, severity)
            VALUES (?, ?, ?, ?, ?)
        ''', (service, error_type, error_message, stack_trace, severity))
        
        conn.commit()
        conn.close()
        
    def check_backend_health(self) -> Dict:
        """Check backend service health"""
        try:
            start_time = time.time()
            response = requests.get('http://localhost:3001/api/health', timeout=5)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                return {
                    'status': 'healthy',
                    'response_time': response_time,
                    'uptime': response.json().get('uptime', 0),
                    'memory_usage': response.json().get('memory_usage', 0),
                    'cpu_usage': response.json().get('cpu_usage', 0)
                }
            else:
                return {
                    'status': 'unhealthy',
                    'response_time': response_time,
                    'error': f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'response_time': 0,
                'error': str(e)
            }
            
    def check_ai_module_health(self) -> Dict:
        """Check AI module health"""
        try:
            start_time = time.time()
            response = requests.post('http://localhost:3001/api/ai/health', 
                                   json={}, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'status': 'healthy',
                    'response_time': response_time,
                    'python_version': data.get('python_version', 'unknown'),
                    'ai_module_version': data.get('ai_module_version', 'unknown'),
                    'memory_usage': data.get('memory_usage', 0)
                }
            else:
                return {
                    'status': 'unhealthy',
                    'response_time': response_time,
                    'error': f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'response_time': 0,
                'error': str(e)
            }
            
    def test_ai_functionality(self) -> Dict:
        """Test AI functionality with sample data"""
        try:
            # Test optimization endpoint
            start_time = time.time()
            test_data = {
                "items": [
                    {
                        "id": "TEST_001",
                        "name": "Test Item",
                        "category": "TEST",
                        "currentStock": 100,
                        "unitCost": 50.0,
                        "leadTimeDays": 7,
                        "historicalDemand": [
                            {"date": "2024-01-01", "quantity": 10},
                            {"date": "2024-01-02", "quantity": 12},
                            {"date": "2024-01-03", "quantity": 8}
                        ]
                    }
                ],
                "optimizationSettings": {
                    "modelType": "auto",
                    "serviceLevel": 0.95,
                    "includeBatchOptimization": True
                }
            }
            
            response = requests.post('http://localhost:3001/api/ai/optimize',
                                   json=test_data, timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'status': 'success',
                    'response_time': response_time,
                    'items_processed': len(result.get('optimization_results', [])),
                    'recommendations_generated': sum(
                        len(item.get('recommendations', [])) 
                        for item in result.get('optimization_results', [])
                    )
                }
            else:
                return {
                    'status': 'error',
                    'response_time': response_time,
                    'error': f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'response_time': 0,
                'error': str(e)
            }
            
    def get_performance_summary(self, hours: int = 24) -> Dict:
        """Get performance summary for the last N hours"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get recent performance metrics
        cursor.execute('''
            SELECT 
                COUNT(*) as total_requests,
                AVG(response_time_ms) as avg_response_time,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
                MAX(response_time_ms) as max_response_time,
                MIN(response_time_ms) as min_response_time
            FROM performance_metrics 
            WHERE timestamp > datetime('now', '-{} hours')
        '''.format(hours))
        
        perf_data = cursor.fetchone()
        
        # Get error count
        cursor.execute('''
            SELECT COUNT(*) as error_count
            FROM error_logs 
            WHERE timestamp > datetime('now', '-{} hours')
        '''.format(hours))
        
        error_count = cursor.fetchone()[0]
        
        # Get model performance
        cursor.execute('''
            SELECT 
                AVG(accuracy_score) as avg_accuracy,
                AVG(optimization_success_rate) as avg_success_rate,
                SUM(items_processed) as total_items_processed,
                SUM(recommendation_count) as total_recommendations
            FROM model_metrics 
            WHERE timestamp > datetime('now', '-{} hours')
        '''.format(hours))
        
        model_data = cursor.fetchone()
        
        conn.close()
        
        return {
            'performance': {
                'total_requests': perf_data[0] or 0,
                'avg_response_time': perf_data[1] or 0,
                'success_rate': (perf_data[2] / perf_data[0] * 100) if perf_data[0] else 0,
                'max_response_time': perf_data[3] or 0,
                'min_response_time': perf_data[4] or 0
            },
            'errors': {
                'total_errors': error_count or 0,
                'error_rate': (error_count / perf_data[0] * 100) if perf_data[0] else 0
            },
            'ai_models': {
                'avg_accuracy': model_data[0] or 0,
                'avg_success_rate': model_data[1] or 0,
                'total_items_processed': model_data[2] or 0,
                'total_recommendations': model_data[3] or 0
            }
        }
        
    def start_monitoring(self, interval_seconds: int = 60):
        """Start continuous monitoring"""
        self.monitoring_active = True
        
        def monitoring_loop():
            while self.monitoring_active:
                try:
                    # Check backend health
                    backend_health = self.check_backend_health()
                    self.log_system_health(
                        'backend',
                        backend_health['status'],
                        backend_health.get('uptime', 0),
                        backend_health.get('memory_usage', 0),
                        backend_health.get('cpu_usage', 0),
                        0,  # disk usage - would need system monitoring
                        backend_health['response_time']
                    )
                    
                    # Check AI module health
                    ai_health = self.check_ai_module_health()
                    self.log_system_health(
                        'ai_module',
                        ai_health['status'],
                        0,  # uptime not available
                        ai_health.get('memory_usage', 0),
                        0,  # cpu usage not available
                        0,  # disk usage not available
                        ai_health['response_time']
                    )
                    
                    # Test AI functionality
                    ai_test = self.test_ai_functionality()
                    if ai_test['status'] == 'success':
                        self.log_model_metric(
                            'optimization',
                            0.95,  # Default accuracy
                            ai_test['response_time'],
                            ai_test['items_processed'],
                            1.0,  # Success rate
                            ai_test['recommendations_generated']
                        )
                    else:
                        self.log_error(
                            'ai_module',
                            'functionality_test_failed',
                            ai_test.get('error', 'Unknown error'),
                            None,
                            'WARNING'
                        )
                    
                    print(f"[{datetime.now()}] Monitoring check completed")
                    
                except Exception as e:
                    self.log_error(
                        'monitoring_dashboard',
                        'monitoring_error',
                        str(e),
                        None,
                        'ERROR'
                    )
                    print(f"[{datetime.now()}] Monitoring error: {e}")
                
                time.sleep(interval_seconds)
        
        monitoring_thread = threading.Thread(target=monitoring_loop)
        monitoring_thread.daemon = True
        monitoring_thread.start()
        
        print(f"🔄 AI Monitoring started (interval: {interval_seconds}s)")
        return monitoring_thread
        
    def stop_monitoring(self):
        """Stop continuous monitoring"""
        self.monitoring_active = False
        print("🛑 AI Monitoring stopped")
        
    def generate_report(self, hours: int = 24) -> str:
        """Generate comprehensive monitoring report"""
        summary = self.get_performance_summary(hours)
        
        report = f"""
🏥 AI MODULE MONITORING REPORT
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Time Period: Last {hours} hours

📊 PERFORMANCE METRICS
{'='*40}
• Total Requests: {summary['performance']['total_requests']}
• Average Response Time: {summary['performance']['avg_response_time']:.2f}ms
• Success Rate: {summary['performance']['success_rate']:.1f}%
• Min Response Time: {summary['performance']['min_response_time']:.2f}ms
• Max Response Time: {summary['performance']['max_response_time']:.2f}ms

🤖 AI MODEL PERFORMANCE
{'='*40}
• Average Accuracy: {summary['ai_models']['avg_accuracy']:.2f}%
• Average Success Rate: {summary['ai_models']['avg_success_rate']:.2f}%
• Items Processed: {summary['ai_models']['total_items_processed']}
• Recommendations Generated: {summary['ai_models']['total_recommendations']}

❌ ERROR STATISTICS
{'='*40}
• Total Errors: {summary['errors']['total_errors']}
• Error Rate: {summary['errors']['error_rate']:.2f}%

🎯 HEALTH STATUS
{'='*40}
"""
        
        # Current health check
        backend_health = self.check_backend_health()
        ai_health = self.check_ai_module_health()
        
        report += f"• Backend Service: {backend_health['status'].upper()}\n"
        report += f"• AI Module: {ai_health['status'].upper()}\n"
        
        if backend_health['status'] != 'healthy':
            report += f"  ⚠️ Backend Issue: {backend_health.get('error', 'Unknown')}\n"
            
        if ai_health['status'] != 'healthy':
            report += f"  ⚠️ AI Module Issue: {ai_health.get('error', 'Unknown')}\n"
            
        # Performance rating
        if summary['performance']['success_rate'] >= 95:
            performance_rating = "🟢 EXCELLENT"
        elif summary['performance']['success_rate'] >= 90:
            performance_rating = "🟡 GOOD"
        elif summary['performance']['success_rate'] >= 80:
            performance_rating = "🟠 ACCEPTABLE"
        else:
            performance_rating = "🔴 NEEDS ATTENTION"
            
        report += f"\n📈 OVERALL RATING: {performance_rating}\n"
        
        return report

def main():
    """Main monitoring dashboard interface"""
    print("🏥 HOSPITAL INVENTORY AI - MONITORING DASHBOARD")
    print("=" * 50)
    
    dashboard = AIMonitoringDashboard()
    
    while True:
        print("\n📋 MONITORING OPTIONS:")
        print("1. Generate Current Report")
        print("2. Start Continuous Monitoring")
        print("3. Stop Monitoring")
        print("4. Health Check")
        print("5. Performance Summary")
        print("6. Exit")
        
        choice = input("\nSelect option (1-6): ").strip()
        
        if choice == '1':
            hours = input("Report period in hours (default 24): ").strip()
            hours = int(hours) if hours.isdigit() else 24
            
            print("\n📊 GENERATING REPORT...")
            report = dashboard.generate_report(hours)
            print(report)
            
            # Save report to file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"ai_monitoring_report_{timestamp}.txt"
            with open(filename, 'w') as f:
                f.write(report)
            print(f"💾 Report saved to {filename}")
            
        elif choice == '2':
            interval = input("Monitoring interval in seconds (default 60): ").strip()
            interval = int(interval) if interval.isdigit() else 60
            
            dashboard.start_monitoring(interval)
            input("Press Enter to continue...")
            
        elif choice == '3':
            dashboard.stop_monitoring()
            
        elif choice == '4':
            print("\n🔍 RUNNING HEALTH CHECKS...")
            
            backend = dashboard.check_backend_health()
            ai_module = dashboard.check_ai_module_health()
            
            print(f"Backend: {backend['status'].upper()} ({backend['response_time']:.2f}ms)")
            if backend['status'] != 'healthy':
                print(f"  Error: {backend.get('error', 'Unknown')}")
                
            print(f"AI Module: {ai_module['status'].upper()} ({ai_module['response_time']:.2f}ms)")
            if ai_module['status'] != 'healthy':
                print(f"  Error: {ai_module.get('error', 'Unknown')}")
                
        elif choice == '5':
            hours = input("Summary period in hours (default 24): ").strip()
            hours = int(hours) if hours.isdigit() else 24
            
            summary = dashboard.get_performance_summary(hours)
            print(f"\n📈 PERFORMANCE SUMMARY (Last {hours} hours):")
            print(f"Requests: {summary['performance']['total_requests']}")
            print(f"Success Rate: {summary['performance']['success_rate']:.1f}%")
            print(f"Avg Response Time: {summary['performance']['avg_response_time']:.2f}ms")
            print(f"Errors: {summary['errors']['total_errors']}")
            
        elif choice == '6':
            dashboard.stop_monitoring()
            print("👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid option. Please try again.")

if __name__ == "__main__":
    main()
