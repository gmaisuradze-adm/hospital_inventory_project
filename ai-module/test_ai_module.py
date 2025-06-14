#!/usr/bin/env python3

import sys
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime

# Add the AI module to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

print("=== AI MODULE ANALYSIS ===")
print(f"Working directory: {current_dir}")
print(f"Python version: {sys.version}")

# Test 1: Import core libraries
try:
    import pandas as pd
    import numpy as np
    print("✅ Core libraries (pandas, numpy) imported successfully")
except Exception as e:
    print(f"❌ Core libraries failed: {e}")

# Test 2: Import inventory optimizer
try:
    from src.models.inventory_optimizer import InventoryOptimizer
    print("✅ InventoryOptimizer imported successfully")
    
    # Test basic functionality
    optimizer = InventoryOptimizer()
    print("✅ InventoryOptimizer initialized")
    
    # Test EOQ calculation
    eoq_result = optimizer.calculate_eoq(annual_demand=1000, unit_cost=100)
    print(f"✅ EOQ calculation: {eoq_result}")
    
    # Test ABC analysis
    test_items = [
        {'item_id': 'test1', 'annual_consumption_value': 10000},
        {'item_id': 'test2', 'annual_consumption_value': 5000},
        {'item_id': 'test3', 'annual_consumption_value': 1000}
    ]
    abc_result = optimizer.perform_abc_analysis(test_items)
    print(f"✅ ABC Analysis: {len(abc_result)} categories")
    
except Exception as e:
    print(f"❌ InventoryOptimizer failed: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Import demand forecaster
try:
    from src.models.demand_forecaster import DemandForecaster
    forecaster = DemandForecaster()
    print("✅ DemandForecaster imported and initialized")
except Exception as e:
    print(f"❌ DemandForecaster failed: {e}")

# Test 4: Test integration bridge
try:
    from integration_bridge import AIBridge
    bridge = AIBridge()
    
    # Test health check
    health_result = bridge.handle_health_check({})
    print(f"✅ Integration Bridge Health Check: {health_result.get('status', 'unknown')}")
    
    # Test basic optimization
    test_optimization_data = {
        'items_data': [{
            'item_id': 'test_item',
            'item_name': 'Test Hospital Equipment',
            'current_stock': 50,
            'unit_cost': 200,
            'lead_time_days': 7,
            'historical_demand': [10, 12, 8, 15, 9, 11, 13, 14, 10, 12]
        }],
        'service_level': 0.95,
        'holding_cost_rate': 0.25,
        'ordering_cost': 150
    }
    
    optimization_result = bridge.handle_optimize(test_optimization_data)
    if optimization_result.get('success'):
        print(f"✅ Optimization Test: {len(optimization_result.get('recommendations', []))} recommendations")
        for rec in optimization_result.get('recommendations', [])[:1]:  # Show first recommendation
            print(f"   - Item: {rec.get('item_name')}")
            print(f"   - EOQ: {rec.get('economic_order_quantity', 'N/A')}")
            print(f"   - Reorder Point: {rec.get('reorder_point', 'N/A')}")
            print(f"   - ABC Category: {rec.get('abc_category', 'N/A')}")
    else:
        print(f"❌ Optimization Test failed: {optimization_result.get('error', 'Unknown error')}")
    
except Exception as e:
    print(f"❌ Integration Bridge failed: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Test forecasting
try:
    test_forecast_data = {
        'item_id': 'test_item',
        'historical_data': [
            {'date': '2024-01-01', 'quantity': 10},
            {'date': '2024-01-02', 'quantity': 12},
            {'date': '2024-01-03', 'quantity': 8},
            {'date': '2024-01-04', 'quantity': 15},
            {'date': '2024-01-05', 'quantity': 9}
        ],
        'forecast_horizon': 7,
        'model_type': 'auto'
    }
    
    forecast_result = bridge.handle_forecast(test_forecast_data)
    if forecast_result.get('success'):
        predictions = forecast_result.get('predictions', [])
        print(f"✅ Forecast Test: Generated {len(predictions)} predictions")
        print(f"   - Model used: {forecast_result.get('model_used', 'unknown')}")
        print(f"   - Accuracy: {forecast_result.get('accuracy', 'unknown')}")
    else:
        print(f"❌ Forecast Test failed: {forecast_result.get('error', 'Unknown error')}")
        
except Exception as e:
    print(f"❌ Forecast Test failed: {e}")

print("\n=== PRACTICAL AI MODULE CAPABILITIES ===")
print("1. EOQ (Economic Order Quantity) Calculation")
print("2. Reorder Point and Safety Stock Optimization") 
print("3. ABC Analysis for Inventory Classification")
print("4. Demand Forecasting (with fallback methods)")
print("5. Multi-item Batch Optimization")
print("6. Intelligent Business Recommendations")
print("7. Service Level and Cost Optimization")

print("\n=== END OF ANALYSIS ===")
