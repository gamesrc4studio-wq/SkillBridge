import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    let msg = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(msg);
      if (parsed && parsed.error && parsed.operationType) {
        msg = `Database ${parsed.operationType} error on ${parsed.path || 'record'}: ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, errorMessage: msg };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SkillBridge ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#D1D9E0] rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FFEBE9] text-[#CF222E] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#1F2328]">Something went wrong</h2>
                <p className="mt-1 text-sm text-[#656D76] break-words">{this.state.errorMessage}</p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      this.setState({ hasError: false, errorMessage: '' });
                      window.location.reload();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0969DA] hover:bg-[#0550AE] rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reload Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
