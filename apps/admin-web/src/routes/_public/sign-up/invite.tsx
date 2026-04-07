import { Button, CardContent, CardFooter } from '@repo/ui';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Fragment } from 'react';
import { z } from 'zod';

import { getSignUpControllerGetInvitationQueryOptions,
         signInControllerSignOut,
         useSignUpControllerRejectInvite } from '@/api/endpoints';

export const Route = createFileRoute('/_public/sign-up/invite')({
  validateSearch: z.object({
    token: z.string(),
  }),
  /**
   * 초대 수락 화면 진입 전, 기존 로그인 세션이 있다면 로그아웃 처리
   */
  beforeLoad: async () => {
    await signInControllerSignOut();
  },
  component: RouteComponent,
});

/**
 * 초대 수락 화면
 */
function RouteComponent() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const { data: invitationData, isLoading: isInviteLoading, error: inviteError } = useQuery(getSignUpControllerGetInvitationQueryOptions({ token }));
  const { mutateAsync: rejectInvite, isPending: isRejecting } = useSignUpControllerRejectInvite();

  /**
   * 초대 합류하기 클릭 시 약관 동의 단계로 이동
   */
  const handleAcceptClick = () => {
    if (!invitationData) return;
    void navigate({
      to: '/sign-up/term',
      search: { token },
      replace: true,
    });
  };

  /**
   * 초대 거절 처리 후 로그인 화면으로 이동
   */
  const handleRejectClick = async () => {
    if (!invitationData) return;
    await rejectInvite({ params: { token } });
    void navigate({ to: '/login', replace: true });
  };

  if (isInviteLoading) {
    return (
      <CardContent className="flex h-40 items-center justify-center">
        <p className="animate-pulse text-muted-foreground text-sm font-medium">초대 정보를 확인하고 있습니다...</p>
      </CardContent>
    );
  }

  if (inviteError || !invitationData) {
    return (
      <Fragment>
        <CardContent className="pt-6">
          <div className="rounded-lg bg-destructive/5 p-4 border border-destructive/10 text-center">
            <p className="text-destructive font-semibold">유효하지 않은 초대입니다</p>
            <p className="text-muted-foreground text-sm mt-1">만료되었거나 잘못된 초대 링크입니다. 관리자에게 다시 요청해주세요.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => void navigate({ to: '/login', replace: true })}>
            로그인 창으로
          </Button>
        </CardFooter>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <CardContent className="flex flex-col gap-6 pt-0">
        <div className="rounded-xl bg-muted/30 p-5 border border-muted ring-offset-background transition-colors">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-muted pb-3">
              <span className="text-muted-foreground text-sm font-medium">초대받은 조직</span>
              <span className="text-foreground font-bold">{invitationData?.data.organization.name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-muted pb-3">
              <span className="text-muted-foreground text-sm font-medium">권한</span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {invitationData?.data.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">초대 대상자</span>
              <span className="text-foreground font-medium">{invitationData?.data.email}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pb-8">
        <Button
          className="w-full"
          size="lg"
          disabled={isRejecting}
          onClick={() => handleAcceptClick()}
        >
          합류하기
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          disabled={isRejecting}
          onClick={() => void handleRejectClick()}
        >
          {isRejecting ? '거절 중...' : '나중에 하기'}
        </Button>
      </CardFooter>
    </Fragment>
  );
}
