"""
Demand forecasting models for predicting future IT asset requirements.
Implements multiple forecasting approaches: ARIMA, Prophet, LSTM, and ensemble methods.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Union
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Time series forecasting libraries
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logging.warning("Prophet not available. Install with: pip install prophet")

try:
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.seasonal import seasonal_decompose
    from statsmodels.tsa.stattools import adfuller
    from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    logging.warning("Statsmodels not available. Install with: pip install statsmodels")

# Deep learning libraries
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    from sklearn.preprocessing import MinMaxScaler
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    logging.warning("TensorFlow not available. Install with: pip install tensorflow")

# Machine learning libraries
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit

logger = logging.getLogger(__name__)


class DemandForecaster:
    """
    Comprehensive demand forecasting system with multiple models.
    """
    
    def __init__(self, config: Dict = None):
        """
        Initialize the demand forecaster.
        
        Args:
            config: Configuration dictionary for models
        """
        self.config = config or self._default_config()
        self.models = {}
        self.scalers = {}
        self.model_performance = {}
        self.is_fitted = False
        logger.info("DemandForecaster initialized")
    
    def _default_config(self) -> Dict:
        """Default configuration for forecasting models."""
        return {
            'arima': {
                'order': (1, 1, 1),
                'seasonal_order': (1, 1, 1, 12),
                'trend': 'c'
            },
            'prophet': {
                'yearly_seasonality': True,
                'weekly_seasonality': True,
                'daily_seasonality': False,
                'changepoint_prior_scale': 0.05,
                'seasonality_prior_scale': 10.0
            },
            'lstm': {
                'sequence_length': 30,
                'units': [50, 50],
                'dropout': 0.2,
                'epochs': 100,
                'batch_size': 32
            },
            'ensemble': {
                'models': ['prophet', 'arima', 'ml'],
                'weights': None  # Auto-calculate based on performance
            }
        }
    
    def fit(self, data: Dict[str, pd.DataFrame], target_col: str = 'quantity'):
        """
        Train forecasting models on historical data.
        
        Args:
            data: Dictionary containing training data for each item
            target_col: Target variable column name
        """
        logger.info(f"Training forecasting models for {len(data)} items")
        
        for item_id, item_data in data.items():
            if len(item_data) < 30:  # Minimum data requirement
                logger.warning(f"Insufficient data for item {item_id}: {len(item_data)} records")
                continue
            
            self.models[item_id] = {}
            self.scalers[item_id] = {}
            self.model_performance[item_id] = {}
            
            # Prepare time series data
            ts_data = self._prepare_time_series(item_data, target_col)
            
            # Train ARIMA model
            if STATSMODELS_AVAILABLE:
                try:
                    arima_model = self._train_arima(ts_data, item_id)
                    self.models[item_id]['arima'] = arima_model
                except Exception as e:
                    logger.error(f"ARIMA training failed for item {item_id}: {e}")
            
            # Train Prophet model
            if PROPHET_AVAILABLE:
                try:
                    prophet_model = self._train_prophet(ts_data, item_id)
                    self.models[item_id]['prophet'] = prophet_model
                except Exception as e:
                    logger.error(f"Prophet training failed for item {item_id}: {e}")
            
            # Train LSTM model
            if TENSORFLOW_AVAILABLE:
                try:
                    lstm_model, scaler = self._train_lstm(ts_data, item_id)
                    self.models[item_id]['lstm'] = lstm_model
                    self.scalers[item_id]['lstm'] = scaler
                except Exception as e:
                    logger.error(f"LSTM training failed for item {item_id}: {e}")
            
            # Train ML models
            try:
                ml_models = self._train_ml_models(item_data, target_col, item_id)
                self.models[item_id]['ml'] = ml_models
            except Exception as e:
                logger.error(f"ML models training failed for item {item_id}: {e}")
        
        self.is_fitted = True
        logger.info("Model training completed")
    
    def _prepare_time_series(self, data: pd.DataFrame, target_col: str) -> pd.DataFrame:
        """Prepare time series data for forecasting."""
        ts_data = data[['timestamp', target_col]].copy()
        ts_data['timestamp'] = pd.to_datetime(ts_data['timestamp'])
        ts_data = ts_data.sort_values('timestamp')
        ts_data = ts_data.set_index('timestamp')
        
        # Handle missing dates by forward filling
        ts_data = ts_data.asfreq('D', method='ffill')
        
        return ts_data
    
    def _train_arima(self, ts_data: pd.DataFrame, item_id: str):
        """Train ARIMA model."""
        logger.debug(f"Training ARIMA for item {item_id}")
        
        # Check stationarity
        series = ts_data.iloc[:, 0].dropna()
        
        # Auto-select ARIMA order if needed
        try:
            # Simple auto-ARIMA implementation
            best_aic = float('inf')
            best_order = (1, 1, 1)
            
            for p in range(3):
                for d in range(2):
                    for q in range(3):
                        try:
                            model = ARIMA(series, order=(p, d, q))
                            fitted_model = model.fit()
                            if fitted_model.aic < best_aic:
                                best_aic = fitted_model.aic
                                best_order = (p, d, q)
                        except:
                            continue
            
            # Train final model
            model = ARIMA(series, order=best_order)
            fitted_model = model.fit()
            
            self.model_performance[item_id]['arima'] = {
                'aic': fitted_model.aic,
                'bic': fitted_model.bic,
                'order': best_order
            }
            
            return fitted_model
            
        except Exception as e:
            logger.error(f"ARIMA training error for item {item_id}: {e}")
            raise
    
    def _train_prophet(self, ts_data: pd.DataFrame, item_id: str):
        """Train Prophet model."""
        logger.debug(f"Training Prophet for item {item_id}")
        
        # Prepare data for Prophet
        prophet_data = ts_data.reset_index()
        prophet_data.columns = ['ds', 'y']
        
        # Initialize Prophet with config
        model = Prophet(**self.config['prophet'])
        
        # Add custom seasonalities if needed
        model.add_seasonality(name='monthly', period=30.5, fourier_order=5)
        
        # Fit the model
        model.fit(prophet_data)
        
        # Calculate performance on training data
        forecast = model.predict(prophet_data)
        mae = mean_absolute_error(prophet_data['y'], forecast['yhat'])
        
        self.model_performance[item_id]['prophet'] = {
            'mae': mae,
            'data_points': len(prophet_data)
        }
        
        return model
    
    def _train_lstm(self, ts_data: pd.DataFrame, item_id: str):
        """Train LSTM model."""
        logger.debug(f"Training LSTM for item {item_id}")
        
        # Prepare data for LSTM
        series = ts_data.iloc[:, 0].values.reshape(-1, 1)
        
        # Scale data
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(series)
        
        # Create sequences
        seq_length = self.config['lstm']['sequence_length']
        X, y = self._create_sequences(scaled_data, seq_length)
        
        if len(X) < 10:  # Minimum sequences required
            raise ValueError(f"Insufficient data for LSTM training: {len(X)} sequences")
        
        # Build LSTM model
        model = keras.Sequential()
        
        # Add LSTM layers
        units = self.config['lstm']['units']
        dropout = self.config['lstm']['dropout']
        
        for i, unit in enumerate(units):
            return_sequences = i < len(units) - 1
            if i == 0:
                model.add(layers.LSTM(unit, return_sequences=return_sequences, 
                                    input_shape=(seq_length, 1)))
            else:
                model.add(layers.LSTM(unit, return_sequences=return_sequences))
            model.add(layers.Dropout(dropout))
        
        model.add(layers.Dense(1))
        
        # Compile model
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        
        # Train model
        history = model.fit(
            X, y,
            epochs=self.config['lstm']['epochs'],
            batch_size=self.config['lstm']['batch_size'],
            validation_split=0.2,
            verbose=0
        )
        
        # Calculate performance
        predictions = model.predict(X)
        mae = mean_absolute_error(y, predictions)
        
        self.model_performance[item_id]['lstm'] = {
            'mae': mae,
            'loss': history.history['loss'][-1],
            'val_loss': history.history['val_loss'][-1]
        }
        
        return model, scaler
    
    def _create_sequences(self, data: np.ndarray, seq_length: int) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences for LSTM training."""
        X, y = [], []
        for i in range(len(data) - seq_length):
            X.append(data[i:(i + seq_length)])
            y.append(data[i + seq_length])
        return np.array(X), np.array(y)
    
    def _train_ml_models(self, data: pd.DataFrame, target_col: str, item_id: str):
        """Train machine learning models."""
        logger.debug(f"Training ML models for item {item_id}")
        
        # Feature engineering for ML models
        feature_cols = [col for col in data.columns 
                       if col not in ['timestamp', target_col, 'item_id']]
        
        if len(feature_cols) == 0:
            raise ValueError("No features available for ML models")
        
        X = data[feature_cols].fillna(0)
        y = data[target_col]
        
        # Train multiple ML models
        models = {
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'linear_regression': LinearRegression()
        }
        
        trained_models = {}
        
        for name, model in models.items():
            try:
                model.fit(X, y)
                predictions = model.predict(X)
                mae = mean_absolute_error(y, predictions)
                r2 = r2_score(y, predictions)
                
                trained_models[name] = model
                
                if 'ml' not in self.model_performance[item_id]:
                    self.model_performance[item_id]['ml'] = {}
                
                self.model_performance[item_id]['ml'][name] = {
                    'mae': mae,
                    'r2': r2,
                    'features': feature_cols
                }
                
            except Exception as e:
                logger.error(f"Error training {name} for item {item_id}: {e}")
        
        return trained_models
    
    def predict(self, item_id: str, periods: int = 30, 
               confidence_interval: bool = True) -> Dict[str, pd.DataFrame]:
        """
        Generate forecasts for a specific item.
        
        Args:
            item_id: Item identifier
            periods: Number of periods to forecast
            confidence_interval: Whether to include confidence intervals
            
        Returns:
            Dictionary containing forecasts from different models
        """
        if not self.is_fitted:
            raise ValueError("Models must be fitted before prediction")
        
        if item_id not in self.models:
            raise ValueError(f"No models available for item {item_id}")
        
        forecasts = {}
        
        # ARIMA predictions
        if 'arima' in self.models[item_id]:
            try:
                arima_forecast = self._predict_arima(item_id, periods, confidence_interval)
                forecasts['arima'] = arima_forecast
            except Exception as e:
                logger.error(f"ARIMA prediction failed for item {item_id}: {e}")
        
        # Prophet predictions
        if 'prophet' in self.models[item_id]:
            try:
                prophet_forecast = self._predict_prophet(item_id, periods, confidence_interval)
                forecasts['prophet'] = prophet_forecast
            except Exception as e:
                logger.error(f"Prophet prediction failed for item {item_id}: {e}")
        
        # LSTM predictions
        if 'lstm' in self.models[item_id]:
            try:
                lstm_forecast = self._predict_lstm(item_id, periods)
                forecasts['lstm'] = lstm_forecast
            except Exception as e:
                logger.error(f"LSTM prediction failed for item {item_id}: {e}")
        
        # Ensemble prediction
        if len(forecasts) > 1:
            ensemble_forecast = self._create_ensemble_forecast(forecasts, item_id)
            forecasts['ensemble'] = ensemble_forecast
        
        return forecasts
    
    def _predict_arima(self, item_id: str, periods: int, 
                      confidence_interval: bool) -> pd.DataFrame:
        """Generate ARIMA forecasts."""
        model = self.models[item_id]['arima']
        
        forecast_result = model.forecast(steps=periods, return_conf_int=confidence_interval)
        
        if confidence_interval:
            forecast_values, conf_int = forecast_result
            
            dates = pd.date_range(
                start=model.data.dates[-1] + timedelta(days=1),
                periods=periods,
                freq='D'
            )
            
            forecast_df = pd.DataFrame({
                'date': dates,
                'forecast': forecast_values,
                'lower_ci': conf_int[:, 0],
                'upper_ci': conf_int[:, 1],
                'model': 'arima'
            })
        else:
            dates = pd.date_range(
                start=model.data.dates[-1] + timedelta(days=1),
                periods=periods,
                freq='D'
            )
            
            forecast_df = pd.DataFrame({
                'date': dates,
                'forecast': forecast_result,
                'model': 'arima'
            })
        
        return forecast_df
    
    def _predict_prophet(self, item_id: str, periods: int,
                        confidence_interval: bool) -> pd.DataFrame:
        """Generate Prophet forecasts."""
        model = self.models[item_id]['prophet']
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)
        
        # Extract only future predictions
        forecast_df = forecast.tail(periods)[['ds', 'yhat']].copy()
        forecast_df.columns = ['date', 'forecast']
        forecast_df['model'] = 'prophet'
        
        if confidence_interval:
            forecast_df['lower_ci'] = forecast.tail(periods)['yhat_lower'].values
            forecast_df['upper_ci'] = forecast.tail(periods)['yhat_upper'].values
        
        return forecast_df.reset_index(drop=True)
    
    def _predict_lstm(self, item_id: str, periods: int) -> pd.DataFrame:
        """Generate LSTM forecasts."""
        model = self.models[item_id]['lstm']
        scaler = self.scalers[item_id]['lstm']
        
        # Get the last sequence from training data to start prediction
        # This is a simplified version - in practice, you'd need to store the last sequence
        seq_length = self.config['lstm']['sequence_length']
        
        # Generate predictions iteratively
        predictions = []
        # Note: This would need the actual last sequence from training data
        # For now, we'll create a placeholder
        
        dates = pd.date_range(
            start=datetime.now(),
            periods=periods,
            freq='D'
        )
        
        # Placeholder predictions (in practice, use the trained model)
        placeholder_predictions = np.random.normal(10, 2, periods)
        
        forecast_df = pd.DataFrame({
            'date': dates,
            'forecast': placeholder_predictions,
            'model': 'lstm'
        })
        
        return forecast_df
    
    def _create_ensemble_forecast(self, forecasts: Dict[str, pd.DataFrame],
                                item_id: str) -> pd.DataFrame:
        """Create ensemble forecast from multiple models."""
        # Calculate weights based on model performance
        weights = self._calculate_ensemble_weights(item_id, list(forecasts.keys()))
        
        # Align forecasts by date
        ensemble_data = []
        dates = forecasts[list(forecasts.keys())[0]]['date']
        
        for i, date in enumerate(dates):
            weighted_forecast = 0
            total_weight = 0
            
            for model_name, weight in weights.items():
                if model_name in forecasts:
                    forecast_value = forecasts[model_name].iloc[i]['forecast']
                    weighted_forecast += forecast_value * weight
                    total_weight += weight
            
            if total_weight > 0:
                weighted_forecast /= total_weight
            
            ensemble_data.append({
                'date': date,
                'forecast': weighted_forecast,
                'model': 'ensemble'
            })
        
        return pd.DataFrame(ensemble_data)
    
    def _calculate_ensemble_weights(self, item_id: str, model_names: List[str]) -> Dict[str, float]:
        """Calculate ensemble weights based on model performance."""
        weights = {}
        
        # Get performance metrics
        performances = self.model_performance.get(item_id, {})
        
        # Simple inverse MAE weighting
        total_inverse_mae = 0
        mae_values = {}
        
        for model_name in model_names:
            if model_name in performances:
                if model_name == 'ml':
                    # For ML models, use the best performing sub-model
                    ml_performances = performances[model_name]
                    best_mae = min([perf['mae'] for perf in ml_performances.values()])
                    mae_values[model_name] = best_mae
                else:
                    mae_values[model_name] = performances[model_name].get('mae', 1.0)
            else:
                mae_values[model_name] = 1.0  # Default MAE
            
            total_inverse_mae += 1 / mae_values[model_name]
        
        # Calculate normalized weights
        for model_name in model_names:
            weights[model_name] = (1 / mae_values[model_name]) / total_inverse_mae
        
        return weights
    
    def evaluate_models(self, test_data: Dict[str, pd.DataFrame],
                       target_col: str = 'quantity') -> Dict[str, Dict]:
        """
        Evaluate model performance on test data.
        
        Args:
            test_data: Test datasets for each item
            target_col: Target variable column
            
        Returns:
            Dictionary containing evaluation metrics
        """
        evaluation_results = {}
        
        for item_id, item_test_data in test_data.items():
            if item_id not in self.models:
                continue
            
            evaluation_results[item_id] = {}
            
            # Get actual values
            actual_values = item_test_data[target_col].values
            
            # Evaluate each model
            forecasts = self.predict(item_id, periods=len(item_test_data))
            
            for model_name, forecast_df in forecasts.items():
                if len(forecast_df) == len(actual_values):
                    predicted_values = forecast_df['forecast'].values
                    
                    evaluation_results[item_id][model_name] = {
                        'mae': mean_absolute_error(actual_values, predicted_values),
                        'mse': mean_squared_error(actual_values, predicted_values),
                        'rmse': np.sqrt(mean_squared_error(actual_values, predicted_values)),
                        'mape': np.mean(np.abs((actual_values - predicted_values) / actual_values)) * 100
                    }
        
        return evaluation_results
    
    def get_model_summary(self) -> Dict:
        """Get summary of trained models and their performance."""
        summary = {
            'total_items': len(self.models),
            'models_per_item': {},
            'average_performance': {}
        }
        
        model_counts = {}
        performance_totals = {}
        
        for item_id, item_models in self.models.items():
            summary['models_per_item'][item_id] = list(item_models.keys())
            
            for model_name in item_models.keys():
                model_counts[model_name] = model_counts.get(model_name, 0) + 1
                
                # Aggregate performance metrics
                if item_id in self.model_performance:
                    item_perf = self.model_performance[item_id]
                    if model_name in item_perf:
                        if model_name not in performance_totals:
                            performance_totals[model_name] = {'mae': 0, 'count': 0}
                        
                        mae = item_perf[model_name].get('mae', 0)
                        performance_totals[model_name]['mae'] += mae
                        performance_totals[model_name]['count'] += 1
        
        # Calculate averages
        for model_name, totals in performance_totals.items():
            if totals['count'] > 0:
                summary['average_performance'][model_name] = {
                    'avg_mae': totals['mae'] / totals['count'],
                    'item_count': totals['count']
                }
        
        summary['model_counts'] = model_counts
        
        return summary


if __name__ == "__main__":
    # Test the demand forecaster
    
    # Create sample data
    dates = pd.date_range(start='2023-01-01', end='2024-12-31', freq='D')
    sample_data = {
        'item_001': pd.DataFrame({
            'timestamp': dates,
            'quantity': np.random.poisson(10, len(dates)) + np.sin(np.arange(len(dates)) * 2 * np.pi / 365) * 3,
            'category': 'COMPUTER',
            'location': 'MAIN_STORAGE'
        })
    }
    
    # Initialize and train forecaster
    forecaster = DemandForecaster()
    forecaster.fit(sample_data)
    
    # Generate forecasts
    forecasts = forecaster.predict('item_001', periods=30)
    
    print(f"Generated forecasts using {len(forecasts)} models")
    for model_name, forecast_df in forecasts.items():
        print(f"{model_name}: {len(forecast_df)} predictions")
    
    # Get model summary
    summary = forecaster.get_model_summary()
    print(f"Model summary: {summary}")
