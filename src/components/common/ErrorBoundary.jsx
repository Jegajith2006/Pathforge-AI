import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Standard React Error Boundary
 * Catches JavaScript errors anywhere in child component tree,
 * logs errors, and renders a graceful recovery UI.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PathForge AI ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('pathforge-theme');
      localStorage.removeItem('pathforge_theme');
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--background,#0b1020)] text-[var(--text-primary,#f8fafc)] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-2xl bg-[var(--surface,#121b2f)] border border-[var(--border,rgba(148,163,184,0.16))] shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display">PathForge AI Calibration Paused</h2>
              <p className="text-sm text-[var(--text-secondary,#cbd5e1)] leading-relaxed">
                An unexpected interface event occurred while rendering. Your data and progress remain completely intact.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-[var(--surface-secondary,#1a263d)] text-xs font-mono text-[var(--text-muted,#94a3b8)] text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Screen
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-secondary,#1a263d)] hover:bg-[var(--surface-hover,#202d46)] border border-[var(--border,rgba(148,163,184,0.16))] text-[var(--text-primary,#f8fafc)] font-medium text-sm transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return to Home
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
