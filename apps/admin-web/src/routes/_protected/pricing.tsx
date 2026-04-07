import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';

import { useServicePricingControllerFindAll } from '@/api/endpoints';
import type { ServicePlanResponseDto } from '@/api/model';

export const Route = createFileRoute('/_protected/pricing')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading, refetch } = useServicePricingControllerFindAll();

  const plans = useMemo(() => {
    const raw = data?.data;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Pricing</h2>
        <p className="mt-1 text-sm text-slate-500">서비스에서 적용 가능한 요금제 목록을 조회합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>요금제 목록</CardTitle>
          <CardDescription>{isLoading ? '로딩 중...' : `총 ${plans.length}개`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">월 요금</th>
                  <th className="px-3 py-2">기능</th>
                  <th className="px-3 py-2">생성일</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan: ServicePlanResponseDto, idx) => (
                  <tr key={`${plan.name}-${idx}`} className="border-b">
                    <td className="px-3 py-2">{plan.name ?? '-'}</td>
                    <td className="px-3 py-2">
                      {typeof plan.monthlyPrice === 'number' ? `${plan.monthlyPrice.toLocaleString()}원` : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {Array.isArray(plan.features) ? plan.features.join(', ') : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {plan.createdAt ? new Date(plan.createdAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
            }}
          >
            새로고침
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
