import { Button, CardContent, CardFooter, cn } from '@repo/ui';
import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, XCircle } from 'lucide-react';
import { z } from 'zod';

import { signUpControllerConfirmEmailVerification } from '@/api/endpoints';

export const Route = createFileRoute('/_public/sign-up/email-confirm')({
  validateSearch: z.object({
    token: z.string(),
  }),
  /**
   * 화면 진입 시 서버에 이메일 인증 요청 수행
   * 성공/실패 여부를 context로 전달하여 컴포넌트에서 상태별 UI 렌더링
   */
  beforeLoad: ({ search }) => {
    return signUpControllerConfirmEmailVerification(search)
      .then(() => ({ status: 'success' as const }))
      .catch(() => ({ status: 'error' as const }));
  },
  errorComponent: () => {
    return <Navigate to="/login" replace />;
  },
  component: RouteComponent,
});

const StatusContent = {
  success: {
    icon: <CheckCircle2 className="size-8 text-primary" />,
    bg: 'bg-primary/5 ring-primary/10',
    title: '인증 완료',
    titleClassName: undefined,
    description: (
      <>
        이메일 인증이 성공적으로 완료되었습니다.
        <br />
        이제 서비스를 이용하실 수 있습니다.
      </>
    ),
  },
  error: {
    icon: <XCircle className="size-8 text-destructive" />,
    bg: 'bg-destructive/5 ring-destructive/10',
    title: '인증 실패',
    titleClassName: 'text-destructive',
    description: (
      <>
        인증 토큰이 만료되었거나 올바르지 않습니다.
        <br />
        관리자에게 문의해 주세요.
      </>
    ),
  },
} as const;

function RouteComponent() {
  const navigate = useNavigate();
  const { status } = Route.useRouteContext();

  const content = StatusContent[status];

  return (
    <>
      <CardContent className="flex flex-col items-center justify-center gap-6 pt-6">
        <div className={cn(
          'flex items-center justify-center',
          'size-16 rounded-full ring-1',
          content.bg,
        )}
        >
          {content.icon}
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className={cn(
            'text-center text-lg font-semibold',
            content.titleClassName,
          )}
          >
            {content.title}
          </p>
          <p className="text-center max-w-xs text-sm leading-relaxed text-muted-foreground font-medium">
            {content.description}
          </p>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-6">
        <Button
          className="w-full h-10 text-sm font-semibold transition-all active:scale-[0.98]"
          onClick={() => void navigate({
            to: '/login',
            replace: true,
          })}
        >
          로그인 페이지로 이동
        </Button>
      </CardFooter>
    </>
  );
}
