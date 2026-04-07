import { Button, CardContent, CardFooter } from '@repo/ui';
import { useAppForm } from '@repo/ui/components/form/context';
import { toGlobalPhoneNumber } from '@repo/utils';
import { createFileRoute } from '@tanstack/react-router';
import { Fragment, useState } from 'react';

import { useSignInControllerFindId } from '@/api/endpoints';
import { SignInControllerFindIdBody } from '@/api/zod';

export const Route = createFileRoute('/_public/find/id')({
  component: RouteComponent,
});

function RouteComponent() {
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const { mutateAsync: findId } = useSignInControllerFindId();

  const form = useAppForm({
    defaultValues: {
      name: '',
      phoneNumber: '',
    },
    validators: {
      onSubmit: SignInControllerFindIdBody,
    },
    onSubmit: async ({ value }) => {
      const res = await findId({
        data: {
          name: value.name,
          phoneNumber: toGlobalPhoneNumber(value.phoneNumber),
        },
      });

      setFoundEmail(res.data.email);
    },
  });

  const handleResetFindId = () => {
    setFoundEmail(null);
    form.reset();
  };

  if (foundEmail) {
    return (
      <Fragment>
        <CardContent className="flex flex-col items-center justify-center gap-6 py-10 text-center">
          <p className="text-muted-foreground">찾으시는 아이디(이메일)는 다음과 같습니다</p>
          <div className="w-full p-6 bg-muted/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
            <p className="text-2xl font-bold text-primary tracking-tight">{foundEmail}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full font-bold" size="lg" onClick={handleResetFindId}>
            다시 찾기
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
              <form.AppField name="name">
                {({ Input }) => (
                  <Input
                    label="이름"
                    placeholder="홍길동"
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
                {isSubmitting ? '찾는 중...' : '아이디 찾기'}
              </form.Submit>
            )}
          </form.Subscribe>
        </CardFooter>
      </form.Layout>
    </form.AppForm>
  );
}
