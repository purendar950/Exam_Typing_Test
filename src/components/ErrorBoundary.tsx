import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReturnHome = () => {
    window.location.hash = '#/';
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'var(--surface)',
              border: '1.5px solid var(--bd-red-100)',
              borderRadius: '16px',
              padding: '32px 24px',
              boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.12)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-red-800)', marginBottom: '8px' }}>
              {this.props.fallbackTitle || 'Something went wrong (तकनीकी समस्या हुई)'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--fg-slate-500)', lineHeight: 1.6, marginBottom: '20px' }}>
              We encountered an unexpected error while rendering this page. Your saved test history and profile are safe in local storage.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'var(--bg-red-50)',
                  border: '1px solid var(--bd-red-200)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: 'var(--fg-red-700)',
                  textAlign: 'left',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  marginBottom: '24px'
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, var(--tw-sky-600) 0%, var(--tw-sky-700) 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🔄</span>
                <span>Reload Page (पेज रीलोड करें)</span>
              </button>

              <button
                onClick={this.handleReturnHome}
                style={{
                  background: 'var(--bg-slate-50)',
                  color: 'var(--fg-slate-700)',
                  border: '1px solid var(--bd-slate-300)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🏠</span>
                <span>Return to Home (होम पर जाएँ)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
