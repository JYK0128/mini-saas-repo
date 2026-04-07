import './app.css';

import { keepPreviousData, MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import axios from 'axios';
import { Toaster } from 'sonner';

import { toastApiSuccess } from '@/lib/error-handler';
import { routeTree } from '@/routeTree.gen';

axios.defaults.baseURL = '/api';
axios.defaults.withCredentials = true;

/* 1) router 설정 */
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface StaticDataRouteOption {
  }
}

const router = createRouter({
  basepath: import.meta.env.BASE_URL,
  routeTree,
  context: {
    queryClient: undefined!,
  },
});

/* 2) client tools 설정 */
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (data) => {
      toastApiSuccess(data);
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      placeholderData: keepPreviousData,
      throwOnError: false,
      staleTime: 0,
      gcTime: 0,
    },
    mutations: {
      retry: false,
      throwOnError: false,
      gcTime: 0,
    },
  },
});

function AppInner() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient }} />
      <TanStackRouterDevtools router={router} initialIsOpen={false} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function App() {
  return (
    <>
      <AppInner />
      <Toaster />
    </>
  );
}

export default App;
