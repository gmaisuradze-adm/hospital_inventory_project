import React from 'react';

const ITRequestDetails: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">IT Request Details</h1>
        <p className="text-gray-600">
          This page would show detailed information about a specific IT request, including:
        </p>
        <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
          <li>Request title and description</li>
          <li>Priority and category</li>
          <li>Status and timeline</li>
          <li>Assigned technician</li>
          <li>Cost estimates and actual costs</li>
          <li>Comments and updates</li>
          <li>Approval workflow</li>
        </ul>
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> This is a placeholder page. The full implementation would include
            detailed request information, status updates, and action buttons for authorized users.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ITRequestDetails;
