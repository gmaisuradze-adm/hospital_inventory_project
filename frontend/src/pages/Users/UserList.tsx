import React from 'react';

const UserList: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
        <p className="text-secondary-600">Manage users, roles, and permissions</p>
      </div>
      
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">User Management</h3>
          <p className="text-secondary-600">Coming soon - Comprehensive user management features</p>
        </div>
      </div>
    </div>
  );
};

export default UserList;
