import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTable, useSortBy, usePagination, useFilters } from 'react-table';
import { 
  IconPlus, 
  IconSearch, 
  IconChevronUp, 
  IconChevronDown,
  IconEdit,
  IconTrash,
  IconEye,
  IconClipboard,
  IconCheck,
  IconX,
  IconFilter
} from '@tabler/icons-react';
import { requestsAPI } from '../../core/api/apiService';

const RequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const { data } = await requestsAPI.getAll();
        setRequests(data.requests || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError('Failed to load requests');
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await requestsAPI.delete(id);
        setRequests(requests.filter(request => request.id !== id));
      } catch (error) {
        setError('Failed to delete the request');
      }
    }
  };
  
  const handleApprove = async (id) => {
    try {
      await requestsAPI.approve(id);
      setRequests(requests.map(request => 
        request.id === id ? { ...request, status: 'Approved' } : request
      ));
    } catch (error) {
      setError('Failed to approve the request');
    }
  };
  
  const handleReject = async (id) => {
    try {
      await requestsAPI.reject(id);
      setRequests(requests.map(request => 
        request.id === id ? { ...request, status: 'Rejected' } : request
      ));
    } catch (error) {
      setError('Failed to reject the request');
    }
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
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
  
  // Define table columns
  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
        Cell: ({ value }) => <span className="text-muted">{value}</span>
      },
      {
        Header: 'Title',
        accessor: 'title',
        Cell: ({ row }) => (
          <div className="d-flex align-items-center">
            <span className="avatar avatar-sm me-2 bg-blue-lt">
              <IconClipboard size={18} />
            </span>
            <Link to={`/requests/${row.original.id}`} className="text-reset">
              {row.original.title}
            </Link>
          </div>
        )
      },
      {
        Header: 'Type',
        accessor: 'type',
      },
      {
        Header: 'Requester',
        accessor: 'requester',
      },
      {
        Header: 'Department',
        accessor: 'department',
      },
      {
        Header: 'Request Date',
        accessor: 'requestDate',
        Cell: ({ value }) => new Date(value).toLocaleDateString()
      },
      {
        Header: 'Priority',
        accessor: 'priority',
        Cell: ({ value }) => (
          <span className={`badge ${getPriorityBadgeClass(value)}`}>
            {value}
          </span>
        )
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => (
          <span className={`badge ${getStatusBadgeClass(value)}`}>
            {value}
          </span>
        ),
        Filter: ({ column }) => (
          <select
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )
      },
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }) => (
          <div className="btn-list flex-nowrap">
            <Link to={`/requests/${row.original.id}`} className="btn btn-sm btn-icon btn-outline-primary">
              <IconEye size={18} />
            </Link>
            {row.original.status === 'Pending' && (
              <>
                <button 
                  onClick={() => handleApprove(row.original.id)} 
                  className="btn btn-sm btn-icon btn-outline-success"
                  title="Approve"
                >
                  <IconCheck size={18} />
                </button>
                <button 
                  onClick={() => handleReject(row.original.id)} 
                  className="btn btn-sm btn-icon btn-outline-danger"
                  title="Reject"
                >
                  <IconX size={18} />
                </button>
              </>
            )}
            <Link to={`/requests/${row.original.id}/edit`} className="btn btn-sm btn-icon btn-outline-secondary">
              <IconEdit size={18} />
            </Link>
            <button 
              onClick={() => handleDelete(row.original.id)} 
              className="btn btn-sm btn-icon btn-outline-danger"
              title="Delete"
            >
              <IconTrash size={18} />
            </button>
          </div>
        )
      }
    ],
    [statusFilter]
  );
  
  // Filter data based on search and status filter
  const filteredData = useMemo(() => {
    return (requests.length > 0 ? requests : mockRequests).filter(request => {
      const matchesSearch = searchQuery === '' || 
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.department.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || 
        request.status.toLowerCase() === statusFilter.toLowerCase();
        
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);
  
  // Mock data if API doesn't return any
  const mockRequests = [
    {
      id: 'REQ001',
      title: 'New Laptops for IT Department',
      type: 'Equipment',
      requester: 'John Smith',
      department: 'IT',
      requestDate: '2023-07-01T10:30:00Z',
      priority: 'High',
      status: 'Pending'
    },
    {
      id: 'REQ002',
      title: 'Printer Paper Restock',
      type: 'Supplies',
      requester: 'Maria Garcia',
      department: 'Administration',
      requestDate: '2023-07-02T14:45:00Z',
      priority: 'Low',
      status: 'Approved'
    },
    {
      id: 'REQ003',
      title: 'Emergency Surgery Equipment',
      type: 'Medical',
      requester: 'Dr. James Wilson',
      department: 'Surgery',
      requestDate: '2023-07-03T08:15:00Z',
      priority: 'High',
      status: 'Completed'
    },
    {
      id: 'REQ004',
      title: 'Office Furniture for Pediatrics',
      type: 'Furniture',
      requester: 'Dr. Emily Chen',
      department: 'Pediatrics',
      requestDate: '2023-07-04T11:20:00Z',
      priority: 'Medium',
      status: 'Rejected'
    },
    {
      id: 'REQ005',
      title: 'Laboratory Testing Supplies',
      type: 'Supplies',
      requester: 'Dr. Michael Brown',
      department: 'Laboratory',
      requestDate: '2023-07-05T09:00:00Z',
      priority: 'Medium',
      status: 'Pending'
    },
    {
      id: 'REQ006',
      title: 'Patient Monitoring Equipment',
      type: 'Medical',
      requester: 'Dr. Sarah Johnson',
      department: 'ICU',
      requestDate: '2023-07-06T16:30:00Z',
      priority: 'High',
      status: 'Approved'
    }
  ];
  
  // Set up react-table
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns,
      data: filteredData,
      initialState: { pageIndex: 0, pageSize: 10 }
    },
    useFilters,
    useSortBy,
    usePagination
  );
  
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
              <h2 className="page-title">Request Management</h2>
              <div className="text-muted mt-1">
                {filteredData.length} requests
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/requests/new" className="btn btn-primary d-none d-sm-inline-block">
                  <IconPlus className="icon" />
                  Create Request
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          <div className="card">
            <div className="card-body border-bottom py-3">
              <div className="d-flex">
                <div className="text-muted">
                  Show
                  <div className="mx-2 d-inline-block">
                    <select 
                      className="form-select form-select-sm" 
                      value={pageSize}
                      onChange={e => setPageSize(Number(e.target.value))}
                    >
                      {[10, 25, 50, 100].map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  entries
                </div>
                <div className="ms-auto d-flex">
                  <div className="me-3">
                    <div className="input-icon">
                      <span className="input-icon-addon">
                        <IconFilter size={18} stroke={1.5} />
                      </span>
                      <select 
                        className="form-select" 
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        aria-label="Filter by status"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <IconSearch size={18} stroke={1.5} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={handleSearch}
                      aria-label="Search requests"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table {...getTableProps()} className="table table-vcenter card-table table-striped">
                <thead>
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map(column => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                          <div className="d-flex align-items-center">
                            {column.render('Header')}
                            <span className="ms-1">
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? <IconChevronDown size={14} />
                                  : <IconChevronUp size={14} />
                                : ''}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map(row => {
                    prepareRow(row)
                    return (
                      <tr {...row.getRowProps()}>
                        {row.cells.map(cell => {
                          return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                        })}
                      </tr>
                    )
                  })}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-4">
                        No requests found. Try changing your search criteria or create a new request.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="card-footer d-flex align-items-center">
              <p className="m-0 text-muted">
                Showing <span>{pageIndex * pageSize + 1}</span> to <span>{Math.min((pageIndex + 1) * pageSize, filteredData.length)}</span> of <span>{filteredData.length}</span> entries
              </p>
              <ul className="pagination m-0 ms-auto">
                <li className={`page-item ${!canPreviousPage && 'disabled'}`}>
                  <button className="page-link" onClick={() => previousPage()} disabled={!canPreviousPage}>
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                </li>
                {pageOptions.length <= 5 ? (
                  pageOptions.map(page => (
                    <li key={page} className={`page-item ${pageIndex === page && 'active'}`}>
                      <button className="page-link" onClick={() => gotoPage(page)}>
                        {page + 1}
                      </button>
                    </li>
                  ))
                ) : (
                  <>
                    <li className={`page-item ${pageIndex === 0 && 'active'}`}>
                      <button className="page-link" onClick={() => gotoPage(0)}>1</button>
                    </li>
                    {pageIndex > 1 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    {pageIndex > 0 && pageIndex < pageOptions.length - 1 && (
                      <li className="page-item active">
                        <button className="page-link">{pageIndex + 1}</button>
                      </li>
                    )}
                    {pageIndex < pageOptions.length - 2 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    <li className={`page-item ${pageIndex === pageOptions.length - 1 && 'active'}`}>
                      <button className="page-link" onClick={() => gotoPage(pageOptions.length - 1)}>
                        {pageOptions.length}
                      </button>
                    </li>
                  </>
                )}
                <li className={`page-item ${!canNextPage && 'disabled'}`}>
                  <button className="page-link" onClick={() => nextPage()} disabled={!canNextPage}>
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestsList;
