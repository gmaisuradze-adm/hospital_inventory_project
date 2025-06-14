"""
Visualization Module for AI-Powered Hospital Inventory System

This module provides comprehensive visualization capabilities for:
- Demand forecasting results
- Inventory optimization outcomes
- Performance metrics and KPIs
- Interactive dashboards
- Statistical analysis plots
"""

import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# Set style
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class InventoryVisualizer:
    """
    Comprehensive visualization suite for inventory analysis and optimization
    """
    
    def __init__(self, figsize: Tuple[int, int] = (12, 8)):
        """
        Initialize the visualizer
        
        Args:
            figsize: Default figure size for matplotlib plots
        """
        self.figsize = figsize
        self.colors = px.colors.qualitative.Set3
    
    def plot_demand_forecast(self,
                           historical_data: pd.Series,
                           forecast_data: pd.Series,
                           confidence_intervals: Optional[pd.DataFrame] = None,
                           title: str = "Demand Forecast Analysis") -> go.Figure:
        """
        Create interactive demand forecast visualization
        
        Args:
            historical_data: Historical demand data
            forecast_data: Forecasted demand data
            confidence_intervals: Optional confidence intervals
            title: Plot title
            
        Returns:
            Plotly figure object
        """
        fig = go.Figure()
        
        # Historical data
        fig.add_trace(go.Scatter(
            x=historical_data.index,
            y=historical_data.values,
            mode='lines+markers',
            name='Historical Demand',
            line=dict(color='blue', width=2),
            marker=dict(size=4)
        ))
        
        # Forecast data
        fig.add_trace(go.Scatter(
            x=forecast_data.index,
            y=forecast_data.values,
            mode='lines+markers',
            name='Forecasted Demand',
            line=dict(color='red', width=2, dash='dash'),
            marker=dict(size=4)
        ))
        
        # Confidence intervals
        if confidence_intervals is not None:
            fig.add_trace(go.Scatter(
                x=confidence_intervals.index,
                y=confidence_intervals['upper'],
                mode='lines',
                line=dict(width=0),
                showlegend=False,
                hoverinfo='skip'
            ))
            
            fig.add_trace(go.Scatter(
                x=confidence_intervals.index,
                y=confidence_intervals['lower'],
                mode='lines',
                line=dict(width=0),
                fill='tonexty',
                fillcolor='rgba(255, 0, 0, 0.2)',
                name='Confidence Interval',
                hoverinfo='skip'
            ))
        
        fig.update_layout(
            title=title,
            xaxis_title='Time Period',
            yaxis_title='Demand Quantity',
            hovermode='x unified',
            template='plotly_white'
        )
        
        return fig
    
    def plot_inventory_optimization_results(self,
                                          optimization_results: pd.DataFrame,
                                          title: str = "Inventory Optimization Results") -> go.Figure:
        """
        Visualize inventory optimization results for multiple items
        
        Args:
            optimization_results: DataFrame with optimization results
            title: Plot title
            
        Returns:
            Plotly figure with subplots
        """
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=['EOQ Distribution', 'Reorder Point Analysis', 
                          'ABC Category Distribution', 'Cost vs Service Level'],
            specs=[[{"secondary_y": False}, {"secondary_y": False}],
                   [{"type": "pie"}, {"secondary_y": False}]]
        )
        
        # EOQ Distribution
        fig.add_trace(
            go.Histogram(
                x=optimization_results['optimal_order_quantity'],
                name='EOQ Distribution',
                marker_color='lightblue'
            ),
            row=1, col=1
        )
        
        # Reorder Point Analysis
        fig.add_trace(
            go.Scatter(
                x=optimization_results['reorder_point'],
                y=optimization_results['safety_stock'],
                mode='markers',
                name='Reorder vs Safety Stock',
                marker=dict(
                    size=8,
                    color=optimization_results['total_cost'],
                    colorscale='Viridis',
                    showscale=True
                )
            ),
            row=1, col=2
        )
        
        # ABC Category Distribution
        abc_counts = optimization_results['abc_category'].value_counts()
        fig.add_trace(
            go.Pie(
                labels=abc_counts.index,
                values=abc_counts.values,
                name="ABC Categories"
            ),
            row=2, col=1
        )
        
        # Cost vs Service Level
        fig.add_trace(
            go.Scatter(
                x=optimization_results['service_level'],
                y=optimization_results['total_cost'],
                mode='markers',
                name='Cost vs Service',
                marker=dict(size=8, color='red')
            ),
            row=2, col=2
        )
        
        fig.update_layout(
            title=title,
            showlegend=True,
            template='plotly_white'
        )
        
        return fig
    
    def plot_abc_analysis(self,
                         abc_data: pd.DataFrame,
                         value_column: str = 'annual_value') -> go.Figure:
        """
        Create ABC analysis visualization
        
        Args:
            abc_data: DataFrame with ABC analysis results
            value_column: Column containing values for analysis
            
        Returns:
            Plotly figure
        """
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=['Cumulative Value Distribution', 'Category Breakdown']
        )
        
        # Cumulative distribution
        fig.add_trace(
            go.Scatter(
                x=np.arange(len(abc_data)),
                y=abc_data['cumulative_percentage'],
                mode='lines+markers',
                name='Cumulative %',
                line=dict(color='blue', width=3)
            ),
            row=1, col=1
        )
        
        # Add 80-20 rule lines
        fig.add_hline(y=80, line_dash="dash", line_color="red", 
                     annotation_text="80% Value", row=1, col=1)
        
        # Category breakdown bar chart
        category_stats = abc_data.groupby('abc_category').agg({
            value_column: ['count', 'sum']
        }).round(2)
        
        fig.add_trace(
            go.Bar(
                x=category_stats.index,
                y=category_stats[(value_column, 'count')],
                name='Item Count',
                marker_color='lightgreen'
            ),
            row=1, col=2
        )
        
        fig.update_layout(
            title="ABC Analysis Results",
            template='plotly_white'
        )
        
        return fig
    
    def plot_model_performance_comparison(self,
                                        model_results: Dict[str, Dict[str, float]],
                                        title: str = "Model Performance Comparison") -> go.Figure:
        """
        Compare performance of different forecasting models
        
        Args:
            model_results: Dictionary with model names and their metrics
            title: Plot title
            
        Returns:
            Plotly figure
        """
        models = list(model_results.keys())
        metrics = list(model_results[models[0]].keys())
        
        fig = go.Figure()
        
        for metric in metrics:
            values = [model_results[model][metric] for model in models]
            fig.add_trace(go.Bar(
                name=metric,
                x=models,
                y=values,
                text=[f'{v:.3f}' for v in values],
                textposition='auto'
            ))
        
        fig.update_layout(
            title=title,
            xaxis_title='Models',
            yaxis_title='Metric Values',
            barmode='group',
            template='plotly_white'
        )
        
        return fig
    
    def plot_inventory_dashboard(self,
                               inventory_data: pd.DataFrame,
                               demand_data: pd.DataFrame) -> go.Figure:
        """
        Create comprehensive inventory dashboard
        
        Args:
            inventory_data: Current inventory levels
            demand_data: Historical demand data
            
        Returns:
            Interactive dashboard figure
        """
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=[
                'Current Stock Levels', 'Stock Turnover Rate',
                'Demand Trend', 'Stockout Risk',
                'Cost Analysis', 'Performance KPIs'
            ],
            specs=[[{"secondary_y": False}, {"secondary_y": False}],
                   [{"colspan": 2}, None],
                   [{"secondary_y": False}, {"type": "indicator"}]]
        )
        
        # Current Stock Levels
        fig.add_trace(
            go.Bar(
                x=inventory_data['item_name'][:10],  # Top 10 items
                y=inventory_data['current_stock'][:10],
                name='Current Stock',
                marker_color='lightblue'
            ),
            row=1, col=1
        )
        
        # Stock Turnover
        if 'turnover_rate' in inventory_data.columns:
            fig.add_trace(
                go.Scatter(
                    x=inventory_data['item_name'][:10],
                    y=inventory_data['turnover_rate'][:10],
                    mode='markers+lines',
                    name='Turnover Rate',
                    marker=dict(size=10, color='red')
                ),
                row=1, col=2
            )
        
        # Demand Trend
        fig.add_trace(
            go.Scatter(
                x=demand_data.index,
                y=demand_data.values if hasattr(demand_data, 'values') else demand_data,
                mode='lines',
                name='Demand Trend',
                line=dict(color='green', width=2)
            ),
            row=2, col=1
        )
        
        # Performance KPIs
        total_value = inventory_data['current_stock'].sum() if 'current_stock' in inventory_data.columns else 0
        fig.add_trace(
            go.Indicator(
                mode="gauge+number+delta",
                value=total_value,
                title={'text': "Total Inventory Value"},
                gauge={'axis': {'range': [None, total_value * 1.5]},
                      'bar': {'color': "darkblue"},
                      'steps': [{'range': [0, total_value * 0.5], 'color': "lightgray"},
                               {'range': [total_value * 0.5, total_value], 'color': "gray"}],
                      'threshold': {'line': {'color': "red", 'width': 4},
                                   'thickness': 0.75, 'value': total_value * 1.2}}
            ),
            row=3, col=2
        )
        
        fig.update_layout(
            title="Hospital Inventory Dashboard",
            showlegend=True,
            template='plotly_white',
            height=800
        )
        
        return fig
    
    def plot_seasonal_analysis(self,
                             demand_data: pd.Series,
                             title: str = "Seasonal Demand Analysis") -> go.Figure:
        """
        Analyze and visualize seasonal patterns in demand
        
        Args:
            demand_data: Time series demand data
            title: Plot title
            
        Returns:
            Plotly figure with seasonal decomposition
        """
        try:
            from statsmodels.tsa.seasonal import seasonal_decompose
            
            # Perform seasonal decomposition
            decomposition = seasonal_decompose(demand_data, model='additive', period=12)
            
            fig = make_subplots(
                rows=4, cols=1,
                subplot_titles=['Original', 'Trend', 'Seasonal', 'Residual'],
                vertical_spacing=0.08
            )
            
            # Original series
            fig.add_trace(
                go.Scatter(x=demand_data.index, y=demand_data.values,
                          mode='lines', name='Original', line=dict(color='blue')),
                row=1, col=1
            )
            
            # Trend
            fig.add_trace(
                go.Scatter(x=decomposition.trend.index, y=decomposition.trend.values,
                          mode='lines', name='Trend', line=dict(color='red')),
                row=2, col=1
            )
            
            # Seasonal
            fig.add_trace(
                go.Scatter(x=decomposition.seasonal.index, y=decomposition.seasonal.values,
                          mode='lines', name='Seasonal', line=dict(color='green')),
                row=3, col=1
            )
            
            # Residual
            fig.add_trace(
                go.Scatter(x=decomposition.resid.index, y=decomposition.resid.values,
                          mode='lines', name='Residual', line=dict(color='orange')),
                row=4, col=1
            )
            
            fig.update_layout(
                title=title,
                showlegend=False,
                template='plotly_white',
                height=800
            )
            
            return fig
            
        except ImportError:
            # Fallback to simple seasonal plot
            return self._simple_seasonal_plot(demand_data, title)
    
    def _simple_seasonal_plot(self, demand_data: pd.Series, title: str) -> go.Figure:
        """Simple seasonal plot when statsmodels is not available"""
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=demand_data.index,
            y=demand_data.values,
            mode='lines+markers',
            name='Demand',
            line=dict(color='blue', width=2)
        ))
        
        fig.update_layout(
            title=title,
            xaxis_title='Time',
            yaxis_title='Demand',
            template='plotly_white'
        )
        
        return fig
    
    def save_dashboard_html(self,
                          figures: List[go.Figure],
                          filename: str = "inventory_dashboard.html",
                          title: str = "Hospital Inventory AI Dashboard"):
        """
        Save multiple figures as an HTML dashboard
        
        Args:
            figures: List of Plotly figures
            filename: Output HTML filename
            title: Dashboard title
        """
        from plotly.offline import plot
        import plotly.graph_objects as go
        
        # Create HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{title}</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .dashboard-header {{ text-align: center; margin-bottom: 30px; }}
                .chart-container {{ margin-bottom: 30px; }}
            </style>
        </head>
        <body>
            <div class="dashboard-header">
                <h1>{title}</h1>
                <p>Generated on {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
        """
        
        # Add each figure
        for i, fig in enumerate(figures):
            div_id = f"chart_{i}"
            html_content += f'<div class="chart-container" id="{div_id}"></div>\n'
            
        html_content += """
        <script>
        """
        
        for i, fig in enumerate(figures):
            div_id = f"chart_{i}"
            fig_json = fig.to_json()
            html_content += f"""
            Plotly.newPlot('{div_id}', {fig_json});
            """
        
        html_content += """
        </script>
        </body>
        </html>
        """
        
        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Dashboard saved to {filename}")

def create_sample_visualizations():
    """Create sample visualizations for demonstration"""
    visualizer = InventoryVisualizer()
    
    # Sample data
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    demand_data = pd.Series(
        np.random.poisson(10, 100) + np.sin(np.arange(100) * 2 * np.pi / 30) * 2,
        index=dates
    )
    
    forecast_dates = pd.date_range('2023-04-11', periods=30, freq='D')
    forecast_data = pd.Series(
        np.random.poisson(12, 30) + np.sin(np.arange(30) * 2 * np.pi / 30) * 2,
        index=forecast_dates
    )
    
    # Create visualizations
    forecast_fig = visualizer.plots_demand_forecast(
        demand_data[-30:], forecast_data
    )
    
    return [forecast_fig]
