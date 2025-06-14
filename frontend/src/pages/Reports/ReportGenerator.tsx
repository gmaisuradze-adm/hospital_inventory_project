import React, { useState } from 'react';
import { DocumentChartBarIcon, CalendarIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ReportTemplate {
  id: string;
  name: string;
  type: 'inventory' | 'procurement' | 'requests' | 'audit' | 'analytics';
  description: string;
  parameters: string[];
}

const ReportGenerator: React.FC = () => {
  const [reportTemplates] = useState<ReportTemplate[]>([
    {
      id: '1',
      name: 'Inventory Status Report',
      type: 'inventory',
      description: 'Detailed inventory status with location and condition information',
      parameters: ['Date Range', 'Location', 'Category', 'Status'],
    },
    {
      id: '2',
      name: 'Procurement Analysis',
      type: 'procurement',
      description: 'Procurement requests with budget and vendor analysis',
      parameters: ['Date Range', 'Department', 'Budget Range', 'Status', 'Vendor'],
    },
    {
      id: '3',
      name: 'IT Request Metrics',
      type: 'requests',
      description: 'IT request completion rates and response times',
      parameters: ['Date Range', 'Category', 'Priority', 'Status', 'Assigned To'],
    },
    {
      id: '4',
      name: 'User Activity Report',
      type: 'audit',
      description: 'User activity and system access patterns',
      parameters: ['Date Range', 'User Role', 'Action Type', 'Department'],
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportParameters, setReportParameters] = useState<Record<string, string>>({});
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleParameterChange = (parameter: string, value: string) => {
    setReportParameters(prev => ({
      ...prev,
      [parameter]: value
    }));
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      alert('Report generated successfully!');
    }, 3000);
  };

  const renderParameterInput = (parameter: string) => {
    switch (parameter) {
      case 'Date Range':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={reportParameters[`${parameter}_start`] || ''}
              onChange={(e) => handleParameterChange(`${parameter}_start`, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={reportParameters[`${parameter}_end`] || ''}
              onChange={(e) => handleParameterChange(`${parameter}_end`, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      case 'Status':
        return (
          <select
            value={reportParameters[parameter] || ''}
            onChange={(e) => handleParameterChange(parameter, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        );
      case 'Priority':
        return (
          <select
            value={reportParameters[parameter] || ''}
            onChange={(e) => handleParameterChange(parameter, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        );
      case 'Category':
        return (
          <select
            value={reportParameters[parameter] || ''}
            onChange={(e) => handleParameterChange(parameter, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="network">Network</option>
            <option value="security">Security</option>
          </select>
        );
      case 'Department':
        return (
          <select
            value={reportParameters[parameter] || ''}
            onChange={(e) => handleParameterChange(parameter, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            <option value="ICU">ICU</option>
            <option value="Emergency">Emergency</option>
            <option value="IT">IT</option>
            <option value="Administration">Administration</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={reportParameters[parameter] || ''}
            onChange={(e) => handleParameterChange(parameter, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${parameter.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Generator</h1>
          <p className="text-gray-600">Create custom reports with specific parameters</p>
        </div>
        <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <DocumentChartBarIcon className="h-5 w-5" />
          Report History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Templates</h3>
            <div className="space-y-3">
              {reportTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{template.name}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {template.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedTemplate.name}</h3>
                <p className="text-gray-600">{selectedTemplate.description}</p>
              </div>

              {/* Parameters */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5" />
                  Report Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.parameters.map((parameter) => (
                    <div key={parameter}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {parameter}
                      </label>
                      {renderParameterInput(parameter)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Output Format</h4>
                <div className="flex gap-4">
                  {(['pdf', 'excel', 'csv'] as const).map((format) => (
                    <label key={format} className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={reportFormat === format}
                        onChange={(e) => setReportFormat(e.target.value as typeof reportFormat)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule Options */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Schedule Options
                </h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center">
                    <input type="radio" name="schedule" value="now" defaultChecked className="mr-2" />
                    <span className="text-sm text-gray-700">Generate now</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="schedule" value="daily" className="mr-2" />
                    <span className="text-sm text-gray-700">Daily at 9:00 AM</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="schedule" value="weekly" className="mr-2" />
                    <span className="text-sm text-gray-700">Weekly on Monday</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="schedule" value="monthly" className="mr-2" />
                    <span className="text-sm text-gray-700">Monthly on 1st day</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Save Template
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <DocumentChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report Template</h3>
              <p className="text-gray-600">Choose a report template from the left panel to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reports</h3>
        <div className="space-y-3">
          {[
            { name: 'Monthly Inventory Report', generated: '2024-12-01', format: 'PDF', size: '2.3 MB' },
            { name: 'Weekly IT Requests', generated: '2024-11-28', format: 'Excel', size: '890 KB' },
            { name: 'Procurement Analysis Q4', generated: '2024-11-25', format: 'PDF', size: '1.8 MB' },
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <DocumentChartBarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{report.name}</h4>
                  <p className="text-xs text-gray-600">
                    Generated {report.generated} • {report.format} • {report.size}
                  </p>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-blue-600">
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
