"""
Inventory Optimization Module for Hospital IT Equipment

This module provides advanced inventory optimization algorithms including:
- Economic Order Quantity (EOQ) calculations
- Reorder point optimization
- Safety stock calculations
- ABC analysis for item prioritization
- Multi-objective optimization for cost vs service level
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from scipy.optimize import minimize
from scipy.stats import norm # Added for norm.ppf and norm.pdf
import logging
import warnings
import traceback # Added for detailed error logging

warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

@dataclass
class OptimizationResult:
    """Container for optimization results"""
    optimal_order_quantity: float
    reorder_point: float
    safety_stock: float
    total_cost: float
    service_level: float
    abc_category: str
    recommendations: List[str]

class InventoryOptimizer:
    """
    Advanced inventory optimization system for hospital IT equipment
    
    Provides multiple optimization strategies:
    - Classical EOQ model
    - Stochastic inventory models
    - Service level optimization
    - Multi-criteria decision making
    """
    
    def __init__(self, 
                 service_level_target: float = 0.95,
                 holding_cost_rate: float = 0.25,
                 ordering_cost: float = 100.0):
        """
        Initialize the inventory optimizer
        
        Args:
            service_level_target: Target service level (0-1)
            holding_cost_rate: Annual holding cost as fraction of item value
            ordering_cost: Fixed cost per order
        """
        self.service_level_target = service_level_target
        self.holding_cost_rate = holding_cost_rate
        self.ordering_cost = ordering_cost
        
        logger.info(f"Initialized InventoryOptimizer with service level: {service_level_target}")
    
    def calculate_eoq(self, 
                      annual_demand: float, 
                      unit_cost: float, # Kept for compatibility if holding_cost_per_unit_annual_override is not used
                      ordering_cost: Optional[float] = None,
                      holding_cost_rate: Optional[float] = None,
                      holding_cost_per_unit_annual_override: Optional[float] = None) -> float:
        """
        Calculate Economic Order Quantity (EOQ)
        
        Args:
            annual_demand: Annual demand in units
            unit_cost: Cost per unit (used if holding_cost_per_unit_annual_override is None)
            ordering_cost: Fixed ordering cost (uses default if None)
            holding_cost_rate: Holding cost rate (uses default if None and override is None)
            holding_cost_per_unit_annual_override: If provided, this value is used directly for annual holding cost per unit.
            
        Returns:
            Optimal order quantity
        """
        _ordering_cost = ordering_cost if ordering_cost is not None else self.ordering_cost
        
        if holding_cost_per_unit_annual_override is not None:
            _holding_cost_per_unit_annual = holding_cost_per_unit_annual_override
        else:
            _holding_cost_rate = holding_cost_rate if holding_cost_rate is not None else self.holding_cost_rate
            if unit_cost <= 0 and annual_demand > 0:
                 logger.warning(f"Unit cost is {unit_cost} but annual demand is {annual_demand}. Cannot calculate holding cost accurately. Returning 1 for EOQ.")
                 return 1.0
            _holding_cost_per_unit_annual = unit_cost * _holding_cost_rate
            
        if _holding_cost_per_unit_annual <= 0:
            logger.warning(f"Invalid annual holding cost per unit: {_holding_cost_per_unit_annual}. Fallback for EOQ.")
            return annual_demand / 12 if annual_demand > 0 else 1.0 # Monthly demand or 1
            
        if annual_demand <= 0:
            logger.info(f"Annual demand is {annual_demand}. EOQ is 0.")
            return 0.0
            
        eoq = np.sqrt((2 * annual_demand * _ordering_cost) / _holding_cost_per_unit_annual)
        return max(1.0, eoq) if annual_demand > 0 else 0.0 # Ensure minimum order quantity of 1 if there is demand
    
    def _calculate_rop_and_ss_for_constant_lt(self,
                                mean_daily_demand: float,
                                std_daily_demand: float,
                                lead_time_days: int,
                                service_level: float) -> Tuple[float, float]:
        """
        Calculate Reorder Point (ROP) and Safety Stock (SS) for constant lead time.
        Assumes demand is normally distributed.
        """
        if not (0 < service_level < 1):
            logger.warning(f"Service level {service_level} out of bounds (0,1). Clamping to 0.95 or 0.05")
            service_level = min(max(0.001, service_level), 0.999) # Clamp to avoid issues with norm.ppf
        
        z_score = norm.ppf(service_level)
        
        std_daily_demand = max(0, std_daily_demand) # Ensure non-negative std dev
        lead_time_days = max(0, lead_time_days) # Ensure non-negative lead time

        std_dev_demand_during_lead_time = std_daily_demand * np.sqrt(lead_time_days)
        safety_stock = z_score * std_dev_demand_during_lead_time
        safety_stock = max(0, safety_stock) # Safety stock cannot be negative

        mean_demand_during_lead_time = mean_daily_demand * lead_time_days
        reorder_point = mean_demand_during_lead_time + safety_stock
        reorder_point = max(0, reorder_point) 
        
        return reorder_point, safety_stock

    # Existing calculate_reorder_point method - can be kept for other uses or refactored later
    # For calculate_optimal_levels, we will use the new _calculate_rop_and_ss_for_constant_lt
    def calculate_reorder_point(self,
                              lead_time_demand: float, # This is mean demand during lead time
                              demand_std: float, # This is interpreted as std dev of demand during lead time by the formula if lead_time_std is 0
                              lead_time_std: float = 0,
                              service_level: Optional[float] = None) -> Tuple[float, float]:
        """
        Calculate reorder point with safety stock (Original Method)
        """
        _service_level = service_level if service_level is not None else self.service_level_target
        if not (0 < _service_level < 1):
            _service_level = 0.95
            
        z_score = norm.ppf(_service_level)
        
        # Original safety stock calculation logic
        if lead_time_std > 0 and demand_std > 0: # More complex formula when lead time is variable
            # This formula had issues (e.g. len(demand_std)) - needs careful review if used.
            # For now, this path is less likely to be hit by calculate_optimal_levels if it uses the new helper.
            # Placeholder for a more robust formula for variable lead time and demand:
            # safety_stock = z_score * np.sqrt(lead_time_demand * demand_std**2 + (mean_daily_rate**2) * lead_time_std**2)
            # The original formula was: z_score * np.sqrt((lead_time_demand / len(demand_std)) * demand_std**2 + (demand_std**2) * lead_time_std**2)
            # This is problematic. Let's assume for now this branch is not the primary path for the new method.
            # Fallback to simpler calculation if original formula is problematic or inputs don't fit
             safety_stock = z_score * demand_std # Assuming demand_std is std dev during lead time
        elif demand_std > 0 : # Simple case with fixed lead time, assuming demand_std is std dev during lead time
             safety_stock = z_score * demand_std
        else:
            safety_stock = 0 # No variability, no safety stock
            
        safety_stock = max(0, safety_stock)
        reorder_point = lead_time_demand + safety_stock
        
        return max(0, reorder_point), max(0, safety_stock)
    
    def calculate_optimal_levels(self,
                                 item_id: str,
                                 demand_forecast: pd.Series, # Daily demand forecast
                                 lead_time_days: int,
                                 service_level: float,
                                 holding_cost_per_unit_per_year: float,
                                 ordering_cost_per_order: float,
                                 current_stock_level: float, # For context, not directly used in all calcs here yet
                                 unit_cost: float 
                                ) -> Dict[str, Any]:
        """
        Calculates optimal inventory levels (EOQ, ROP, Safety Stock, etc.) for a single item.
        This method is designed to be called by the integration bridge.
        """
        try:
            if demand_forecast is None or demand_forecast.empty:
                logger.warning(f"Item {item_id}: Demand forecast is empty. Cannot optimize.")
                return {
                    "item_id": item_id, "status": "error", "message": "Demand forecast empty",
                    "economic_order_quantity": 0, "reorder_point": 0, "safety_stock": 0,
                    "target_inventory_level": 0, "expected_shortage_per_cycle": 0
                }

            mean_daily_demand = demand_forecast.mean()
            std_daily_demand = demand_forecast.std()

            # Handle potential NaN or negative values from forecast stats
            if pd.isna(mean_daily_demand) or mean_daily_demand < 0: mean_daily_demand = 0
            if pd.isna(std_daily_demand) or std_daily_demand < 0: std_daily_demand = 0
            
            # 1. Calculate EOQ
            annual_demand_forecast = mean_daily_demand * 365
            
            economic_order_quantity = self.calculate_eoq(
                annual_demand=annual_demand_forecast,
                unit_cost=unit_cost, # Passed for calculate_eoq compatibility
                ordering_cost=ordering_cost_per_order,
                holding_cost_per_unit_annual_override=holding_cost_per_unit_per_year
            )
            economic_order_quantity = round(economic_order_quantity)

            # 2. Calculate Reorder Point and Safety Stock using the new helper
            # Use the same clamped service level for consistency
            clamped_service_level_for_rop = min(max(0.001, service_level), 0.999)
            reorder_point, safety_stock = self._calculate_rop_and_ss_for_constant_lt(
                mean_daily_demand=mean_daily_demand,
                std_daily_demand=std_daily_demand,
                lead_time_days=lead_time_days,
                service_level=clamped_service_level_for_rop
            )
            reorder_point = round(reorder_point)
            safety_stock = round(safety_stock)

            # 3. Target Inventory Level (e.g., as a reference max stock or (s,S) S-level)
            # Common approximation: Safety Stock + EOQ. 
            target_inventory_level = safety_stock + economic_order_quantity
            target_inventory_level = round(target_inventory_level)

            # 4. Expected Shortage per Cycle (ESPRC) in units
            # ESPRC = G_u(z) * sigma_LTD, where G_u(z) is the unit normal loss integral.
            # sigma_LTD is std dev of demand during lead time.
            # Use the same clamped service level for consistency
            _z_score = norm.ppf(clamped_service_level_for_rop)
            std_dev_demand_during_lead_time = std_daily_demand * np.sqrt(max(0,lead_time_days))
            
            expected_shortage_units = 0.0
            if std_dev_demand_during_lead_time > 1e-6: # Avoid issues if std_dev is zero or very small
                phi_z = norm.pdf(_z_score)
                cap_phi_z = norm.cdf(_z_score) 
                G_u_z = phi_z - _z_score * (1 - cap_phi_z) if (1 - cap_phi_z) > 1e-9 else phi_z # Avoid z * inf if 1-Phi(z) is 0
                expected_shortage_units = G_u_z * std_dev_demand_during_lead_time
            
            expected_shortage_units = max(0, round(expected_shortage_units, 2))

            return {
                "item_id": item_id,
                "economic_order_quantity": float(economic_order_quantity),
                "reorder_point": float(reorder_point),
                "safety_stock": float(safety_stock),
                "target_inventory_level": float(target_inventory_level), 
                "expected_shortage_per_cycle": float(expected_shortage_units),
                "achieved_service_level": float(clamped_service_level_for_rop),
                "calculated_annual_demand": round(float(annual_demand_forecast),2),
                "calculated_mean_daily_demand": round(float(mean_daily_demand),2),
                "calculated_std_daily_demand": round(float(std_daily_demand),2)
            }

        except Exception as e:
            logger.error(f"Error in calculate_optimal_levels for item {item_id}: {e}\n{traceback.format_exc()}")
            return {
                "item_id": item_id, "status": "error", "message": str(e),
                "economic_order_quantity": 0.0, "reorder_point": 0.0, "safety_stock": 0.0,
                "target_inventory_level": 0.0, "expected_shortage_per_cycle": 0.0
            }

    def abc_analysis(self, items_df: pd.DataFrame, 
                     value_column: str = 'annual_value') -> pd.DataFrame:
        """
        Perform ABC analysis to categorize items by importance
        
        Args:
            items_df: DataFrame with items and their annual values
            value_column: Column name containing annual values
            
        Returns:
            DataFrame with ABC categories added
        """
        df = items_df.copy()
        df = df.sort_values(value_column, ascending=False)
        
        # Calculate cumulative percentage
        df['cumulative_value'] = df[value_column].cumsum()
        total_value = df[value_column].sum()
        df['cumulative_percentage'] = (df['cumulative_value'] / total_value) * 100
        
        # Assign ABC categories
        conditions = [
            df['cumulative_percentage'] <= 80,
            df['cumulative_percentage'] <= 95,
            df['cumulative_percentage'] <= 100
        ]
        categories = ['A', 'B', 'C']
        df['abc_category'] = np.select(conditions, categories)
        
        logger.info(f"ABC Analysis completed: {len(df)} items categorized")
        return df
    
    def perform_abc_analysis(self, 
                           items_data: List[Dict[str, Any]], 
                           value_field: str = 'annual_consumption_value',
                           custom_thresholds: Optional[Dict[str, float]] = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Perform ABC analysis on inventory items based on value.
        
        Args:
            items_data: List of dictionaries containing item information
            value_field: Field name to use for value calculation
            custom_thresholds: Optional dict with custom thresholds {'A': 0.8, 'B': 0.95}
                               Default is A: top 80%, B: next 15%, C: last 5%
                               
        Returns:
            Dictionary with items grouped by category
        """
        if not items_data:
            return {'A': [], 'B': [], 'C': [], 'D': []}
            
        # Use default thresholds if not provided
        thresholds = custom_thresholds or {'A': 0.8, 'B': 0.95, 'C': 1.0}
        
        # Sort items by value in descending order
        try:
            sorted_items = sorted(items_data, key=lambda x: x.get(value_field, 0), reverse=True)
            
            # Calculate cumulative value
            total_value = sum(item.get(value_field, 0) for item in sorted_items)
            if total_value <= 0:
                logger.warning("Total value for ABC analysis is zero or negative.")
                return {'A': [], 'B': [], 'C': [], 'D': []}
                
            # Group items by category
            result = {'A': [], 'B': [], 'C': [], 'D': []}
            cumulative_percentage = 0
            
            for item in sorted_items:
                item_value = item.get(value_field, 0)
                item_percentage = item_value / total_value
                cumulative_percentage += item_percentage
                
                # Determine category based on cumulative percentage
                if cumulative_percentage <= thresholds.get('A'):
                    category = 'A'
                elif cumulative_percentage <= thresholds.get('B'):
                    category = 'B'
                elif cumulative_percentage <= thresholds.get('C'):
                    category = 'C'
                else:
                    category = 'D'  # Very low value or obsolete items
                    
                # Add category to item and append to result
                item_with_category = {**item, 'abc_category': category}
                result[category].append(item_with_category)
                
            return result
        
        except Exception as e:
            logger.error(f"Error in ABC analysis: {str(e)}")
            logger.debug(traceback.format_exc())
            return {'A': [], 'B': [], 'C': [], 'D': []}
    
    def optimize_inventory_levels(self,
                                item_data: Dict[str, Any],
                                demand_forecast: pd.Series,
                                lead_time_days: int = 7) -> OptimizationResult:
        """
        Comprehensive inventory optimization for a single item
        
        Args:
            item_data: Dictionary containing item information
            demand_forecast: Forecasted demand series
            lead_time_days: Lead time in days
            
        Returns:
            OptimizationResult with optimization recommendations
        """
        try:
            # Extract key parameters
            unit_cost = item_data.get('unit_cost', 100)
            current_stock = item_data.get('current_stock', 0)
            
            # Calculate demand statistics
            annual_demand = demand_forecast.sum()
            daily_demand = annual_demand / 365
            demand_std = demand_forecast.std()
            
            if annual_demand <= 0:
                logger.warning(f"Invalid annual demand: {annual_demand}")
                return self._default_optimization_result()
            
            # Calculate EOQ
            eoq = self.calculate_eoq(annual_demand, unit_cost)
            
            # Calculate reorder point
            lead_time_demand = daily_demand * lead_time_days
            reorder_point, safety_stock = self.calculate_reorder_point(
                lead_time_demand, demand_std
            )
            
            # Calculate total costs
            holding_cost = (eoq / 2) * unit_cost * self.holding_cost_rate
            ordering_cost_annual = (annual_demand / eoq) * self.ordering_cost
            total_cost = holding_cost + ordering_cost_annual
            
            # Determine ABC category (simplified)
            annual_value = annual_demand * unit_cost
            if annual_value > 10000:
                abc_category = 'A'
            elif annual_value > 1000:
                abc_category = 'B'
            else:
                abc_category = 'C'
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                current_stock, eoq, reorder_point, safety_stock, abc_category
            )
            
            return OptimizationResult(
                optimal_order_quantity=eoq,
                reorder_point=reorder_point,
                safety_stock=safety_stock,
                total_cost=total_cost,
                service_level=self.service_level_target,
                abc_category=abc_category,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error in inventory optimization: {str(e)}")
            return self._default_optimization_result()
    
    def batch_optimize(self, 
                       items_data: pd.DataFrame,
                       demand_forecasts: Dict[str, pd.Series]) -> pd.DataFrame:
        """
        Optimize inventory levels for multiple items
        
        Args:
            items_data: DataFrame with item information
            demand_forecasts: Dictionary mapping item IDs to demand forecasts
            
        Returns:
            DataFrame with optimization results for all items
        """
        results = []
        
        for _, item in items_data.iterrows():
            item_id = item['item_id']
            
            if item_id in demand_forecasts:
                forecast = demand_forecasts[item_id]
                result = self.optimize_inventory_levels(
                    item.to_dict(), forecast
                )
                
                results.append({
                    'item_id': item_id,
                    'item_name': item.get('item_name', ''),
                    'optimal_order_quantity': result.optimal_order_quantity,
                    'reorder_point': result.reorder_point,
                    'safety_stock': result.safety_stock,
                    'total_cost': result.total_cost,
                    'service_level': result.service_level,
                    'abc_category': result.abc_category,
                    'recommendations': '; '.join(result.recommendations)
                })
        
        return pd.DataFrame(results)
    
    def multi_objective_optimization(self,
                                   annual_demand: float,
                                   unit_cost: float,
                                   cost_weight: float = 0.6,
                                   service_weight: float = 0.4) -> Dict[str, float]:
        """
        Multi-objective optimization balancing cost and service level
        
        Args:
            annual_demand: Annual demand in units
            unit_cost: Cost per unit
            cost_weight: Weight for cost objective (0-1)
            service_weight: Weight for service level objective (0-1)
            
        Returns:
            Dictionary with optimal parameters
        """
        def objective(params):
            order_qty, service_level = params
            
            # Cost component
            holding_cost = (order_qty / 2) * unit_cost * self.holding_cost_rate
            ordering_cost = (annual_demand / order_qty) * self.ordering_cost
            total_cost = holding_cost + ordering_cost
            
            # Normalize cost (lower is better)
            cost_score = total_cost / (annual_demand * unit_cost)
            
            # Service level component (higher is better)
            service_score = 1 - service_level
            
            # Combined objective
            return cost_weight * cost_score + service_weight * service_score
        
        # Constraints
        constraints = [
            {'type': 'ineq', 'fun': lambda x: x[0] - 1},  # order_qty >= 1
            {'type': 'ineq', 'fun': lambda x: 0.99 - x[1]},  # service_level <= 0.99
            {'type': 'ineq', 'fun': lambda x: x[1] - 0.80}   # service_level >= 0.80
        ]
        
        # Initial guess
        initial_eoq = self.calculate_eoq(annual_demand, unit_cost)
        x0 = [initial_eoq, self.service_level_target]
        
        # Bounds
        bounds = [(1, annual_demand), (0.80, 0.99)]
        
        try:
            result = minimize(objective, x0, method='SLSQP', 
                            bounds=bounds, constraints=constraints)
            
            return {
                'optimal_order_quantity': result.x[0],
                'optimal_service_level': result.x[1],
                'total_objective_value': result.fun,
                'optimization_success': result.success
            }
        except Exception as e:
            logger.error(f"Multi-objective optimization failed: {str(e)}")
            return {
                'optimal_order_quantity': initial_eoq,
                'optimal_service_level': self.service_level_target,
                'total_objective_value': np.inf,
                'optimization_success': False
            }
    
    def calculate_jit_strategy(self,
                              demand_forecast: pd.Series,
                              lead_time_days: int,
                              order_frequency_days: int = 7,
                              buffer_percentage: float = 0.2) -> Dict[str, Any]:
        """
        Calculate Just-In-Time (JIT) inventory strategy parameters.
        
        This approach aims to minimize inventory holding while ensuring availability
        by scheduling more frequent, smaller deliveries.
        
        Args:
            demand_forecast: Series containing forecasted daily demand
            lead_time_days: Supplier lead time in days
            order_frequency_days: How often orders are placed (default weekly)
            buffer_percentage: Additional buffer to account for variability
            
        Returns:
            Dictionary with JIT strategy parameters
        """
        # Calculate average demand during lead time plus order cycle
        period_demand = demand_forecast.rolling(lead_time_days + order_frequency_days).mean()
        avg_period_demand = period_demand.mean()
        
        # Calculate optimal order quantity for JIT
        jit_order_qty = avg_period_demand * order_frequency_days
        
        # Add buffer for variability
        jit_order_qty_with_buffer = jit_order_qty * (1 + buffer_percentage)
        
        # Minimum safety buffer based on lead time
        min_safety_buffer = demand_forecast.mean() * lead_time_days * buffer_percentage
        
        return {
            'jit_order_quantity': max(1, round(jit_order_qty_with_buffer)),
            'order_frequency_days': order_frequency_days,
            'minimum_safety_buffer': max(1, round(min_safety_buffer)),
            'expected_stockout_probability': 1 - (1 / (1 + buffer_percentage))
        }
    
    def generate_intelligent_recommendations(self,
                                      item_data: Dict[str, Any],
                                      optimization_results: Dict[str, Any],
                                      historical_data: Optional[pd.DataFrame] = None) -> List[str]:
        """
        Generate intelligent recommendations based on optimization results and historical data.
        
        Args:
            item_data: Dictionary containing item information
            optimization_results: Results from optimization calculations
            historical_data: Optional historical demand/inventory data
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Extract key data
        current_stock = item_data.get('current_stock', 0)
        eoq = optimization_results.get('economic_order_quantity', 0)
        rop = optimization_results.get('reorder_point', 0)
        safety_stock = optimization_results.get('safety_stock', 0)
        category = optimization_results.get('abc_category', 'C')
        lead_time = item_data.get('lead_time_days', 7)
        
        # Basic recommendations
        if current_stock <= rop:
            recommendations.append(f"URGENT: Stock level ({current_stock}) below reorder point ({rop}). Place order for {eoq} units immediately.")
        elif current_stock <= rop * 1.2:
            recommendations.append(f"WARNING: Stock level ({current_stock}) approaching reorder point ({rop}). Prepare to order {eoq} units soon.")
        
        # Category-specific recommendations
        if category == 'A':
            recommendations.append("HIGH VALUE item: Consider negotiating better supplier terms and shorter lead times.")
            recommendations.append("Implement cycle counting and strict inventory control for this high-value item.")
        elif category == 'B':
            recommendations.append("MEDIUM VALUE item: Review stock levels and order quantities quarterly.")
        elif category == 'C':
            recommendations.append("LOW VALUE item: Consider bulk ordering to reduce procurement overhead.")
        
        # Lead time recommendations
        if lead_time > 14:
            recommendations.append(f"Long lead time ({lead_time} days): Consider identifying alternative suppliers or dual-sourcing strategy.")
        
        # Safety stock recommendations
        if safety_stock > eoq * 0.5:
            recommendations.append("High safety stock relative to order quantity: Review demand variability and lead time reliability.")
        
        # Historical data recommendations
        if historical_data is not None and not historical_data.empty:
            try:
                # Check for seasonality
                if len(historical_data) >= 365:
                    # Basic check for seasonality (simplified)
                    monthly_data = historical_data.resample('M').sum()
                    monthly_std = monthly_data.std()
                    monthly_mean = monthly_data.mean()
                    
                    if monthly_std > monthly_mean * 0.5:  # High variability between months
                        recommendations.append("Demand shows seasonal patterns: Consider adjusting inventory policy by season.")
                        
                # Check for stockout history
                stockout_events = historical_data[historical_data <= 0].count()
                if stockout_events > 0:
                    recommendations.append(f"Historical analysis: {stockout_events} stockout events detected. Consider increasing safety stock.")
            except Exception as e:
                logger.warning(f"Error analyzing historical data for recommendations: {str(e)}")
        
        # Return top recommendations if there are too many
        return recommendations[:5] if len(recommendations) > 5 else recommendations
    
    def _generate_recommendations(self,
                                current_stock: float,
                                eoq: float,
                                reorder_point: float,
                                safety_stock: float,
                                abc_category: str) -> List[str]:
        """Generate actionable recommendations based on optimization results"""
        recommendations = []
        
        # Stock level recommendations
        if current_stock < safety_stock:
            recommendations.append("URGENT: Current stock below safety level - immediate reorder required")
        elif current_stock < reorder_point:
            recommendations.append("Stock approaching reorder point - place order soon")
        
        # Order quantity recommendations
        if eoq > current_stock * 2:
            recommendations.append(f"Consider larger order quantity ({eoq:.0f} units) for cost efficiency")
        
        # Category-specific recommendations
        if abc_category == 'A':
            recommendations.append("High-value item: Monitor closely, consider vendor-managed inventory")
        elif abc_category == 'C':
            recommendations.append("Low-value item: Consider bulk ordering or longer review cycles")
        
        # General recommendations
        recommendations.append(f"Maintain safety stock of {safety_stock:.0f} units")
        recommendations.append(f"Optimal order quantity: {eoq:.0f} units")
        
        return recommendations
    
    def _default_optimization_result(self) -> OptimizationResult:
        """Return default optimization result for error cases"""
        return OptimizationResult(
            optimal_order_quantity=1,
            reorder_point=1,
            safety_stock=1,
            total_cost=0,
            service_level=0.95,
            abc_category='C',
            recommendations=["Unable to optimize - using default values"]
        )

class StochasticInventoryOptimizer(InventoryOptimizer):
    """
    Advanced stochastic inventory optimization with uncertainty modeling
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.simulation_runs = 1000
    
    def monte_carlo_optimization(self,
                               demand_distribution: Dict[str, float],
                               lead_time_distribution: Dict[str, float],
                               cost_parameters: Dict[str, float]) -> Dict[str, Any]:
        """
        Monte Carlo simulation for inventory optimization under uncertainty
        
        Args:
            demand_distribution: Parameters for demand distribution
            lead_time_distribution: Parameters for lead time distribution  
            cost_parameters: Cost structure parameters
            
        Returns:
            Dictionary with simulation results and optimal policies
        """
        results = []
        
        for _ in range(self.simulation_runs):
            # Sample from distributions
            demand = np.random.normal(
                demand_distribution['mean'], 
                demand_distribution['std']
            )
            lead_time = np.random.normal(
                lead_time_distribution['mean'],
                lead_time_distribution['std']
            )
            
            # Calculate metrics for this scenario
            eoq = self.calculate_eoq(
                max(1, demand), 
                cost_parameters['unit_cost']
            )
            
            reorder_point, safety_stock = self.calculate_reorder_point(
                max(1, demand) * max(1, lead_time) / 365,
                demand_distribution['std']
            )
            
            results.append({
                'demand': demand,
                'lead_time': lead_time,
                'eoq': eoq,
                'reorder_point': reorder_point,
                'safety_stock': safety_stock
            })
        
        results_df = pd.DataFrame(results)
        
        return {
            'mean_eoq': results_df['eoq'].mean(),
            'std_eoq': results_df['eoq'].std(),
            'mean_reorder_point': results_df['reorder_point'].mean(),
            'std_reorder_point': results_df['reorder_point'].std(),
            'confidence_intervals': {
                'eoq_95': np.percentile(results_df['eoq'], [2.5, 97.5]),
                'reorder_point_95': np.percentile(results_df['reorder_point'], [2.5, 97.5])
            },
            'simulation_results': results_df
        }
    
    def perform_multi_criteria_optimization(self,
                                     demand_forecast: pd.Series,
                                     lead_time_days: int,
                                     unit_cost: float,
                                     holding_cost_rate: float,
                                     ordering_cost: float,
                                     shortage_cost: float,
                                     min_service_level: float = 0.9,
                                     weights: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Performs multi-criteria optimization balancing:
        - Service level (stockout prevention)
        - Inventory holding costs
        - Ordering costs
        - Space utilization
        
        Args:
            demand_forecast: Series containing forecasted daily demand
            lead_time_days: Supplier lead time in days
            unit_cost: Cost per unit
            holding_cost_rate: Annual holding cost as fraction of item value
            ordering_cost: Fixed cost per order
            shortage_cost: Cost per unit shortage
            min_service_level: Minimum acceptable service level (0-1)
            weights: Optional weights for multi-criteria objective
            
        Returns:
            Dictionary with optimized parameters
        """
        if weights is None:
            weights = {
                'holding_cost': 0.3,
                'ordering_cost': 0.2,
                'service_level': 0.5,
            }
            
        # Validation and defaults
        weights = {k: max(0, v) for k, v in weights.items()}
        weight_sum = sum(weights.values())
        if weight_sum == 0:
            weights = {'holding_cost': 0.3, 'ordering_cost': 0.2, 'service_level': 0.5}
        else:
            weights = {k: v/weight_sum for k, v in weights.items()}
        
        mean_daily_demand = demand_forecast.mean()
        std_daily_demand = demand_forecast.std() if len(demand_forecast) > 1 else mean_daily_demand * 0.1
        annual_demand = mean_daily_demand * 365
        
        # Define the objective function
        def objective_function(q_z):
            q, z = q_z
            
            # Service level from z-score
            service_level = norm.cdf(z)
            
            # Safety stock
            safety_stock = z * std_daily_demand * np.sqrt(lead_time_days)
            
            # Expected annual holding cost
            annual_holding_cost = unit_cost * holding_cost_rate * (q/2 + safety_stock)
            
            # Annual ordering cost
            annual_ordering_cost = ordering_cost * annual_demand / q if q > 0 else 999999
            
            # Expected annual shortage cost
            expected_units_short = std_daily_demand * np.sqrt(lead_time_days) * (norm.pdf(z) - z * (1 - norm.cdf(z)))
            annual_shortage_cost = shortage_cost * annual_demand * expected_units_short / q if q > 0 else 999999
            
            # Normalize costs between 0 and 1 for weighted objective
            # For simplicity, we'll use estimated upper bounds
            max_holding_cost = unit_cost * holding_cost_rate * annual_demand
            max_ordering_cost = ordering_cost * annual_demand
            max_shortage_cost = shortage_cost * annual_demand
            
            norm_holding_cost = min(annual_holding_cost / max_holding_cost, 1) if max_holding_cost > 0 else 0
            norm_ordering_cost = min(annual_ordering_cost / max_ordering_cost, 1) if max_ordering_cost > 0 else 0
            norm_shortage = 1 - min(service_level, min_service_level) / min_service_level
            
            # Weighted objective (minimizing)
            weighted_objective = (
                weights.get('holding_cost', 0.3) * norm_holding_cost +
                weights.get('ordering_cost', 0.2) * norm_ordering_cost +
                weights.get('service_level', 0.5) * norm_shortage
            )
            
            return weighted_objective
            
        # Initial guess based on EOQ and z-score for given service level
        initial_q = self.calculate_eoq(annual_demand, unit_cost, ordering_cost, holding_cost_rate)
        initial_z = norm.ppf(min_service_level)
        
        # Bounds for the optimization
        bounds = [(max(1, initial_q * 0.1), initial_q * 10), (norm.ppf(min_service_level), norm.ppf(0.9999))]
        
        try:
            # Perform the optimization
            result = minimize(objective_function, [initial_q, initial_z], bounds=bounds, method='L-BFGS-B')
            
            if result.success:
                optimal_q, optimal_z = result.x
                optimal_service_level = norm.cdf(optimal_z)
                optimal_safety_stock = optimal_z * std_daily_demand * np.sqrt(lead_time_days)
                optimal_reorder_point = mean_daily_demand * lead_time_days + optimal_safety_stock
                
                # Calculate costs with optimal values
                annual_holding_cost = unit_cost * holding_cost_rate * (optimal_q/2 + optimal_safety_stock)
                annual_ordering_cost = ordering_cost * annual_demand / optimal_q if optimal_q > 0 else 0
                
                return {
                    'optimal_order_quantity': max(1, round(optimal_q)),
                    'optimal_service_level': optimal_service_level,
                    'optimal_safety_stock': max(0, round(optimal_safety_stock)),
                    'optimal_reorder_point': max(0, round(optimal_reorder_point)),
                    'annual_holding_cost': annual_holding_cost,
                    'annual_ordering_cost': annual_ordering_cost,
                    'total_annual_cost': annual_holding_cost + annual_ordering_cost,
                    'z_score': optimal_z
                }
            else:
                logger.warning(f"Multi-criteria optimization did not converge: {result.message}")
                return self._fallback_optimization(mean_daily_demand, std_daily_demand, lead_time_days, 
                                                 unit_cost, holding_cost_rate, ordering_cost, min_service_level)
        except Exception as e:
            logger.error(f"Error in multi-criteria optimization: {str(e)}")
            logger.debug(traceback.format_exc())
            return self._fallback_optimization(mean_daily_demand, std_daily_demand, lead_time_days, 
                                             unit_cost, holding_cost_rate, ordering_cost, min_service_level)
    
    def _fallback_optimization(self, mean_daily_demand, std_daily_demand, lead_time_days, 
                             unit_cost, holding_cost_rate, ordering_cost, service_level):
        """Fallback method for when advanced optimization fails"""
        annual_demand = mean_daily_demand * 365
        eoq = self.calculate_eoq(annual_demand, unit_cost, ordering_cost, holding_cost_rate)
        z_score = norm.ppf(service_level)
        safety_stock = z_score * std_daily_demand * np.sqrt(lead_time_days)
        reorder_point = mean_daily_demand * lead_time_days + safety_stock
        
        return {
            'optimal_order_quantity': max(1, round(eoq)),
            'optimal_service_level': service_level,
            'optimal_safety_stock': max(0, round(safety_stock)),
            'optimal_reorder_point': max(0, round(reorder_point)),
            'annual_holding_cost': unit_cost * holding_cost_rate * (eoq/2 + safety_stock),
            'annual_ordering_cost': ordering_cost * annual_demand / eoq if eoq > 0 else 0,
            'is_fallback': True
        }
