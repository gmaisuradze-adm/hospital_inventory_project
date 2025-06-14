import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-secondary-900 mb-2">
          Loading...
        </h2>
        <p className="text-sm text-secondary-500">
          Please wait while we load your content
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
