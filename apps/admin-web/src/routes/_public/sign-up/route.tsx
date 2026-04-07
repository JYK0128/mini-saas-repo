import { Card, CardDescription, CardHeader, CardTitle, cn } from '@repo/ui';
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { Provider } from 'jotai';
import { ClipboardCheck, MailCheck, UserCheck, UserPlus } from 'lucide-react';
import { z } from 'zod';

import { termStore } from '@/lib/atoms';

export const Route = createFileRoute('/_public/sign-up')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: RouteComponent,
});

const SignUpContent = {
  '/sign-up/term': {
    icon: <ClipboardCheck className="size-6" />,
    title: '약관 동의',
    description: '시스템 이용을 위해 아래 약관에 동의가 필요합니다',
  },
  '/sign-up/form': {
    icon: <UserPlus className="size-6" />,
    title: '계정 정보 입력',
    description: '관리자 시스템 이용을 위한 필수 정보를 입력하세요',
  },
  '/sign-up/email-confirm': {
    icon: <MailCheck className="size-6" />,
    title: '이메일 인증',
    description: '이메일 인증을 완료해주세요',
  },
  '/sign-up/invite': {
    icon: <UserCheck className="size-6" />,
    title: '초대 수락',
    description: '조직 초대 정보를 확인하고 수락해주세요',
  },
  '/sign-up/owner-complete': {
    icon: <MailCheck className="size-6" />,
    title: '이메일 인증 요청',
    description: '가입을 위해 이메일 인증이 필요합니다',
  },
  '/sign-up/member-complete': {
    icon: <UserCheck className="size-6" />,
    title: '가입 완료',
    description: '관리자 시스템 가입이 완료되었습니다',
  },
  '/sign-up/verify-email': {
    icon: <MailCheck className="size-6" />,
    title: '이메일 인증',
    description: '시스템 보안 및 접속 인증 단계입니다',
  },
} as const;

/**
 * 가입 단계별 헤더 정보 관리 및 레이아웃 컴포넌트
 */
function RouteComponent() {
  const { pathname } = useLocation();

  const headerInfo = SignUpContent[pathname as keyof typeof SignUpContent];
  if (!headerInfo) return;

  return (
    <Provider store={termStore}>
      <Card className={cn(
        'mx-auto max-w-md size-full',
        'border-zinc-200/50 dark:border-zinc-800/50 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm',
        '*:data-[slot="card-content"]:flex-1',
      )}
      >
        {headerInfo && (
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              {headerInfo.icon}
              <CardTitle>{headerInfo.title}</CardTitle>
            </div>
            <CardDescription className="text-base">
              {headerInfo.description}
            </CardDescription>
          </CardHeader>
        )}
        <Outlet />
      </Card>
    </Provider>
  );
}
