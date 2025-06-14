import React, { useState } from 'react';
import { MagnifyingGlassIcon, EyeIcon, DocumentArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface FormSubmission {
  id: string;
  formName: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, any>;
}

const FormSubmissions: React.FC = () => {
  const [submissions] = useState<FormSubmission[]>([
    {
      id: '1',
      formName: 'IT Request Form',
      submittedBy: 'Dr. Sarah Johnson',
      submittedAt: '2024-12-01T10:30:00Z',
      status: 'pending',
      data: {
        'Request Type': 'Hardware',
        'Description': 'Need new laptop for medical records',
        'Department': 'ICU',
        'Priority': 'High',
      },
    },
    {
      id: '2',
      formName: 'Equipment Request Form',
      submittedBy: 'John Smith',
      submittedAt: '2024-12-01T09:15:00Z',
      status: 'approved',
      data: {
        'Equipment Type': 'Printer',
        'Model': 'HP LaserJet Pro',
        'Quantity': '2',
        'Justification': 'Current printers are failing frequently',
      },
    },
    {
      id: '3',
      formName: 'Maintenance Request Form',
      submittedBy: 'Jane Wilson',
      submittedAt: '2024-11-30T16:45:00Z',
      status: 'rejected',
      data: {
        'Issue Type': 'Network',
        'Location': 'Emergency Department',
        'Description': 'Internet connection dropping frequently',
        'Urgency': 'Medium',
      },
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.formName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: FormSubmission['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
          <p className="text-gray-600">View and manage form submissions</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <DocumentArrowDownIcon className="h-5 w-5" />
          Export
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
                placeholder="Search submissions..."
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
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Submissions ({filteredSubmissions.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-medium text-gray-900">{submission.formName}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>Submitted by {submission.submittedBy}</span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {/* Preview of submission data */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(submission.data).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-medium text-gray-600">{key}:</span>
                        <span className="text-gray-800 ml-1">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSubmission(submission)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  {submission.status === 'pending' && (
                    <>
                      <button className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg">
                        Approve
                      </button>
                      <button className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No submissions found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Submission Details</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Form:</span>
                  <p className="text-gray-900">{selectedSubmission.formName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                    {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Submitted by:</span>
                  <p className="text-gray-900">{selectedSubmission.submittedBy}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Submitted at:</span>
                  <p className="text-gray-900">
                    {new Date(selectedSubmission.submittedAt).toLocaleDateString()} at{' '}
                    {new Date(selectedSubmission.submittedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Submission Data</h4>
                <div className="space-y-3">
                  {Object.entries(selectedSubmission.data).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="font-medium text-gray-600 text-sm">{key}</span>
                      <p className="text-gray-900 mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {selectedSubmission.status === 'pending' && (
                <>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSubmissions;
