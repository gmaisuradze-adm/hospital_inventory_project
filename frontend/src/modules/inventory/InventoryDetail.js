import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  IconArrowLeft, 
  IconEdit, 
  IconTrash, 
  IconDeviceLaptop,
  IconBoxSeam,
  IconHistory,
  IconBuildingWarehouse,
  IconInfoCircle,
  IconCalendarEvent,
  IconUserCircle,
  IconPrinter
} from '@tabler/icons-react';
import { inventoryAPI } from '../../core/api/apiService';

const InventoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const { data } = await inventoryAPI.getById(id);
        setItem(data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load inventory item details');
        setLoading(false);
      }
    };
    
    fetchItem();
  }, [id]);
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryAPI.delete(id);
        navigate('/inventory', { state: { message: 'Item deleted successfully' } });
      } catch (error) {
        setError('Failed to delete the item');
      }
    }
  };
  
  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'in stock':
        return 'bg-success';
      case 'low stock':
        return 'bg-warning';
      case 'out of stock':
        return 'bg-danger';
      default:
        return 'bg-secondary';
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
  
  // Mock data if API does not provide all fields
  const itemData = {
    ...item,
    name: item?.name || 'Medical Laptop XPS',
    category: item?.category || 'Computers',
    model: item?.model || 'Dell XPS 13',
    serialNumber: item?.serialNumber || 'SN-39582-X9372',
    acquisitionDate: item?.acquisitionDate || '2023-05-15',
    warrantyExpiry: item?.warrantyExpiry || '2026-05-15',
    purchasePrice: item?.purchasePrice || 1299.99,
    currentValue: item?.currentValue || 1050.00,
    quantity: item?.quantity || 10,
    minimumThreshold: item?.minimumThreshold || 3,
    location: item?.location || 'Warehouse A - Shelf 23',
    department: item?.department || 'Radiology',
    assignedTo: item?.assignedTo || 'Dr. Sarah Johnson',
    status: item?.status || 'In Stock',
    notes: item?.notes || 'Laptops are configured with hospital EMR software and encryption.',
    imageUrl: item?.imageUrl || 'https://i.dell.com/is/image/DellContent/content/dam/images/products/laptops-and-2-in-1s/xps/13-9315/media-gallery/notebook-xps-9315-nt-blue-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=573&qlt=100,1&resMode=sharp2&size=573,402&chrss=full',
    lastUpdated: item?.updatedAt || '2024-01-20T08:43:21Z',
    activityLog: item?.activityLog || [
      { date: '2024-01-20T08:43:21Z', action: 'Updated quantity', user: 'admin@hospital.org', notes: 'Quantity increased by 3' },
      { date: '2023-12-05T14:22:10Z', action: 'Maintenance performed', user: 'tech@hospital.org', notes: 'Software updated to latest version' },
      { date: '2023-11-15T09:10:00Z', action: 'Item added', user: 'admin@hospital.org', notes: 'Initial inventory registration' }
    ]
  };
  
  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                Inventory Item #{itemData.id}
              </div>
              <h2 className="page-title">{itemData.name}</h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/inventory" className="btn btn-outline-secondary d-none d-sm-inline-block">
                  <IconArrowLeft className="icon" />
                  Back to Inventory
                </Link>
                <button onClick={() => window.print()} className="btn btn-outline-secondary d-none d-sm-inline-block">
                  <IconPrinter className="icon" />
                  Print Details
                </button>
                <Link to={`/inventory/${id}/edit`} className="btn btn-primary d-none d-sm-inline-block">
                  <IconEdit className="icon" />
                  Edit Item
                </Link>
                <button onClick={handleDelete} className="btn btn-danger d-none d-sm-inline-block">
                  <IconTrash className="icon" />
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          <div className="row">
            <div className="col-lg-8">
              {/* Main item details */}
              <div className="card mb-4">
                <div className="card-header">
                  <h3 className="card-title">Item Details</h3>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 text-center mb-4">
                      <div className="mb-3">
                        {itemData.imageUrl ? (
                          <img 
                            src={itemData.imageUrl} 
                            alt={itemData.name} 
                            className="img-fluid rounded"
                            style={{ maxHeight: '200px' }}
                          />
                        ) : (
                          <div className="avatar avatar-xl mb-3 bg-primary-lt">
                            <IconDeviceLaptop size={48} />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`badge ${getStatusBadgeClass(itemData.status)} mb-2`}>
                          {itemData.status}
                        </span>
                        <div className="text-muted">
                          ID: {itemData.id}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="mb-3">
                            <label className="form-label text-muted">Category</label>
                            <div className="form-control-plaintext">{itemData.category}</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-3">
                            <label className="form-label text-muted">Model</label>
                            <div className="form-control-plaintext">{itemData.model}</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-3">
                            <label className="form-label text-muted">Serial Number</label>
                            <div className="form-control-plaintext">{itemData.serialNumber}</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-3">
                            <label className="form-label text-muted">Department</label>
                            <div className="form-control-plaintext">{itemData.department}</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-3">
                            <label className="form-label text-muted">Quantity</label>
                            <div className="form-control-plaintext">
                              {itemData.quantity} <small className="text-muted">(Min: {itemData.minimumThreshold})</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-3">
                            <label className="form-label text-muted">Location</label>
                            <div className="form-control-plaintext">{itemData.location}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <hr className="my-3" />
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label text-muted">Acquisition Date</label>
                        <div className="form-control-plaintext">
                          {new Date(itemData.acquisitionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label text-muted">Warranty Expiry</label>
                        <div className="form-control-plaintext">
                          {new Date(itemData.warrantyExpiry).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label text-muted">Purchase Price</label>
                        <div className="form-control-plaintext">
                          ${itemData.purchasePrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label text-muted">Current Value</label>
                        <div className="form-control-plaintext">
                          ${itemData.currentValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label text-muted">Assigned To</label>
                        <div className="form-control-plaintext">
                          {itemData.assignedTo || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label text-muted">Last Updated</label>
                        <div className="form-control-plaintext">
                          {new Date(itemData.lastUpdated).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label text-muted">Notes</label>
                        <div className="form-control-plaintext">
                          {itemData.notes || 'No additional notes.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Activity Log */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Activity Log</h3>
                </div>
                <div className="card-body">
                  <div className="divide-y">
                    {itemData.activityLog?.length > 0 ? (
                      itemData.activityLog.map((log, index) => (
                        <div key={index} className="row py-3">
                          <div className="col-auto">
                            <span className="avatar bg-blue-lt">
                              {log.action === 'Item added' ? (
                                <IconBoxSeam size={24} />
                              ) : log.action === 'Updated quantity' ? (
                                <IconHistory size={24} />
                              ) : (
                                <IconInfoCircle size={24} />
                              )}
                            </span>
                          </div>
                          <div className="col">
                            <div className="text-truncate">
                              <strong>{log.action}</strong>
                            </div>
                            <div className="text-muted">{log.notes}</div>
                          </div>
                          <div className="col-auto align-self-center">
                            <div className="badge bg-primary">{log.user}</div>
                          </div>
                          <div className="col-auto align-self-center">
                            <div className="text-muted">
                              {new Date(log.date).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-3">No activity recorded for this item.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              {/* Related information cards */}
              <div className="card mb-4">
                <div className="card-header">
                  <h3 className="card-title">Stats</h3>
                </div>
                <div className="card-body">
                  <div className="row row-cards">
                    <div className="col-md-6 col-xl-12">
                      <div className="card card-sm mb-3">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <span className="bg-blue text-white avatar">
                                <IconBoxSeam size={24} />
                              </span>
                            </div>
                            <div className="col">
                              <div className="font-weight-medium">
                                {itemData.quantity} units in stock
                              </div>
                              <div className="text-muted">
                                Min threshold: {itemData.minimumThreshold}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 col-xl-12">
                      <div className="card card-sm mb-3">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <span className="bg-green text-white avatar">
                                <IconBuildingWarehouse size={24} />
                              </span>
                            </div>
                            <div className="col">
                              <div className="font-weight-medium">
                                {itemData.location}
                              </div>
                              <div className="text-muted">
                                Current location
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 col-xl-12">
                      <div className="card card-sm mb-3">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <span className="bg-yellow text-white avatar">
                                <IconCalendarEvent size={24} />
                              </span>
                            </div>
                            <div className="col">
                              <div className="font-weight-medium">
                                {new Date(itemData.warrantyExpiry).toLocaleDateString()}
                              </div>
                              <div className="text-muted">
                                Warranty expiration
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 col-xl-12">
                      <div className="card card-sm">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <span className="bg-purple text-white avatar">
                                <IconUserCircle size={24} />
                              </span>
                            </div>
                            <div className="col">
                              <div className="font-weight-medium">
                                {itemData.assignedTo || 'Unassigned'}
                              </div>
                              <div className="text-muted">
                                Assigned to
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Related Items */}
              <div className="card mb-4">
                <div className="card-header">
                  <h3 className="card-title">Related Items</h3>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    <a href="#" className="list-group-item list-group-item-action">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <span className="avatar" style={{ backgroundImage: `url(https://img.freepik.com/free-photo/laptop-white_1232-2084.jpg?t=st=1719688227~exp=1719691827~hmac=c8197d9c3c83d7af44c09b876246479207816d93c3f67d5e50c7cff952eef316)` }}></span>
                        </div>
                        <div className="col text-truncate">
                          <div className="d-block text-muted text-truncate mt-n1">
                            Medical Laptop Charger
                          </div>
                        </div>
                      </div>
                    </a>
                    <a href="#" className="list-group-item list-group-item-action">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <span className="avatar" style={{ backgroundImage: `url(https://img.freepik.com/free-photo/laptop-with-blank-screen-wooden-table_53876-147477.jpg?t=st=1719688243~exp=1719691843~hmac=6f36e0b1e67d85da160156b60f8c713be549febdcf2764b783552a61ead087b8)` }}></span>
                        </div>
                        <div className="col text-truncate">
                          <div className="d-block text-muted text-truncate mt-n1">
                            Laptop Docking Station
                          </div>
                        </div>
                      </div>
                    </a>
                    <a href="#" className="list-group-item list-group-item-action">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <span className="avatar" style={{ backgroundImage: `url(https://img.freepik.com/free-vector/realistic-computer-monitor_23-2147503803.jpg?t=st=1719688267~exp=1719691867~hmac=52863e5f7f884f50895310c4a1964ac87ca5928404d9aab58d60c60b53ace395)` }}></span>
                        </div>
                        <div className="col text-truncate">
                          <div className="d-block text-muted text-truncate mt-n1">
                            External Monitor 24"
                          </div>
                        </div>
                      </div>
                    </a>
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

export default InventoryDetail;
