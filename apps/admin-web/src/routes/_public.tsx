import { cn } from '@repo/ui';
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { Provider } from 'jotai';

import { publicStore } from '@/lib/atoms';

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});

function PublicLayout() {
  const { pathname } = useLocation();

  const isLoginPage = pathname === '/login';

  return (
    <Provider store={publicStore}>
      <div className={cn(
        'size-full min-h-screen',
        'grid grid-rows-[.3fr_1fr_.3fr] gap-3 p-4',
        'bg-zinc-50 dark:bg-zinc-950',
      )}
      >
        <header className="flex items-center justify-center">
          <Link to="/">
            <h1 className="text-3xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50">
              Admin System
            </h1>
          </Link>
        </header>

        <main className="min-h-0">
          <Outlet />
        </main>

        <footer className="flex items-center justify-center">
          {
            isLoginPage
              ? (
                <p className="text-center text-xs font-medium text-muted-foreground/40 uppercase tracking-[0.2em]">
                  © 2026 Admin Portal System.
                  <br />
                  All rights reserved.
                </p>
              )
              : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">이미 계정이 있으신가요?</p>
                  <Link
                    to="/login"
                    search={{ redirect: undefined }}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    로그인하기
                  </Link>
                </div>
              )
          }
        </footer>
      </div>
    </Provider>
  );
}
