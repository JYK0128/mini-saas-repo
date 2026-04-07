import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, Input, Label } from '@repo/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { z } from 'zod';

import { useAuditControllerFindAll, useServiceAuditControllerFindAll } from '@/api/endpoints';
import { AuditListItemDto, AuditListItemDto2 } from '@/api/model';
import { useSessionRole } from '@/lib/session-role';

export const Route = createFileRoute('/_protected/audit')({
  validateSearch: z.object({
    userId: z.string().optional(),
    url: z.string().optional(),
    page: z.number().int().min(1).optional().catch(1),
    limit: z.number().int().min(1).optional().catch(20),
  }),
  component: RouteComponent,
});

type AuditItem = AuditListItemDto | AuditListItemDto2;

function RouteComponent() {
  const { isOwner, isAdmin, member } = useSessionRole();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const canViewAudit = isOwner || isAdmin;
  const isPlatform = member?.organization?.metadata?.type === 'PLATFORM';

  // Local state for input fields before search button is clicked
  const [userIdInput, setUserIdInput] = useState(search.userId ?? '');
  const [urlInput, setUrlInput] = useState(search.url ?? '');

  const queryParams = {
    page: search.page ?? 1,
    limit: search.limit ?? 20,
    userId: search.userId || undefined,
    url: search.url || undefined,
  };

  const businessQuery = useServiceAuditControllerFindAll(queryParams, {
    query: { enabled: !isPlatform && canViewAudit },
  });

  const platformQuery = useAuditControllerFindAll(queryParams, {
    query: { enabled: isPlatform && canViewAudit },
  });

  const queryResult = isPlatform ? platformQuery : businessQuery;
  const payload = queryResult.data?.data;
  const items = useMemo(() => payload?.items ?? [], [payload?.items]);
  const total = payload?.total ?? 0;

  const handleSearch = (updates: Partial<typeof search>) => {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, ...updates, page: 1 }),
    });
  };

  const columns = useMemo<ColumnDef<AuditItem>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: '시간',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="whitespace-nowrap text-slate-700">
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
            {item.method}
          </span>
        );
      },
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="max-w-xs truncate text-slate-600 font-medium">
            {item.url}
          </span>
        );
      },
    },
    {
      accessorKey: 'statusCode',
      header: 'Status',
      cell: ({ row }) => {
        const item = row.original;
        const statusCode = item.statusCode;
        const colorClass = statusCode >= 400 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600';
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colorClass}`}>
            {statusCode}
          </span>
        );
      },
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="text-slate-600 font-mono">
            {item.duration}
            ms
          </span>
        );
      },
    },
    {
      id: 'user',
      header: 'User',
      cell: ({ row }) => {
        const item = row.original;
        const { userName, userId } = item;
        if (userName) {
          return (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900">{userName}</span>
              <span className="text-[10px] opacity-50">{userId}</span>
            </div>
          );
        }
        return <span className="text-slate-600">{userId ?? '-'}</span>;
      },
    },
  ], []);

  return (
    <section className="flex flex-col gap-6">
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Audit Logs</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">시스템에서 발생하는 주요 이벤트를 모니터링합니다.</p>
      </div>

      <Card className="border-slate-200/60 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">검색 필터</CardTitle>
          <CardDescription className="text-xs">상세 로그를 찾기 위해 필터를 적용하세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          {!canViewAudit && (
            <div className="md:col-span-4 p-3 rounded-lg bg-red-50 border border-red-100 text-xs font-bold text-red-600">
              OWNER/ADMIN 권한에서만 실시간 로그 조회가 가능합니다.
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="audit-user-id" className="text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</Label>
            <Input
              id="audit-user-id"
              className="h-9 rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white transition-all"
              key={`user-${search.userId}`}
              defaultValue={search.userId ?? ''}
              onChange={(e) => setUserIdInput(e.target.value)}
              disabled={!canViewAudit}
              placeholder="유저 고유 ID"
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="audit-url" className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL Path</Label>
            <Input
              id="audit-url"
              className="h-9 rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white transition-all"
              key={`url-${search.url}`}
              defaultValue={search.url ?? ''}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={!canViewAudit}
              placeholder="/api/v1/..."
            />
          </div>
          <div className="grid gap-1.5 align-end pt-5.5">
            <Button
              className="w-full h-9 rounded-lg bg-slate-900 font-bold shadow-lg shadow-slate-200 transition-transform active:scale-95"
              disabled={!canViewAudit}
              onClick={() => handleSearch({ userId: userIdInput || undefined, url: urlInput || undefined })}
            >
              조회하기
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <DataTable
          columns={columns}
          data={items}
          rowCount={total}
          defaultPageSize={queryParams.limit}
          onPaginationChange={(pagination) => {
            void navigate({
              to: '.',
              search: (prev) => ({
                ...prev,
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
              }),
            });
          }}
        />
      </Card>
    </section>
  );
}
