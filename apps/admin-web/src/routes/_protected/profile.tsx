import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardHeader, CardTitle, DataTable, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Label, Switch } from '@repo/ui';
import { useAppForm } from '@repo/ui/components/form/context';
import { useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { type ChangeEvent, useMemo, useRef, useState } from 'react';

import { getProfileControllerGetAgreementsHistoryQueryKey,
         getProfileControllerGetAgreementsQueryKey,
         getProfileControllerGetProfileQueryKey,
         useProfileControllerAgreeToTerms,
         useProfileControllerChangePassword,
         useProfileControllerDisable2FA,
         useProfileControllerEnable2FA,
         useProfileControllerGetAgreements,
         useProfileControllerGetProfile,
         useProfileControllerSetup2FA,
         useProfileControllerUpdateProfile,
         useProfileControllerUploadProfileImage } from '@/api/endpoints';
import type { ProfileControllerSetup2FA200, TermAgreementResponseDto, User } from '@/api/model';
import { ProfileControllerChangePasswordBody, ProfileControllerEnable2FABody, ProfileControllerUpdateProfileBody } from '@/api/zod';

export const Route = createFileRoute('/_protected/profile')({
  component: ProfileComponent,
});

function ProfileComponent() {
  const { data: userData } = useProfileControllerGetProfile();
  const user = userData?.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">내 프로필</h1>
        <p className="text-sm text-slate-500">계정 소유자 정보를 확인하고 보안 설정을 변경할 수 있습니다.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 flex flex-col gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-semibold">사용자 정보</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 flex flex-col items-center gap-6">
              <ProfileAvatarSection user={user} />

              <div className="w-full flex flex-col gap-5">
                <div className="flex flex-col gap-1 text-center">
                  <h3 className="font-bold text-slate-900">{user?.name || '사용자'}</h3>
                  <p className="text-xs text-slate-400 font-medium">{user?.email}</p>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <DisplayNameForm user={user} />
                  <SecuritySection user={user} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-6">
          <AgreementStatusCard />
        </div>
      </div>
    </div>
  );
}

function ProfileAvatarSection({ user }: { readonly user?: User }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadImage, isPending: isImageUploading } = useProfileControllerUploadProfileImage();
  const { mutateAsync: updateProfile } = useProfileControllerUpdateProfile();

  const initials = useMemo(() => {
    if (!user?.name) return 'U';
    return user.name.slice(0, 2).toUpperCase();
  }, [user]);

  const handleProfileImageButtonClick = () => {
    if (isImageUploading) return;
    fileInputRef.current?.click();
  };

  const handleProfileImageDelete = async () => {
    if (isImageUploading || !user?.image) return;
    if (!window.confirm('프로필 이미지를 정말 삭제하시겠습니까?')) return;

    await updateProfile({ data: { image: '' } });
    await queryClient.invalidateQueries({ queryKey: getProfileControllerGetProfileQueryKey() });
  };

  const handleProfileImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadImage({ data: { file } });
    event.target.value = '';
  };

  const actionButtonIcon = (() => {
    if (isImageUploading) return <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />;
    if (user?.image) return <Trash2 className="w-4 h-4" />;
    return <Camera className="w-4 h-4 text-slate-500" />;
  })();

  return (
    <div className="relative group">
      <Avatar
        className="border-2 border-slate-100 shadow-sm"
        style={{ width: '112px', height: '112px' }}
      >
        <AvatarImage src={user?.image} className="object-cover" />
        <AvatarFallback className="bg-slate-50 text-slate-300 text-3xl font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={user?.image ? () => void handleProfileImageDelete() : handleProfileImageButtonClick}
        disabled={isImageUploading}
        className={`absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-slate-200 shadow-md transition-all disabled:opacity-50 z-10 ${
          user?.image ? 'hover:bg-red-50 hover:border-red-100 hover:text-red-500' : 'hover:bg-slate-50'
        }`}
      >
        {actionButtonIcon}
      </button>
      <input type="file" ref={fileInputRef} onChange={(e) => void handleProfileImageChange(e)} className="hidden" accept="image/*" />
    </div>
  );
}

function DisplayNameForm({ user }: { readonly user?: User }) {
  const { mutateAsync: updateProfile } = useProfileControllerUpdateProfile();

  const nameForm = useAppForm({
    defaultValues: {
      name: user?.name,
    },
    validators: {
      onSubmit: ProfileControllerUpdateProfileBody.required('name'),
    },
    onSubmit: async ({ value }) => {
      await updateProfile({ data: value });
    },
  });

  return (
    <nameForm.AppForm>
      <nameForm.Layout onSubmit={() => void nameForm.handleSubmit()}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="p-name" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">표시 이름</Label>
          <div className="flex gap-2">
            <nameForm.AppField name="name">
              {({ Input }) => (
                <Input
                  id="p-name"
                  className="h-9 text-sm shadow-none"
                  placeholder="이름을 입력하세요"
                />
              )}
            </nameForm.AppField>
            <nameForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.values.name]}>
              {([canSubmit, isSubmitting, nameVal]) => (
                <Button
                  type="submit"
                  disabled={!!(!canSubmit || isSubmitting || String(nameVal) === String(user?.name ?? ''))}
                  className="h-9 px-4 font-bold shadow-none shrink-0"
                >
                  {isSubmitting ? '...' : '적용'}
                </Button>
              )}
            </nameForm.Subscribe>
          </div>
        </div>
      </nameForm.Layout>
    </nameForm.AppForm>
  );
}

function SecuritySection({ user }: { readonly user?: User }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">인증 및 보안</Label>
      <div className="grid grid-cols-1 gap-2">
        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)} className="justify-between h-10 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all font-semibold shadow-none">
          <span>비밀번호 관리</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="m9 18 6-6-6-6" /></svg>
        </Button>
        <Button variant="outline" onClick={() => setIs2FADialogOpen(true)} className="justify-between h-10 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all font-semibold shadow-none">
          <div className="flex items-center gap-2">
            <span>2단계 인증</span>
            <Badge variant={user?.twoFactorEnabled ? 'default' : 'secondary'} className={user?.twoFactorEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] h-4.5' : 'bg-slate-100 text-slate-400 text-[10px] h-4.5'}>
              {user?.twoFactorEnabled ? '활성' : '해제'}
            </Badge>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="m9 18 6-6-6-6" /></svg>
        </Button>
      </div>
      <PasswordChangeDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
      <TwoFactorDialog
        open={is2FADialogOpen}
        onOpenChange={setIs2FADialogOpen}
        isTwoFactorEnabled={Boolean(user?.twoFactorEnabled)}
        onStateChanged={async () => {
          await queryClient.invalidateQueries({ queryKey: getProfileControllerGetProfileQueryKey() });
          await router.invalidate();
        }}
      />
    </div>
  );
}

function AgreementStatusCard() {
  const queryClient = useQueryClient();
  const { data: agreementsData, isLoading: isLoadingAgreements } = useProfileControllerGetAgreements();
  const agreements = useMemo(() => agreementsData?.data || [], [agreementsData]);
  const { mutateAsync: agree } = useProfileControllerAgreeToTerms();

  const systemAgreements = useMemo(() => agreements.filter((ta) => !ta.organization), [agreements]);
  const organizationAgreements = useMemo(() => agreements.filter((ta) => ta.organization), [agreements]);

  const onRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: getProfileControllerGetAgreementsQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getProfileControllerGetAgreementsHistoryQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getProfileControllerGetProfileQueryKey() });
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <CardTitle className="text-base font-semibold">약관 동의 현황</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col divide-y divide-slate-50">
          <AgreementSection
            title="플랫폼 기본 약관"
            agreements={systemAgreements}
            isLoading={isLoadingAgreements}
            onAgree={agree}
            onRefresh={onRefresh}
          />
          <AgreementSection
            title="워크스페이스/조직 약관"
            agreements={organizationAgreements}
            isLoading={isLoadingAgreements}
            onAgree={agree}
            onRefresh={onRefresh}
            showOrgName
          />
        </div>
      </CardContent>
    </Card>
  );
}

function AgreementSection({
  title,
  agreements,
  isLoading,
  onAgree,
  onRefresh,
  showOrgName = false,
}: {
  readonly title: string
  readonly agreements: TermAgreementResponseDto[]
  readonly isLoading: boolean
  readonly onAgree: (args: { data: { termIds: string[] } }) => Promise<unknown>
  readonly onRefresh: () => Promise<void>
  readonly showOrgName?: boolean
}) {
  const columns = useMemo<ColumnDef<TermAgreementResponseDto>[]>(() => [
    {
      id: 'title',
      header: '약관명',
      cell: ({ row }) => {
        const ta = row.original;
        const org = ta.organization?.name;
        return (
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-700">{ta.title}</span>
            {showOrgName && org && <span className="text-[10px] text-sky-600 font-bold">{org}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'termType',
      header: '유형',
      size: 80,
      cell: ({ row }) => {
        const type = row.getValue('termType');
        const isRequired = String(type).toLowerCase() === 'required';
        return (
          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-none rounded whitespace-nowrap ${isRequired ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
            {isRequired ? '필수' : '선택'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'version',
      header: '버전',
      size: 60,
      cell: ({ row }) => (
        <span className="text-[11px] text-slate-500 font-medium">
          v
          {row.getValue('version')}
        </span>
      ),
    },
    {
      id: 'status',
      header: '상태',
      size: 110,
      cell: ({ row }) => {
        const ta = row.original;
        return (
          <div className="flex flex-col">
            <span className={`text-[11px] font-bold ${ta.agreedAt ? 'text-emerald-600' : 'text-slate-300'}`}>
              {ta.agreedAt ? '동의됨' : '미동의'}
            </span>
            {ta.agreedAt && <span className="text-[9px] text-slate-400">{new Date(ta.agreedAt).toLocaleDateString()}</span>}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '변경',
      size: 60,
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <AgreementSwitch
            ta={row.original}
            onAgree={onAgree}
            onRefresh={onRefresh}
          />
        </div>
      ),
    },
  ], [showOrgName, onAgree, onRefresh]);

  return (
    <div className="p-6 flex flex-col gap-4">
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">{title}</h4>
      <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
        {isLoading
          ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/30">
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-sky-500" />
              로딩 중...
            </div>
          )
          : (
            <DataTable
              columns={columns}
              data={agreements}
              defaultPageSize={100}
            />
          )}
      </div>
    </div>
  );
}

function AgreementSwitch({
  ta,
  onAgree,
  onRefresh,
}: {
  readonly ta: TermAgreementResponseDto
  readonly onAgree: (args: { data: { termIds: string[] } }) => Promise<unknown>
  readonly onRefresh: () => Promise<void>
}) {
  const isRequired = String(ta.termType).toLowerCase() === 'required';

  const handleChange = async (c: boolean) => {
    if (c && ta.id) {
      await onAgree({ data: { termIds: [ta.id] } });
    }
    else if (!c && ta.agreementId) {
      await axios.post('/profile/agreements/withdraw', { agreementId: ta.agreementId });
    }
    await onRefresh();
  };

  return (
    <Switch
      checked={!!ta.agreedAt}
      disabled={isRequired && !!ta.agreedAt}
      className="scale-90"
      onCheckedChange={(c) => void handleChange(c)}
    />
  );
}

function PasswordChangeDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}) {
  const { mutateAsync: changePassword } = useProfileControllerChangePassword();

  const f = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: ProfileControllerChangePasswordBody,
    },
    onSubmit: async ({ value }) => {
      await changePassword({ data: value });
      onOpenChange(false);
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          f.reset();
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-95 p-6 rounded-xl">
        <DialogHeader><DialogTitle className="text-lg font-bold">비밀번호 변경</DialogTitle></DialogHeader>
        <f.AppForm>
          <f.Layout onSubmit={() => void f.handleSubmit()} className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">현재 비밀번호</Label>
              <f.AppField name="currentPassword">
                {({ Input }) => <Input type="password" placeholder="••••••••" className="h-9 shadow-none border-slate-200" />}
              </f.AppField>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">신규 비밀번호</Label>
                <f.AppField name="newPassword">
                  {({ Input }) => <Input type="password" placeholder="••••••••" className="h-9 shadow-none border-slate-200" />}
                </f.AppField>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase">비밀번호 확인</Label>
                <f.AppField name="confirmPassword">
                  {({ Input }) => <Input type="password" placeholder="••••••••" className="h-9 shadow-none border-slate-200" />}
                </f.AppField>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" className="h-10 font-bold shadow-none">비밀번호 변경</Button>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-9 text-slate-400 text-xs hover:bg-transparent">취소</Button>
            </div>
          </f.Layout>
        </f.AppForm>
      </DialogContent>
    </Dialog>
  );
}

function TwoFactorDialog({
  open,
  onOpenChange,
  isTwoFactorEnabled,
  onStateChanged,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly isTwoFactorEnabled: boolean
  readonly onStateChanged: (enabled: boolean) => Promise<void>
}) {
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [isPending, setIsPending] = useState(false);

  const { mutateAsync: enable2FA } = useProfileControllerEnable2FA();
  const f = useAppForm({
    defaultValues: { token: '', secret: '' },
    validators: {
      onSubmit: ProfileControllerEnable2FABody,
    },
    onSubmit: async ({ value }) => {
      await enable2FA({ data: { secret: value.secret, token: value.token } });
      await onStateChanged(true);
      onOpenChange(false);
    },
  });

  const setupSecret = useStore(f.store, (s) => s.values.secret);
  const { mutateAsync: setup } = useProfileControllerSetup2FA();
  const { mutateAsync: disable } = useProfileControllerDisable2FA();

  const handleGen = async () => {
    setIsPending(true);
    await setup()
      .then((res) => {
        const data = (res as ProfileControllerSetup2FA200)?.data;
        if (data) {
          f.setFieldValue('secret', data.secret);
          setOtpAuthUrl(data.url);
        }
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const handleDis = async () => {
    setIsPending(true);
    await disable()
      .then(async () => {
        await onStateChanged(false);
        onOpenChange(false);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const renderDialogContent = () => {
    if (isTwoFactorEnabled) {
      return (
        <div className="flex flex-col gap-4">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <span className="text-xs font-bold text-emerald-700">인증이 활성화되어 있습니다.</span>
          </div>
          <Button
            className="w-full h-11 font-bold shadow-none"
            variant="destructive"
            onClick={() => void handleDis()}
            disabled={isPending}
          >
            인증 비활성화
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {!setupSecret
          ? (
            <Button onClick={() => void handleGen()} disabled={isPending} className="w-full h-11 font-bold shadow-none">
              비밀키 생성 시작
            </Button>
          )
          : (
            <f.AppForm>
              <f.Layout onSubmit={() => void f.handleSubmit()} className="flex flex-col gap-6">
                <div className="flex justify-center p-4 bg-slate-50 rounded-xl">
                  <QRCodeSVG value={otpAuthUrl || setupSecret} size={150} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-slate-500 text-center block">6자리 코드 입력</Label>
                  <f.AppField name="token">
                    {({ Input }) => (
                      <Input
                        className="text-center text-2xl h-12 font-black border-2 border-slate-100 focus:border-sky-500"
                        placeholder="000000"
                        maxLength={6}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          f.setFieldValue('token', val);
                        }}
                      />
                    )}
                  </f.AppField>
                </div>
                <Button type="submit" disabled={isPending} className="w-full h-11 font-bold shadow-none">
                  활성화 완료
                </Button>
              </f.Layout>
            </f.AppForm>
          )}
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          f.reset();
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-100 p-8 rounded-2xl">
        <DialogHeader className="gap-2 pb-4">
          <DialogTitle className="text-xl font-bold text-center">2단계 인증 설정</DialogTitle>
          <DialogDescription className="text-center text-xs">OTP 인증을 통해 보안을 강화하세요.</DialogDescription>
        </DialogHeader>

        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
