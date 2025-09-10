import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI for this specific message
      return (
        <div className="flex justify-start mb-4">
          <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow bg-red-50 border border-red-200">
            <div className="text-red-600 text-sm">
              [Message error - please clear old messages]
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;