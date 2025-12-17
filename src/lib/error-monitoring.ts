import { captureException, captureMessage, withScope } from '@sentry/nextjs';

// Global error handler for unhandled errors
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      withScope((scope) => {
        scope.setTag('error_type', 'unhandled_promise_rejection');
        scope.setLevel('error');
        captureException(event.reason || event);
      });

      console.error('Unhandled promise rejection:', event.reason);
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      withScope((scope) => {
        scope.setTag('error_type', 'uncaught_error');
        scope.setLevel('fatal');
        scope.setContext('error_event', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
        captureException(event.error || event);
      });

      console.error('Uncaught error:', event.error);
    });

    // Handle console errors in production
    if (process.env.NODE_ENV === 'production') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Still log to console
        originalConsoleError.apply(console, args);

        // Send to Sentry if it looks like an error
        const message = args.join(' ');
        if (message.includes('Error') || message.includes('Exception') || args[0] instanceof Error) {
          withScope((scope) => {
            scope.setTag('error_type', 'console_error');
            scope.setLevel('error');
            captureMessage(message, 'error');
          });
        }
      };
    }
  }

  // Handle server-side unhandled rejections
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason, promise) => {
      withScope((scope) => {
        scope.setTag('error_type', 'server_unhandled_rejection');
        scope.setLevel('error');
        scope.setContext('promise_rejection', {
          reason: reason?.toString(),
          promise: promise?.toString(),
        });
        captureException(reason);
      });

      console.error('Server unhandled promise rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      withScope((scope) => {
        scope.setTag('error_type', 'server_uncaught_exception');
        scope.setLevel('fatal');
        captureException(error);
      });

      console.error('Server uncaught exception:', error);
      // Don't exit the process in development
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
  }
};

// Utility function to log user actions for monitoring
export const logUserAction = (action: string, metadata?: Record<string, any>) => {
  withScope((scope) => {
    scope.setTag('action_type', 'user_action');
    scope.setLevel('info');
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        scope.setContext(key, { value });
      });
    }
    captureMessage(`User action: ${action}`, 'info');
  });
};

// Utility function to log performance metrics
export const logPerformanceMetric = (metric: string, value: number, unit: string = 'ms') => {
  withScope((scope) => {
    scope.setTag('metric_type', 'performance');
    scope.setLevel('info');
    scope.setContext('performance_metric', {
      metric,
      value,
      unit,
    });
    captureMessage(`Performance: ${metric} = ${value}${unit}`, 'info');
  });
};

// Utility function to log API errors
export const logApiError = (endpoint: string, error: any, statusCode?: number) => {
  withScope((scope) => {
    scope.setTag('error_type', 'api_error');
    scope.setTag('endpoint', endpoint);
    scope.setLevel('error');
    scope.setContext('api_error', {
      endpoint,
      statusCode,
      error: error?.message || error?.toString(),
    });
    captureException(error);
  });
};

// Utility function to log authentication events
export const logAuthEvent = (event: string, userId?: string, metadata?: Record<string, any>) => {
  withScope((scope) => {
    scope.setTag('event_type', 'auth');
    scope.setTag('auth_event', event);
    scope.setLevel('info');
    if (userId) {
      scope.setUser({ id: userId });
    }
    if (metadata) {
      scope.setContext('auth_metadata', metadata);
    }
    captureMessage(`Auth event: ${event}`, 'info');
  });
};