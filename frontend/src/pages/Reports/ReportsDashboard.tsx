import React, { useState } from 'react';
import { ChartBarIcon, DocumentChartBarIcon, CalendarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface Report {
  id: string;
  name: string;
  type: 'inventory' | 'procurement' | 'requests' | 'audit' | 'analytics';
  description: string;
  lastGenerated: string;
  fileSize: string;
  status: 'ready' | 'generating' | 'failed';
}

const ReportsDashboard: React.FC = () => {
  const [reports] = useState<Report[]>([
    {
      id: '1',
      name: 'Monthly Inventory Report',
      type: 'inventory',
      description: 'Comprehensive inventory status and movements',
      lastGenerated: '2024-12-01T10:00:00Z',
      fileSize: '2.3 MB',
      status: 'ready',
    },
    {
      id: '2',
      name: 'Procurement Analysis',
      type: 'procurement',
      description: 'Procurement trends and budget analysis',
      lastGenerated: '2024-12-01T08:30:00Z',
      fileSize: '1.8 MB',
      status: 'ready',
    },
    {
      id: '3',
      name: 'IT Requests Summary',
      type: 'requests',
      description: 'IT request status and completion rates',
      lastGenerated: '2024-11-30T16:00:00Z',
      fileSize: '950 KB',
      status: 'ready',
    },
    {
      id: '4',
      name: 'User Activity Audit',
      type: 'audit',
      description: 'User activity and system access logs',
      lastGenerated: '2024-11-29T14:15:00Z',
      fileSize: '3.1 MB',
      status: 'ready',
    },
    {
      id: '5',
      name: 'Weekly Analytics',
      type: 'analytics',
      description: 'Performance metrics and KPIs',
      lastGenerated: '',
      fileSize: '',
      status: 'generating',
    },
  ]);

  const [selectedType, setSelectedType] = useState('all');

  const reportTypes = [
    { value: 'all', label: 'All Reports' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'procurement', label: 'Procurement' },
    { value: 'requests', label: 'IT Requests' },
    { value: 'audit', label: 'Audit' },
    { value: 'analytics', label: 'Analytics' },
  ];

  const filteredReports = reports.filter(report => 
    selectedType === 'all' || report.type === selectedType
  );

  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'inventory':
        return '📦';
      case 'procurement':
        return '🛒';
      case 'requests':
        return '🎫';
      case 'audit':
        return '🔍';
      case 'analytics':
        return '📊';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateReport = (reportId: string) => {
    console.log('Generating report:', reportId);
    // TODO: Implement report generation
  };

  const handleDownloadReport = (reportId: string) => {
    console.log('Downloading report:', reportId);
    // TODO: Implement report download
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600">Generate and manage system reports</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <DocumentChartBarIcon className="h-5 w-5" />
          Custom Report
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ready</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'ready').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-bold">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Generating</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'generating').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Last 7 Days
            </button>
            <button className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Last 30 Days
            </button>
            <button className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Custom Range
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Available Reports ({filteredReports.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getTypeIcon(report.type)}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      {report.name}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </h4>
                    <p className="text-gray-600 mt-1">{report.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {report.lastGenerated && (
                        <>
                          <span>Last generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                          <span>Size: {report.fileSize}</span>
                        </>
                      )}
                      <span className="capitalize">{report.type} report</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {report.status === 'ready' && (
                    <button
                      onClick={() => handleDownloadReport(report.id)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                      title="Download Report"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={report.status === 'generating'}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
                  >
                    {report.status === 'generating' ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No reports found for the selected type.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-medium text-gray-900">Generate Monthly Summary</h4>
                <p className="text-sm text-gray-600">Create comprehensive monthly report</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <h4 className="font-medium text-gray-900">Performance Analytics</h4>
                <p className="text-sm text-gray-600">View system performance metrics</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <div>
                <h4 className="font-medium text-gray-900">Custom Report Builder</h4>
                <p className="text-sm text-gray-600">Create custom reports with specific parameters</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
