import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="container-xl d-flex flex-column justify-content-center align-items-center min-vh-100">
      <div className="empty">
        <div className="empty-icon">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
        <p className="empty-title">Loading...</p>
        <p className="empty-subtitle text-muted">
          Please wait while we load your content
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
