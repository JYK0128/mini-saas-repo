import { Button, CardContent, CardFooter, cn } from '@repo/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Mail } from 'lucide-react';

export const Route = createFileRoute('/_public/sign-up/owner-complete')({
  component: RouteComponent,
});

/**
 * 소유자 가입 요청 완료 화면 (이메일 인증 대기)
 */
function RouteComponent() {
  const navigate = useNavigate();

  return (
    <>
      <CardContent className="flex flex-col items-center justify-center gap-6 pt-6">
        <div className={cn(
          'flex items-center justify-center',
          'size-16 rounded-full bg-primary/5 ring-1 ring-primary/10',
        )}
        >
          <Mail className="size-8 text-primary" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-lg font-semibold">
            인증 메일을 확인해 주세요
          </p>
          <div className="text-center max-w-xs text-sm leading-relaxed text-muted-foreground font-medium">
            가입하신 이메일 주소로 인증 링크를 보냈습니다.
            <br />
            메일함을 확인해주세요.
          </div>
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
