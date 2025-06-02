import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import { 
  IconPlus, 
  IconSearch, 
  IconFilter, 
  IconChevronUp, 
  IconChevronDown,
  IconEdit,
  IconTrash,
  IconInfoCircle
} from '@tabler/icons-react';
import { inventoryAPI } from '../../core/api/apiService';

const InventoryList = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const { data } = await inventoryAPI.getAll();
        setInventoryItems(data.items || []);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.items.map(item => item.category))];
        setCategories(uniqueCategories);
        
        setLoading(false);
      } catch (error) {
        setError('Failed to load inventory items');
        setLoading(false);
      }
    };
    
    fetchInventory();
  }, []);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryAPI.delete(id);
        // Remove from state
        setInventoryItems(inventoryItems.filter(item => item.id !== id));
      } catch (error) {
        setError('Failed to delete the item');
      }
    }
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleCategoryFilter = (e) => {
    setFilterCategory(e.target.value);
  };
  
  const getStatusBadgeClass = (status) => {
    switch(status.toLowerCase()) {
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
          <Link to={`/inventory/${row.original.id}`} className="text-reset">
            {row.original.name}
          </Link>
        )
      },
      {
        Header: 'Category',
        accessor: 'category'
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
        Cell: ({ value }) => <span className="fw-bold">{value}</span>
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => (
          <span className={`badge ${getStatusBadgeClass(value)}`}>
            {value}
          </span>
        )
      },
      {
        Header: 'Location',
        accessor: 'location'
      },
      {
        Header: 'Last Updated',
        accessor: 'updatedAt',
        Cell: ({ value }) => new Date(value).toLocaleDateString()
      },
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }) => (
          <div className="btn-list flex-nowrap">
            <Link to={`/inventory/${row.original.id}`} className="btn btn-sm btn-icon btn-outline-primary">
              <IconInfoCircle size={18} />
            </Link>
            <Link to={`/inventory/${row.original.id}/edit`} className="btn btn-sm btn-icon btn-outline-secondary">
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
  
  // Filter data based on search and category filter
  const filteredData = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.id.toString().includes(searchQuery);
      
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [inventoryItems, searchQuery, filterCategory]);
  
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
    useGlobalFilter,
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
              <h2 className="page-title">Inventory Management</h2>
              <div className="text-muted mt-1">
                {filteredData.length} items in inventory
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link to="/inventory/new" className="btn btn-primary d-none d-sm-inline-block">
                  <IconPlus className="icon" />
                  Add Item
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
                  <div className="d-flex flex-row">
                    <div className="me-2">
                      <select
                        className="form-select form-select-sm"
                        value={filterCategory}
                        onChange={handleCategoryFilter}
                      >
                        <option value="all">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-icon">
                      <span className="input-icon-addon">
                        <IconSearch size={18} stroke={1.5} />
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={handleSearch}
                        aria-label="Search inventory"
                      />
                    </div>
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
                        No inventory items found. Try changing the filters or add a new item.
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

export default InventoryList;
