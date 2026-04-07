import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';

import { useServiceSettlementControllerFindAll } from '@/api/endpoints';
import type { ServiceSettlementResponseDto } from '@/api/model';

export const Route = createFileRoute('/_protected/settlement')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading } = useServiceSettlementControllerFindAll();

  const settlements = useMemo(() => {
    const raw = data?.data;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Settlement</h2>
        <p className="mt-1 text-sm text-slate-500">서비스 정산 내역을 조회합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>정산 내역</CardTitle>
          <CardDescription>{isLoading ? '로딩 중...' : `총 ${settlements.length}건`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-3 py-2">정산 ID</th>
                  <th className="px-3 py-2">금액</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">정산일</th>
                  <th className="px-3 py-2">생성일</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((item: ServiceSettlementResponseDto) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-3 py-2">{item.id}</td>
                    <td className="px-3 py-2">
                      {typeof item.amount === 'number' ? `${item.amount.toLocaleString()}원` : '-'}
                    </td>
                    <td className="px-3 py-2">{item.status ?? '-'}</td>
                    <td className="px-3 py-2">{item.settledAt ? new Date(item.settledAt).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
