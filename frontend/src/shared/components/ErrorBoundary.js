import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-tight py-4">
          <div className="empty">
            <div className="empty-header">Error</div>
            <p className="empty-title">Something went wrong</p>
            <p className="empty-subtitle text-muted">
              We apologize for the inconvenience. The issue has been logged for review.
            </p>
            {this.props.showDetails && this.state.error && (
              <div className="alert alert-danger mt-3">
                <details className="mb-0">
                  <summary>Error details (for developers)</summary>
                  <pre className="m-0 mt-2">{this.state.error.toString()}</pre>
                  {this.state.errorInfo && (
                    <pre className="m-0 mt-2">{this.state.errorInfo.componentStack}</pre>
                  )}
                </details>
              </div>
            )}
            <div className="empty-action">
              <Link to="/" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <line x1="5" y1="12" x2="11" y2="18"></line>
                  <line x1="5" y1="12" x2="11" y2="6"></line>
                </svg>
                Go to Dashboard
              </Link>
              <button onClick={() => window.location.reload()} className="btn btn-outline-secondary ms-2">
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
