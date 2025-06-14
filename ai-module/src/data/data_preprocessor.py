"""
Data preprocessing utilities for preparing hospital inventory data for ML models.
Includes feature engineering, data cleaning, and time series preparation.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer

logger = logging.getLogger(__name__)


class DataPreprocessor:
    """
    Comprehensive data preprocessing for inventory optimization models.
    """
    
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.imputers = {}
        logger.info("DataPreprocessor initialized")
    
    def create_time_series_features(self, df: pd.DataFrame, 
                                  timestamp_col: str = 'timestamp',
                                  value_col: str = 'quantity') -> pd.DataFrame:
        """
        Create time series features from timestamp data.
        
        Args:
            df: Input dataframe
            timestamp_col: Name of timestamp column
            value_col: Name of value column
            
        Returns:
            DataFrame with time series features
        """
        df_processed = df.copy()
        
        # Ensure timestamp is datetime
        df_processed[timestamp_col] = pd.to_datetime(df_processed[timestamp_col])
        
        # Extract temporal features
        df_processed['year'] = df_processed[timestamp_col].dt.year
        df_processed['month'] = df_processed[timestamp_col].dt.month
        df_processed['day'] = df_processed[timestamp_col].dt.day
        df_processed['dayofweek'] = df_processed[timestamp_col].dt.dayofweek
        df_processed['dayofyear'] = df_processed[timestamp_col].dt.dayofyear
        df_processed['week'] = df_processed[timestamp_col].dt.isocalendar().week
        df_processed['quarter'] = df_processed[timestamp_col].dt.quarter
        
        # Create cyclical features
        df_processed['month_sin'] = np.sin(2 * np.pi * df_processed['month'] / 12)
        df_processed['month_cos'] = np.cos(2 * np.pi * df_processed['month'] / 12)
        df_processed['dayofweek_sin'] = np.sin(2 * np.pi * df_processed['dayofweek'] / 7)
        df_processed['dayofweek_cos'] = np.cos(2 * np.pi * df_processed['dayofweek'] / 7)
        
        # Business calendar features
        df_processed['is_weekend'] = df_processed['dayofweek'].isin([5, 6]).astype(int)
        df_processed['is_month_start'] = df_processed[timestamp_col].dt.is_month_start.astype(int)
        df_processed['is_month_end'] = df_processed[timestamp_col].dt.is_month_end.astype(int)
        df_processed['is_quarter_start'] = df_processed[timestamp_col].dt.is_quarter_start.astype(int)
        df_processed['is_quarter_end'] = df_processed[timestamp_col].dt.is_quarter_end.astype(int)
        
        logger.info(f"Created time series features, shape: {df_processed.shape}")
        return df_processed
    
    def create_demand_aggregations(self, df: pd.DataFrame,
                                 group_cols: List[str] = None,
                                 timestamp_col: str = 'timestamp',
                                 freq: str = 'D') -> pd.DataFrame:
        """
        Create demand aggregations by time period and categories.
        
        Args:
            df: Input dataframe
            group_cols: Columns to group by
            timestamp_col: Timestamp column name
            freq: Frequency for aggregation ('D', 'W', 'M')
            
        Returns:
            Aggregated demand dataframe
        """
        if group_cols is None:
            group_cols = ['category']
        
        df_agg = df.copy()
        df_agg[timestamp_col] = pd.to_datetime(df_agg[timestamp_col])
        
        # Create period column based on frequency
        if freq == 'D':
            df_agg['period'] = df_agg[timestamp_col].dt.date
        elif freq == 'W':
            df_agg['period'] = df_agg[timestamp_col].dt.to_period('W').dt.start_time
        elif freq == 'M':
            df_agg['period'] = df_agg[timestamp_col].dt.to_period('M').dt.start_time
        else:
            raise ValueError(f"Unsupported frequency: {freq}")
        
        # Aggregate by period and group columns
        agg_cols = ['period'] + group_cols
        
        demand_agg = df_agg.groupby(agg_cols).agg({
            'quantity': ['sum', 'mean', 'count'],
            'unit_price': ['mean', 'sum'] if 'unit_price' in df_agg.columns else [],
        }).reset_index()
        
        # Flatten column names
        demand_agg.columns = [f"{col[0]}_{col[1]}" if col[1] else col[0] 
                             for col in demand_agg.columns]
        
        # Rename aggregated columns
        rename_dict = {
            'quantity_sum': 'total_demand',
            'quantity_mean': 'avg_demand',
            'quantity_count': 'demand_frequency'
        }
        demand_agg.rename(columns=rename_dict, inplace=True)
        
        logger.info(f"Created demand aggregations, shape: {demand_agg.shape}")
        return demand_agg
    
    def create_inventory_change_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create features based on inventory level changes.
        
        Args:
            df: Inventory history dataframe
            
        Returns:
            DataFrame with change features
        """
        df_changes = df.copy()
        
        # Sort by item and timestamp
        df_changes = df_changes.sort_values(['item_id', 'timestamp'])
        
        # Calculate changes
        df_changes['quantity_change'] = df_changes.groupby('item_id')['quantity'].diff()
        df_changes['quantity_pct_change'] = df_changes.groupby('item_id')['quantity'].pct_change()
        
        # Calculate rolling statistics
        for window in [7, 14, 30]:
            df_changes[f'quantity_rolling_mean_{window}d'] = (
                df_changes.groupby('item_id')['quantity']
                .rolling(window=window, min_periods=1)
                .mean()
                .reset_index(level=0, drop=True)
            )
            
            df_changes[f'quantity_rolling_std_{window}d'] = (
                df_changes.groupby('item_id')['quantity']
                .rolling(window=window, min_periods=1)
                .std()
                .reset_index(level=0, drop=True)
            )
        
        # Calculate velocity features
        df_changes['days_since_last_change'] = (
            df_changes.groupby('item_id')['timestamp']
            .diff()
            .dt.days
        )
        
        # Stock level indicators
        df_changes['is_low_stock'] = (
            df_changes['quantity'] <= df_changes['min_quantity']
        ).astype(int)
        
        df_changes['stock_ratio'] = (
            df_changes['quantity'] / df_changes['min_quantity'].replace(0, 1)
        )
        
        logger.info(f"Created inventory change features, shape: {df_changes.shape}")
        return df_changes
    
    def encode_categorical_features(self, df: pd.DataFrame,
                                  categorical_cols: List[str]) -> pd.DataFrame:
        """
        Encode categorical features using appropriate methods.
        
        Args:
            df: Input dataframe
            categorical_cols: List of categorical columns
            
        Returns:
            DataFrame with encoded categorical features
        """
        df_encoded = df.copy()
        
        for col in categorical_cols:
            if col in df_encoded.columns:
                # Use label encoding for ordinal features
                if col in ['priority', 'urgency']:
                    priority_map = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4}
                    df_encoded[f'{col}_encoded'] = df_encoded[col].map(priority_map)
                
                # Use label encoding for other categorical features
                else:
                    if col not in self.encoders:
                        self.encoders[col] = LabelEncoder()
                        df_encoded[f'{col}_encoded'] = self.encoders[col].fit_transform(
                            df_encoded[col].fillna('Unknown')
                        )
                    else:
                        # Handle new categories in transform
                        known_classes = set(self.encoders[col].classes_)
                        df_encoded[col] = df_encoded[col].fillna('Unknown')
                        
                        # Add new classes if found
                        new_classes = set(df_encoded[col].unique()) - known_classes
                        if new_classes:
                            all_classes = list(known_classes) + list(new_classes)
                            self.encoders[col].classes_ = np.array(all_classes)
                        
                        df_encoded[f'{col}_encoded'] = self.encoders[col].transform(df_encoded[col])
        
        logger.info(f"Encoded categorical features: {categorical_cols}")
        return df_encoded
    
    def create_lag_features(self, df: pd.DataFrame,
                          value_cols: List[str],
                          group_col: str = 'item_id',
                          lags: List[int] = None) -> pd.DataFrame:
        """
        Create lagged features for time series modeling.
        
        Args:
            df: Input dataframe
            value_cols: Columns to create lags for
            group_col: Column to group by
            lags: List of lag periods
            
        Returns:
            DataFrame with lag features
        """
        if lags is None:
            lags = [1, 3, 7, 14, 30]
        
        df_lagged = df.copy()
        
        for col in value_cols:
            if col in df_lagged.columns:
                for lag in lags:
                    df_lagged[f'{col}_lag_{lag}'] = (
                        df_lagged.groupby(group_col)[col].shift(lag)
                    )
        
        logger.info(f"Created lag features for {value_cols} with lags {lags}")
        return df_lagged
    
    def handle_missing_values(self, df: pd.DataFrame,
                            strategy: Dict[str, str] = None) -> pd.DataFrame:
        """
        Handle missing values with appropriate strategies.
        
        Args:
            df: Input dataframe
            strategy: Dictionary mapping column types to imputation strategies
            
        Returns:
            DataFrame with imputed missing values
        """
        if strategy is None:
            strategy = {
                'numeric': 'median',
                'categorical': 'most_frequent'
            }
        
        df_imputed = df.copy()
        
        # Identify numeric and categorical columns
        numeric_cols = df_imputed.select_dtypes(include=[np.number]).columns
        categorical_cols = df_imputed.select_dtypes(include=['object', 'category']).columns
        
        # Impute numeric columns
        if len(numeric_cols) > 0:
            if 'numeric' not in self.imputers:
                self.imputers['numeric'] = SimpleImputer(strategy=strategy['numeric'])
                df_imputed[numeric_cols] = self.imputers['numeric'].fit_transform(
                    df_imputed[numeric_cols]
                )
            else:
                df_imputed[numeric_cols] = self.imputers['numeric'].transform(
                    df_imputed[numeric_cols]
                )
        
        # Impute categorical columns
        if len(categorical_cols) > 0:
            if 'categorical' not in self.imputers:
                self.imputers['categorical'] = SimpleImputer(strategy=strategy['categorical'])
                df_imputed[categorical_cols] = self.imputers['categorical'].fit_transform(
                    df_imputed[categorical_cols]
                )
            else:
                df_imputed[categorical_cols] = self.imputers['categorical'].transform(
                    df_imputed[categorical_cols]
                )
        
        logger.info(f"Handled missing values using strategies: {strategy}")
        return df_imputed
    
    def scale_features(self, df: pd.DataFrame,
                      feature_cols: List[str],
                      method: str = 'standard') -> pd.DataFrame:
        """
        Scale numerical features.
        
        Args:
            df: Input dataframe
            feature_cols: Columns to scale
            method: Scaling method ('standard', 'minmax', 'robust')
            
        Returns:
            DataFrame with scaled features
        """
        df_scaled = df.copy()
        
        if method == 'standard':
            if 'scaler' not in self.scalers:
                self.scalers['scaler'] = StandardScaler()
                df_scaled[feature_cols] = self.scalers['scaler'].fit_transform(
                    df_scaled[feature_cols]
                )
            else:
                df_scaled[feature_cols] = self.scalers['scaler'].transform(
                    df_scaled[feature_cols]
                )
        
        logger.info(f"Scaled features: {feature_cols} using {method} scaling")
        return df_scaled
    
    def prepare_forecasting_data(self, df: pd.DataFrame,
                               target_col: str = 'quantity',
                               group_col: str = 'item_id',
                               timestamp_col: str = 'timestamp') -> Dict[str, pd.DataFrame]:
        """
        Prepare data specifically for demand forecasting models.
        
        Args:
            df: Input dataframe
            target_col: Target variable column
            group_col: Grouping column (e.g., item_id)
            timestamp_col: Timestamp column
            
        Returns:
            Dictionary containing prepared datasets
        """
        # Create time series features
        df_ts = self.create_time_series_features(df, timestamp_col, target_col)
        
        # Create lag features
        df_lagged = self.create_lag_features(
            df_ts, 
            [target_col], 
            group_col,
            lags=[1, 3, 7, 14, 30]
        )
        
        # Create change features
        df_changes = self.create_inventory_change_features(df_lagged)
        
        # Handle missing values
        df_clean = self.handle_missing_values(df_changes)
        
        # Separate datasets by item for individual forecasting
        item_datasets = {}
        for item_id in df_clean[group_col].unique():
            item_data = df_clean[df_clean[group_col] == item_id].copy()
            item_data = item_data.sort_values(timestamp_col)
            item_datasets[item_id] = item_data
        
        result = {
            'combined': df_clean,
            'by_item': item_datasets,
            'feature_columns': [col for col in df_clean.columns 
                              if col not in [group_col, timestamp_col, target_col]]
        }
        
        logger.info(f"Prepared forecasting data for {len(item_datasets)} items")
        return result
    
    def prepare_optimization_data(self, current_inventory: pd.DataFrame,
                                demand_forecast: pd.DataFrame,
                                cost_data: pd.DataFrame = None) -> pd.DataFrame:
        """
        Prepare data for inventory optimization algorithms.
        
        Args:
            current_inventory: Current inventory snapshot
            demand_forecast: Demand forecasts
            cost_data: Cost information
            
        Returns:
            Combined optimization dataset
        """
        # Merge current inventory with forecasts
        optimization_data = current_inventory.merge(
            demand_forecast, 
            left_on='id', 
            right_on='item_id', 
            how='left'
        )
        
        # Add cost information if available
        if cost_data is not None:
            optimization_data = optimization_data.merge(
                cost_data, 
                on='item_id', 
                how='left'
            )
        
        # Calculate optimization features
        optimization_data['current_stock_days'] = (
            optimization_data['quantity'] / 
            optimization_data['forecasted_demand'].clip(lower=0.1)
        )
        
        optimization_data['safety_stock_ratio'] = (
            optimization_data['min_quantity'] / 
            optimization_data['quantity'].clip(lower=1)
        )
        
        # Handle missing values
        optimization_data = self.handle_missing_values(optimization_data)
        
        logger.info(f"Prepared optimization data, shape: {optimization_data.shape}")
        return optimization_data


def create_training_datasets(data_dict: Dict[str, pd.DataFrame],
                           test_size: float = 0.2) -> Dict[str, Dict[str, pd.DataFrame]]:
    """
    Create training and testing datasets from processed data.
    
    Args:
        data_dict: Dictionary containing different data types
        test_size: Proportion of data for testing
        
    Returns:
        Dictionary containing train/test splits
    """
    preprocessor = DataPreprocessor()
    datasets = {}
    
    # Process inventory data for forecasting
    if 'inventory' in data_dict and not data_dict['inventory'].empty:
        inventory_data = preprocessor.prepare_forecasting_data(
            data_dict['inventory'],
            target_col='quantity',
            group_col='item_id',
            timestamp_col='timestamp'
        )
        
        # Split by time for each item
        datasets['forecasting'] = {}
        for item_id, item_data in inventory_data['by_item'].items():
            split_idx = int(len(item_data) * (1 - test_size))
            datasets['forecasting'][item_id] = {
                'train': item_data.iloc[:split_idx],
                'test': item_data.iloc[split_idx:],
                'features': inventory_data['feature_columns']
            }
    
    # Process current inventory for optimization
    if 'current_inventory' in data_dict and not data_dict['current_inventory'].empty:
        # Create mock demand forecast for optimization data preparation
        current_inv = data_dict['current_inventory']
        mock_forecast = pd.DataFrame({
            'item_id': current_inv['id'],
            'forecasted_demand': current_inv['quantity'] * 0.1,  # Mock 10% demand
            'forecast_std': current_inv['quantity'] * 0.05
        })
        
        optimization_data = preprocessor.prepare_optimization_data(
            current_inv, mock_forecast
        )
        
        datasets['optimization'] = {
            'data': optimization_data,
            'features': [col for col in optimization_data.columns 
                        if col not in ['id', 'name']]
        }
    
    logger.info(f"Created training datasets for {len(datasets)} model types")
    return datasets


if __name__ == "__main__":
    # Test preprocessing
    from data_loader import load_sample_data
    
    # Load sample data
    data = load_sample_data(days_back=90)
    
    # Create training datasets
    datasets = create_training_datasets(data)
    
    print(f"Created datasets: {list(datasets.keys())}")
    
    if 'forecasting' in datasets:
        print(f"Forecasting datasets for {len(datasets['forecasting'])} items")
    
    if 'optimization' in datasets:
        print(f"Optimization dataset shape: {datasets['optimization']['data'].shape}")
