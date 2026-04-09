import { Button, CardContent, CardFooter } from '@repo/ui';
import { useAppForm } from '@repo/ui/components/form/context';
import { toGlobalPhoneNumber } from '@repo/utils';
import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { omit } from 'lodash-es';
import { CheckCircle } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { z } from 'zod';

import { useSignUpControllerCheckEmailConflict,
         useSignUpControllerConfirmPhoneVerification,
         useSignUpControllerCreateAccount,
         useSignUpControllerGetInvitation,
         useSignUpControllerRequestPhoneVerification } from '@/api/endpoints';
import { SignUpControllerCreateAccountBody } from '@/api/zod';
import { agreedTermIdsAtom, termStore } from '@/lib/atoms';

export const Route = createFileRoute('/_public/sign-up/form')({
  /**
   * 진입 전 권한 및 필수 단계 확인
   * 약관 동의가 완료되지 않은 경우 동의 페이지로 리다이렉트
   */
  beforeLoad() {
    const agreedTermIds = termStore.get(agreedTermIdsAtom);
    if (agreedTermIds.length === 0) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: '/sign-up/term', replace: true });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const navigate = useNavigate();

  const { token } = Route.useSearch();
  const agreedTermIds = useAtomValue(agreedTermIdsAtom);

  const [timer, setTimer] = useState(0);
  const [emailChecked, setEmailChecked] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const { mutateAsync: signUp } = useSignUpControllerCreateAccount();
  const { mutateAsync: checkEmail } = useSignUpControllerCheckEmailConflict();
  const { mutateAsync: requestPhone } = useSignUpControllerRequestPhoneVerification();
  const { mutateAsync: confirmPhone } = useSignUpControllerConfirmPhoneVerification();
  const { data: invitation } = useSignUpControllerGetInvitation({ token: token as string }, {
    query: { enabled: !!token },
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      termIds: agreedTermIds,
      verificationCode: '',
    },
    validators: {
      onSubmit: SignUpControllerCreateAccountBody.extend({
        verificationCode: z.string(),
      }),
    },
    onSubmitInvalid(props) {
      console.error('invalid submit: ', props);
    },
    onSubmit: async ({ value }) => {
      const rest = omit(value, ['verificationCode']);
      await signUp({
        data: {
          ...rest,
          phoneNumber: toGlobalPhoneNumber(value.phoneNumber),
        },
      });

      // 초대 응답인 경우 멤버십 가입 완료 페이지로, 그 외에는 소유자 가입 완료 페이지로 이동
      if (token) {
        void navigate({
          to: '/sign-up/member-complete',
          replace: true,
        });
      }
      else {
        void navigate({
          to: '/sign-up/owner-complete',
          replace: true,
        });
      }
    },
  });

  /**
   * 이메일 중복 확인 처리
   */
  const handleCheckEmail = async () => {
    const email = form.getFieldValue('email');
    await checkEmail({ data: { email } });
    setEmailChecked(true);
  };

  /**
   * 휴대폰 인증번호 발송 요청
   */
  const handleRequestPhone = async () => {
    const phoneNumber = toGlobalPhoneNumber(form.getFieldValue('phoneNumber'));
    await requestPhone({ data: { phoneNumber } });
    setTimer(60);
  };

  /**
   * 전송된 인증번호 검증 처리
   */
  const handleVerifyPhone = async () => {
    const phoneNumber = toGlobalPhoneNumber(form.getFieldValue('phoneNumber'));
    const token = form.getFieldValue('verificationCode');
    await confirmPhone({ data: { phoneNumber, token } });
    setPhoneVerified(true);
    setTimer(0);
  };

  useEffect(() => {
    if (timer > 0) {
      const timer = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timer]);

  useEffect(() => {
    if (invitation?.data?.email) {
      form.setFieldValue('email', invitation.data.email);
    }
  }, [form, invitation]);

  return (
    <Fragment>
      <CardContent className="overflow-y-auto">
        <form.AppForm>
          <form.Layout onSubmit={() => void form.handleSubmit()}>
            <form.FieldSet>
              <form.FieldGroup>
                <form.AppField name="name">
                  {({ Input }) => (
                    <Input
                      label="이름"
                      placeholder="실명을 입력하세요"
                      orientation="vertical"
                      showError
                    />
                  )}
                </form.AppField>

                <form.AppField name="email">
                  {({ Input }) => (
                    <Input
                      className="col-span-3"
                      label="이메일"
                      type="email"
                      placeholder="admin@example.com"
                      autoComplete="email"
                      orientation="vertical"
                      showError
                      readOnly={!!invitation}
                      onChange={() => setEmailChecked(false)}
                      rightSide={!invitation && (
                        <Button
                          className="w-20"
                          type="button"
                          disabled={emailChecked}
                          onClick={() => void handleCheckEmail()}
                        >
                          확인
                        </Button>
                      )}
                    />
                  )}
                </form.AppField>

                {emailChecked && (
                  <div className="flex items-center gap-2 text-primary text-sm font-medium p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <CheckCircle className="h-4 w-4" />
                    이메일 확인이 완료되었습니다
                  </div>
                )}

                <form.AppField name="phoneNumber">
                  {({ Input }) => (
                    <Input
                      className="col-span-3"
                      label="휴대폰 번호"
                      placeholder="01012345678"
                      disabled={phoneVerified}
                      orientation="vertical"

                      rightSide={(
                        <Button
                          className="w-20"
                          type="button"
                          disabled={phoneVerified || !!timer}
                          onClick={() => void handleRequestPhone()}
                        >
                          {
                            phoneVerified
                              ? '인증됨'
                              : '인증 요청'
                          }
                        </Button>
                      )}
                    />
                  )}
                </form.AppField>

                {!phoneVerified && timer > 0 && (
                  <form.AppField name="verificationCode">
                    {({ Input }) => (
                      <Input
                        className="col-span-3"
                        placeholder="인증번호 6자리"
                        maxLength={6}
                        orientation="vertical"
                        rightSide={(
                          <Button
                            className="w-20"
                            type="button"
                            variant="outline"
                            onClick={() => void handleVerifyPhone()}
                          >
                            확인
                          </Button>
                        )}
                      />

                    )}
                  </form.AppField>
                )}

                {phoneVerified && (
                  <div className="flex items-center gap-2 text-primary text-sm font-medium p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <CheckCircle className="h-4 w-4" />
                    휴대폰 인증이 완료되었습니다
                  </div>
                )}

                <form.AppField name="password">
                  {({ Input }) => (
                    <Input
                      label="비밀번호"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      orientation="vertical"
                      showError
                    />
                  )}
                </form.AppField>

                <form.AppField name="confirmPassword">
                  {({ Input }) => (
                    <Input
                      label="비밀번호 확인"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      orientation="vertical"
                      showError
                    />
                  )}
                </form.AppField>
              </form.FieldGroup>
            </form.FieldSet>

          </form.Layout>
        </form.AppForm>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => router.history.back()}
        >
          이전
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-2"
          onClick={() => void form.handleSubmit()}
        >
          가입 완료
        </Button>
      </CardFooter>
    </Fragment>
  );
}
