import { type QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { ErrorBoundary } from '@/lib/error-boundary';
import { toastApiError } from '@/lib/error-handler';

type AppContext = {
  queryClient: QueryClient
};
export const Route = createRootRouteWithContext<AppContext>()({
  component: () => {
    return (
      <ErrorBoundary
        fallback={({ error, reset }) => {
          console.log(error);
          return (
            <div>
              <div>오류 발생</div>
              <div onClick={reset}>재시도</div>
            </div>
          );
        }}
        onError={toastApiError}
      >
        <Outlet />
      </ErrorBoundary>
    );
  },
});
