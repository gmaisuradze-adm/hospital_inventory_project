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
  IconTools,
  IconCalendar,
  IconFilter,
  IconCheck,
  IconClock
} from '@tabler/icons-react';
import { serviceAPI } from '../../core/api/apiService';

const ServiceMaintenance = () => {
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    const fetchMaintenanceTasks = async () => {
      try {
        setLoading(true);
        const { data } = await serviceAPI.getMaintenance();
        setMaintenanceTasks(data?.maintenance || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching maintenance tasks:', error);
        setError('Failed to load maintenance tasks');
        setLoading(false);
      }
    };
    
    fetchMaintenanceTasks();
  }, []);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance task?')) {
      try {
        // This would normally make an API call
        // await serviceAPI.deleteMaintenance(id);
        setMaintenanceTasks(maintenanceTasks.filter(task => task.id !== id));
      } catch (error) {
        setError('Failed to delete the maintenance task');
      }
    }
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  const handleMarkComplete = (id) => {
    setMaintenanceTasks(maintenanceTasks.map(task => 
      task.id === id ? { ...task, status: 'Completed' } : task
    ));
  };
  
  // Get maintenance type badge color
  const getTypeBadgeClass = (type) => {
    switch(type.toLowerCase()) {
      case 'preventive': return 'bg-azure';
      case 'corrective': return 'bg-orange';
      case 'emergency': return 'bg-danger';
      case 'predictive': return 'bg-primary';
      case 'routine': return 'bg-teal';
      default: return 'bg-secondary';
    }
  };
  
  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch(status.toLowerCase()) {
      case 'scheduled': return 'bg-primary';
      case 'in progress': return 'bg-warning';
      case 'completed': return 'bg-success';
      case 'postponed': return 'bg-info';
      case 'cancelled': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };
  
  // Calculate if a task is overdue
  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && dueDate;
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
            <span className="avatar avatar-sm me-2 bg-cyan-lt">
              <IconTools size={18} />
            </span>
            <Link to={`/service/maintenance/${row.original.id}`} className="text-reset">
              {row.original.title}
            </Link>
          </div>
        )
      },
      {
        Header: 'Type',
        accessor: 'type',
        Cell: ({ value }) => (
          <span className={`badge ${getTypeBadgeClass(value)}`}>
            {value}
          </span>
        ),
        Filter: ({ column }) => (
          <select
            className="form-select form-select-sm"
            value={typeFilter}
            onChange={handleTypeFilterChange}
          >
            <option value="all">All Types</option>
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="emergency">Emergency</option>
            <option value="predictive">Predictive</option>
            <option value="routine">Routine</option>
          </select>
        )
      },
      {
        Header: 'Equipment/System',
        accessor: 'asset',
      },
      {
        Header: 'Location',
        accessor: 'location',
      },
      {
        Header: 'Scheduled Date',
        accessor: 'scheduledDate',
        Cell: ({ value }) => new Date(value).toLocaleDateString()
      },
      {
        Header: 'Due Date',
        accessor: 'dueDate',
        Cell: ({ value }) => (
          <span className={isOverdue(value) ? 'text-danger fw-bold' : ''}>
            {new Date(value).toLocaleDateString()}
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
            <option value="scheduled">Scheduled</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="postponed">Postponed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )
      },
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }) => (
          <div className="btn-list flex-nowrap">
            <Link to={`/service/maintenance/${row.original.id}`} className="btn btn-sm btn-icon btn-outline-primary">
              <IconEye size={18} />
            </Link>
            {row.original.status !== 'Completed' && row.original.status !== 'Cancelled' && (
              <button 
                onClick={() => handleMarkComplete(row.original.id)} 
                className="btn btn-sm btn-icon btn-outline-success"
                title="Mark as Complete"
              >
                <IconCheck size={18} />
              </button>
            )}
            <Link to={`/service/maintenance/${row.original.id}/edit`} className="btn btn-sm btn-icon btn-outline-secondary">
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
    [typeFilter, statusFilter]
  );
  
  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return (maintenanceTasks.length > 0 ? maintenanceTasks : mockMaintenanceTasks).filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.location.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesType = typeFilter === 'all' || 
        task.type.toLowerCase() === typeFilter.toLowerCase();
        
      const matchesStatus = statusFilter === 'all' || 
        task.status.toLowerCase() === statusFilter.toLowerCase();
        
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [maintenanceTasks, searchQuery, typeFilter, statusFilter]);
  
  // Mock data if API doesn't return any
  const mockMaintenanceTasks = [
    {
      id: 'MT001',
      title: 'HVAC System Quarterly Maintenance',
      type: 'Preventive',
      asset: 'HVAC System',
      location: 'Building A',
      scheduledDate: '2023-07-20T09:00:00Z',
      dueDate: '2023-07-25T17:00:00Z',
      assignedTo: 'Facilities Team',
      estimatedDuration: '8 hours',
      status: 'Scheduled',
      priority: 'Medium',
      description: 'Regular quarterly maintenance of the HVAC system including filter changes, duct inspection, and performance testing.'
    },
    {
      id: 'MT002',
      title: 'Emergency Generator Testing',
      type: 'Routine',
      asset: 'Backup Generator',
      location: 'Power Room',
      scheduledDate: '2023-07-18T10:00:00Z',
      dueDate: '2023-07-18T12:00:00Z',
      assignedTo: 'Electrical Team',
      estimatedDuration: '2 hours',
      status: 'Completed',
      priority: 'High',
      description: 'Monthly test of the emergency generator system to ensure proper operation during power outages.'
    },
    {
      id: 'MT003',
      title: 'MRI Machine Calibration',
      type: 'Preventive',
      asset: 'MRI Scanner',
      location: 'Radiology Department',
      scheduledDate: '2023-07-22T08:30:00Z',
      dueDate: '2023-07-22T16:30:00Z',
      assignedTo: 'Medical Equipment Team',
      estimatedDuration: '6 hours',
      status: 'Scheduled',
      priority: 'High',
      description: 'Regular calibration of the MRI machine to ensure accurate imaging results.'
    },
    {
      id: 'MT004',
      title: 'Elevator Safety Inspection',
      type: 'Preventive',
      asset: 'Elevators',
      location: 'Building B',
      scheduledDate: '2023-07-15T09:00:00Z',
      dueDate: '2023-07-15T17:00:00Z',
      assignedTo: 'Facilities Team',
      estimatedDuration: '8 hours',
      status: 'Completed',
      priority: 'Medium',
      description: 'Annual safety inspection of all elevators in Building B.'
    },
    {
      id: 'MT005',
      title: 'Network Switch Replacement',
      type: 'Corrective',
      asset: 'Network Infrastructure',
      location: 'Data Center',
      scheduledDate: '2023-07-05T22:00:00Z',
      dueDate: '2023-07-06T03:00:00Z',
      assignedTo: 'IT Network Team',
      estimatedDuration: '5 hours',
      status: 'Completed',
      priority: 'High',
      description: 'Replace faulty network switch that is causing intermittent connectivity issues.'
    },
    {
      id: 'MT006',
      title: 'Fire Alarm System Testing',
      type: 'Routine',
      asset: 'Fire Detection System',
      location: 'All Buildings',
      scheduledDate: '2023-07-25T09:00:00Z',
      dueDate: '2023-07-27T17:00:00Z',
      assignedTo: 'Safety Team',
      estimatedDuration: '16 hours',
      status: 'Scheduled',
      priority: 'High',
      description: 'Quarterly testing and inspection of all fire alarm systems as required by regulations.'
    },
    {
      id: 'MT007',
      title: 'X-Ray Machine Repair',
      type: 'Emergency',
      asset: 'X-Ray Unit #3',
      location: 'Emergency Department',
      scheduledDate: '2023-07-10T14:00:00Z',
      dueDate: '2023-07-10T18:00:00Z',
      assignedTo: 'Medical Equipment Team',
      estimatedDuration: '4 hours',
      status: 'Completed',
      priority: 'Critical',
      description: 'Emergency repair of the X-Ray machine that has stopped functioning.'
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
  
  // Count tasks by status for summary cards
  const taskCounts = {
    upcoming: filteredData.filter(task => 
      ['Scheduled', 'Postponed'].includes(task.status) && 
      new Date(task.dueDate) >= new Date()
    ).length,
    overdue: filteredData.filter(task => 
      ['Scheduled', 'Postponed', 'In Progress'].includes(task.status) && 
      new Date(task.dueDate) < new Date()
    ).length,
    completed: filteredData.filter(task => task.status === 'Completed').length,
    inProgress: filteredData.filter(task => task.status === 'In Progress').length
  };
  
  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Maintenance Management</h2>
              <div className="text-muted mt-1">
                {filteredData.length} maintenance tasks
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/service/maintenance/calendar" className="btn btn-outline-primary d-none d-sm-inline-block">
                  <IconCalendar className="icon" />
                  Calendar View
                </Link>
                <Link to="/service/maintenance/new" className="btn btn-primary d-none d-sm-inline-block">
                  <IconPlus className="icon" />
                  Schedule Maintenance
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="page-body">
        <div className="container-xl">
          <div className="row mb-3">
            <div className="col-md-6 col-xl-3">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-primary text-white avatar">
                        <IconCalendar size={24} />
                      </span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">
                        Upcoming Maintenance Tasks
                      </div>
                      <div className="text-muted">
                        {taskCounts.upcoming} tasks scheduled
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-warning text-white avatar">
                        <IconClock size={24} />
                      </span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">
                        In-Progress Tasks
                      </div>
                      <div className="text-muted">
                        {taskCounts.inProgress} tasks currently in progress
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-danger text-white avatar">
                        <IconTools size={24} />
                      </span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">
                        Overdue Tasks
                      </div>
                      <div className="text-muted">
                        {taskCounts.overdue} tasks overdue
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <div className="card card-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <span className="bg-success text-white avatar">
                        <IconCheck size={24} />
                      </span>
                    </div>
                    <div className="col">
                      <div className="font-weight-medium">
                        Completed Tasks
                      </div>
                      <div className="text-muted">
                        {taskCounts.completed} tasks completed
                      </div>
                    </div>
                  </div>
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
                        value={typeFilter}
                        onChange={handleTypeFilterChange}
                        aria-label="Filter by type"
                      >
                        <option value="all">All Types</option>
                        <option value="preventive">Preventive</option>
                        <option value="corrective">Corrective</option>
                        <option value="emergency">Emergency</option>
                        <option value="predictive">Predictive</option>
                        <option value="routine">Routine</option>
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
                        <option value="scheduled">Scheduled</option>
                        <option value="in progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="postponed">Postponed</option>
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
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={handleSearch}
                      aria-label="Search tasks"
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
                        No maintenance tasks found matching your criteria.
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

export default ServiceMaintenance;
