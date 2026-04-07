import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode, useEffect } from 'react';

interface ReactErrorBoundaryProps
  extends PropsWithChildren {
  fallback?: (props: { error: Error | null, reset: () => void }) => ReactNode
}

interface RuntimeErrorBoundaryProps
  extends PropsWithChildren {
  onError?: (error: unknown) => void
}

interface ReactErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/** Global Error Boundary */
export function ErrorBoundary({
  children, fallback, onError,
}: Readonly<PropsWithChildren<ReactErrorBoundaryProps & RuntimeErrorBoundaryProps>>) {
  return (
    <ReactErrorBoundary fallback={fallback}>
      <RuntimeErrorBoundary onError={onError}>
        {children}
      </RuntimeErrorBoundary>
    </ReactErrorBoundary>
  );
}

/** React Error Boundary */
class ReactErrorBoundary
  extends Component<Readonly<ReactErrorBoundaryProps>, ReactErrorBoundaryState> {
  constructor(props: Readonly<ReactErrorBoundaryProps>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  override render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      return (
        <>
          {fallback?.({
            error,
            reset: () => this.setState({ hasError: false, error: null }),
          })}
        </>
      );
    }

    return <>{children}</>;
  }
}

/** Runtime Error Boundary */
function RuntimeErrorBoundary({
  children, onError: logger,
}: Readonly<RuntimeErrorBoundaryProps>) {
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      logger?.(event.error);
      if (import.meta.env.MODE === 'production') {
        event.preventDefault();
        return true;
      }
    };

    const rejectHandler = (event: PromiseRejectionEvent) => {
      logger?.(event.reason);
      if (import.meta.env.MODE === 'production') {
        event.preventDefault();
        return true;
      };
    };

    addEventListener('error', errorHandler);
    addEventListener('unhandledrejection', rejectHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
