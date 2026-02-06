import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#e2e8f0' }}>
            <h2>Something went wrong</h2>
            <p style={{ color: '#a0aec0' }}>{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                marginTop: '1rem', padding: '0.5rem 1rem',
                background: '#3b82f6', color: '#fff', border: 'none',
                borderRadius: '6px', cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
