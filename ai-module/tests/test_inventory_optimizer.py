#!/usr/bin/env python3

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Adjust the path to import from the src directory
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from models.inventory_optimizer import InventoryOptimizer

@pytest.fixture
def optimizer():
    """Provides an InventoryOptimizer instance for tests."""
    return InventoryOptimizer(
        service_level_target=0.95, 
        holding_cost_rate=0.25, 
        ordering_cost=100.0
    )

@pytest.fixture
def sample_demand_forecast_data():
    """Provides a sample daily demand forecast pandas Series."""
    dates = pd.date_range(start=datetime(2023, 1, 1), periods=365, freq='D')
    # Generate somewhat realistic demand data with seasonality and noise
    demand = (10 + 
              5 * np.sin(2 * np.pi * np.arange(365) / 365) +  # Seasonal component
              2 * np.sin(2 * np.pi * np.arange(365) / (365/4)) + # Quarterly spikes
              np.random.normal(0, 2, 365) # Noise
             )
    demand = np.maximum(1, demand) # Ensure demand is at least 1
    return pd.Series(demand, index=dates)

@pytest.fixture
def sample_demand_forecast_data_low_variability():
    """Provides a sample daily demand forecast pandas Series with low variability."""
    dates = pd.date_range(start=datetime(2023, 1, 1), periods=365, freq='D')
    demand = np.full(365, 10) + np.random.normal(0, 0.5, 365) # Constant demand with very little noise
    demand = np.maximum(1, demand)
    return pd.Series(demand, index=dates)

@pytest.fixture
def sample_demand_forecast_data_zero_demand():
    """Provides a sample daily demand forecast pandas Series with zero demand."""
    dates = pd.date_range(start=datetime(2023, 1, 1), periods=365, freq='D')
    demand = np.zeros(365)
    return pd.Series(demand, index=dates)


class TestInventoryOptimizer:
    def test_calculate_optimal_levels_basic_case(self, optimizer, sample_demand_forecast_data):
        item_id = "ITEM001"
        lead_time_days = 7
        service_level = 0.95
        holding_cost_per_unit_per_year = 5.0 # Example: $20 unit cost * 0.25 holding rate
        ordering_cost_per_order = 50.0
        current_stock_level = 100.0
        unit_cost = 20.0

        results = optimizer.calculate_optimal_levels(
            item_id=item_id,
            demand_forecast=sample_demand_forecast_data,
            lead_time_days=lead_time_days,
            service_level=service_level,
            holding_cost_per_unit_per_year=holding_cost_per_unit_per_year,
            ordering_cost_per_order=ordering_cost_per_order,
            current_stock_level=current_stock_level,
            unit_cost=unit_cost
        )

        assert results["item_id"] == item_id
        assert "economic_order_quantity" in results
        assert "reorder_point" in results
        assert "safety_stock" in results
        assert "target_inventory_level" in results
        assert "expected_shortage_per_cycle" in results

        assert results["economic_order_quantity"] > 0
        assert results["reorder_point"] >= 0 # Can be 0 if safety stock and lead time demand are 0
        assert results["safety_stock"] >= 0
        assert results["target_inventory_level"] >= results["safety_stock"]
        assert results["expected_shortage_per_cycle"] >= 0
        assert results["achieved_service_level"] == service_level

    def test_calculate_optimal_levels_low_variability(self, optimizer, sample_demand_forecast_data_low_variability):
        item_id = "ITEM002"
        lead_time_days = 5
        service_level = 0.99
        holding_cost_per_unit_per_year = 2.0
        ordering_cost_per_order = 20.0
        current_stock_level = 50.0
        unit_cost = 10.0

        results = optimizer.calculate_optimal_levels(
            item_id=item_id,
            demand_forecast=sample_demand_forecast_data_low_variability,
            lead_time_days=lead_time_days,
            service_level=service_level,
            holding_cost_per_unit_per_year=holding_cost_per_unit_per_year,
            ordering_cost_per_order=ordering_cost_per_order,
            current_stock_level=current_stock_level,
            unit_cost=unit_cost
        )
        # With low variability, safety stock should be relatively small
        assert results["safety_stock"] < results["economic_order_quantity"] / 2 # Heuristic check
        assert results["reorder_point"] > 0

    def test_calculate_optimal_levels_zero_demand(self, optimizer, sample_demand_forecast_data_zero_demand):
        item_id = "ITEM003"
        lead_time_days = 10
        service_level = 0.90
        holding_cost_per_unit_per_year = 1.0
        ordering_cost_per_order = 10.0
        current_stock_level = 0.0
        unit_cost = 5.0

        results = optimizer.calculate_optimal_levels(
            item_id=item_id,
            demand_forecast=sample_demand_forecast_data_zero_demand,
            lead_time_days=lead_time_days,
            service_level=service_level,
            holding_cost_per_unit_per_year=holding_cost_per_unit_per_year,
            ordering_cost_per_order=ordering_cost_per_order,
            current_stock_level=current_stock_level,
            unit_cost=unit_cost
        )

        assert results["economic_order_quantity"] == 0
        assert results["reorder_point"] == 0
        assert results["safety_stock"] == 0
        assert results["target_inventory_level"] == 0
        assert results["expected_shortage_per_cycle"] == 0
        assert results["calculated_annual_demand"] == 0

    def test_calculate_optimal_levels_high_service_level(self, optimizer, sample_demand_forecast_data):
        item_id = "ITEM004"
        lead_time_days = 7
        service_level = 0.999 # Very high service level
        holding_cost_per_unit_per_year = 5.0
        ordering_cost_per_order = 50.0
        current_stock_level = 100.0
        unit_cost = 20.0

        results_high_sl = optimizer.calculate_optimal_levels(
            item_id=item_id,
            demand_forecast=sample_demand_forecast_data,
            lead_time_days=lead_time_days,
            service_level=service_level,
            holding_cost_per_unit_per_year=holding_cost_per_unit_per_year,
            ordering_cost_per_order=ordering_cost_per_order,
            current_stock_level=current_stock_level,
            unit_cost=unit_cost
        )

        service_level_lower = 0.90
        results_lower_sl = optimizer.calculate_optimal_levels(
            item_id=item_id,
            demand_forecast=sample_demand_forecast_data,
            lead_time_days=lead_time_days,
            service_level=service_level_lower,
            holding_cost_per_unit_per_year=holding_cost_per_unit_per_year,
            ordering_cost_per_order=ordering_cost_per_order,
            current_stock_level=current_stock_level,
            unit_cost=unit_cost
        )
        # Higher service level should result in higher safety stock and reorder point
        assert results_high_sl["safety_stock"] > results_lower_sl["safety_stock"]
        assert results_high_sl["reorder_point"] > results_lower_sl["reorder_point"]

    def test_calculate_optimal_levels_invalid_inputs(self, optimizer, sample_demand_forecast_data):
        item_id = "ITEM005"
        # Test with negative lead time (should be handled by the method, e.g. max(0, lead_time_days))
        results_neg_lt = optimizer.calculate_optimal_levels(
            item_id=item_id,
            demand_forecast=sample_demand_forecast_data,
            lead_time_days=-5, 
            service_level=0.95,
            holding_cost_per_unit_per_year=5.0,
            ordering_cost_per_order=50.0,
            current_stock_level=100.0,
            unit_cost=20.0
        )
        # Expect non-negative safety stock and ROP even if lead time was negative
        assert results_neg_lt["safety_stock"] >= 0
        assert results_neg_lt["reorder_point"] >= 0

        # Test with service level out of bounds (e.g. > 1 or < 0)
        # The method should clamp service level or handle it gracefully
        results_sl_too_high = optimizer.calculate_optimal_levels(
            item_id=item_id,
            demand_forecast=sample_demand_forecast_data,
            lead_time_days=7, 
            service_level=1.5, # Invalid
            holding_cost_per_unit_per_year=5.0,
            ordering_cost_per_order=50.0,
            current_stock_level=100.0,
            unit_cost=20.0
        )
        assert 0 < results_sl_too_high["achieved_service_level"] < 1

        results_sl_too_low = optimizer.calculate_optimal_levels(
            item_id=item_id,
            demand_forecast=sample_demand_forecast_data,
            lead_time_days=7, 
            service_level=-0.5, # Invalid
            holding_cost_per_unit_per_year=5.0,
            ordering_cost_per_order=50.0,
            current_stock_level=100.0,
            unit_cost=20.0
        )
        assert 0 < results_sl_too_low["achieved_service_level"] < 1

    def test_eoq_calculation_direct(self, optimizer):
        # Test EOQ calculation more directly if needed, or rely on calculate_optimal_levels
        annual_demand = 1000
        unit_cost = 10
        ordering_cost = 50
        holding_cost_rate = 0.20 # Holding cost per unit per year = 10 * 0.20 = 2
        # EOQ = sqrt((2 * 1000 * 50) / 2) = sqrt(100000 / 2) = sqrt(50000) approx 223.6
        eoq = optimizer.calculate_eoq(annual_demand, unit_cost, ordering_cost, holding_cost_rate)
        assert abs(eoq - np.sqrt((2 * 1000 * 50) / (10 * 0.20))) < 0.01

        eoq_override = optimizer.calculate_eoq(
            annual_demand=annual_demand, 
            unit_cost=unit_cost, # Not used if override provided
            ordering_cost=ordering_cost, 
            holding_cost_per_unit_annual_override=2.0 # Directly provide 2.0
        )
        assert abs(eoq_override - np.sqrt((2 * 1000 * 50) / 2.0)) < 0.01

    def test_rop_ss_calculation_direct(self, optimizer):
        # Test ROP and SS calculation more directly
        mean_daily_demand = 10
        std_daily_demand = 2
        lead_time_days = 7
        service_level = 0.95 # Z-score approx 1.645
        
        # std_dev_demand_during_lead_time = 2 * sqrt(7) approx 2 * 2.645 = 5.29
        # safety_stock = 1.645 * 5.29 approx 8.7
        # mean_demand_during_lead_time = 10 * 7 = 70
        # reorder_point = 70 + 8.7 approx 78.7
        rop, ss = optimizer._calculate_rop_and_ss_for_constant_lt(
            mean_daily_demand, std_daily_demand, lead_time_days, service_level
        )
        
        z_score = 1.64485 # More precise Z for 0.95
        expected_ss = z_score * std_daily_demand * np.sqrt(lead_time_days)
        expected_rop = mean_daily_demand * lead_time_days + expected_ss

        assert abs(ss - expected_ss) < 0.1
        assert abs(rop - expected_rop) < 0.1

# To run these tests, navigate to the ai-module directory and run:
# python -m pytest
# or just `pytest` if your environment is set up for it.
