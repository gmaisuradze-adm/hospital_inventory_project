import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconBuildingWarehouse,
  IconEdit,
  IconTrash,
  IconPackage,
  IconUser,
  IconMapPin,
  IconHistory
} from '@tabler/icons-react';
import { warehouseAPI } from '../../core/api/apiService';

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const fetchWarehouseDetails = async () => {
      try {
        setLoading(true);
        
        if (id === 'new') {
          // Set up empty warehouse object for new warehouse form
          setWarehouse({
            name: '',
            location: '',
            capacity: 0,
            manager: '',
            description: '',
            status: 'Active',
            items: [],
            history: []
          });
        } else {
          // Fetch warehouse data for existing warehouse
          const { data } = await warehouseAPI.getById(id);
          setWarehouse(data.warehouse || mockWarehouse);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch warehouse details:', error);
        setError('Failed to fetch warehouse details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchWarehouseDetails();
  }, [id]);
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this warehouse? This action cannot be undone.')) {
      try {
        await warehouseAPI.delete(id);
        navigate('/warehouse', { replace: true });
      } catch (error) {
        setError('Failed to delete the warehouse. Please try again.');
      }
    }
  };
  
  // Mock warehouse data for development
  const mockWarehouse = {
    id: id || 'WH001',
    name: 'Main Medical Storage',
    description: 'Primary storage facility for medical supplies and equipment.',
    location: 'Building A, Floor 1',
    capacity: 5000,
    utilization: 78,
    manager: 'Sarah Johnson',
    status: 'Active',
    lastUpdated: '2023-07-15T10:30:00Z',
    items: [
      { id: 'IT001', name: 'Laptop Dell XPS', category: 'Electronics', quantity: 25, lastChecked: '2023-07-10' },
      { id: 'IT002', name: 'Monitor 24"', category: 'Electronics', quantity: 50, lastChecked: '2023-07-11' },
      { id: 'MD001', name: 'Stethoscope', category: 'Medical', quantity: 100, lastChecked: '2023-07-12' },
      { id: 'MD002', name: 'Blood Pressure Monitor', category: 'Medical', quantity: 30, lastChecked: '2023-07-13' },
      { id: 'SU001', name: 'Surgical Masks', category: 'Supplies', quantity: 5000, lastChecked: '2023-07-14' }
    ],
    history: [
      { date: '2023-07-15', action: 'Inventory audit completed', user: 'David Smith' },
      { date: '2023-07-10', action: 'New equipment added (50 laptops)', user: 'Maria Rodriguez' },
      { date: '2023-07-05', action: 'Supplies relocated from Emergency Storage', user: 'Sarah Johnson' },
      { date: '2023-06-28', action: 'Maintenance performed', user: 'Technical Team' }
    ]
  };
  
  // Calculate warehouse capacity utilization
  const getUtilizationClass = (utilization) => {
    if (utilization > 90) return 'bg-danger';
    if (utilization > 70) return 'bg-warning';
    return 'bg-success';
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  
  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                Warehouse Details
              </div>
              <h2 className="page-title d-flex align-items-center">
                <IconBuildingWarehouse size={24} className="me-2" />
                {id === 'new' ? 'Create New Warehouse' : warehouse?.name}
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/warehouse" className="btn btn-outline-primary">
                  <IconArrowLeft size={20} className="me-1" />
                  Back to List
                </Link>
                {id !== 'new' && (
                  <>
                    <Link to={`/warehouse/${id}/edit`} className="btn btn-primary">
                      <IconEdit size={20} className="me-1" />
                      Edit
                    </Link>
                    <button onClick={handleDelete} className="btn btn-danger">
                      <IconTrash size={20} className="me-1" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          
          {id === 'new' ? (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">New Warehouse Information</h3>
              </div>
              <div className="card-body">
                <form>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label required">Warehouse Name</label>
                      <input type="text" className="form-control" placeholder="Enter warehouse name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required">Location</label>
                      <input type="text" className="form-control" placeholder="Building, Floor, Room" />
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label required">Capacity</label>
                      <input type="number" className="form-control" placeholder="Max capacity (items)" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required">Manager</label>
                      <input type="text" className="form-control" placeholder="Person in charge" />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows="3" placeholder="Warehouse description and additional information"></textarea>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select className="form-select">
                        <option value="Active">Active</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-footer">
                    <Link to="/warehouse" className="btn btn-outline-secondary me-2">Cancel</Link>
                    <button type="submit" className="btn btn-primary">Save Warehouse</button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <>
              <div className="row">
                <div className="col-lg-8">
                  <div className="card mb-3">
                    <ul className="nav nav-tabs nav-fill">
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                          onClick={() => setActiveTab('overview')}
                        >
                          Overview
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
                          onClick={() => setActiveTab('inventory')}
                        >
                          Inventory
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                          onClick={() => setActiveTab('history')}
                        >
                          History
                        </button>
                      </li>
                    </ul>
                    <div className="card-body">
                      {activeTab === 'overview' && (
                        <div className="warehouse-overview">
                          <div className="mb-3">
                            <h3 className="card-title">Warehouse Information</h3>
                            <p className="text-muted">{warehouse.description}</p>
                          </div>
                          
                          <div className="mb-4">
                            <div className="datagrid">
                              <div className="datagrid-item">
                                <div className="datagrid-title">Location</div>
                                <div className="datagrid-content">
                                  <IconMapPin size={16} className="me-1" />
                                  {warehouse.location}
                                </div>
                              </div>
                              <div className="datagrid-item">
                                <div className="datagrid-title">Manager</div>
                                <div className="datagrid-content">
                                  <IconUser size={16} className="me-1" />
                                  {warehouse.manager}
                                </div>
                              </div>
                              <div className="datagrid-item">
                                <div className="datagrid-title">Status</div>
                                <div className="datagrid-content">
                                  <span className={`badge ${warehouse.status === 'Active' ? 'bg-success' : warehouse.status === 'Maintenance' ? 'bg-warning' : 'bg-danger'}`}>
                                    {warehouse.status}
                                  </span>
                                </div>
                              </div>
                              <div className="datagrid-item">
                                <div className="datagrid-title">Last Updated</div>
                                <div className="datagrid-content">
                                  {new Date(warehouse.lastUpdated).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {activeTab === 'inventory' && (
                        <div className="warehouse-inventory">
                          <div className="d-flex justify-content-between mb-3">
                            <h3 className="card-title">Stored Items</h3>
                            <Link to={`/inventory?warehouse=${id}`} className="btn btn-sm btn-outline-primary">
                              View All
                            </Link>
                          </div>
                          
                          <div className="table-responsive">
                            <table className="table table-vcenter card-table">
                              <thead>
                                <tr>
                                  <th>Item ID</th>
                                  <th>Name</th>
                                  <th>Category</th>
                                  <th>Quantity</th>
                                  <th>Last Checked</th>
                                  <th className="w-1"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {warehouse.items.map(item => (
                                  <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.name}</td>
                                    <td>
                                      <span className={`badge ${
                                        item.category === 'Electronics' ? 'bg-blue' : 
                                        item.category === 'Medical' ? 'bg-green' : 'bg-azure'
                                      }`}>
                                        {item.category}
                                      </span>
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>{item.lastChecked}</td>
                                    <td>
                                      <Link to={`/inventory/${item.id}`} className="btn btn-sm btn-icon btn-outline-primary">
                                        <IconPackage size={16} />
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {activeTab === 'history' && (
                        <div className="warehouse-history">
                          <div className="d-flex justify-content-between mb-3">
                            <h3 className="card-title">Activity History</h3>
                          </div>
                          
                          <div className="card-list">
                            {warehouse.history.map((entry, index) => (
                              <div key={index} className="card-list-item">
                                <div>
                                  <div className="d-flex align-items-center">
                                    <span className="avatar me-3 bg-azure-lt">
                                      <IconHistory size={24} />
                                    </span>
                                    <div>
                                      <div className="font-weight-medium">{entry.action}</div>
                                      <div className="text-muted">{entry.user} • {entry.date}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4">
                  <div className="card mb-3">
                    <div className="card-body">
                      <h3 className="card-title">Capacity Utilization</h3>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="h1 mb-0 me-2">{warehouse.utilization}%</div>
                          <div>{warehouse.utilization < 80 ? 'Normal' : 'High'} Usage</div>
                        </div>
                        <div className="progress progress-lg">
                          <div 
                            className={`progress-bar ${getUtilizationClass(warehouse.utilization)}`} 
                            style={{ width: `${warehouse.utilization}%` }}
                          >
                            <span>{warehouse.utilization}%</span>
                          </div>
                        </div>
                        <div className="mt-3 text-muted">
                          <span className="text-nowrap">{Math.round(warehouse.capacity * warehouse.utilization / 100)} used</span> of <span className="text-nowrap">{warehouse.capacity} items</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Quick Actions</h3>
                    </div>
                    <div className="list-group list-group-flush">
                      <Link to={`/inventory?warehouse=${id}`} className="list-group-item list-group-item-action">
                        View All Inventory Items
                      </Link>
                      <Link to="/requests/new" className="list-group-item list-group-item-action">
                        Create Supply Request
                      </Link>
                      <Link to={`/service/maintenance?location=${encodeURIComponent(warehouse.location)}`} className="list-group-item list-group-item-action">
                        Schedule Maintenance
                      </Link>
                      <Link to="/analytics/reports" className="list-group-item list-group-item-action">
                        Generate Inventory Report
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default WarehouseDetail;
