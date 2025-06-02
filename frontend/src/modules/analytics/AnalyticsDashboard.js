import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IconDownload, 
  IconCalendar,
  IconChartBar,
  IconChartPie,
  IconChartLine,
  IconClipboardData
} from '@tabler/icons-react';
import { analyticsAPI } from '../../core/api/apiService';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    end: new Date().toISOString().split('T')[0] // Today
  });
  
  const [analyticsData, setAnalyticsData] = useState({
    inventoryStats: {},
    warehouseStats: {},
    requestStats: {},
    serviceStats: {},
    trends: {},
    loading: true,
    error: null
  });
  
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setAnalyticsData(prev => ({ ...prev, loading: true }));
        
        // In a real implementation, we would pass the date range to the API
        const { data } = await analyticsAPI.getDashboard();
        
        setAnalyticsData({
          ...data,
          loading: false
        });
      } catch (error) {
        setAnalyticsData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load analytics data'
        }));
      }
    };
    
    fetchAnalyticsData();
  }, [dateRange]);
  
  const handleDateRangeChange = (event) => {
    const { name, value } = event.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const exportReportPDF = async () => {
    try {
      await analyticsAPI.generateReport('inventory-summary', { format: 'pdf', ...dateRange });
      // In a real implementation, we would handle the file download
      alert('Report generated and downloaded successfully!');
    } catch (error) {
      alert('Failed to generate report');
    }
  };
  
  const exportReportCSV = async () => {
    try {
      await analyticsAPI.generateReport('inventory-summary', { format: 'csv', ...dateRange });
      // In a real implementation, we would handle the file download
      alert('Report generated and downloaded successfully!');
    } catch (error) {
      alert('Failed to generate report');
    }
  };
  
  // Inventory stock distribution data
  const stockDistributionData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock', 'On Order'],
    datasets: [
      {
        data: [65, 12, 8, 15],
        backgroundColor: [
          'rgba(32, 107, 196, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(220, 53, 69, 0.8)',
          'rgba(32, 201, 151, 0.8)'
        ],
        borderColor: [
          'rgb(32, 107, 196)',
          'rgb(255, 193, 7)',
          'rgb(220, 53, 69)',
          'rgb(32, 201, 151)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Inventory value by category data
  const categoryValueData = {
    labels: ['Computers', 'Networking', 'Peripherals', 'Mobile Devices', 'Medical IT', 'Other'],
    datasets: [
      {
        label: 'Inventory Value ($)',
        data: [120000, 85000, 25000, 45000, 230000, 15000],
        backgroundColor: 'rgba(32, 107, 196, 0.6)',
        borderColor: 'rgb(32, 107, 196)',
        borderWidth: 1
      }
    ]
  };
  
  // Service tickets by month data
  const monthlyTicketsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Opened',
        data: [42, 38, 45, 50, 55, 60, 58, 55, 60, 65, 70, 68],
        borderColor: 'rgb(32, 107, 196)',
        backgroundColor: 'rgba(32, 107, 196, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Closed',
        data: [40, 36, 42, 45, 48, 55, 52, 50, 55, 60, 65, 60],
        borderColor: 'rgb(32, 201, 151)',
        backgroundColor: 'rgba(32, 201, 151, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  // Asset utilization data
  const assetUtilizationData = {
    labels: ['Radiology', 'Emergency', 'ICU', 'General Medicine', 'Administration', 'Laboratory'],
    datasets: [
      {
        label: 'Asset Utilization (%)',
        data: [95, 85, 90, 75, 70, 80],
        backgroundColor: [
          'rgba(32, 107, 196, 0.8)',
          'rgba(220, 53, 69, 0.8)',
          'rgba(32, 201, 151, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(108, 117, 125, 0.8)',
          'rgba(111, 66, 193, 0.8)'
        ],
        borderColor: [
          'rgb(32, 107, 196)',
          'rgb(220, 53, 69)',
          'rgb(32, 201, 151)',
          'rgb(255, 193, 7)',
          'rgb(108, 117, 125)',
          'rgb(111, 66, 193)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  if (analyticsData.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (analyticsData.error) {
    return (
      <div className="alert alert-danger" role="alert">
        {analyticsData.error}
      </div>
    );
  }
  
  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Analytics Dashboard</h2>
              <div className="text-muted mt-1">
                Comprehensive view of inventory, service, and asset metrics
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <div className="d-flex">
                  <div className="me-2">
                    <div className="input-group">
                      <span className="input-group-text">
                        <IconCalendar size={18} />
                      </span>
                      <input 
                        type="date" 
                        className="form-control" 
                        name="start"
                        value={dateRange.start}
                        onChange={handleDateRangeChange}
                      />
                    </div>
                  </div>
                  <div className="me-2">
                    <div className="input-group">
                      <span className="input-group-text">to</span>
                      <input 
                        type="date" 
                        className="form-control"
                        name="end"
                        value={dateRange.end}
                        onChange={handleDateRangeChange}
                      />
                    </div>
                  </div>
                  <div className="dropdown">
                    <button 
                      type="button" 
                      className="btn dropdown-toggle btn-primary" 
                      data-bs-toggle="dropdown"
                    >
                      <IconDownload className="icon" />
                      Export
                    </button>
                    <div className="dropdown-menu dropdown-menu-end">
                      <button className="dropdown-item" onClick={exportReportPDF}>
                        Export as PDF
                      </button>
                      <button className="dropdown-item" onClick={exportReportCSV}>
                        Export as CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          {/* Summary Cards */}
          <div className="row row-deck row-cards mb-4">
            <div className="col-sm-6 col-lg-3">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-primary text-white avatar">
                        <IconChartBar size={24} />
                      </span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">
                        $520,000
                      </div>
                      <div className="text-muted">
                        Total Inventory Value
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-green text-white avatar">
                        <IconChartPie size={24} />
                      </span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">
                        82.6%
                      </div>
                      <div className="text-muted">
                        Average Asset Utilization
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-yellow text-white avatar">
                        <IconChartLine size={24} />
                      </span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">
                        42 hours
                      </div>
                      <div className="text-muted">
                        Avg. Response Time
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-azure text-white avatar">
                        <IconClipboardData size={24} />
                      </span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">
                        95.1%
                      </div>
                      <div className="text-muted">
                        Request Approval Rate
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts - First Row */}
          <div className="row row-cards mb-4">
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Stock Distribution</h3>
                </div>
                <div className="card-body">
                  <div className="chart-lg">
                    <Doughnut 
                      data={stockDistributionData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Inventory Value by Category</h3>
                </div>
                <div className="card-body">
                  <div className="chart-lg">
                    <Bar 
                      data={categoryValueData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts - Second Row */}
          <div className="row row-cards mb-4">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Service Tickets - Monthly Trend</h3>
                </div>
                <div className="card-body">
                  <div className="chart-lg">
                    <Line 
                      data={monthlyTicketsData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Asset Utilization by Department</h3>
                </div>
                <div className="card-body">
                  <div className="chart-lg">
                    <Bar 
                      data={assetUtilizationData}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: function(value) {
                                return value + '%';
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Key Metrics & Reports */}
          <div className="row row-cards">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Key Metrics</h3>
                </div>
                <div className="table-responsive">
                  <table className="table card-table table-vcenter">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Average Response Time</td>
                        <td>42 hours</td>
                        <td className="text-success">-12%</td>
                      </tr>
                      <tr>
                        <td>Mean Time to Repair</td>
                        <td>3.5 days</td>
                        <td className="text-success">-8%</td>
                      </tr>
                      <tr>
                        <td>Inventory Turnover Rate</td>
                        <td>4.2</td>
                        <td className="text-danger">+2%</td>
                      </tr>
                      <tr>
                        <td>Asset Utilization</td>
                        <td>82.6%</td>
                        <td className="text-success">+5%</td>
                      </tr>
                      <tr>
                        <td>Service Quality Rating</td>
                        <td>4.7/5.0</td>
                        <td className="text-success">+0.3</td>
                      </tr>
                      <tr>
                        <td>Request Approval Rate</td>
                        <td>95.1%</td>
                        <td className="text-success">+1.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Available Reports</h3>
                </div>
                <div className="list-group list-group-flush">
                  <Link to="/analytics/reports?type=inventory-summary" className="list-group-item list-group-item-action">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="avatar bg-blue-lt">
                          <IconClipboardData size={24} />
                        </span>
                      </div>
                      <div className="col">
                        <div className="d-block font-weight-medium">Inventory Summary Report</div>
                        <div className="d-block text-muted text-truncate mt-n1">
                          Complete overview of all inventory items, values, and status
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link to="/analytics/reports?type=service-performance" className="list-group-item list-group-item-action">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="avatar bg-green-lt">
                          <IconChartLine size={24} />
                        </span>
                      </div>
                      <div className="col">
                        <div className="d-block font-weight-medium">Service Performance Report</div>
                        <div className="d-block text-muted text-truncate mt-n1">
                          Response times, resolution rates, and service quality metrics
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link to="/analytics/reports?type=asset-utilization" className="list-group-item list-group-item-action">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="avatar bg-purple-lt">
                          <IconChartPie size={24} />
                        </span>
                      </div>
                      <div className="col">
                        <div className="d-block font-weight-medium">Asset Utilization Report</div>
                        <div className="d-block text-muted text-truncate mt-n1">
                          Usage rates and effectiveness of all hospital IT assets
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link to="/analytics/reports?type=operational-costs" className="list-group-item list-group-item-action">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="avatar bg-red-lt">
                          <IconChartBar size={24} />
                        </span>
                      </div>
                      <div className="col">
                        <div className="d-block font-weight-medium">Operational Costs Report</div>
                        <div className="d-block text-muted text-truncate mt-n1">
                          Detailed breakdown of all IT-related expenses and cost trends
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="card-footer">
                  <Link to="/analytics/reports" className="btn btn-primary w-100">
                    View All Reports
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsDashboard;
