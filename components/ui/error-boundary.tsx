"use client";

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on level
      const { level = 'component', showDetails = false } = this.props;
      const { error, errorInfo } = this.state;

      if (level === 'component') {
        return (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Something went wrong</span>
            </div>
            <p className="mt-1 text-xs text-red-600">
              This component encountered an error. Please try refreshing the page.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={this.handleReset}
              className="mt-2 h-7 px-2 text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Try Again
            </Button>
          </div>
        );
      }

      if (level === 'section') {
        return (
          <Card className="mx-auto max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Section Error
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  This section encountered an unexpected error. Don't worry, the rest of the app should still work.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={this.handleReset}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Section
                  </Button>
                  <Button variant="default" onClick={this.handleReload}>
                    Reload Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Page level error
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">
                  Oops! Something went wrong
                </h1>
                <p className="mb-6 text-gray-600">
                  We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
                </p>
                
                {showDetails && error && (
                  <details className="mb-4 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700">
                      Technical Details
                    </summary>
                    <div className="mt-2 rounded-md bg-gray-100 p-3">
                      <p className="text-xs font-mono text-gray-800">
                        {error.message}
                      </p>
                    </div>
                  </details>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button variant="outline" onClick={this.handleReset}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button variant="default" onClick={this.handleReload}>
                    Reload Page
                  </Button>
                  <Button variant="ghost" onClick={this.handleGoHome}>
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper components
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
    {children}
  </ErrorBoundary>
);

export const SectionErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="section">
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary; 