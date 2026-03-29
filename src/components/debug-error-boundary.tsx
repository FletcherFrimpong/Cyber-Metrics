"use client";

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ hasError: true, error });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-900 text-white p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-red-500 mb-4">
              Something went wrong
            </h1>
            <div className="bg-neutral-800 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Error Details:</h2>
              <pre className="text-sm text-red-400 overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
