#!/usr/bin/env python3
"""
Performance Testing Suite for Hospital Inventory AI Module
Tests the AI module with larger, realistic hospital datasets
"""

import sys
import os
import json
import time
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add AI module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-module'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-module', 'src'))

try:
    from src.models.inventory_optimizer import InventoryOptimizer
    from src.models.demand_forecaster import DemandForecaster  
    from src.utils.config import AIConfig
    ai_module_available = True
except ImportError as e:
    print(f"⚠️ Warning: AI module not fully available: {e}")
    ai_module_available = False

def generate_hospital_test_data(num_items=1000, days_history=365):
    """Generate realistic hospital inventory test data"""
    
    categories = [
        'MEDICAL_EQUIPMENT', 'SURGICAL_INSTRUMENTS', 'PHARMACEUTICALS',
        'CONSUMABLES', 'IT_EQUIPMENT', 'FURNITURE', 'LABORATORY_SUPPLIES',
        'EMERGENCY_SUPPLIES', 'MAINTENANCE_TOOLS', 'OFFICE_SUPPLIES'
    ]
    
    departments = [
        'Emergency', 'Surgery', 'ICU', 'Cardiology', 'Neurology',
        'Pediatrics', 'Oncology', 'Laboratory', 'Radiology', 'IT'
    ]
    
    items = []
    
    for i in range(num_items):
        category = random.choice(categories)
        department = random.choice(departments)
        
        # Generate realistic item characteristics based on category
        if category == 'MEDICAL_EQUIPMENT':
            base_cost = random.uniform(5000, 50000)
            base_demand = random.uniform(1, 5)  # Low volume, high value
        elif category == 'PHARMACEUTICALS':
            base_cost = random.uniform(50, 500)
            base_demand = random.uniform(10, 100)  # High volume
        elif category == 'CONSUMABLES':
            base_cost = random.uniform(5, 100)
            base_demand = random.uniform(20, 200)  # Very high volume
        elif category == 'IT_EQUIPMENT':
            base_cost = random.uniform(500, 5000)
            base_demand = random.uniform(2, 20)
        else:
            base_cost = random.uniform(100, 1000)
            base_demand = random.uniform(5, 50)
        
        # Generate historical demand with trends and seasonality
        historical_demand = []
        current_date = datetime.now() - timedelta(days=days_history)
        
        for day in range(days_history):
            # Add trend (slight growth over time)
            trend_factor = 1 + (day / days_history) * 0.1
            
            # Add seasonality (monthly cycles)
            seasonal_factor = 1 + 0.2 * np.sin(2 * np.pi * day / 30)
            
            # Add day-of-week effect (lower on weekends for some categories)
            dow_factor = 1.0
            if current_date.weekday() >= 5 and category in ['IT_EQUIPMENT', 'OFFICE_SUPPLIES']:
                dow_factor = 0.3
            
            # Add random noise
            noise_factor = random.uniform(0.7, 1.3)
            
            daily_demand = base_demand * trend_factor * seasonal_factor * dow_factor * noise_factor
            daily_demand = max(0, int(daily_demand))
            
            historical_demand.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'quantity': daily_demand
            })
            
            current_date += timedelta(days=1)
        
        # Calculate annual consumption value for ABC analysis
        annual_consumption = sum(item['quantity'] for item in historical_demand[-365:])
        annual_value = annual_consumption * base_cost
        
        item = {
            'item_id': f'HOSP_{category[:3]}_{i+1:04d}',
            'item_name': f'{category.replace("_", " ").title()} {i+1}',
            'category': category,
            'department': department,
            'unit_cost': round(base_cost, 2),
            'current_stock': random.randint(int(base_demand * 10), int(base_demand * 30)),
            'lead_time_days': random.randint(3, 21),
            'annual_consumption_value': round(annual_value, 2),
            'historical_demand': historical_demand
        }
        
        items.append(item)
    
    return items

def run_performance_test():
    """Run comprehensive performance testing"""
    
    print("🧪 Generating large hospital dataset...")
    start_time = time.time()
    
    # Generate test datasets of varying sizes
    test_sizes = [100, 500, 1000, 2000]
    results = {}
    
    for size in test_sizes:
        print(f"\n📊 Testing with {size} items...")
        
        # Generate data
        data_gen_start = time.time()
        test_data = generate_hospital_test_data(num_items=size, days_history=365)
        data_gen_time = time.time() - data_gen_start
        
        # Test ABC Analysis
        abc_start = time.time()
        try:
            from ai_module.src.models.inventory_optimizer import InventoryOptimizer
            optimizer = InventoryOptimizer()
            abc_results = optimizer.perform_abc_analysis(test_data)
            abc_time = time.time() - abc_start
            abc_success = True
        except Exception as e:
            abc_time = 0
            abc_success = False
            print(f"   ❌ ABC Analysis failed: {e}")
        
        # Test Individual Optimization (sample of items)
        opt_start = time.time()
        optimization_times = []
        sample_size = min(50, size)  # Test up to 50 items for individual optimization
        
        for i in range(sample_size):
            item = test_data[i]
            item_start = time.time()
            
            try:
                # Convert historical data to pandas Series
                demand_data = [entry['quantity'] for entry in item['historical_demand']]
                demand_series = pd.Series(demand_data)
                
                # Calculate optimal levels
                result = optimizer.calculate_optimal_levels(
                    item_id=item['item_id'],
                    demand_forecast=demand_series,
                    lead_time_days=item['lead_time_days'],
                    service_level=0.95,
                    holding_cost_per_unit_per_year=item['unit_cost'] * 0.25,
                    ordering_cost_per_order=150,
                    current_stock_level=item['current_stock'],
                    unit_cost=item['unit_cost']
                )
                
                item_time = time.time() - item_start
                optimization_times.append(item_time)
                
            except Exception as e:
                print(f"   ⚠️ Item optimization failed for {item['item_id']}: {e}")
                continue
        
        avg_opt_time = np.mean(optimization_times) if optimization_times else 0
        total_opt_time = time.time() - opt_start
        
        # Store results
        results[size] = {
            'data_generation_time': round(data_gen_time, 3),
            'abc_analysis_time': round(abc_time, 3),
            'abc_analysis_success': abc_success,
            'individual_optimization_time': round(avg_opt_time, 4),
            'total_optimization_time': round(total_opt_time, 3),
            'items_optimized': len(optimization_times),
            'optimization_success_rate': len(optimization_times) / sample_size if sample_size > 0 else 0
        }
        
        print(f"   ✅ Data generation: {data_gen_time:.2f}s")
        print(f"   ✅ ABC analysis: {abc_time:.3f}s ({'Success' if abc_success else 'Failed'})")
        print(f"   ✅ Avg optimization per item: {avg_opt_time:.4f}s")
        print(f"   ✅ Success rate: {len(optimization_times)}/{sample_size} ({(len(optimization_times)/sample_size*100):.1f}%)")
    
    total_time = time.time() - start_time
    
    print(f"\n🎯 PERFORMANCE TEST SUMMARY")
    print(f"=" * 40)
    print(f"Total test time: {total_time:.2f}s")
    print(f"Largest dataset: {max(test_sizes)} items")
    
    # Performance benchmarks
    if results:
        largest_test = results[max(test_sizes)]
        print(f"\n📈 SCALABILITY METRICS:")
        print(f"• {max(test_sizes)} items ABC analysis: {largest_test['abc_analysis_time']:.3f}s")
        print(f"• Single item optimization: {largest_test['individual_optimization_time']:.4f}s")
        print(f"• Projected time for 10,000 items: {largest_test['individual_optimization_time'] * 10000:.1f}s")
        
        # Performance ratings
        if largest_test['individual_optimization_time'] < 0.01:
            performance_rating = "🟢 EXCELLENT"
        elif largest_test['individual_optimization_time'] < 0.05:
            performance_rating = "🟡 GOOD"
        elif largest_test['individual_optimization_time'] < 0.1:
            performance_rating = "🟠 ACCEPTABLE"
        else:
            performance_rating = "🔴 NEEDS OPTIMIZATION"
            
        print(f"• Performance rating: {performance_rating}")
    
    return results

if __name__ == "__main__":
    print("🏥 HOSPITAL INVENTORY AI - PERFORMANCE TESTING")
    print("=" * 50)
    
    try:
        results = run_performance_test()
        
        # Save results
        with open('performance_test_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'results': results
            }, f, indent=2)
        
        print(f"\n💾 Results saved to performance_test_results.json")
        
    except Exception as e:
        print(f"❌ Performance testing failed: {e}")
        import traceback
        traceback.print_exc()
