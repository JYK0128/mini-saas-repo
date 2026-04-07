import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useServiceStaffControllerFindAll,
         useServiceStaffControllerInvite,
         useServiceStaffControllerRemove,
         useServiceStaffControllerUpdate } from '@/api/endpoints';
import { StaffResponseDto } from '@/api/model';
import { useSessionRole } from '@/lib/session-role';

const ROLE_OPTIONS = ['owner', 'admin', 'member'] as const;

export const Route = createFileRoute('/_protected/staff')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isOwner } = useSessionRole();
  const { data, isLoading, refetch } = useServiceStaffControllerFindAll();
  const { mutateAsync: inviteStaff, isPending: isInviting } = useServiceStaffControllerInvite();
  const { mutateAsync: updateStaff, isPending: isUpdating } = useServiceStaffControllerUpdate();
  const { mutateAsync: removeStaff, isPending: isRemoving } = useServiceStaffControllerRemove();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>('member');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, (typeof ROLE_OPTIONS)[number]>>({});
  const [selectedStaffHistory, setSelectedStaffHistory] = useState<StaffResponseDto | null>(null);

  const { activeStaff, pendingInvites } = useMemo(() => {
    const raw = data?.data;
    const list = Array.isArray(raw) ? raw : [];
    return {
      activeStaff: list.filter((s) => s.status === 'active'),
      pendingInvites: list.filter((s) => ['pending', 'rejected', 'canceled', 'accepted'].includes(s.status)),
    };
  }, [data]);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Staff</h2>
        <p className="mt-1 text-sm text-slate-500">스태프 초대, 역할 변경, 삭제를 관리합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>스태프 초대</CardTitle>
          <CardDescription>OWNER 권한이 필요합니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="staff-name">이름</Label>
            <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="staff-email">이메일</Label>
            <Input id="staff-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staff-role">역할</Label>
            <select
              id="staff-role"
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof ROLE_OPTIONS)[number])}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <Button
              disabled={isInviting || !isOwner}
              onClick={() => {
                if (!name.trim() || !email.trim()) {
                  toast.error('이름과 이메일을 입력해주세요.');
                  return;
                }

                void inviteStaff({ data: { name, email, role } })
                  .then(async () => {
                    toast.success('초대 메일을 발송했습니다. 상대방이 수락하면 목록에 표시됩니다.');
                    setName('');
                    setEmail('');
                    setRole('member');
                    await refetch();
                  });
              }}
            >
              {(() => {
                if (!isOwner) return 'OWNER 전용';
                if (isInviting) return '초대 중...';
                return '초대하기';
              })()}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>스태프 목록</CardTitle>
          <CardDescription>{isLoading ? '로딩 중...' : `총 ${activeStaff.length}명`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">이메일</th>
                  <th className="px-3 py-2">현재 역할</th>
                  <th className="px-3 py-2 text-center">약관 동의</th>
                  <th className="px-3 py-2">가입 일시</th>
                  <th className="px-3 py-2">변경 역할</th>
                  <th className="px-3 py-2 text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {activeStaff.map((staff: StaffResponseDto) => (
                  <tr key={staff.id} className="border-b">
                    <td className="px-3 py-2 font-medium">{staff.user?.name}</td>
                    <td className="px-3 py-2">{staff.user?.email}</td>
                    <td className="px-3 py-2 capitalize">{staff.role}</td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                        onClick={() => setSelectedStaffHistory(staff)}
                      >
                        이력 보기
                        <span className="ml-1 opacity-60">
                          (
                          {staff.termAgreements?.length ?? 0}
                          )
                        </span>
                      </Button>
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-[11px]">
                      {new Date(staff.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs"
                        value={roleDrafts[staff.id] ?? staff.role}
                        onChange={(e) => {
                          setRoleDrafts((prev) => ({
                            ...prev,
                            [staff.id]: e.target.value as (typeof ROLE_OPTIONS)[number],
                          }));
                        }}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating || !isOwner}
                          onClick={() => {
                            const nextRole = roleDrafts[staff.id] ?? staff.role;
                            void updateStaff({ id: staff.id, data: { role: nextRole } })
                              .then(async () => {
                                toast.success('역할을 변경했습니다.');
                                await refetch();
                              });
                          }}
                        >
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isRemoving}
                          onClick={() => {
                            const confirmed = window.confirm('해당 스태프를 삭제하시겠습니까?');
                            if (!confirmed) return;

                            void removeStaff({ id: staff.id })
                              .then(async () => {
                                toast.success('스태프를 삭제했습니다.');
                                await refetch();
                              });
                          }}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeStaff.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">등록된 스태프가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>초대 목록</CardTitle>
          <CardDescription>{isLoading ? '로딩 중...' : `총 ${pendingInvites.length}명`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">이메일</th>
                  <th className="px-3 py-2">초대 역할</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">초대 일시</th>
                  <th className="px-3 py-2">갱신 일시</th>
                  <th className="px-3 py-2 text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map((invite: StaffResponseDto) => (
                  <tr key={invite.id} className="border-b">
                    <td className="px-3 py-2">{invite.user?.name}</td>
                    <td className="px-3 py-2">{invite.user?.email}</td>
                    <td className="px-3 py-2 capitalize">{invite.role}</td>
                    <td className="px-3 py-2">
                      {invite.status === 'pending' && <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">대기 중</Badge>}
                      {invite.status === 'rejected' && <Badge variant="destructive">거절됨</Badge>}
                      {invite.status === 'canceled' && <Badge variant="outline" className="text-slate-500">취소됨</Badge>}
                      {invite.status === 'accepted' && <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">가입 완료</Badge>}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-[11px]">
                      {new Date(invite.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-[11px]">
                      {new Date(invite.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isRemoving || invite.status !== 'pending'}
                        onClick={() => {
                          const confirmed = window.confirm('초대를 취소하시겠습니까?');
                          if (!confirmed) return;

                          void removeStaff({ id: invite.id })
                            .then(async () => {
                              toast.success('초대를 취소했습니다.');
                              await refetch();
                            });
                        }}
                      >
                        {invite.status === 'pending' ? '초대 취소' : '처리 완료'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {pendingInvites.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">대기 중인 초대가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedStaffHistory} onOpenChange={(open) => !open && setSelectedStaffHistory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>약관 동의 이력</DialogTitle>
            <DialogDescription>
              {selectedStaffHistory?.user.name}
              {' ('}
              {selectedStaffHistory?.user.email}
              ) 스태프의 약관 동의 및 취소 이력을 확인합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>약관명</TableHead>
                  <TableHead>버전</TableHead>
                  <TableHead>일시</TableHead>
                  <TableHead className="text-right">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedStaffHistory?.termAgreements
                  ?.sort((a, b) => new Date(b.agreedAt || '').getTime() - new Date(a.agreedAt || '').getTime())
                  .map((ta) => (
                    <TableRow key={`${ta.versionId}-${ta.agreedAt}`}>
                      <TableCell className="font-medium text-xs">{ta.title}</TableCell>
                      <TableCell className="text-xs font-mono">
                        v
                        {ta.version}
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-500">
                        {ta.deletedAt
                          ? new Date(ta.deletedAt).toLocaleString()
                          : new Date(ta.agreedAt || '').toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {ta.deletedAt
                          ? <Badge variant="destructive" className="h-5 text-[10px] items-center px-1.5 py-0">계약취소</Badge>
                          : <Badge variant="secondary" className="h-5 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100 items-center px-1.5 py-0">동의완료</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                {(selectedStaffHistory?.termAgreements?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-400 text-xs">동의 이력이 없습니다.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
