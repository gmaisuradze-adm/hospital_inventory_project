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
  CubeIcon,
  SparklesIcon,
  BoltIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const AIOverview: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [selectedItemId, setSelectedItemId] = useState<string>('LAPTOP_001');
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [isLoadingOptimization, setIsLoadingOptimization] = useState(false);
  const [forecastData, setForecastData] = useState<any>(null);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'forecast' | 'optimization'>('dashboard');

  // Sample data for demonstration
  const systemStats = {
    totalItems: 1248,
    optimizedItems: 892,
    forecastAccuracy: 94.2,
    costSavings: 127500,
    activeForecasts: 156,
    alertsToday: 12
  };

  const availableItems = [
    { id: 'LAPTOP_001', name: 'Dell Laptop XPS 15', category: 'Computers', stock: 45, status: 'optimal' },
    { id: 'PRINTER_001', name: 'HP Printer LaserJet Pro', category: 'Printers', stock: 12, status: 'low' },
    { id: 'MONITOR_001', name: 'Samsung 27" Monitor', category: 'Displays', stock: 78, status: 'optimal' },
    { id: 'KEYBOARD_001', name: 'Logitech Wireless Keyboard', category: 'Peripherals', stock: 156, status: 'high' },
    { id: 'MOUSE_001', name: 'Microsoft Optical Mouse', category: 'Peripherals', stock: 89, status: 'optimal' },
    { id: 'CABLE_001', name: 'USB-C Cables (5-pack)', category: 'Accessories', stock: 8, status: 'critical' },
    { id: 'SWITCH_001', name: 'Cisco Network Switch', category: 'Network', stock: 23, status: 'optimal' },
    { id: 'ROUTER_001', name: 'Netgear WiFi Router', category: 'Network', stock: 34, status: 'optimal' }
  ];

  const recentActivity = [
    { id: 1, action: 'Optimization completed', item: 'Dell Laptop XPS 15', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'Forecast generated', item: 'HP Printer LaserJet', time: '4 hours ago', type: 'info' },
    { id: 3, action: 'Low stock alert', item: 'USB Cables', time: '6 hours ago', type: 'warning' },
    { id: 4, action: 'Reorder recommendation', item: 'Network Switch', time: '8 hours ago', type: 'info' }
  ];

  const selectedItem = availableItems.find(item => item.id === selectedItemId);

  const handleRunForecast = async () => {
    if (!token || !selectedItemId) return;

    setIsLoadingForecast(true);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setForecastData({
        success: true,
        itemId: selectedItemId,
        itemName: selectedItem?.name,
        forecast: [15, 18, 22, 16, 19, 24, 20, 17, 21, 23, 19, 16, 25, 22, 18, 20, 24, 19, 17, 21, 23, 18, 16, 20, 22, 19, 17, 24, 21, 18],
        model_used: 'ARIMA',
        model_accuracy: 0.94,
        generated_at: new Date().toISOString(),
        confidence_intervals: Array.from({length: 30}, () => [Math.random() * 5 + 15, Math.random() * 5 + 25])
      });
      
      setActiveTab('forecast');
    } catch (error) {
      console.error('Forecast error:', error);
    } finally {
      setIsLoadingForecast(false);
    }
  };

  const handleRunOptimization = async () => {
    if (!token || !selectedItemId) return;

    setIsLoadingOptimization(true);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOptimizationData({
        success: true,
        status: 'success',
        recommendations: [{
          itemId: selectedItemId,
          itemName: selectedItem?.name,
          status: 'success',
          recommendedStockLevel: 65,
          reorderPoint: 25,
          safetyStock: 15,
          optimalOrderQuantity: 40,
          expectedShortage: 0
        }],
        modelVersion: '2.1.0',
        optimizationDate: new Date().toISOString()
      });
      
      setActiveTab('optimization');
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setIsLoadingOptimization(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }: any) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      optimal: 'bg-green-100 text-green-800 border-green-200',
      low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-blue-100 text-blue-800 border-blue-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }: any) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-5 w-5 mr-2" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <SparklesIcon className="h-8 w-8 text-blue-600 mr-3" />
                  AI Inventory Intelligence
                </h1>
                <p className="mt-2 text-gray-600">Advanced machine learning for hospital inventory optimization</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 px-3 py-1 rounded-full">
                  <span className="text-green-800 text-sm font-medium">● System Online</span>
                </div>
                {!token && (
                  <div className="bg-yellow-100 px-3 py-1 rounded-full">
                    <span className="text-yellow-800 text-sm font-medium">⚠ Login Required</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <TabButton
            id="dashboard"
            label="Dashboard"
            icon={ChartBarIcon}
            isActive={activeTab === 'dashboard'}
            onClick={setActiveTab}
          />
          <TabButton
            id="forecast"
            label="Demand Forecast"
            icon={ArrowTrendingUpIcon}
            isActive={activeTab === 'forecast'}
            onClick={setActiveTab}
          />
          <TabButton
            id="optimization"
            label="Optimization"
            icon={CogIcon}
            isActive={activeTab === 'optimization'}
            onClick={setActiveTab}
          />
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={CubeIcon}
                title="Total Items"
                value={systemStats.totalItems.toLocaleString()}
                subtitle="In inventory system"
                color="blue"
              />
              <StatCard
                icon={BoltIcon}
                title="AI Optimized"
                value={systemStats.optimizedItems.toLocaleString()}
                subtitle={`${((systemStats.optimizedItems / systemStats.totalItems) * 100).toFixed(1)}% coverage`}
                color="green"
              />
              <StatCard
                icon={ChartBarIcon}
                title="Forecast Accuracy"
                value={`${systemStats.forecastAccuracy}%`}
                subtitle="Last 30 days average"
                color="purple"
              />
              <StatCard
                icon={CpuChipIcon}
                title="Cost Savings"
                value={`$${(systemStats.costSavings / 1000).toFixed(0)}k`}
                subtitle="This year"
                color="indigo"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Item Selection & Quick Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Item Selection */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <EyeIcon className="h-6 w-6 text-blue-600 mr-2" />
                    Item Analysis
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Item for AI Analysis
                      </label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        {availableItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedItem && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{selectedItem.name}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Category:</span>
                            <span className="font-medium">{selectedItem.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Stock:</span>
                            <span className="font-medium">{selectedItem.stock} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <StatusBadge status={selectedItem.status} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleRunForecast}
                      disabled={!token || isLoadingForecast || !selectedItemId}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoadingForecast ? (
                        <>
                          <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                          Generating Forecast...
                        </>
                      ) : (
                        <>
                          <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                          Generate Forecast
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleRunOptimization}
                      disabled={!token || isLoadingOptimization || !selectedItemId}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoadingOptimization ? (
                        <>
                          <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <CogIcon className="h-5 w-5 mr-2" />
                          Optimize Inventory
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{systemStats.activeForecasts}</div>
                      <div className="text-sm text-blue-600">Active Forecasts</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-700">{systemStats.alertsToday}</div>
                      <div className="text-sm text-yellow-600">Alerts Today</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">99.2%</div>
                      <div className="text-sm text-green-600">System Uptime</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.item}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <ArrowTrendingUpIcon className="h-7 w-7 text-blue-600 mr-3" />
                Demand Forecasting
              </h2>
              <button
                onClick={handleRunForecast}
                disabled={!token || isLoadingForecast}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Refresh Forecast
              </button>
            </div>

            {forecastData && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-blue-600 font-medium">Item</div>
                      <div className="text-lg font-semibold text-blue-900">{forecastData.itemName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-600 font-medium">Model Used</div>
                      <div className="text-lg font-semibold text-blue-900">{forecastData.model_used}</div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-600 font-medium">Accuracy</div>
                      <div className="text-lg font-semibold text-blue-900">{(forecastData.model_accuracy * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-600 font-medium">30-Day Total</div>
                      <div className="text-lg font-semibold text-blue-900">{forecastData.forecast.reduce((a: number, b: number) => a + b, 0).toFixed(0)} units</div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Demand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence Range</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {forecastData.forecast.slice(0, 10).map((demand: number, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Day {index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{demand.toFixed(1)} units</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {forecastData.confidence_intervals[index][0].toFixed(1)} - {forecastData.confidence_intervals[index][1].toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!forecastData && (
              <div className="text-center py-12">
                <ArrowTrendingUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No forecast data</h3>
                <p className="mt-1 text-sm text-gray-500">Select an item and click "Generate Forecast" to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Optimization Tab */}
        {activeTab === 'optimization' && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <CogIcon className="h-7 w-7 text-green-600 mr-3" />
                Inventory Optimization
              </h2>
              <button
                onClick={handleRunOptimization}
                disabled={!token || isLoadingOptimization}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Run Optimization
              </button>
            </div>

            {optimizationData && optimizationData.recommendations && (
              <div className="space-y-6">
                {optimizationData.recommendations.map((item: any, index: number) => (
                  <div key={index} className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">{item.itemName}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-green-600 font-medium">Recommended Stock</div>
                        <div className="text-2xl font-bold text-green-900">{item.recommendedStockLevel}</div>
                      </div>
                      <div>
                        <div className="text-sm text-green-600 font-medium">Reorder Point</div>
                        <div className="text-2xl font-bold text-green-900">{item.reorderPoint}</div>
                      </div>
                      <div>
                        <div className="text-sm text-green-600 font-medium">Safety Stock</div>
                        <div className="text-2xl font-bold text-green-900">{item.safetyStock}</div>
                      </div>
                      <div>
                        <div className="text-sm text-green-600 font-medium">Order Quantity</div>
                        <div className="text-2xl font-bold text-green-900">{item.optimalOrderQuantity}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!optimizationData && (
              <div className="text-center py-12">
                <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No optimization data</h3>
                <p className="mt-1 text-sm text-gray-500">Select an item and click "Run Optimization" to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Login Warning */}
        {!token && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Authentication Required</h3>
                <p className="text-yellow-700 mt-1">Please log in to access AI forecasting and optimization features.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIOverview;
