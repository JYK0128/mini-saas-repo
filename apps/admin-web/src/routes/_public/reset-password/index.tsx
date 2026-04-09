import { Button } from '@repo/ui';
import { useAppForm } from '@repo/ui/components/form/context';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { useSignInControllerResetPassword } from '@/api/endpoints';
import { SignInControllerResetPasswordBody } from '@/api/zod';

export const Route = createFileRoute('/_public/reset-password/')({
  validateSearch: z.object({
    token: z.string(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useSearch();
  const { mutateAsync: resetPassword } = useSignInControllerResetPassword();

  const form = useAppForm({
    defaultValues: {
      token,
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
          token,
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
