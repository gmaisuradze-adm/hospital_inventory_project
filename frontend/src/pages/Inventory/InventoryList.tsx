import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetInventoryItemsQuery } from '../../store/api/inventoryApi';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const InventoryList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    location: '',
  });

  const { data, isLoading, error } = useGetInventoryItemsQuery({
    page,
    limit: 50,
    ...filters,
  });

  const categories = [
    'COMPUTER',
    'SERVER', 
    'PRINTER',
    'NETWORK_EQUIPMENT',
    'PERIPHERAL',
    'SOFTWARE',
    'CONSUMABLE',
    'SPARE_PART',
    'MOBILE_DEVICE',
    'OTHER'
  ];

  const statuses = [
    'AVAILABLE',
    'IN_USE',
    'MAINTENANCE', 
    'RETIRED',
    'DAMAGED',
    'RESERVED'
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      AVAILABLE: 'badge-success',
      IN_USE: 'badge-primary',
      MAINTENANCE: 'badge-warning',
      RETIRED: 'badge-secondary',
      DAMAGED: 'badge-error',
      RESERVED: 'badge-warning'
    };

    return (
      <span className={`badge ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-error-600 py-8">
        Error loading inventory items
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Inventory Management</h1>
          <p className="text-secondary-600">Manage your IT equipment and assets</p>
        </div>
        <Link to="/inventory/add" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Item
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search items..."
                className="form-input pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <select
              className="form-input"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <input
              type="text"
              placeholder="Filter by location..."
              className="form-input"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Category</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Location</th>
                  <th className="table-header-cell">Quantity</th>
                  <th className="table-header-cell">Serial Number</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {data?.items.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-secondary-900">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-sm text-secondary-500">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge-secondary">
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="table-cell">{item.location}</td>
                    <td className="table-cell">
                      <span className={`font-medium ${
                        item.minQuantity && item.quantity <= item.minQuantity 
                          ? 'text-error-600' 
                          : 'text-secondary-900'
                      }`}>
                        {item.quantity}
                      </span>
                      {item.minQuantity && (
                        <span className="text-xs text-secondary-500">
                          {' '}(min: {item.minQuantity})
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-secondary-600">
                        {item.serialNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/inventory/${item.id}`}
                          className="text-primary-600 hover:text-primary-500"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/inventory/${item.id}/edit`}
                          className="text-secondary-600 hover:text-secondary-500"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button className="text-error-600 hover:text-error-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-secondary-700">
            Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.pagination.total)} of{' '}
            {data.pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-secondary-600">
              Page {page} of {data.pagination.pages}
            </span>
            <button
              onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
              disabled={page === data.pagination.pages}
              className="btn-secondary btn-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
