import { Button, CardContent, CardFooter } from '@repo/ui';
import { useAppForm } from '@repo/ui/components/form/context';
import { toGlobalPhoneNumber } from '@repo/utils';
import { createFileRoute } from '@tanstack/react-router';
import { MailCheck } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';

import { useSignInControllerFindPassword } from '@/api/endpoints';
import { SignInControllerFindPasswordBody } from '@/api/zod';

export const Route = createFileRoute('/_public/find/password')({
  component: RouteComponent,
});

function RouteComponent() {
  const [pwSent, setPwSent] = useState(false);
  const [pwCooldown, setPwCooldown] = useState(0);
  const { mutateAsync: findPassword } = useSignInControllerFindPassword();

  const form = useAppForm({
    defaultValues: {
      email: '',
      name: '',
      phoneNumber: '',
    },
    validators: {
      onSubmit: SignInControllerFindPasswordBody,
    },
    onSubmit: async ({ value }) => {
      await findPassword({
        data: {
          email: value.email,
          name: value.name,
          phoneNumber: toGlobalPhoneNumber(value.phoneNumber),
        },
      });
      setPwSent(true);
      setPwCooldown(60);
    },
  });

  useEffect(() => {
    if (pwCooldown <= 0) return;
    const timer = setTimeout(() => {
      setPwCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [pwCooldown]);

  if (pwSent) {
    return (
      <Fragment>
        <CardContent className="flex flex-col items-center justify-center gap-6 flex-1 text-center">
          <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
            <MailCheck className="size-10" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xl font-bold">이메일 발송 완료</p>
            <p className="text-muted-foreground text-sm">
              입력하신 이메일 주소로 재설정 링크가 포함된
              <br />
              안내 메일을 보내드렸습니다.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full font-bold"
            disabled={pwCooldown > 0}
            onClick={() => setPwSent(false)}
          >
            {pwCooldown > 0 ? `${pwCooldown}초 후 다시 요청 가능` : `다시 요청하기`}
          </Button>
        </CardFooter>
      </Fragment>
    );
  }

  return (
    <form.AppForm>
      <form.Layout
        className="flex-1 flex flex-col"
        onSubmit={() => void form.handleSubmit()}
      >
        <CardContent className="flex-1">
          <form.FieldSet>
            <form.FieldGroup className="gap-5">
              <form.AppField name="email">
                {({ Input }) => (
                  <Input
                    label="이메일"
                    type="email"
                    placeholder="example@email.com"
                    autoComplete="email"
                    orientation="vertical"
                    showError
                  />
                )}
              </form.AppField>
              <form.AppField name="name">
                {({ Input }) => (
                  <Input
                    label="이름"
                    placeholder="홍길동"
                    autoComplete="name"
                    orientation="vertical"
                    showError
                  />
                )}
              </form.AppField>
              <form.AppField name="phoneNumber">
                {({ Input }) => (
                  <Input
                    label="휴대폰 번호"
                    placeholder="01012345678"
                    autoComplete="tel"
                    orientation="vertical"
                    showError
                  />
                )}
              </form.AppField>
            </form.FieldGroup>
          </form.FieldSet>
        </CardContent>

        <CardFooter>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <form.Submit
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? '요청 중...' : '비밀번호 찾기'}
              </form.Submit>
            )}
          </form.Subscribe>
        </CardFooter>
      </form.Layout>
    </form.AppForm>
  );
}
