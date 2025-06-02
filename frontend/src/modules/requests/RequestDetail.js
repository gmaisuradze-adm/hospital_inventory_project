import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconClipboard,
  IconEdit,
  IconTrash,
  IconPackage,
  IconUser,
  IconClock,
  IconBuildingWarehouse,
  IconEye,
  IconCheck,
  IconX,
  IconMessageCircle,
  IconSend,
  IconAlertTriangle,
  IconFileDescription
} from '@tabler/icons-react';
import { requestsAPI } from '../../core/api/apiService';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  
  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        setLoading(true);
        const { data } = await requestsAPI.getById(id);
        setRequest(data.request || mockRequest);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch request details:', error);
        setError('Failed to fetch request details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchRequestDetails();
  }, [id]);
  
  // Mock request data for development
  const mockRequest = {
    id: id || 'REQ001',
    title: 'New Laptops for IT Department',
    description: 'We need 10 new laptops for the IT department to replace the outdated models. Preferred specifications: Intel i7, 16GB RAM, 512GB SSD.',
    type: 'Equipment',
    requester: 'John Smith',
    department: 'IT',
    requestDate: '2023-07-01T10:30:00Z',
    priority: 'High',
    status: 'Pending',
    warehouse: 'Main Medical Storage',
    warehouseId: 'WH001',
    items: [
      {
        id: 'IT001',
        name: 'Dell XPS 15 Laptop',
        quantity: 5,
        price: 1500.00,
        status: 'Available'
      },
      {
        id: 'IT002',
        name: 'HP EliteBook Laptop',
        quantity: 5,
        price: 1400.00,
        status: 'On Order'
      }
    ],
    attachments: [
      { name: 'Laptop_Specifications.pdf', size: '1.2 MB' },
      { name: 'Budget_Approval.docx', size: '520 KB' }
    ],
    timeline: [
      { date: '2023-07-01T10:30:00Z', action: 'Request Created', user: 'John Smith', notes: 'Initial request submitted' },
      { date: '2023-07-02T14:15:00Z', action: 'Request Reviewed', user: 'Sarah Johnson', notes: 'Request reviewed by IT Management' }
    ],
    comments: [
      {
        id: 1,
        user: 'Sarah Johnson',
        role: 'IT Manager',
        date: '2023-07-02T14:15:00Z',
        text: "I've reviewed the request and specifications. Our budget can accommodate this purchase for this quarter."
      },
      {
        id: 2,
        user: 'Michael Chen',
        role: 'Procurement Officer',
        date: '2023-07-03T09:30:00Z',
        text: "We have existing contracts with Dell and HP. I'll check inventory and pricing for both options."
      }
    ]
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      try {
        await requestsAPI.delete(id);
        navigate('/requests', { replace: true });
      } catch (error) {
        setError('Failed to delete the request. Please try again.');
      }
    }
  };
  
  const handleApprove = async () => {
    try {
      await requestsAPI.approve(id);
      setRequest({
        ...request,
        status: 'Approved',
        timeline: [
          ...request.timeline,
          {
            date: new Date().toISOString(),
            action: 'Request Approved',
            user: 'Current User', // In a real app, get this from auth context
            notes: 'Request approved'
          }
        ]
      });
    } catch (error) {
      setError('Failed to approve the request. Please try again.');
    }
  };
  
  const handleReject = async () => {
    try {
      await requestsAPI.reject(id);
      setRequest({
        ...request,
        status: 'Rejected',
        timeline: [
          ...request.timeline,
          {
            date: new Date().toISOString(),
            action: 'Request Rejected',
            user: 'Current User', // In a real app, get this from auth context
            notes: 'Request rejected'
          }
        ]
      });
    } catch (error) {
      setError('Failed to reject the request. Please try again.');
    }
  };
  
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      // In a real app, this would send the comment to the API
      // await requestsAPI.addComment(id, { text: comment });
      
      // For now, just update the state locally
      setRequest({
        ...request,
        comments: [
          ...request.comments,
          {
            id: request.comments.length + 1,
            user: 'Current User', // In a real app, get this from auth context
            role: 'Current Role', // In a real app, get this from auth context
            date: new Date().toISOString(),
            text: comment
          }
        ]
      });
      
      setComment('');
    } catch (error) {
      setError('Failed to add comment. Please try again.');
    }
  };
  
  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-warning';
      case 'approved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      case 'cancelled': return 'bg-secondary';
      case 'completed': return 'bg-info';
      default: return 'bg-primary';
    }
  };
  
  // Get priority badge color
  const getPriorityBadgeClass = (priority) => {
    switch(priority.toLowerCase()) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-info';
      default: return 'bg-secondary';
    }
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
                Request Details
              </div>
              <h2 className="page-title d-flex align-items-center">
                <IconClipboard size={24} className="me-2" />
                {request.title}
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/requests" className="btn btn-outline-primary">
                  <IconArrowLeft size={20} className="me-1" />
                  Back to List
                </Link>
                
                <div className="btn-group">
                  {request.status === 'Pending' && (
                    <>
                      <button 
                        onClick={handleApprove} 
                        className="btn btn-success"
                        title="Approve Request"
                      >
                        <IconCheck size={20} className="me-1" />
                        Approve
                      </button>
                      <button 
                        onClick={handleReject} 
                        className="btn btn-danger"
                        title="Reject Request"
                      >
                        <IconX size={20} className="me-1" />
                        Reject
                      </button>
                    </>
                  )}
                  <Link to={`/requests/${id}/edit`} className="btn btn-primary">
                    <IconEdit size={20} className="me-1" />
                    Edit
                  </Link>
                  <button onClick={handleDelete} className="btn btn-outline-danger">
                    <IconTrash size={20} className="me-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          <div className="row">
            <div className="col-lg-8">
              {/* Request Details Card */}
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">Request Information</h3>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="datagrid">
                      <div className="datagrid-item">
                        <div className="datagrid-title">Request ID</div>
                        <div className="datagrid-content">{request.id}</div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Type</div>
                        <div className="datagrid-content">{request.type}</div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Status</div>
                        <div className="datagrid-content">
                          <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Priority</div>
                        <div className="datagrid-content">
                          <span className={`badge ${getPriorityBadgeClass(request.priority)}`}>
                            {request.priority}
                          </span>
                        </div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Requester</div>
                        <div className="datagrid-content">
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-xs me-2 bg-blue-lt">
                              <IconUser size={14} />
                            </span>
                            {request.requester}
                          </div>
                        </div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Department</div>
                        <div className="datagrid-content">{request.department}</div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Request Date</div>
                        <div className="datagrid-content">
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-xs me-2 bg-azure-lt">
                              <IconClock size={14} />
                            </span>
                            {new Date(request.requestDate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="datagrid-item">
                        <div className="datagrid-title">Warehouse</div>
                        <div className="datagrid-content">
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-xs me-2 bg-green-lt">
                              <IconBuildingWarehouse size={14} />
                            </span>
                            <Link to={`/warehouse/${request.warehouseId}`}>
                              {request.warehouse}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="mb-3">Description</h4>
                    <div className="markdown">
                      {request.description}
                    </div>
                  </div>
                  
                  {/* Requested Items */}
                  <div className="mb-3">
                    <h4 className="mb-3">Requested Items</h4>
                    <div className="table-responsive">
                      <table className="table table-vcenter card-table">
                        <thead>
                          <tr>
                            <th>Item ID</th>
                            <th>Name</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th className="w-1"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {request.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.id}</td>
                              <td>{item.name}</td>
                              <td>{item.quantity}</td>
                              <td>${item.price.toFixed(2)}</td>
                              <td>
                                <span className={`badge ${
                                  item.status === 'Available' ? 'bg-success' : 
                                  item.status === 'On Order' ? 'bg-warning' : 
                                  'bg-danger'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td>
                                <Link to={`/inventory/${item.id}`} className="btn btn-sm btn-icon btn-outline-primary">
                                  <IconEye size={16} />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-end fw-bold">Total:</td>
                            <td className="fw-bold">
                              ${request.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  
                  {/* Attachments */}
                  {request.attachments && request.attachments.length > 0 && (
                    <div className="mb-3">
                      <h4 className="mb-3">Attachments</h4>
                      <div className="row g-2">
                        {request.attachments.map((file, index) => (
                          <div key={index} className="col-auto">
                            <a href="#" className="btn btn-outline-primary">
                              <IconFileDescription size={20} className="me-2" />
                              {file.name}
                              <span className="text-muted ms-2">({file.size})</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Comments Section */}
              <div className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title">
                    <IconMessageCircle className="me-2" />
                    Comments ({request.comments.length})
                  </h3>
                </div>
                <div className="card-body">
                  <div className="divide-y">
                    {request.comments.map((comment) => (
                      <div key={comment.id} className="py-3">
                        <div className="d-flex">
                          <div className="avatar avatar-md me-3">
                            {comment.user.charAt(0)}
                          </div>
                          <div className="flex-fill">
                            <div className="d-flex align-items-center">
                              <div className="fw-bold">{comment.user}</div>
                              <div className="text-muted ms-2">
                                <small>{comment.role}</small>
                              </div>
                              <div className="text-muted ms-auto">
                                <small>{new Date(comment.date).toLocaleString()}</small>
                              </div>
                            </div>
                            <div className="mt-2">
                              {comment.text}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <div className="mb-3">
                      <label className="form-label">Add Comment</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        placeholder="Type your comment here..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="text-end">
                      <button 
                        className="btn btn-primary" 
                        onClick={handleAddComment}
                        disabled={!comment.trim()}
                      >
                        <IconSend size={18} className="me-1" />
                        Submit Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              {/* Status Card */}
              <div className="card mb-3">
                <div className="card-status-top bg-primary"></div>
                <div className="card-body">
                  <h3 className="card-title">Request Status</h3>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <div className={`status-indicator ${
                        request.status === 'Approved' ? 'bg-success' : 
                        request.status === 'Rejected' ? 'bg-danger' :
                        request.status === 'Pending' ? 'bg-warning' : 'bg-info'
                      } me-2`}></div>
                      <div className="h3 mb-0">{request.status}</div>
                    </div>
                    
                    {request.status === 'Pending' && (
                      <div className="alert alert-warning d-flex mb-3">
                        <IconAlertTriangle className="me-2" />
                        <div>This request requires approval.</div>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <div className="progress mb-2">
                        <div className={`progress-bar ${
                          request.status === 'Approved' ? 'bg-success' : 
                          request.status === 'Rejected' ? 'bg-danger' :
                          request.status === 'Completed' ? 'bg-info' : 'bg-warning'
                        }`} style={{ width: 
                          request.status === 'Pending' ? '25%' : 
                          request.status === 'Approved' ? '75%' :
                          request.status === 'Completed' ? '100%' : '50%' 
                        }}></div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Created</span>
                        <span>Approved</span>
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timeline Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Timeline</h3>
                </div>
                <div className="card-body">
                  <ul className="steps steps-vertical">
                    {request.timeline.map((event, index) => (
                      <li key={index} className={`step-item ${index === 0 ? 'active' : ''}`}>
                        <div className="h4 m-0">{event.action}</div>
                        <div className="text-muted">{event.user}</div>
                        <div className="text-muted small">
                          {new Date(event.date).toLocaleString()}
                        </div>
                        {event.notes && (
                          <div className="mt-1 text-muted">{event.notes}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestDetail;
