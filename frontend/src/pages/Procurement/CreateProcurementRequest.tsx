import React from 'react';

const CreateProcurementRequest: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Create Procurement Request</h1>
        <p className="text-gray-600 mb-6">
          This page would contain a detailed form for creating new procurement requests with
          budget tracking and approval workflow integration.
        </p>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Request title and description</li>
                <li>Category selection (Hardware/Software/Services)</li>
                <li>Priority level</li>
                <li>Department and budget code</li>
                <li>Estimated cost and budget allocation</li>
                <li>Required delivery date</li>
                <li>Business justification</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Vendor & Specifications</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Preferred vendor selection</li>
                <li>Detailed specifications</li>
                <li>Quantity requirements</li>
                <li>Technical requirements</li>
                <li>Warranty and support needs</li>
                <li>Compliance requirements</li>
                <li>File attachments (quotes, specs)</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Approval Workflow</h4>
            <p className="text-blue-800 text-sm">
              This form would automatically route requests through the appropriate approval chain
              based on cost thresholds and department policies.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="font-medium text-green-900 mb-2">Budget Integration</h4>
            <p className="text-green-800 text-sm">
              Real-time budget availability checking and automatic allocation tracking
              to prevent overspending and ensure compliance.
            </p>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Save as Draft
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                Preview
              </button>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProcurementRequest;
