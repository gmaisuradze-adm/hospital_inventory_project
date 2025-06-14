import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  ArrowTrendingUpIcon, 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

interface ForecastItem {
  itemId: string;
  itemName: string;
  forecast: number[];
  model_used: string;
  model_accuracy?: number;
  confidence_intervals?: Array<[number, number]>;
}

interface ForecastResponse {
  success: boolean;
  status: string;
  itemId: string;
  itemName: string;
  forecast: number[];
  model_used: string;
  model_accuracy?: number;
  confidence_intervals?: Array<[number, number]>;
  forecast_horizon: number;
  generated_at: string;
}

interface OptimizationItem {
  itemId: string;
  itemName: string;
  status: string;
  recommendedStockLevel: number;
  reorderPoint: number;
  safetyStock: number;
  optimalOrderQuantity: number;
  expectedShortage: number;
  reason?: string;
}

interface OptimizationResponse {
  success: boolean;
  status: string;
  recommendations: OptimizationItem[];
  modelVersion: string;
  optimizationDate: string;
}

const AIOverview: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [optimizationData, setOptimizationData] = useState<OptimizationResponse | null>(null);
  const [isLoadingOptimization, setIsLoadingOptimization] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);

  // Sample item IDs for testing - in a real app these would come from inventory API
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [availableItems, setAvailableItems] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    // Fetch available inventory items for the dropdown
    const fetchInventoryItems = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('/api/inventory?limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setAvailableItems(data.items || []);
          if (data.items && data.items.length > 0) {
            setSelectedItemId(data.items[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch inventory items:', error);
        // Fallback to hardcoded items if API fails
        const fallbackItems = [
          { id: 'item1', name: 'Dell OptiPlex 7090' },
          { id: 'item2', name: 'HP LaserJet Pro M404n' },
          { id: 'item3', name: 'Cisco Catalyst 2960-X' }
        ];
        setAvailableItems(fallbackItems);
        setSelectedItemId(fallbackItems[0].id);
      }
    };

    fetchInventoryItems();
  }, [token]);

  const handleRunForecast = async () => {
    if (!token) {
      setForecastError('Authentication required. Please log in.');
      return;
    }

    if (!selectedItemId) {
      setForecastError('Please select an item for forecasting.');
      return;
    }

    setIsLoadingForecast(true);
    setForecastError(null);
    setForecastData(null);

    try {
      const response = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemId: selectedItemId,
          forecastHorizon: 30,
          modelType: 'auto'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ForecastResponse = await response.json();
      setForecastData(data);
    } catch (err: any) {
      setForecastError(err.message || 'Failed to fetch forecast data.');
    } finally {
      setIsLoadingForecast(false);
    }
  };

  const handleRunOptimization = async () => {
    if (!token) {
      setOptimizationError('Authentication required. Please log in.');
      return;
    }

    if (!selectedItemId) {
      setOptimizationError('Please select an item for optimization.');
      return;
    }

    setIsLoadingOptimization(true);
    setOptimizationError(null);
    setOptimizationData(null);

    try {
      const response = await fetch('/api/ai/optimize', {
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemId: selectedItemId,
          serviceLevel: 0.95,
          holdingCostRate: 0.25,
          orderingCost: 150
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: OptimizationResponse = await response.json();
      setOptimizationData(data);
    } catch (err: any) {
      setOptimizationError(err.message || 'Failed to fetch optimization data.');
    } finally {
      setIsLoadingOptimization(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">AI-Powered Inventory Management</h1>
        
        {/* Item Selection */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3 text-indigo-600">Select Item for Analysis</h2>
          <div className="flex items-center space-x-4">
            <label htmlFor="item-select" className="text-sm font-medium text-gray-700">
              Choose an inventory item:
            </label>
            <select
              id="item-select"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {!token && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
              <p className="text-sm">Please log in to access AI features.</p>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3 text-indigo-600">Demand Forecasting</h2>
          <p className="mb-4 text-gray-600">
            Utilize advanced machine learning models to predict future demand for IT inventory items. 
            Click the button below to generate the latest forecast.
          </p>
          <button
            onClick={handleRunForecast}
            disabled={isLoadingForecast}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingForecast ? 'Generating Forecast...' : 'Run Demand Forecast'}
          </button>
        </div>

        {isLoadingForecast && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading forecast data...</p>
          </div>
        )}

        {forecastError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{forecastError}</span>
          </div>
        )}

        {forecastData && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">Forecast Results</h2>
            <p className="text-sm text-gray-500 mb-1">Model Used: {forecastData.model_used}</p>
            <p className="text-sm text-gray-500 mb-1">Item: {forecastData.itemName}</p>
            <p className="text-sm text-gray-500 mb-4">Generated: {new Date(forecastData.generated_at).toLocaleDateString()}</p>
            
            {forecastData.model_accuracy && (
              <p className="text-sm text-green-600 mb-4">Model Accuracy: {(forecastData.model_accuracy * 100).toFixed(1)}%</p>
            )}
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Predicted Demand
                    </th>
                    {forecastData.confidence_intervals && (
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Confidence Interval
                       </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forecastData.forecast.slice(0, 10).map((demand, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Day {index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{demand.toFixed(1)}</td>
                      {forecastData.confidence_intervals && forecastData.confidence_intervals[index] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {forecastData.confidence_intervals[index][0].toFixed(1)} - {forecastData.confidence_intervals[index][1].toFixed(1)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Forecast Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Demand (30 days):</span>
                  <div className="font-semibold text-blue-800">{forecastData.forecast.reduce((a, b) => a + b, 0).toFixed(1)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Average Daily Demand:</span>
                  <div className="font-semibold text-blue-800">{(forecastData.forecast.reduce((a, b) => a + b, 0) / forecastData.forecast.length).toFixed(1)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Peak Demand:</span>
                  <div className="font-semibold text-blue-800">{Math.max(...forecastData.forecast).toFixed(1)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Forecast Horizon:</span>
                  <div className="font-semibold text-blue-800">{forecastData.forecast_horizon} days</div>
                </div>
              </div>
            </div>
            
            {forecastData.forecast.length === 0 && (
              <p className="text-center text-gray-500 py-4">No forecast data available.</p>
            )}
          </div>
        )}
        
        {/* Inventory Optimization Section */}
        <div className="mt-8 bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3 text-indigo-600">Inventory Optimization</h2>
          <p className="mb-4 text-gray-600">
            Get AI-driven recommendations for optimizing stock levels, reorder points, and reducing holding costs.
          </p>
          <button
            onClick={handleRunOptimization}
            disabled={isLoadingOptimization}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingOptimization ? 'Generating Recommendations...' : 'Run Inventory Optimization'}
          </button>
        </div>

        {isLoadingOptimization && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading optimization recommendations...</p>
          </div>
        )}

        {optimizationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{optimizationError}</span>
          </div>
        )}

        {optimizationData && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">Optimization Recommendations</h2>
            <p className="text-sm text-gray-500 mb-1">Model Version: {optimizationData.modelVersion}</p>
            <p className="text-sm text-gray-500 mb-4">Generated: {new Date(optimizationData.optimizationDate).toLocaleDateString()}</p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recommended Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reorder Point
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Safety Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {optimizationData.recommendations.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.status === 'success' ? item.recommendedStockLevel : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.status === 'success' ? item.reorderPoint : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.status === 'success' ? item.safetyStock : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.status === 'success' ? item.optimalOrderQuantity : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {optimizationData.recommendations.some(item => item.reason) && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Notes</h3>
                {optimizationData.recommendations
                  .filter(item => item.reason)
                  .map((item, index) => (
                    <p key={index} className="text-sm text-yellow-700 mb-1">
                      <strong>{item.itemName}:</strong> {item.reason}
                    </p>
                  ))}
              </div>
            )}
            
            {optimizationData.recommendations.length === 0 && (
              <p className="text-center text-gray-500 py-4">No optimization recommendations available.</p>
            )}
          </div>
        )}

        <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
           <h2 className="text-xl font-semibold mb-3 text-indigo-600">Analytics & Reporting (Coming Soon)</h2>
           <p className="text-gray-600">
            Visualize demand trends, model accuracy, and key performance indicators for inventory management.
            This feature is currently under development.
           </p>
        </div>

      </div>
    </div>
  );
};

export default AIOverview;
