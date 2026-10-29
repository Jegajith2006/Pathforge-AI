import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PathForge AI ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F5F6FC',
            padding: '24px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              padding: '36px',
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(16, 27, 48, 0.08)',
              textAlign: 'center',
              border: '1px solid #E3E8F2',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: '#FEF2F2',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#15213B',
                margin: '0 0 8px',
              }}
            >
              Workspace Interface Notice
            </h2>
            <p
              style={{
                fontSize: '0.88rem',
                color: '#64748B',
                lineHeight: '1.5',
                margin: '0 0 24px',
              }}
            >
              A non-blocking display issue occurred while rendering this view. Your session, progress, and database records remain safe.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/dashboard';
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#5B4BFF',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(91, 75, 255, 0.25)',
                }}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFD',
                  color: '#15213B',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  border: '1px solid #E3E8F2',
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

