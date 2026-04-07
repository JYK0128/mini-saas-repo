import { Button, Input, Label } from '@repo/ui';
import { useAppForm } from '@repo/ui/components/form/context';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { useSignInControllerResetPassword } from '@/api/endpoints';
import { SignInControllerResetPasswordBody } from '@/api/zod';

export const Route = createFileRoute('/_public/reset-password/')({
  validateSearch: z.object({
    email: z.string(),
    token: z.string(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { email, token } = Route.useSearch();
  const { mutateAsync: resetPassword } = useSignInControllerResetPassword();

  const form = useAppForm({
    defaultValues: {
      identifier: email,
      token: token,
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: SignInControllerResetPasswordBody.extend({
        confirmPassword: z.string(),
      }),
    },
    onSubmit: async ({ value }) => {
      await resetPassword({
        data: {
          identifier: String(email),
          token: String(token),
          password: value.password,
          confirmPassword: value.confirmPassword,
        },
      });
    },
  });

  return (
    <form.AppForm>
      <form.Layout onSubmit={() => void form.handleSubmit()}>
        <form.FieldSet>
          <form.FieldGroup>
            <div className="grid gap-2 text-left">
              <Label htmlFor="reset-email">이메일</Label>
              <Input id="reset-email" value={String(email ?? '')} readOnly disabled />
            </div>
            <div className="grid gap-2 text-left">
              <Label htmlFor="reset-token">인증 코드</Label>
              <Input id="reset-token" value={String(token ?? '')} readOnly disabled />
            </div>

            <form.AppField name="password">
              {({ Input }) => (
                <Input
                  label="새 비밀번호"
                  type="password"
                  placeholder="영문 소문자/숫자/특수문자 포함 8자 이상"
                  orientation="vertical"
                  showError
                />
              )}
            </form.AppField>

            <form.AppField name="confirmPassword">
              {({ Input }) => (
                <Input
                  label="새 비밀번호 확인"
                  type="password"
                  orientation="vertical"
                  showError
                />
              )}
            </form.AppField>
          </form.FieldGroup>
        </form.FieldSet>

        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <Button className="w-full font-bold mt-4" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '변경 중...' : '비밀번호 변경'}
            </Button>
          )}
        </form.Subscribe>
      </form.Layout>
    </form.AppForm>
  );
}
