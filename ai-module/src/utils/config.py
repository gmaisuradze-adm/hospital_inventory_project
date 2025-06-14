"""
Configuration utilities for the Hospital Inventory AI Module

This module provides configuration management for database connections,
model parameters, and system settings.
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path
import json
import logging

logger = logging.getLogger(__name__)

@dataclass
class DatabaseConfig:
    """Database configuration settings"""
    host: str = "localhost"
    port: int = 5432
    database: str = "hospital_inventory"
    username: str = "postgres"
    password: str = ""
    
    @property
    def connection_string(self) -> str:
        """Generate PostgreSQL connection string"""
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
    
    @property
    def async_connection_string(self) -> str:
        """Generate async PostgreSQL connection string"""
        return f"postgresql+asyncpg://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"

@dataclass
class ModelConfig:
    """Model configuration settings"""
    # Forecasting parameters
    forecast_horizon: int = 30
    min_history_days: int = 90
    seasonality_period: int = 30
    
    # ARIMA parameters
    arima_max_p: int = 3
    arima_max_d: int = 2
    arima_max_q: int = 3
    
    # LSTM parameters
    lstm_sequence_length: int = 10
    lstm_epochs: int = 100
    lstm_batch_size: int = 32
    lstm_units: int = 50
    
    # Random Forest parameters
    rf_n_estimators: int = 100
    rf_max_depth: int = 10
    rf_random_state: int = 42
    
    # Prophet parameters
    prophet_seasonality_mode: str = 'additive'
    prophet_yearly_seasonality: bool = True
    prophet_weekly_seasonality: bool = True
    prophet_daily_seasonality: bool = False

@dataclass
class InventoryConfig:
    """Inventory optimization configuration"""
    # Service levels
    default_service_level: float = 0.95
    critical_service_level: float = 0.99
    
    # Cost parameters
    default_holding_cost_rate: float = 0.25
    default_ordering_cost: float = 150.0
    
    # Safety factors
    safety_factor_z: float = 1.96  # 95% confidence
    
    # ABC analysis thresholds
    abc_a_threshold: float = 0.8  # 80% of value
    abc_b_threshold: float = 0.95  # 95% of value
    
    # Optimization parameters
    min_order_quantity: int = 1
    max_order_quantity: int = 10000

@dataclass
class SystemConfig:
    """System-wide configuration"""
    # Logging
    log_level: str = "INFO"
    log_file: str = "ai_inventory.log"
    
    # Caching
    cache_enabled: bool = True
    cache_ttl: int = 3600  # 1 hour
    
    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    
    # Monitoring
    monitoring_enabled: bool = True
    alert_email: str = ""
    alert_thresholds: Dict[str, float] = None
    
    def __post_init__(self):
        if self.alert_thresholds is None:
            self.alert_thresholds = {
                'forecast_accuracy': 0.7,
                'stock_level_critical': 0.1,
                'cost_variance': 0.2
            }

class ConfigManager:
    """
    Configuration manager for the AI inventory system
    """
    
    def __init__(self, config_file: Optional[str] = None):
        """
        Initialize configuration manager
        
        Args:
            config_file: Path to configuration file (JSON format)
        """
        self.config_file = config_file or os.getenv('AI_CONFIG_FILE', 'config.json')
        self.config_dir = Path(__file__).parent.parent.parent / 'config'
        self.config_path = self.config_dir / self.config_file
        
        # Default configurations
        self.database = DatabaseConfig()
        self.model = ModelConfig()
        self.inventory = InventoryConfig()
        self.system = SystemConfig()
        
        # Load configuration from file if exists
        self._load_config()
        
        # Override with environment variables
        self._load_env_config()
    
    def _load_config(self):
        """Load configuration from JSON file"""
        if self.config_path.exists():
            try:
                with open(self.config_path, 'r') as f:
                    config_data = json.load(f)
                
                # Update configurations
                if 'database' in config_data:
                    self._update_dataclass(self.database, config_data['database'])
                
                if 'model' in config_data:
                    self._update_dataclass(self.model, config_data['model'])
                
                if 'inventory' in config_data:
                    self._update_dataclass(self.inventory, config_data['inventory'])
                
                if 'system' in config_data:
                    self._update_dataclass(self.system, config_data['system'])
                
                logger.info(f"Configuration loaded from {self.config_path}")
                
            except Exception as e:
                logger.warning(f"Failed to load configuration from {self.config_path}: {e}")
    
    def _load_env_config(self):
        """Load configuration from environment variables"""
        # Database configuration
        if os.getenv('DB_HOST'):
            self.database.host = os.getenv('DB_HOST')
        if os.getenv('DB_PORT'):
            self.database.port = int(os.getenv('DB_PORT'))
        if os.getenv('DB_NAME'):
            self.database.database = os.getenv('DB_NAME')
        if os.getenv('DB_USER'):
            self.database.username = os.getenv('DB_USER')
        if os.getenv('DB_PASSWORD'):
            self.database.password = os.getenv('DB_PASSWORD')
        
        # System configuration
        if os.getenv('LOG_LEVEL'):
            self.system.log_level = os.getenv('LOG_LEVEL')
        if os.getenv('API_PORT'):
            self.system.api_port = int(os.getenv('API_PORT'))
        if os.getenv('ALERT_EMAIL'):
            self.system.alert_email = os.getenv('ALERT_EMAIL')
    
    def _update_dataclass(self, dataclass_obj, config_dict: Dict[str, Any]):
        """Update dataclass with configuration dictionary"""
        for key, value in config_dict.items():
            if hasattr(dataclass_obj, key):
                setattr(dataclass_obj, key, value)
    
    def save_config(self):
        """Save current configuration to file"""
        try:
            # Create config directory if it doesn't exist
            self.config_dir.mkdir(exist_ok=True)
            
            # Prepare configuration data
            config_data = {
                'database': self._dataclass_to_dict(self.database),
                'model': self._dataclass_to_dict(self.model),
                'inventory': self._dataclass_to_dict(self.inventory),
                'system': self._dataclass_to_dict(self.system)
            }
            
            # Save to file
            with open(self.config_path, 'w') as f:
                json.dump(config_data, f, indent=2)
            
            logger.info(f"Configuration saved to {self.config_path}")
            
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
    
    def _dataclass_to_dict(self, dataclass_obj) -> Dict[str, Any]:
        """Convert dataclass to dictionary"""
        return {
            field: getattr(dataclass_obj, field)
            for field in dataclass_obj.__dataclass_fields__
            if not field.startswith('_')
        }
    
    def get_model_config(self, model_type: str) -> Dict[str, Any]:
        """Get configuration for specific model type"""
        if model_type.lower() == 'arima':
            return {
                'max_p': self.model.arima_max_p,
                'max_d': self.model.arima_max_d,
                'max_q': self.model.arima_max_q
            }
        elif model_type.lower() == 'lstm':
            return {
                'sequence_length': self.model.lstm_sequence_length,
                'epochs': self.model.lstm_epochs,
                'batch_size': self.model.lstm_batch_size,
                'units': self.model.lstm_units
            }
        elif model_type.lower() == 'random_forest':
            return {
                'n_estimators': self.model.rf_n_estimators,
                'max_depth': self.model.rf_max_depth,
                'random_state': self.model.rf_random_state
            }
        elif model_type.lower() == 'prophet':
            return {
                'seasonality_mode': self.model.prophet_seasonality_mode,
                'yearly_seasonality': self.model.prophet_yearly_seasonality,
                'weekly_seasonality': self.model.prophet_weekly_seasonality,
                'daily_seasonality': self.model.prophet_daily_seasonality
            }
        else:
            return {}
    
    def get_inventory_config_for_category(self, abc_category: str) -> Dict[str, Any]:
        """Get inventory configuration based on ABC category"""
        if abc_category.upper() == 'A':
            service_level = self.inventory.critical_service_level
        else:
            service_level = self.inventory.default_service_level
        
        return {
            'service_level': service_level,
            'holding_cost_rate': self.inventory.default_holding_cost_rate,
            'ordering_cost': self.inventory.default_ordering_cost,
            'safety_factor': self.inventory.safety_factor_z
        }

# Global configuration instance
config = ConfigManager()

# Utility functions
def get_database_url() -> str:
    """Get database connection URL"""
    return config.database.connection_string

def get_async_database_url() -> str:
    """Get async database connection URL"""
    return config.database.async_connection_string

def get_model_config(model_type: str) -> Dict[str, Any]:
    """Get model-specific configuration"""
    return config.get_model_config(model_type)

def get_inventory_config(abc_category: str = 'B') -> Dict[str, Any]:
    """Get inventory configuration for ABC category"""
    return config.get_inventory_config_for_category(abc_category)

def setup_logging():
    """Setup logging configuration"""
    logging.basicConfig(
        level=getattr(logging, config.system.log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(config.system.log_file),
            logging.StreamHandler()
        ]
    )

# Initialize logging
setup_logging()
