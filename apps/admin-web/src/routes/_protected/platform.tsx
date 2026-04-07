import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { createFileRoute } from '@tanstack/react-router';

import { usePlatformControllerGetPolicy, usePlatformControllerGetStatus } from '@/api/endpoints';
import { useSessionRole } from '@/lib/session-role';

export const Route = createFileRoute('/_protected/platform')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isOwner } = useSessionRole();
  const { data: statusResponse, isLoading: isStatusLoading } = usePlatformControllerGetStatus();
  const { data: policyResponse, isLoading: isPolicyLoading } = usePlatformControllerGetPolicy({
    query: { enabled: isOwner },
  });

  const status = statusResponse?.data;
  const policy = policyResponse?.data;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Platform</h2>
        <p className="mt-1 text-sm text-slate-500">플랫폼 이용 현황과 정책 정보를 조회합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>플랫폼 이용 현황</CardTitle>
          <CardDescription>{isStatusLoading ? '로딩 중...' : `${status?.name ?? '-'} (${status?.slug ?? '-'})`}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <p>
            <strong>활성 상태:</strong>
            {' '}
            {isStatusLoading ? '-' : status?.isActive ? '활성' : '비활성'}
          </p>
          <p>
            <strong>API 호출:</strong>
            {' '}
            {status?.usage?.apiCalls?.toLocaleString?.() ?? '-'}
          </p>
          <p>
            <strong>스토리지 사용량:</strong>
            {' '}
            {status?.usage?.storageUsed ?? '-'}
            MB
          </p>
          <p>
            <strong>최종 계산 일시:</strong>
            {' '}
            {status?.usage?.lastCalculatedAt ? new Date(status.usage.lastCalculatedAt).toLocaleString() : '-'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>플랫폼 이용 정책</CardTitle>
          <CardDescription>{isPolicyLoading ? '로딩 중...' : isOwner ? '정책 정보를 조회합니다.' : 'OWNER 권한에서만 조회 가능합니다.'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <p>
            <strong>요금제:</strong>
            {' '}
            {policy?.planName ?? '-'}
          </p>
          <p>
            <strong>API 제한:</strong>
            {' '}
            {policy?.apiLimit ?? '-'}
          </p>
          <p>
            <strong>스토리지 제한:</strong>
            {' '}
            {policy?.storageLimit ?? '-'}
            MB
          </p>
          <p>
            <strong>기능:</strong>
            {' '}
            {Array.isArray(policy?.features) ? policy.features.join(', ') : '-'}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
