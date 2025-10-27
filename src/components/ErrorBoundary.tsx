import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={this.handleReset}
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload App
              </Button>
              
              {import.meta.env.DEV && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    View Error Details
                  </summary>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
