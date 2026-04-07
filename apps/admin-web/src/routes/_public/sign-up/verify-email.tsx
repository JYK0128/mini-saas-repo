import { Button, CardContent, CardFooter, cn } from '@repo/ui';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { AlertCircle, Mail } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useSignUpControllerResendEmailVerification } from '@/api/endpoints';
import { publicStore, verifyEmailAtom } from '@/lib/atoms';

export const Route = createFileRoute('/_public/sign-up/verify-email')({
  beforeLoad: () => {
    const email = publicStore.get(verifyEmailAtom);
    if (!email) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: '/login' });
    }
  },
  component: RouteComponent,
});

/**
 * 이메일 인증 메일 확인 화면
 */
function RouteComponent() {
  const navigate = useNavigate();

  const email = useAtomValue(verifyEmailAtom, { store: publicStore });
  const [cooldown, setCooldown] = useState(60);

  const { mutateAsync: resendEmail, isPending: isResendEmailPending }
    = useSignUpControllerResendEmailVerification();

  /**
   * 이메일 인증 메일 재발송 처리
   */
  const handleResendEmail = useCallback(() => {
    if (!email) return;

    void resendEmail({ data: { email } })
      .then(() => {
        setCooldown(60);
        toast.success('인증 메일이 재발송되었습니다.');
      })
      .catch((error) => {
        console.error('Failed to resend email:', error);
      });
  }, [email, resendEmail]);

  /**
   * 화면 진입 시 최초 1회 인증 메일 재발송
   */
  useEffect(() => {
    handleResendEmail();
  }, [handleResendEmail]);

  /**
   * 재발송 쿨다운 타이머 관리
   */
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  return (
    <>
      <CardContent className="flex flex-col items-center justify-center gap-4 pt-2">
        <div className={cn(
          'flex items-center justify-center',
          'size-14 rounded-full ring-1',
          'bg-primary/5 ring-primary/10',
        )}
        >
          <Mail className="size-7 text-primary" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-lg font-semibold tracking-tight">
            인증 메일을 확인해 주세요
          </p>
          <div className="text-center max-w-xs text-sm leading-relaxed text-muted-foreground font-medium">
            로그인 계정으로 인증 링크를 보내드렸습니다.
            <br />
            메일함(또는 스팸함)을 확인해 주세요.
          </div>
        </div>

        <div className="w-full flex flex-col gap-3 px-2">
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-3 transition-all hover:bg-primary/[0.07]">
            <div className="flex gap-3 text-sm">
              <AlertCircle className="size-4 text-primary shrink-0 opacity-80 mt-0.5" />
              <div className="flex flex-col gap-1 text-left font-medium">
                <p className="font-bold text-primary text-xs">메일을 받지 못하셨나요?</p>
                <p className="leading-relaxed text-muted-foreground text-xs">
                  메일함 확인 후에도 오지 않는 경우 하단의 재발송 버튼을 이용하세요.
                </p>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs font-bold text-primary hover:text-primary/70 decoration-primary/20"
                  disabled={isResendEmailPending || cooldown > 0 || !email}
                  onClick={() => handleResendEmail()}
                >
                  {cooldown > 0 ? `${cooldown}초 후 재발송 가능` : '인증 메일 다시 보내기'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-4">
        <Button
          className="w-full h-10 text-sm font-semibold transition-all active:scale-[0.98]"
          onClick={() => void navigate({ to: '/login', replace: true })}
        >
          로그인 페이지로 이동
        </Button>
      </CardFooter>
    </>
  );
}
