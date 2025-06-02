import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconUpload,
  IconBuildingWarehouse
} from '@tabler/icons-react';
import { requestsAPI, warehouseAPI, inventoryAPI } from '../../core/api/apiService';

const CreateRequest = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Equipment',
    priority: 'Medium',
    department: '',
    warehouseId: '',
    items: []
  });
  
  // File upload state
  const [attachments, setAttachments] = useState([]);
  
  // Reference data
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true);
        
        // Fetch warehouses
        const warehousesResponse = await warehouseAPI.getAll();
        setWarehouses(warehousesResponse.data?.warehouses || mockWarehouses);
        
        // Set default warehouse if available
        if (warehousesResponse.data?.warehouses?.length > 0) {
          setFormData(prev => ({
            ...prev,
            warehouseId: warehousesResponse.data.warehouses[0].id
          }));
        }
        
        // Fetch inventory items
        const inventoryResponse = await inventoryAPI.getAll();
        setInventoryItems(inventoryResponse.data?.items || mockInventoryItems);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
        setError('Failed to load necessary data. Please try again.');
        setLoading(false);
        
        // Use mock data as fallback
        setWarehouses(mockWarehouses);
        setInventoryItems(mockInventoryItems);
      }
    };
    
    fetchReferenceData();
  }, []);
  
  // Mock data for development
  const mockWarehouses = [
    { id: 'WH001', name: 'Main Medical Storage', location: 'Building A, Floor 1' },
    { id: 'WH002', name: 'IT Equipment Storage', location: 'Building B, Floor 2' },
    { id: 'WH003', name: 'Emergency Supplies', location: 'Building A, Basement' },
    { id: 'WH004', name: 'Pharmacy Storage', location: 'Building C, Floor 1' }
  ];
  
  const mockInventoryItems = [
    { id: 'IT001', name: 'Dell XPS 15 Laptop', category: 'Electronics', price: 1500.00 },
    { id: 'IT002', name: 'Monitor 24"', category: 'Electronics', price: 250.00 },
    { id: 'MD001', name: 'Stethoscope', category: 'Medical', price: 120.00 },
    { id: 'MD002', name: 'Blood Pressure Monitor', category: 'Medical', price: 80.00 },
    { id: 'SU001', name: 'Surgical Masks (Box)', category: 'Supplies', price: 25.00 }
  ];
  
  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };
  
  const handleRemoveFile = (index) => {
    const newFiles = [...attachments];
    newFiles.splice(index, 1);
    setAttachments(newFiles);
  };
  
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { itemId: '', name: '', quantity: 1, price: 0 }
      ]
    });
  };
  
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    
    if (field === 'itemId' && value) {
      // Find the selected item
      const selectedItem = inventoryItems.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index] = {
          ...updatedItems[index],
          itemId: selectedItem.id,
          name: selectedItem.name,
          price: selectedItem.price
        };
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === 'quantity' ? parseInt(value, 10) || 1 : value
      };
    }
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Prepare request data
      const requestData = {
        ...formData,
        requester: 'Current User', // In a real app, get from auth context
        requestDate: new Date().toISOString()
      };
      
      // Upload attachments (if API supports it)
      if (attachments.length > 0) {
        // This would typically be handled with FormData in a real app
        // For mock purposes, we'll just assume it worked
        console.log('Uploading attachments:', attachments);
      }
      
      // Submit request
      const response = await requestsAPI.create(requestData);
      
      // Navigate to the new request detail page
      navigate(`/requests/${response.data.id || 'new-request'}`);
    } catch (error) {
      console.error('Failed to create request:', error);
      setError('Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Total calculation
  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };
  
  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.department.trim() !== '' &&
      formData.warehouseId.trim() !== '' &&
      formData.items.length > 0 &&
      formData.items.every(item => item.itemId && item.quantity > 0)
    );
  };
  
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
                Create New Request
              </div>
              <h2 className="page-title">
                New Supply/Equipment Request
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/requests" className="btn btn-outline-primary">
                  <IconArrowLeft size={20} className="me-1" />
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-8">
                <div className="card mb-3">
                  <div className="card-header">
                    <h3 className="card-title">Request Information</h3>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label required">Request Title</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        placeholder="Brief title describing what you need"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label required">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="4"
                        placeholder="Detailed description of what you need and why"
                        value={formData.description}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label className="form-label required">Request Type</label>
                        <select 
                          className="form-select"
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          required
                        >
                          <option value="Equipment">Equipment</option>
                          <option value="Supplies">Supplies</option>
                          <option value="Medical">Medical</option>
                          <option value="Furniture">Furniture</option>
                          <option value="Software">Software</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label required">Department</label>
                        <input
                          type="text"
                          className="form-control"
                          name="department"
                          placeholder="Your department"
                          value={formData.department}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label required">Priority</label>
                        <select 
                          className="form-select"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          required
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label required">Warehouse</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <IconBuildingWarehouse size={18} />
                        </span>
                        <select 
                          className="form-select"
                          name="warehouseId"
                          value={formData.warehouseId}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Warehouse</option>
                          {warehouses.map(warehouse => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name} - {warehouse.location}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Requested Items */}
                <div className="card mb-3">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h3 className="card-title">Requested Items</h3>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={handleAddItem}
                    >
                      <IconPlus size={18} className="me-1" />
                      Add Item
                    </button>
                  </div>
                  <div className="card-body">
                    {formData.items.length === 0 ? (
                      <div className="empty">
                        <div className="empty-icon">
                          <IconPlus size={24} />
                        </div>
                        <p className="empty-title">No items added</p>
                        <p className="empty-subtitle text-muted">
                          Start by adding items to your request
                        </p>
                        <div className="empty-action">
                          <button 
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAddItem}
                          >
                            <IconPlus size={18} className="me-1" />
                            Add First Item
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-vcenter card-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th style={{ width: '15%' }}>Quantity</th>
                              <th style={{ width: '20%' }}>Price</th>
                              <th style={{ width: '20%' }}>Total</th>
                              <th style={{ width: '5%' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <select 
                                    className="form-select"
                                    value={item.itemId}
                                    onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                                    required
                                  >
                                    <option value="">Select Item</option>
                                    {inventoryItems.map(invItem => (
                                      <option key={invItem.id} value={invItem.id}>
                                        {invItem.name} - {invItem.category}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input 
                                    type="number" 
                                    className="form-control"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    required
                                  />
                                </td>
                                <td>
                                  <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <input 
                                      type="number" 
                                      className="form-control"
                                      step="0.01" 
                                      value={item.price}
                                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                                      required
                                      disabled={item.itemId !== ''}
                                    />
                                  </div>
                                </td>
                                <td>
                                  ${(item.price * item.quantity).toFixed(2)}
                                </td>
                                <td>
                                  <button 
                                    type="button"
                                    className="btn btn-icon btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveItem(index)}
                                  >
                                    <IconTrash size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="3" className="text-end fw-bold">Total:</td>
                              <td className="fw-bold">${calculateTotal().toFixed(2)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Attachments */}
                <div className="card mb-3">
                  <div className="card-header">
                    <h3 className="card-title">Attachments</h3>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="form-label">Upload Files</div>
                      <input 
                        type="file" 
                        className="form-control"
                        multiple
                        onChange={handleFileChange}
                      />
                      <small className="form-hint">
                        Upload any relevant documents (specifications, approvals, etc.)
                      </small>
                    </div>
                    
                    {attachments.length > 0 && (
                      <div className="mt-3">
                        <label className="form-label">Uploaded Files</label>
                        <div className="row g-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="col-auto">
                              <div className="file-box">
                                <div className="d-flex align-items-center">
                                  <IconUpload size={18} className="me-2" />
                                  <div className="flex-grow-1 text-truncate" style={{ maxWidth: "200px" }}>
                                    {file.name}
                                  </div>
                                  <button 
                                    type="button"
                                    className="btn btn-icon btn-sm ms-2"
                                    onClick={() => handleRemoveFile(index)}
                                  >
                                    <IconTrash size={18} />
                                  </button>
                                </div>
                                <div className="text-muted small">
                                  {(file.size / 1024).toFixed(2)} KB
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
                {/* Summary Card */}
                <div className="card mb-3">
                  <div className="card-status-top bg-primary"></div>
                  <div className="card-header">
                    <h3 className="card-title">Request Summary</h3>
                  </div>
                  <div className="card-body">
                    <div className="datagrid mb-3">
                      <div className="datagrid-item">
                        <div className="datagrid-title">Request Type</div>
                        <div className="datagrid-content">{formData.type || 'Not selected'}</div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Priority</div>
                        <div className="datagrid-content">
                          <span className={`badge ${
                            formData.priority === 'High' ? 'bg-danger' : 
                            formData.priority === 'Medium' ? 'bg-warning' : 'bg-info'
                          }`}>
                            {formData.priority || 'Not selected'}
                          </span>
                        </div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Department</div>
                        <div className="datagrid-content">{formData.department || 'Not specified'}</div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Items</div>
                        <div className="datagrid-content">{formData.items.length} items</div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Total Cost</div>
                        <div className="datagrid-content fw-bold">${calculateTotal().toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="alert alert-info" role="alert">
                      <h4 className="alert-title">Request Process</h4>
                      <div className="text-muted">
                        After submission, your request will be reviewed by the appropriate department.
                        You'll receive notifications about status changes.
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <div className="d-flex justify-content-between">
                      <Link to="/requests" className="btn btn-outline-secondary">
                        Cancel
                      </Link>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading || !isFormValid()}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Submitting...
                          </>
                        ) : (
                          'Submit Request'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateRequest;
