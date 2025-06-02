import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  IconDownload,
  IconFilter,
  IconCalendar,
  IconClipboardData,
  IconChartLine,
  IconChartPie,
  IconChartBar,
  IconArrowLeft
} from '@tabler/icons-react';
import { analyticsAPI } from '../../core/api/apiService';

const Reports = () => {
  const [searchParams] = useSearchParams();
  const initialReportType = searchParams.get('type') || 'inventory-summary';
  
  const [selectedReport, setSelectedReport] = useState(initialReportType);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    end: new Date().toISOString().split('T')[0] // Today
  });
  const [filterOptions, setFilterOptions] = useState({
    department: 'all',
    category: 'all'
  });
  const [reportData, setReportData] = useState({
    data: [],
    loading: true,
    error: null
  });
  
  // Available report types
  const reportTypes = [
    {
      id: 'inventory-summary',
      name: 'Inventory Summary',
      icon: IconClipboardData,
      color: 'blue',
      description: 'Complete overview of all inventory items, values, and status'
    },
    {
      id: 'service-performance',
      name: 'Service Performance',
      icon: IconChartLine,
      color: 'green',
      description: 'Response times, resolution rates, and service quality metrics'
    },
    {
      id: 'asset-utilization',
      name: 'Asset Utilization',
      icon: IconChartPie,
      color: 'purple',
      description: 'Usage rates and effectiveness of all hospital IT assets'
    },
    {
      id: 'operational-costs',
      name: 'Operational Costs',
      icon: IconChartBar,
      color: 'red',
      description: 'Detailed breakdown of all IT-related expenses and cost trends'
    }
  ];
  
  const departments = [
    'all', 'Radiology', 'Emergency', 'ICU', 'General Medicine', 
    'Administration', 'Laboratory', 'Surgery', 'Nursing'
  ];
  
  const categories = [
    'all', 'Computers', 'Networking', 'Peripherals', 'Mobile Devices', 
    'Medical IT', 'Servers', 'Other'
  ];
  
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setReportData(prev => ({ ...prev, loading: true }));
        
        // In a real implementation, we would pass all parameters
        const params = {
          ...dateRange,
          ...filterOptions
        };
        
        const { data } = await analyticsAPI.getReports({ type: selectedReport, ...params });
        
        setReportData({
          data: data.items || [],
          loading: false,
          error: null
        });
      } catch (error) {
        setReportData({
          data: [],
          loading: false,
          error: 'Failed to load report data'
        });
      }
    };
    
    fetchReportData();
  }, [selectedReport, dateRange, filterOptions]);
  
  const handleReportTypeChange = (type) => {
    setSelectedReport(type);
  };
  
  const handleDateRangeChange = (event) => {
    const { name, value } = event.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const exportReport = async (format) => {
    try {
      await analyticsAPI.generateReport(selectedReport, { format, ...dateRange, ...filterOptions });
      // In a real implementation, we would handle the file download
      alert(`Report exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      alert('Failed to export report');
    }
  };
  
  const getReportContent = () => {
    if (reportData.loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }
    
    if (reportData.error) {
      return (
        <div className="alert alert-danger" role="alert">
          {reportData.error}
        </div>
      );
    }
    
    // Mock data for different report types
    if (selectedReport === 'inventory-summary') {
      return (
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Value</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>INV-001</td>
                <td>Medical Laptop XPS</td>
                <td>Computers</td>
                <td>42</td>
                <td>$54,600</td>
                <td><span className="badge bg-success">In Stock</span></td>
                <td>Warehouse A</td>
              </tr>
              <tr>
                <td>INV-002</td>
                <td>Network Switch 48-port</td>
                <td>Networking</td>
                <td>12</td>
                <td>$14,400</td>
                <td><span className="badge bg-success">In Stock</span></td>
                <td>Warehouse B</td>
              </tr>
              <tr>
                <td>INV-003</td>
                <td>Patient Tablets</td>
                <td>Mobile Devices</td>
                <td>35</td>
                <td>$17,500</td>
                <td><span className="badge bg-warning">Low Stock</span></td>
                <td>Warehouse A</td>
              </tr>
              <tr>
                <td>INV-004</td>
                <td>Medical Grade Monitors</td>
                <td>Medical IT</td>
                <td>8</td>
                <td>$28,000</td>
                <td><span className="badge bg-danger">Out of Stock</span></td>
                <td>Warehouse C</td>
              </tr>
              <tr>
                <td>INV-005</td>
                <td>Database Server</td>
                <td>Servers</td>
                <td>4</td>
                <td>$80,000</td>
                <td><span className="badge bg-success">In Stock</span></td>
                <td>Server Room</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    } else if (selectedReport === 'service-performance') {
      return (
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Issue Type</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Response Time</th>
                <th>Resolution Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>TICK-001</td>
                <td>Hardware Failure</td>
                <td>Radiology</td>
                <td><span className="badge bg-danger">High</span></td>
                <td>1.2 hours</td>
                <td>5.5 hours</td>
                <td><span className="badge bg-success">Resolved</span></td>
              </tr>
              <tr>
                <td>TICK-002</td>
                <td>Software Issue</td>
                <td>Emergency</td>
                <td><span className="badge bg-warning">Medium</span></td>
                <td>2.5 hours</td>
                <td>8 hours</td>
                <td><span className="badge bg-success">Resolved</span></td>
              </tr>
              <tr>
                <td>TICK-003</td>
                <td>Network Outage</td>
                <td>Administration</td>
                <td><span className="badge bg-danger">High</span></td>
                <td>0.5 hours</td>
                <td>4 hours</td>
                <td><span className="badge bg-success">Resolved</span></td>
              </tr>
              <tr>
                <td>TICK-004</td>
                <td>Printer Issue</td>
                <td>Nursing</td>
                <td><span className="badge bg-info">Low</span></td>
                <td>5.0 hours</td>
                <td>12 hours</td>
                <td><span className="badge bg-success">Resolved</span></td>
              </tr>
              <tr>
                <td>TICK-005</td>
                <td>Software Training</td>
                <td>Laboratory</td>
                <td><span className="badge bg-warning">Medium</span></td>
                <td>24 hours</td>
                <td>48 hours</td>
                <td><span className="badge bg-info">In Progress</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    } else if (selectedReport === 'asset-utilization') {
      return (
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Asset Type</th>
                <th>Department</th>
                <th>Total Assets</th>
                <th>Active Usage</th>
                <th>Utilization Rate</th>
                <th>Idle Time</th>
                <th>Efficiency Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Computers</td>
                <td>Radiology</td>
                <td>25</td>
                <td>22</td>
                <td>88%</td>
                <td>2.5 hrs/day</td>
                <td><span className="badge bg-success">High</span></td>
              </tr>
              <tr>
                <td>Tablets</td>
                <td>Emergency</td>
                <td>40</td>
                <td>38</td>
                <td>95%</td>
                <td>1.2 hrs/day</td>
                <td><span className="badge bg-success">High</span></td>
              </tr>
              <tr>
                <td>Printers</td>
                <td>Administration</td>
                <td>15</td>
                <td>10</td>
                <td>67%</td>
                <td>5.5 hrs/day</td>
                <td><span className="badge bg-warning">Medium</span></td>
              </tr>
              <tr>
                <td>Servers</td>
                <td>IT Infrastructure</td>
                <td>12</td>
                <td>12</td>
                <td>98%</td>
                <td>0.5 hrs/day</td>
                <td><span className="badge bg-success">High</span></td>
              </tr>
              <tr>
                <td>Medical Displays</td>
                <td>Radiology</td>
                <td>18</td>
                <td>15</td>
                <td>83%</td>
                <td>3.0 hrs/day</td>
                <td><span className="badge bg-success">High</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    } else if (selectedReport === 'operational-costs') {
      return (
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Cost Category</th>
                <th>Current Month</th>
                <th>Previous Month</th>
                <th>YTD</th>
                <th>% of Budget</th>
                <th>Change</th>
                <th>Forecast</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Hardware Purchases</td>
                <td>$42,500</td>
                <td>$38,700</td>
                <td>$358,200</td>
                <td>65%</td>
                <td><span className="text-danger">+9.8%</span></td>
                <td>$510,000</td>
              </tr>
              <tr>
                <td>Software Licenses</td>
                <td>$28,350</td>
                <td>$28,350</td>
                <td>$226,800</td>
                <td>75%</td>
                <td><span className="text-muted">0%</span></td>
                <td>$340,200</td>
              </tr>
              <tr>
                <td>Maintenance</td>
                <td>$12,800</td>
                <td>$15,200</td>
                <td>$102,400</td>
                <td>42%</td>
                <td><span className="text-success">-15.8%</span></td>
                <td>$240,000</td>
              </tr>
              <tr>
                <td>IT Staff</td>
                <td>$72,000</td>
                <td>$72,000</td>
                <td>$576,000</td>
                <td>50%</td>
                <td><span className="text-muted">0%</span></td>
                <td>$864,000</td>
              </tr>
              <tr>
                <td>Cloud Services</td>
                <td>$18,500</td>
                <td>$16,800</td>
                <td>$142,600</td>
                <td>68%</td>
                <td><span className="text-danger">+10.1%</span></td>
                <td>$222,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    
    return (
      <div className="text-center py-4">
        <p>No data available for the selected report type.</p>
      </div>
    );
  };
  
  const getSelectedReportInfo = () => {
    return reportTypes.find(report => report.id === selectedReport);
  };
  
  const reportInfo = getSelectedReportInfo();
  
  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">Analytics</div>
              <h2 className="page-title">Reports</h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/analytics" className="btn btn-outline-secondary d-none d-sm-inline-block">
                  <IconArrowLeft className="icon" />
                  Back to Dashboard
                </Link>
                <div className="dropdown">
                  <button type="button" className="btn dropdown-toggle btn-primary" data-bs-toggle="dropdown">
                    <IconDownload className="icon" />
                    Export
                  </button>
                  <div className="dropdown-menu dropdown-menu-end">
                    <button className="dropdown-item" onClick={() => exportReport('pdf')}>
                      Export as PDF
                    </button>
                    <button className="dropdown-item" onClick={() => exportReport('csv')}>
                      Export as CSV
                    </button>
                    <button className="dropdown-item" onClick={() => exportReport('excel')}>
                      Export as Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          <div className="row">
            <div className="col-lg-3">
              <div className="card mb-4">
                <div className="card-header">
                  <h3 className="card-title">Report Types</h3>
                </div>
                <div className="list-group list-group-flush">
                  {reportTypes.map(report => (
                    <button
                      key={report.id}
                      className={`list-group-item list-group-item-action d-flex align-items-center ${selectedReport === report.id ? 'active' : ''}`}
                      onClick={() => handleReportTypeChange(report.id)}
                    >
                      <span className={`avatar me-3 bg-${report.color}-lt`}>
                        <report.icon size={24} />
                      </span>
                      <span className="text-truncate">
                        {report.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Filters</h3>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Date Range</label>
                    <div className="input-group mb-3">
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
                  
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <select 
                      className="form-select" 
                      name="department"
                      value={filterOptions.department}
                      onChange={handleFilterChange}
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {dept === 'all' ? 'All Departments' : dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-select" 
                      name="category"
                      value={filterOptions.category}
                      onChange={handleFilterChange}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button className="btn btn-primary w-100">
                    <IconFilter className="icon" />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-lg-9">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <span className={`avatar avatar-sm me-2 bg-${reportInfo?.color || 'blue'}-lt`}>
                      {reportInfo && <reportInfo.icon size={18} />}
                    </span>
                    {reportInfo?.name || 'Report'}
                  </h3>
                  <div className="card-actions">
                    <span className="text-muted">
                      {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <p className="text-muted mb-4">{reportInfo?.description}</p>
                  
                  {getReportContent()}
                </div>
                <div className="card-footer text-muted">
                  Generated on {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
