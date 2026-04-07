import { createFileRoute } from '@tanstack/react-router';

import { usePlatformControllerGetStatus,
         useServiceDashboardControllerGetStats,
         useServiceDashboardControllerGetUsage } from '@/api/endpoints';

export const Route = createFileRoute('/_protected/dashboard')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: statsResponse, isLoading: isStatsLoading } = useServiceDashboardControllerGetStats();
  const { data: usageResponse, isLoading: isUsageLoading } = useServiceDashboardControllerGetUsage();
  const { data: statusResponse, isLoading: isStatusLoading } = usePlatformControllerGetStatus();

  const stats = statsResponse?.data;
  const usage = usageResponse?.data;
  const status = statusResponse?.data;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">운영 지표와 최근 이벤트를 한눈에 확인하세요.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">총 매출</p>
          <p className="mt-2 text-3xl font-semibold">
            {isStatsLoading ? '-' : `${(stats?.totalSales ?? 0).toLocaleString()}원`}
          </p>
          <p className="mt-1 text-xs text-emerald-600">서비스 집계 기준</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">활성 스태프</p>
          <p className="mt-2 text-3xl font-semibold">{isStatsLoading ? '-' : stats?.activeStaff ?? 0}</p>
          <p className="mt-1 text-xs text-emerald-600">현재 조직 멤버 기준</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">플랜 / 사용률</p>
          <p className="mt-2 text-3xl font-semibold">
            {isStatsLoading ? '-' : `${stats?.currentPlan ?? '-'} (${stats?.platformUsage ?? 0}%)`}
          </p>
          <p className="mt-1 text-xs text-amber-600">서비스 대시보드 기준</p>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900">플랫폼 상태</h3>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
          <li>
            조직명:
            {' '}
            {isStatusLoading ? '-' : status?.name ?? '-'}
            {' '}
            (
            {status?.slug ?? '-'}
            )
          </li>
          <li>
            활성 상태:
            {' '}
            {isStatusLoading ? '-' : status?.isActive ? '활성' : '비활성'}
          </li>
          <li>
            API 호출:
            {' '}
            {isUsageLoading ? '-' : `${usage?.apiCalls?.toLocaleString() ?? 0}회`}
            {' / '}
            스토리지:
            {' '}
            {isUsageLoading ? '-' : `${usage?.storageUsed ?? 0}GB`}
          </li>
        </ul>
      </article>
    </section>
  );
}
