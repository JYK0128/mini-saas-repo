import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cn } from '@repo/ui';
import { useAppForm } from '@repo/ui/components/form/context';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import z from 'zod';

import { useSignInControllerSignIn } from '@/api/endpoints';
import { SignInControllerSignInBody } from '@/api/zod';
import { verifyEmailAtom } from '@/lib/atoms';
import { hasApiError } from '@/lib/error-handler';

export const Route = createFileRoute('/_public/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { redirect: redirectPath } = Route.useSearch();
  const { mutateAsync: signIn } = useSignInControllerSignIn();
  const setVerifyEmail = useSetAtom(verifyEmailAtom);
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false);

  const form = useAppForm({
    defaultValues: {
      accountId: '',
      password: '',
    } as z.infer<typeof SignInControllerSignInBody>,
    validators: {
      onSubmit: SignInControllerSignInBody,
    },
    onSubmit: ({ value }) => {
      void signIn({
        data: {
          accountId: value.accountId,
          password: value.password,
          token: isTwoFactorStep ? value.token : undefined,
        },
      })
        .then(() => {
          return navigate({
            to: (redirectPath as '/dashboard') || '/dashboard',
          });
        })
        .catch((error) => {
          if (hasApiError(error, 'EMAIL_NOT_VERIFIED')) {
            setVerifyEmail(value.accountId);
            void navigate({ to: '/sign-up/verify-email' });
            return;
          }

          if (hasApiError(error, 'TWO_FACTOR_PENDING')) {
            setIsTwoFactorStep(true);
            return;
          }

          throw error;
        });
    },
  });

  return (
    <form.AppForm>
      <form.Layout
        className="size-full"
        onSubmit={() => void form.handleSubmit()}
      >
        <Card className={cn(
          'mx-auto max-w-md size-full',
          'border-zinc-200/50 dark:border-zinc-800/50 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm',
          '*:data-[slot="card-content"]:flex-1',
        )}
        >
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              {isTwoFactorStep ? <ShieldCheck className="size-6" /> : <LogIn className="size-6" />}
              <CardTitle>{isTwoFactorStep ? '보안 인증' : '로그인'}</CardTitle>
            </div>
            <CardDescription className="text-base">
              {isTwoFactorStep
                ? '2단계 인증 코드를 입력해 주세요'
                : '시스템 보안 인증 및 접속 단계입니다'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col justify-around">
            <form.FieldSet>
              <form.FieldGroup className="gap-5 pt-2">
                <form.AppField name="accountId">
                  {({ Input }) => (
                    <Input
                      label="이메일 계정"
                      type="email"
                      placeholder="admin@example.com"
                      autoComplete="username"
                      orientation="vertical"
                    />
                  )}
                </form.AppField>
                <form.AppField name="password">
                  {({ Input }) => (
                    <Input
                      label="비밀번호"
                      placeholder="••••••••"
                      type="password"
                      autoComplete="current-password"
                      orientation="vertical"
                      showError
                    />
                  )}
                </form.AppField>

                {isTwoFactorStep && (
                  <form.AppField name="token">
                    {({ Input }) => (
                      <Input
                        label="보안 인증 코드"
                        placeholder="••••••"
                        autoComplete="one-time-code"
                        orientation="vertical"
                        showError
                      />
                    )}
                  </form.AppField>
                )}
              </form.FieldGroup>
            </form.FieldSet>

            <form.Submit className="w-full text-sm font-semibold transition-all active:scale-[0.98]">
              {isTwoFactorStep ? '인증 및 로그인' : '로그인'}
            </form.Submit>
          </CardContent>

          <CardFooter className="flex justify-between items-center">
            <Link
              to="/find"
              className="font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              아이디/비밀번호 찾기
            </Link>
            <Link
              to="/sign-up/term"
              className="font-semibold text-primary hover:underline underline-offset-4 decoration-primary/30"
            >
              새 계정 만들기
            </Link>
          </CardFooter>
        </Card>
      </form.Layout>
    </form.AppForm>
  );
}
