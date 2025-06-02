import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IconBoxSeam, 
  IconBuildingWarehouse, 
  IconClipboardList, 
  IconAlertTriangle,
  IconArrowUpRight,
  IconArrowDownRight
} from '@tabler/icons-react';
import { analyticsAPI } from '../../core/api/apiService';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    inventoryStats: {
      total: 0,
      lowStock: 0,
      recentlyAdded: 0,
      categories: []
    },
    warehouseStats: {
      totalWarehouses: 0,
      totalCapacity: 0,
      availableSpace: 0
    },
    requestStats: {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    },
    incidentStats: {
      open: 0,
      inProgress: 0,
      resolved: 0,
      total: 0,
      byPriority: []
    },
    inventoryTrend: {
      labels: [],
      datasets: []
    },
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await analyticsAPI.getDashboard();
        setDashboardData({
          ...data,
          loading: false
        });
      } catch (error) {
        setDashboardData({
          ...dashboardData,
          loading: false,
          error: 'Failed to load dashboard data'
        });
      }
    };

    fetchDashboardData();
  }, []);

  // Chart data for inventory trend
  const inventoryTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Inventory Items',
        data: [65, 68, 72, 75, 80, 82, 85, 87, 88, 90, 93, 95],
        fill: false,
        borderColor: 'rgb(32, 107, 196)',
        tension: 0.1
      }
    ]
  };

  // Chart data for incident priority
  const incidentPriorityData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        data: [12, 19, 8],
        backgroundColor: [
          'rgb(220, 53, 69)',
          'rgb(255, 193, 7)',
          'rgb(32, 107, 196)'
        ],
        hoverOffset: 4
      }
    ]
  };

  if (dashboardData.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="alert alert-danger" role="alert">
        {dashboardData.error}
      </div>
    );
  }

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Dashboard</h2>
              <div className="text-muted mt-1">Hospital IT Management System</div>
            </div>
            <div className="col-12 col-md-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/analytics/reports" className="btn btn-primary d-none d-sm-inline-block">
                  <IconClipboardList className="icon" />
                  View Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          {/* Stats Cards */}
          <div className="row row-deck row-cards mb-4">
            <div className="col-sm-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Inventory Items</div>
                    <div className="ms-auto lh-1">
                      <div className="text-success d-inline-flex align-items-center lh-1">
                        8% <IconArrowUpRight className="ms-1" />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline">
                    <div className="h1 mb-0 me-2">{dashboardData.inventoryStats?.total || 523}</div>
                    <div className="me-auto">
                      <span className="text-danger d-inline-flex align-items-center lh-1">
                        {dashboardData.inventoryStats?.lowStock || 42} low stock <IconAlertTriangle className="ms-1" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <Link to="/inventory" className="btn btn-sm">View all inventory</Link>
                </div>
              </div>
            </div>
            
            <div className="col-sm-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Warehouses</div>
                  </div>
                  <div className="d-flex align-items-baseline">
                    <div className="h1 mb-0 me-2">{dashboardData.warehouseStats?.totalWarehouses || 6}</div>
                    <div className="me-auto">
                      <span className="text-muted">
                        {dashboardData.warehouseStats?.availableSpace || '45%'} available space
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <Link to="/warehouse" className="btn btn-sm">Manage warehouses</Link>
                </div>
              </div>
            </div>
            
            <div className="col-sm-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Pending Requests</div>
                    <div className="ms-auto lh-1">
                      <div className="text-warning d-inline-flex align-items-center lh-1">
                        5% <IconArrowUpRight className="ms-1" />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline">
                    <div className="h1 mb-0 me-2">{dashboardData.requestStats?.pending || 18}</div>
                    <div className="me-auto">
                      <span className="text-muted">{dashboardData.requestStats?.total || 86} total</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <Link to="/requests" className="btn btn-sm">View all requests</Link>
                </div>
              </div>
            </div>
            
            <div className="col-sm-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Open Incidents</div>
                    <div className="ms-auto lh-1">
                      <div className="text-danger d-inline-flex align-items-center lh-1">
                        12% <IconArrowUpRight className="ms-1" />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline">
                    <div className="h1 mb-0 me-2">{dashboardData.incidentStats?.open || 24}</div>
                    <div className="me-auto">
                      <span className="text-muted">
                        {dashboardData.incidentStats?.inProgress || 15} in progress
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <Link to="/service/incidents" className="btn btn-sm">View incidents</Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="row mt-4">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Inventory Trend</h3>
                </div>
                <div className="card-body">
                  <div style={{ height: '240px' }}>
                    <Line 
                      data={inventoryTrendData}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
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
                  <h3 className="card-title">Incidents by Priority</h3>
                </div>
                <div className="card-body">
                  <div style={{ height: '240px' }}>
                    <Doughnut 
                      data={incidentPriorityData}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="row mt-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Inventory Changes</h3>
                </div>
                <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '24rem' }}>
                  <div className="list-group-item">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="avatar bg-blue-lt">ML</span>
                      </div>
                      <div className="col text-truncate">
                        <div className="d-block text-muted text-truncate mt-n1">
                          Updated quantity for <strong>Medical Laptops</strong>
                        </div>
                        <small className="d-block text-muted">2 hours ago</small>
                      </div>
                      <div className="col-auto">
                        <span className="badge bg-primary">+10</span>
                      </div>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="avatar bg-green-lt">PT</span>
                      </div>
                      <div className="col text-truncate">
                        <div className="d-block text-muted text-truncate mt-n1">
                          Added new item <strong>Patient Tablets</strong>
                        </div>
                        <small className="d-block text-muted">3 hours ago</small>
                      </div>
                      <div className="col-auto">
                        <span className="badge bg-success">New</span>
                      </div>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="avatar bg-red-lt">SD</span>
                      </div>
                      <div className="col text-truncate">
                        <div className="d-block text-muted text-truncate mt-n1">
                          Removed <strong>Server Disks</strong> from inventory
                        </div>
                        <small className="d-block text-muted">5 hours ago</small>
                      </div>
                      <div className="col-auto">
                        <span className="badge bg-danger">-5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Service Tickets</h3>
                </div>
                <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '24rem' }}>
                  <div className="list-group-item">
                    <div className="row">
                      <div className="col-auto">
                        <div className="badge bg-red"></div>
                      </div>
                      <div className="col">
                        <div className="text-truncate">
                          <strong>#3568:</strong> Emergency server down in Radiology department
                        </div>
                        <div className="text-muted text-truncate mt-n1">
                          Reported by Dr. Smith • High Priority
                        </div>
                      </div>
                      <div className="col-auto">
                        <a href="#" className="list-group-item-actions">
                          <IconAlertTriangle className="icon-md text-red" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="row">
                      <div className="col-auto">
                        <div className="badge bg-yellow"></div>
                      </div>
                      <div className="col">
                        <div className="text-truncate">
                          <strong>#3567:</strong> Printer not working in Administrative office
                        </div>
                        <div className="text-muted text-truncate mt-n1">
                          Reported by Jane Cooper • Medium Priority
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="list-group-item">
                    <div className="row">
                      <div className="col-auto">
                        <div className="badge bg-blue"></div>
                      </div>
                      <div className="col">
                        <div className="text-truncate">
                          <strong>#3566:</strong> Software update request for Nursing Station
                        </div>
                        <div className="text-muted text-truncate mt-n1">
                          Reported by Robert Fox • Low Priority
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
