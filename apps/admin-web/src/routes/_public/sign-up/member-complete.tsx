import { Button, CardContent, CardFooter, cn } from '@repo/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/_public/sign-up/member-complete')({
  component: RouteComponent,
});

/**
 * 멤버 가입 완료 화면
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
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-lg font-semibold">
            가입을 환영합니다!
          </p>
          <div className="text-center max-w-xs text-sm leading-relaxed text-muted-foreground font-medium">
            조직의 구성원이 되신 것을 진심으로 환영합니다.
            <br />
            이제 바로 서비스를 이용하실 수 있습니다.
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
