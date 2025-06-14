import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Form {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  submissionCount: number;
  createdAt: string;
  createdBy: string;
}

const FormList: React.FC = () => {
  const [forms] = useState<Form[]>([
    {
      id: '1',
      name: 'IT Request Form',
      description: 'Standard form for IT service requests',
      isActive: true,
      submissionCount: 45,
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'Admin User',
    },
    {
      id: '2',
      name: 'Equipment Request Form',
      description: 'Form for requesting new equipment',
      isActive: true,
      submissionCount: 23,
      createdAt: '2024-01-10T10:00:00Z',
      createdBy: 'Manager User',
    },
    {
      id: '3',
      name: 'Maintenance Request Form',
      description: 'Form for reporting maintenance issues',
      isActive: false,
      submissionCount: 8,
      createdAt: '2024-01-05T10:00:00Z',
      createdBy: 'IT Admin',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && form.isActive) ||
                         (statusFilter === 'inactive' && !form.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Management</h1>
          <p className="text-gray-600">Create and manage dynamic forms</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create Form
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Forms</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Forms ({filteredForms.length})</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredForms.map((form) => (
            <div key={form.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-medium text-gray-900">{form.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      form.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{form.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{form.submissionCount} submissions</span>
                    <span>Created by {form.createdBy}</span>
                    <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredForms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No forms found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormList;
