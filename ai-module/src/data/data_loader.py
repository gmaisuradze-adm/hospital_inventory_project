"""
Data loading utilities for the AI inventory optimization system.
Handles database connections and loading data from the hospital inventory system.
"""

import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from typing import Dict, List, Optional, Tuple
import os
from datetime import datetime, timedelta
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataLoader:
    """
    Handles data loading from the hospital inventory PostgreSQL database.
    """
    
    def __init__(self, db_url: str = None):
        """
        Initialize DataLoader with database connection.
        
        Args:
            db_url: PostgreSQL connection string
        """
        self.db_url = db_url or os.getenv(
            'DATABASE_URL', 
            'postgresql://postgres:postgres@localhost:5432/hospital_inventory'
        )
        self.engine = create_engine(self.db_url)
        logger.info("DataLoader initialized with database connection")
    
    def load_inventory_history(self, 
                             start_date: str = None, 
                             end_date: str = None,
                             item_ids: List[str] = None) -> pd.DataFrame:
        """
        Load historical inventory data for forecasting.
        
        Args:
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format)
            item_ids: List of specific item IDs to load
            
        Returns:
            DataFrame with inventory history
        """
        base_query = """
        SELECT 
            i.id as item_id,
            i.name,
            i.category,
            i.quantity,
            i.min_quantity,
            i.location,
            i.updated_at as timestamp,
            i.created_at
        FROM inventory_items i
        WHERE 1=1
        """
        
        conditions = []
        params = {}
        
        if start_date:
            conditions.append("i.updated_at >= :start_date")
            params['start_date'] = start_date
            
        if end_date:
            conditions.append("i.updated_at <= :end_date")
            params['end_date'] = end_date
            
        if item_ids:
            conditions.append("i.id = ANY(:item_ids)")
            params['item_ids'] = item_ids
        
        if conditions:
            base_query += " AND " + " AND ".join(conditions)
            
        base_query += " ORDER BY i.id, i.updated_at"
        
        try:
            df = pd.read_sql(text(base_query), self.engine, params=params)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            logger.info(f"Loaded {len(df)} inventory records")
            return df
        except Exception as e:
            logger.error(f"Error loading inventory history: {e}")
            raise
    
    def load_request_history(self,
                           start_date: str = None,
                           end_date: str = None) -> pd.DataFrame:
        """
        Load historical IT request data to understand demand patterns.
        
        Args:
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format)
            
        Returns:
            DataFrame with request history
        """
        query = """
        SELECT 
            r.id as request_id,
            r.title,
            r.description,
            r.request_type,
            r.priority,
            r.status,
            r.created_at,
            r.updated_at,
            u.department,
            u.role as user_role
        FROM it_requests r
        JOIN users u ON r.requested_by = u.id
        WHERE 1=1
        """
        
        conditions = []
        params = {}
        
        if start_date:
            conditions.append("r.created_at >= :start_date")
            params['start_date'] = start_date
            
        if end_date:
            conditions.append("r.created_at <= :end_date")
            params['end_date'] = end_date
        
        if conditions:
            query += " AND " + " AND ".join(conditions)
            
        query += " ORDER BY r.created_at"
        
        try:
            df = pd.read_sql(text(query), self.engine, params=params)
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['updated_at'] = pd.to_datetime(df['updated_at'])
            logger.info(f"Loaded {len(df)} IT request records")
            return df
        except Exception as e:
            logger.error(f"Error loading request history: {e}")
            raise
    
    def load_procurement_history(self,
                               start_date: str = None,
                               end_date: str = None) -> pd.DataFrame:
        """
        Load procurement request history for supply pattern analysis.
        
        Args:
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format)
            
        Returns:
            DataFrame with procurement history
        """
        query = """
        SELECT 
            p.id as procurement_id,
            p.item_name,
            p.description,
            p.quantity,
            p.unit_price,
            p.total_cost,
            p.urgency,
            p.status,
            p.created_at,
            p.updated_at,
            u.department as requester_department
        FROM procurement_requests p
        JOIN users u ON p.requested_by = u.id
        WHERE 1=1
        """
        
        conditions = []
        params = {}
        
        if start_date:
            conditions.append("p.created_at >= :start_date")
            params['start_date'] = start_date
            
        if end_date:
            conditions.append("p.created_at <= :end_date")
            params['end_date'] = end_date
        
        if conditions:
            query += " AND " + " AND ".join(conditions)
            
        query += " ORDER BY p.created_at"
        
        try:
            df = pd.read_sql(text(query), self.engine, params=params)
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['updated_at'] = pd.to_datetime(df['updated_at'])
            logger.info(f"Loaded {len(df)} procurement records")
            return df
        except Exception as e:
            logger.error(f"Error loading procurement history: {e}")
            raise
    
    def load_audit_logs(self,
                       start_date: str = None,
                       end_date: str = None,
                       resource_types: List[str] = None) -> pd.DataFrame:
        """
        Load audit logs for inventory changes tracking.
        
        Args:
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format)
            resource_types: List of resource types to filter
            
        Returns:
            DataFrame with audit logs
        """
        query = """
        SELECT 
            a.id,
            a.user_id,
            a.action,
            a.resource,
            a.resource_id,
            a.entity_type,
            a.details,
            a.old_values,
            a.new_values,
            a.created_at,
            u.department,
            u.role as user_role
        FROM audit_logs a
        JOIN users u ON a.user_id = u.id
        WHERE 1=1
        """
        
        conditions = []
        params = {}
        
        if start_date:
            conditions.append("a.created_at >= :start_date")
            params['start_date'] = start_date
            
        if end_date:
            conditions.append("a.created_at <= :end_date")
            params['end_date'] = end_date
            
        if resource_types:
            conditions.append("a.resource = ANY(:resource_types)")
            params['resource_types'] = resource_types
        
        if conditions:
            query += " AND " + " AND ".join(conditions)
            
        query += " ORDER BY a.created_at"
        
        try:
            df = pd.read_sql(text(query), self.engine, params=params)
            df['created_at'] = pd.to_datetime(df['created_at'])
            logger.info(f"Loaded {len(df)} audit log records")
            return df
        except Exception as e:
            logger.error(f"Error loading audit logs: {e}")
            raise
    
    def get_current_inventory_snapshot(self) -> pd.DataFrame:
        """
        Get current inventory state for optimization calculations.
        
        Returns:
            DataFrame with current inventory state
        """
        query = """
        SELECT 
            i.id,
            i.name,
            i.description,
            i.category,
            i.quantity,
            i.min_quantity,
            i.location,
            i.status,
            i.unit_price,
            i.purchase_date,
            i.warranty_expiry,
            i.created_at,
            i.updated_at
        FROM inventory_items i
        WHERE i.status != 'RETIRED'
        ORDER BY i.category, i.name
        """
        
        try:
            df = pd.read_sql(text(query), self.engine)
            df['purchase_date'] = pd.to_datetime(df['purchase_date'], errors='coerce')
            df['warranty_expiry'] = pd.to_datetime(df['warranty_expiry'], errors='coerce')
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['updated_at'] = pd.to_datetime(df['updated_at'])
            logger.info(f"Loaded current inventory snapshot: {len(df)} items")
            return df
        except Exception as e:
            logger.error(f"Error loading current inventory: {e}")
            raise
    
    def get_user_department_stats(self) -> pd.DataFrame:
        """
        Get user statistics by department for demand modeling.
        
        Returns:
            DataFrame with department statistics
        """
        query = """
        SELECT 
            department,
            role,
            COUNT(*) as user_count,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
        FROM users
        WHERE department IS NOT NULL
        GROUP BY department, role
        ORDER BY department, role
        """
        
        try:
            df = pd.read_sql(text(query), self.engine)
            logger.info(f"Loaded department statistics: {len(df)} records")
            return df
        except Exception as e:
            logger.error(f"Error loading department stats: {e}")
            raise
    
    def close_connection(self):
        """Close database connection."""
        if hasattr(self, 'engine'):
            self.engine.dispose()
            logger.info("Database connection closed")


# Utility functions for data loading
def load_sample_data(days_back: int = 365) -> Dict[str, pd.DataFrame]:
    """
    Load sample data for the last N days for testing and development.
    
    Args:
        days_back: Number of days to look back
        
    Returns:
        Dictionary containing different data types
    """
    loader = DataLoader()
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    data = {
        'inventory': loader.load_inventory_history(
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d')
        ),
        'requests': loader.load_request_history(
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d')
        ),
        'procurement': loader.load_procurement_history(
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d')
        ),
        'current_inventory': loader.get_current_inventory_snapshot(),
        'department_stats': loader.get_user_department_stats()
    }
    
    loader.close_connection()
    return data


if __name__ == "__main__":
    # Test data loading
    loader = DataLoader()
    
    # Test current inventory
    current = loader.get_current_inventory_snapshot()
    print(f"Current inventory items: {len(current)}")
    
    # Test department stats
    dept_stats = loader.get_user_department_stats()
    print(f"Department statistics: {len(dept_stats)} records")
    
    loader.close_connection()
