import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTable, useSortBy, usePagination } from 'react-table';
import { 
  IconPlus, 
  IconSearch, 
  IconChevronUp, 
  IconChevronDown,
  IconEdit,
  IconTrash,
  IconInfoCircle,
  IconBuildingWarehouse
} from '@tabler/icons-react';
import { warehouseAPI } from '../../core/api/apiService';

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        const { data } = await warehouseAPI.getAll();
        setWarehouses(data.warehouses || []);
        setLoading(false);
      } catch (error) {
        setError('Failed to load warehouses');
        setLoading(false);
      }
    };
    
    fetchWarehouses();
  }, []);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await warehouseAPI.delete(id);
        setWarehouses(warehouses.filter(warehouse => warehouse.id !== id));
      } catch (error) {
        setError('Failed to delete the warehouse');
      }
    }
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Calculate warehouse capacity utilization
  const getUtilizationClass = (utilization) => {
    if (utilization > 90) return 'bg-danger';
    if (utilization > 70) return 'bg-warning';
    return 'bg-success';
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
        Header: 'Name',
        accessor: 'name',
        Cell: ({ row }) => (
          <div className="d-flex align-items-center">
            <span className="avatar avatar-sm me-2 bg-blue-lt">
              <IconBuildingWarehouse size={18} />
            </span>
            <Link to={`/warehouse/${row.original.id}`} className="text-reset">
              {row.original.name}
            </Link>
          </div>
        )
      },
      {
        Header: 'Location',
        accessor: 'location',
      },
      {
        Header: 'Capacity',
        accessor: 'capacity',
        Cell: ({ value }) => <span>{value} items</span>
      },
      {
        Header: 'Utilization',
        accessor: 'utilization',
        Cell: ({ value }) => (
          <div className="row align-items-center">
            <div className="col-12 col-lg-auto">
              {value}%
            </div>
            <div className="col">
              <div className="progress" style={{ height: '6px' }}>
                <div className={`progress-bar ${getUtilizationClass(value)}`} style={{ width: `${value}%` }}></div>
              </div>
            </div>
          </div>
        )
      },
      {
        Header: 'Manager',
        accessor: 'manager'
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => {
          const statusClass = value === 'Active' ? 'bg-success' : value === 'Maintenance' ? 'bg-warning' : 'bg-danger';
          return <span className={`badge ${statusClass}`}>{value}</span>;
        }
      },
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }) => (
          <div className="btn-list flex-nowrap">
            <Link to={`/warehouse/${row.original.id}`} className="btn btn-sm btn-icon btn-outline-primary">
              <IconInfoCircle size={18} />
            </Link>
            <Link to={`/warehouse/${row.original.id}/edit`} className="btn btn-sm btn-icon btn-outline-secondary">
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
    []
  );
  
  // Filter data based on search
  const filteredData = useMemo(() => {
    return warehouses.filter(warehouse => {
      return warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             warehouse.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (warehouse.manager && warehouse.manager.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [warehouses, searchQuery]);
  
  // Mock data if API doesn't return any
  const mockWarehouses = [
    { 
      id: 'WH001', 
      name: 'Main Medical Storage', 
      location: 'Building A, Floor 1', 
      capacity: 5000, 
      utilization: 78, 
      manager: 'Sarah Johnson',
      status: 'Active'
    },
    { 
      id: 'WH002', 
      name: 'IT Equipment Storage', 
      location: 'Building B, Floor 2', 
      capacity: 2000, 
      utilization: 45, 
      manager: 'Michael Chen',
      status: 'Active'
    },
    { 
      id: 'WH003', 
      name: 'Emergency Supplies', 
      location: 'Building A, Basement', 
      capacity: 3000, 
      utilization: 92, 
      manager: 'David Williams',
      status: 'Active'
    },
    { 
      id: 'WH004', 
      name: 'Pharmacy Storage', 
      location: 'Building C, Floor 1', 
      capacity: 1500, 
      utilization: 65, 
      manager: 'Lisa Rodriguez',
      status: 'Maintenance'
    },
    { 
      id: 'WH005', 
      name: 'Medical Devices', 
      location: 'Building D, Floor 2', 
      capacity: 1000, 
      utilization: 87, 
      manager: 'Kevin Taylor',
      status: 'Active'
    },
    { 
      id: 'WH006', 
      name: 'Archive Storage', 
      location: 'Building B, Basement', 
      capacity: 4000, 
      utilization: 30, 
      manager: 'Jennifer Brown',
      status: 'Active'
    }
  ];
  
  // Use mock data if no warehouses are returned
  const dataToUse = warehouses.length > 0 ? filteredData : mockWarehouses;
  
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
      data: dataToUse,
      initialState: { pageIndex: 0, pageSize: 10 }
    },
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
              <h2 className="page-title">Warehouse Management</h2>
              <div className="text-muted mt-1">
                {dataToUse.length} warehouses
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/warehouse/new" className="btn btn-primary d-none d-sm-inline-block">
                  <IconPlus className="icon" />
                  Add Warehouse
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
                <div className="ms-auto text-muted">
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <IconSearch size={18} stroke={1.5} />
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search warehouses..."
                      value={searchQuery}
                      onChange={handleSearch}
                      aria-label="Search warehouses"
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
                  {dataToUse.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-4">
                        No warehouses found. Try changing your search or add a new warehouse.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="card-footer d-flex align-items-center">
              <p className="m-0 text-muted">
                Showing <span>{pageIndex * pageSize + 1}</span> to <span>{Math.min((pageIndex + 1) * pageSize, dataToUse.length)}</span> of <span>{dataToUse.length}</span> entries
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

export default WarehouseList;
