import { Avatar, AvatarFallback, AvatarImage, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Sheet, SheetContent, SheetTrigger } from '@repo/ui';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, isRedirect, Link, Outlet, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { Activity, CreditCard, Database, LayoutDashboard, LogOut, Menu, Receipt, Settings, UserCircle, Users } from 'lucide-react';
import { useMemo } from 'react';

import { getProfileControllerGetProfileQueryOptions,
         useSignInControllerSignOut } from '@/api/endpoints';
import type { User } from '@/api/model';
import { publicStore, verifyEmailAtom } from '@/lib/atoms';
import { getApiError, hasApiError } from '@/lib/error-handler';
import { useSessionRole } from '@/lib/session-role';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context, location }) => {
    return context.queryClient.ensureQueryData(
      getProfileControllerGetProfileQueryOptions({
        query: {
          staleTime: 1000 * 60 * 10,
          gcTime: 1000 * 60 * 30,
        },
      }),
    ).then((profileData) => {
      // If already fully onboarded but accessing pending pages, move to dashboard
      if (['/onboarding', '/agreement'].includes(location.pathname)) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw redirect({ to: '/dashboard' });
      }
      return { user: profileData.data };
    }).catch((e) => {
      if (isRedirect(e)) throw e;

      if (hasApiError(e, 'EMAIL_NOT_VERIFIED')) {
        if (location.pathname !== '/sign-up/verify-email') {
          const { field: email } = getApiError(e, 'EMAIL_NOT_VERIFIED') ?? {};

          if (email) {
            publicStore.set(verifyEmailAtom, email);
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw redirect({ to: '/sign-up/verify-email' });
          }
          else {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw redirect({ to: '/login' });
          }
        }
        return;
      }

      if (hasApiError(e, 'NEEDS_TERM_AGREEMENT')) {
        if (location.pathname !== '/agreement') {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw redirect({ to: '/agreement' });
        }
        return;
      }

      if (hasApiError(e, 'MEMBER_NOT_FOUND')) {
        if (location.pathname !== '/onboarding') {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw redirect({ to: '/onboarding' });
        }
        return;
      }

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    });
  },
  component: ProtectedLayout,
});

function SidebarContent({
  menus,
  user,
  location,
}: {
  readonly menus: { to: string, label: string, icon: LucideIcon }[]
  readonly user?: User
  readonly location: { pathname: string }
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-50 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 shadow-xl shadow-slate-200">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">Platform</span>
            <span className="text-[10px] font-bold text-slate-400">Admin Console v1.0</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Main Menu</p>
        <nav className="flex flex-col gap-1.5">
          {menus.map((menu) => {
            const isActive = location.pathname.startsWith(menu.to);
            const Icon = menu.icon;
            return (
              <Link
                key={menu.to}
                to={menu.to}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 ring-4 ring-slate-900/5'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                <span>{menu.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/50">
          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
            <AvatarImage src={user?.image} />
            <AvatarFallback className="bg-slate-200 text-slate-500 text-xs font-bold">
              {user?.name?.[0].toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-xs font-bold text-slate-900">{user?.name}</span>
            <span className="truncate text-[10px] font-medium text-slate-400">{user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const context = Route.useRouteContext();
  const user = 'user' in context ? context.user : undefined;

  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { mutateAsync: signOut, isPending } = useSignInControllerSignOut();

  const { isOwner, isAdmin } = useSessionRole();
  const isOnboarding = location.pathname === '/onboarding';
  const isAgreement = location.pathname === '/agreement';
  const isVerifyEmail = location.pathname === '/verify-email';
  const isFullPage = isOnboarding || isAgreement || isVerifyEmail;

  let headerTitle = '관리자 패널';
  if (isOnboarding) headerTitle = '초기 설정';
  else if (isAgreement) headerTitle = '약관 동의';
  else if (isVerifyEmail) headerTitle = '이메일 인증';

  let headerSubtitle = '사용자 및 데이터 관리';
  if (isOnboarding) headerSubtitle = '조직 생성 단계';
  else if (isAgreement) headerSubtitle = '개인정보 처리방침 및 이용약관';
  else if (isVerifyEmail) headerSubtitle = '전송된 코드를 확인해 주세요.';

  const menus = useMemo(() => [
    { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { to: '/platform', label: '플랫폼 관리', icon: Database },
    { to: '/staff', label: '직원 및 권한', icon: Users },
    { to: '/settings', label: '기본 설정', icon: Settings, visible: isOwner || isAdmin },
    { to: '/audit', label: '감사 로그', icon: Activity, visible: isOwner || isAdmin },
    { to: '/pricing', label: '요금제 구성', icon: CreditCard },
    { to: '/settlement', label: '정산 리포트', icon: Receipt },
  ].filter((menu) => menu.visible ?? true), [isOwner, isAdmin]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 font-sans selection:bg-sky-100 selection:text-sky-900">
      {!isFullPage && (
        <aside className="hidden w-72 flex-col border-r border-slate-200 md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <SidebarContent menus={menus} user={user} location={location} />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-4">
            {!isFullPage && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-none">
                  <SidebarContent menus={menus} user={user} location={location} />
                </SheetContent>
              </Sheet>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{headerSubtitle}</span>
              </div>
              <h2 className="text-sm font-bold text-slate-900">{headerTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-slate-100 rounded-full transition-transform active:scale-95 shadow-none border-none">
                  <Avatar className="h-9 w-9 border-2 border-slate-100 ring-1 ring-slate-200/50">
                    <AvatarImage src={user?.image} />
                    <AvatarFallback className="bg-white text-slate-400 font-bold">
                      {user?.name?.[0].toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-slate-200">
                <DropdownMenuLabel className="px-3 pb-2 pt-1 font-normal opacity-70">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Account Info</p>
                </DropdownMenuLabel>
                <div className="px-3 py-2">
                  <p className="text-sm font-bold leading-none text-slate-900">{user?.name}</p>
                  <p className="mt-1.5 text-[11px] font-medium leading-none text-slate-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link to="/profile" className="flex items-center gap-2 py-2">
                    <UserCircle className="h-4 w-4" />
                    <span className="font-semibold">내 프로필</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem
                  className="rounded-lg text-red-600 focus:text-white focus:bg-red-500 cursor-pointer flex items-center gap-2 py-2"
                  disabled={isPending}
                  onClick={() => {
                    void (async () => {
                      try {
                        await signOut();
                      }
                      catch (error) {
                        console.error('Logout failed:', error);
                      }
                      finally {
                        queryClient.clear();
                        void navigate({ to: '/login', search: { redirect: undefined } });
                      }
                    })();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-semibold">{isPending ? '로그아웃 중...' : '로그아웃'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto ${!isFullPage ? 'p-6 md:p-8' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
