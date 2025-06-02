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
  IconAlertTriangle,
  IconCalendarStats,
  IconFilter,
  IconCheck,
  IconHelp
} from '@tabler/icons-react';
import { serviceAPI } from '../../core/api/apiService';

const ServiceIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const { data } = await serviceAPI.getIncidents();
        setIncidents(data?.incidents || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching incidents:', error);
        setError('Failed to load incidents');
        setLoading(false);
      }
    };
    
    fetchIncidents();
  }, []);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      try {
        // This would normally make an API call
        // await serviceAPI.deleteIncident(id);
        setIncidents(incidents.filter(incident => incident.id !== id));
      } catch (error) {
        setError('Failed to delete the incident');
      }
    }
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePriorityFilterChange = (e) => {
    setPriorityFilter(e.target.value);
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  // Get severity badge color
  const getSeverityBadgeClass = (severity) => {
    switch(severity.toLowerCase()) {
      case 'critical': return 'bg-danger';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-primary';
      case 'low': return 'bg-info';
      default: return 'bg-secondary';
    }
  };
  
  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch(status.toLowerCase()) {
      case 'open': return 'bg-danger';
      case 'in progress': return 'bg-warning';
      case 'resolved': return 'bg-success';
      case 'closed': return 'bg-secondary';
      default: return 'bg-info';
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
            <span className="avatar avatar-sm me-2 bg-red-lt">
              <IconAlertTriangle size={18} />
            </span>
            <Link to={`/service/incidents/${row.original.id}`} className="text-reset">
              {row.original.title}
            </Link>
          </div>
        )
      },
      {
        Header: 'Affected System',
        accessor: 'system',
      },
      {
        Header: 'Location',
        accessor: 'location',
      },
      {
        Header: 'Reported By',
        accessor: 'reporter',
      },
      {
        Header: 'Reported Date',
        accessor: 'reportDate',
        Cell: ({ value }) => new Date(value).toLocaleDateString()
      },
      {
        Header: 'Priority',
        accessor: 'priority',
        Cell: ({ value }) => (
          <span className={`badge ${getSeverityBadgeClass(value)}`}>
            {value}
          </span>
        ),
        Filter: ({ column }) => (
          <select
            className="form-select form-select-sm"
            value={priorityFilter}
            onChange={handlePriorityFilterChange}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
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
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        )
      },
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }) => (
          <div className="btn-list flex-nowrap">
            <Link to={`/service/incidents/${row.original.id}`} className="btn btn-sm btn-icon btn-outline-primary">
              <IconEye size={18} />
            </Link>
            <Link to={`/service/incidents/${row.original.id}/edit`} className="btn btn-sm btn-icon btn-outline-secondary">
              <IconEdit size={18} />
            </Link>
            <button 
              onClick={() => handleDelete(row.original.id)} 
              className="btn btn-sm btn-icon btn-outline-danger"
            >
              <IconTrash size={18} />
            </button>
          </div>
        )
      }
    ],
    [priorityFilter, statusFilter]
  );
  
  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return (incidents.length > 0 ? incidents : mockIncidents).filter(incident => {
      const matchesSearch = searchQuery === '' || 
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.system.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.reporter.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesPriority = priorityFilter === 'all' || 
        incident.priority.toLowerCase() === priorityFilter.toLowerCase();
        
      const matchesStatus = statusFilter === 'all' || 
        incident.status.toLowerCase() === statusFilter.toLowerCase();
        
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [incidents, searchQuery, priorityFilter, statusFilter]);
  
  // Mock data if API doesn't return any
  const mockIncidents = [
    {
      id: 'INC001',
      title: 'Server Outage - Emergency Systems',
      system: 'Patient Records',
      location: 'Data Center',
      reporter: 'Sarah Johnson',
      reportDate: '2023-07-15T08:30:00Z',
      priority: 'Critical',
      status: 'In Progress',
      assignee: 'IT Support Team',
      description: 'Complete outage of the patient records system affecting all departments.',
      resolution: ''
    },
    {
      id: 'INC002',
      title: 'WiFi Connection Issues',
      system: 'Network',
      location: 'Building B',
      reporter: 'Michael Chen',
      reportDate: '2023-07-14T10:15:00Z',
      priority: 'Medium',
      status: 'Open',
      assignee: 'Network Team',
      description: 'Intermittent WiFi issues in Building B affecting staff connectivity.',
      resolution: ''
    },
    {
      id: 'INC003',
      title: 'Printer Not Working',
      system: 'Peripherals',
      location: 'Nursing Station 3',
      reporter: 'Emily Rodriguez',
      reportDate: '2023-07-13T14:45:00Z',
      priority: 'Low',
      status: 'Resolved',
      assignee: 'Helpdesk',
      description: 'Main printer at Nursing Station 3 is not printing or connecting to computers.',
      resolution: 'Replaced printer cartridge and restarted print services.'
    },
    {
      id: 'INC004',
      title: 'Lab Equipment Software Crash',
      system: 'Laboratory Information System',
      location: 'Main Laboratory',
      reporter: 'Dr. James Wilson',
      reportDate: '2023-07-12T09:20:00Z',
      priority: 'High',
      status: 'In Progress',
      assignee: 'Medical Systems Team',
      description: 'Lab analysis software crashes when processing multiple samples simultaneously.',
      resolution: ''
    },
    {
      id: 'INC005',
      title: 'Email Delivery Delays',
      system: 'Email',
      location: 'Hospital-wide',
      reporter: 'Admin Department',
      reportDate: '2023-07-11T16:30:00Z',
      priority: 'Medium',
      status: 'Resolved',
      assignee: 'IT Infrastructure',
      description: 'Significant delays in email delivery affecting internal and external communications.',
      resolution: 'Server maintenance completed and mail queues processed.'
    },
    {
      id: 'INC006',
      title: 'Patient Monitor Display Error',
      system: 'Patient Monitoring',
      location: 'ICU',
      reporter: 'Dr. Lisa Brown',
      reportDate: '2023-07-10T11:05:00Z',
      priority: 'Critical',
      status: 'Closed',
      assignee: 'Medical Equipment Team',
      description: 'Patient vital monitors displaying incorrect values intermittently.',
      resolution: 'Firmware updated on all affected monitors and calibration performed.'
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
              <h2 className="page-title">Incident Management</h2>
              <div className="text-muted mt-1">
                {filteredData.length} incidents
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/service/knowledge" className="btn btn-outline-primary d-none d-sm-inline-block">
                  <IconHelp className="icon" />
                  Knowledge Base
                </Link>
                <Link to="/service/incidents/new" className="btn btn-primary d-none d-sm-inline-block">
                  <IconPlus className="icon" />
                  Report Incident
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="page-body">
        <div className="container-xl">
          <div className="row mb-3">
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Open Incidents</div>
                    <div className="ms-auto lh-1">
                      <div className="dropdown">
                        <Link 
                          to="#" 
                          className="dropdown-toggle text-muted" 
                          data-bs-toggle="dropdown" 
                          aria-haspopup="true" 
                          aria-expanded="false"
                        >
                          Last 7 days
                        </Link>
                        <div className="dropdown-menu dropdown-menu-end">
                          <Link to="#" className="dropdown-item">Last 7 days</Link>
                          <Link to="#" className="dropdown-item">Last 30 days</Link>
                          <Link to="#" className="dropdown-item">Last 3 months</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline">
                    <div className="h1 mb-0 me-2">12</div>
                    <div className="me-auto">
                      <span className="text-danger d-inline-flex align-items-center lh-1">
                        +18% <IconChevronUp size={14} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="progress card-progress">
                  <div className="progress-bar bg-danger" style={{ width: "32%" }} role="progressbar"></div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Average Resolution Time</div>
                    <div className="ms-auto lh-1">
                      <div className="dropdown">
                        <Link 
                          to="#" 
                          className="dropdown-toggle text-muted" 
                          data-bs-toggle="dropdown" 
                          aria-haspopup="true" 
                          aria-expanded="false"
                        >
                          Last 7 days
                        </Link>
                        <div className="dropdown-menu dropdown-menu-end">
                          <Link to="#" className="dropdown-item">Last 7 days</Link>
                          <Link to="#" className="dropdown-item">Last 30 days</Link>
                          <Link to="#" className="dropdown-item">Last 3 months</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline">
                    <div className="h1 mb-0 me-2">4.3h</div>
                    <div className="me-auto">
                      <span className="text-success d-inline-flex align-items-center lh-1">
                        -12% <IconChevronDown size={14} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="progress card-progress">
                  <div className="progress-bar bg-success" style={{ width: "68%" }} role="progressbar"></div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Critical Incidents</div>
                    <div className="ms-auto lh-1">
                      <div className="dropdown">
                        <Link 
                          to="#" 
                          className="dropdown-toggle text-muted" 
                          data-bs-toggle="dropdown" 
                          aria-haspopup="true" 
                          aria-expanded="false"
                        >
                          Last 7 days
                        </Link>
                        <div className="dropdown-menu dropdown-menu-end">
                          <Link to="#" className="dropdown-item">Last 7 days</Link>
                          <Link to="#" className="dropdown-item">Last 30 days</Link>
                          <Link to="#" className="dropdown-item">Last 3 months</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline">
                    <div className="h1 mb-0 me-2">3</div>
                    <div className="me-auto">
                      <span className="text-danger d-inline-flex align-items-center lh-1">
                        +50% <IconChevronUp size={14} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="progress card-progress">
                  <div className="progress-bar bg-warning" style={{ width: "40%" }} role="progressbar"></div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Resolution Rate</div>
                    <div className="ms-auto lh-1">
                      <div className="dropdown">
                        <Link 
                          to="#" 
                          className="dropdown-toggle text-muted" 
                          data-bs-toggle="dropdown" 
                          aria-haspopup="true" 
                          aria-expanded="false"
                        >
                          Last 7 days
                        </Link>
                        <div className="dropdown-menu dropdown-menu-end">
                          <Link to="#" className="dropdown-item">Last 7 days</Link>
                          <Link to="#" className="dropdown-item">Last 30 days</Link>
                          <Link to="#" className="dropdown-item">Last 3 months</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline">
                    <div className="h1 mb-0 me-2">86%</div>
                    <div className="me-auto">
                      <span className="text-success d-inline-flex align-items-center lh-1">
                        +4% <IconChevronUp size={14} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="progress card-progress">
                  <div className="progress-bar bg-primary" style={{ width: "86%" }} role="progressbar"></div>
                </div>
              </div>
            </div>
          </div>
          
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
                        value={priorityFilter}
                        onChange={handlePriorityFilterChange}
                        aria-label="Filter by priority"
                      >
                        <option value="all">All Priorities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
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
                        <option value="open">Open</option>
                        <option value="in progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
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
                      placeholder="Search incidents..."
                      value={searchQuery}
                      onChange={handleSearch}
                      aria-label="Search incidents"
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
                        No incidents found matching your criteria.
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

export default ServiceIncidents;
