'use client';

import React from 'react';
import { captureException } from '@sentry/nextjs';

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  isRetrying: boolean;
}

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void; isRetrying: boolean }>;
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
  showRetryButton?: boolean;
}

// Error boundary specifically for async operations and server components
export class AsyncErrorBoundary extends React.Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  public retryCount = 0;
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
    return { hasError: true, error, isRetrying: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log async/server errors to Sentry with additional context
    captureException(error, {
      tags: {
        error_type: 'async_component',
        component_type: 'server_component',
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        async_error: {
          retryCount: this.retryCount,
          maxRetries: this.props.maxRetries || 3,
        },
      },
    });

    this.props.onError?.(error);
    console.error('AsyncErrorBoundary caught an error:', error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  retry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;

    if (this.retryCount < maxRetries) {
      this.retryCount += 1;
      this.setState({ isRetrying: true });

      this.retryTimeoutId = setTimeout(() => {
        this.setState({ hasError: false, error: undefined, isRetrying: false });
      }, retryDelay * this.retryCount); // Exponential backoff
    }
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultAsyncErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          retry={this.retry}
          isRetrying={this.state.isRetrying}
        />
      );
    }

    return this.props.children;
  }
}

// Default fallback for async errors
const DefaultAsyncErrorFallback: React.FC<{
  error?: Error;
  retry: () => void;
  isRetrying: boolean;
}> = ({ error, retry, isRetrying }) => (
  <div className="min-h-[300px] flex items-center justify-center p-6">
    <div className="text-center max-w-lg">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Error</h3>
      <p className="text-gray-600 mb-4">
        We couldn't load this content. This might be due to a temporary network issue or server problem.
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Error details (development only)
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      )}
      <button
        onClick={retry}
        disabled={isRetrying}
        className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
      >
        {isRetrying ? 'Retrying...' : 'Try Again'}
      </button>
    </div>
  </div>
);

// Specialized error boundary for API calls
export class APIErrorBoundary extends AsyncErrorBoundary {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, {
      tags: {
        error_type: 'api_error',
        component_type: 'api_boundary',
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        api_error: {
          retryCount: this.retryCount,
          maxRetries: this.props.maxRetries || 2, // Fewer retries for API errors
        },
      },
    });

    this.props.onError?.(error);
    console.error('APIErrorBoundary caught an error:', error, errorInfo);
  }
}

// Error boundary for critical application sections
export class CriticalErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, {
      tags: {
        error_type: 'critical_error',
        component_name: this.props.name,
        severity: 'fatal',
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        critical_section: {
          sectionName: this.props.name,
        },
      },
    });

    console.error(`Critical error in ${this.props.name}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8">
            <div className="mb-6">
              <svg
                className="mx-auto h-20 w-20 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Error</h1>
            <p className="text-gray-600 mb-6">
              A critical error has occurred. Please refresh the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}