import React from 'react';

const CreateITRequest: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Create IT Request</h1>
        <p className="text-gray-600 mb-6">
          This page would contain a comprehensive form for creating new IT requests.
        </p>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Form Fields Would Include:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Request title and description</li>
                <li>Priority level selection</li>
                <li>Category dropdown</li>
                <li>Department selection</li>
                <li>Required completion date</li>
                <li>Cost estimation</li>
                <li>Business justification</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Real-time form validation</li>
                <li>File attachments</li>
                <li>Draft saving capability</li>
                <li>Approval workflow integration</li>
                <li>Email notifications</li>
                <li>Mobile responsive design</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <p className="text-green-800 text-sm">
              <strong>Implementation Note:</strong> This form would use React Hook Form for validation,
              integrate with the backend API, and provide a smooth user experience with proper error handling.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Create Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateITRequest;
