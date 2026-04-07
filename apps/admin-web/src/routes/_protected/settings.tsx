import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@repo/ui';
import { useAppForm } from '@repo/ui/components/form/context';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type z from 'zod';

import { getServiceSettingsControllerFindOneQueryKey,
         useServiceSettingsControllerFindOne,
         useServiceSettingsControllerUpdate,
         useServiceSettingsControllerUploadLogo,
         useServiceTermsControllerCreate,
         useServiceTermsControllerFindAll,
         useServiceTermsControllerUpdate } from '@/api/endpoints';
import type { ServiceSettingsResponseDto, TermResponseDto } from '@/api/model';
import { ServiceSettingsControllerUpdateBody } from '@/api/zod';
import { useSessionRole } from '@/lib/session-role';

export const Route = createFileRoute('/_protected/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isOwner, isAdmin } = useSessionRole();
  const canManageSettings = isOwner || isAdmin;
  const { data: settingsResponse, isLoading, refetch } = useServiceSettingsControllerFindOne();
  const settings = settingsResponse?.data;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-6">
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Service Settings</h1>
        <p className="text-sm text-slate-500 font-medium">서비스의 전반적인 환경 설정과 브랜딩을 관리합니다.</p>
      </div>

      <div className="flex flex-col gap-10">
        <ServiceGeneralSettingsCard
          settings={settings}
          isLoading={isLoading}
          canManage={canManageSettings}
          onRefetch={refetch}
        />

        <TermsSettingsCard canManage={canManageSettings} />
      </div>
    </div>
  );
}

function ServiceGeneralSettingsCard({
  settings,
  isLoading,
  canManage,
  onRefetch,
}: {
  readonly settings?: ServiceSettingsResponseDto
  readonly isLoading: boolean
  readonly canManage: boolean
  readonly onRefetch: () => Promise<unknown>
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: updateSettings } = useServiceSettingsControllerUpdate();
  const { mutateAsync: uploadLogo, isPending: isLogoUploading } = useServiceSettingsControllerUploadLogo();

  const form = useAppForm({
    defaultValues: {
      displayName: settings?.displayName,
    } as z.infer<typeof ServiceSettingsControllerUpdateBody>,
    validators: {
      onSubmit: ServiceSettingsControllerUpdateBody,
    },
    onSubmit: async ({ value }) => {
      await updateSettings({ data: value });
      toast.success('설정이 저장되었습니다.');
      await onRefetch();
    },
  });

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadLogo({ data: { file } });
      const logoUrl = response.data.logoUrl;
      await updateSettings({ data: { logoUrl } });
      await queryClient.invalidateQueries({ queryKey: getServiceSettingsControllerFindOneQueryKey() });
      toast.success('로고가 업데이트되었습니다.');
    }
    catch {
      toast.error('로고 업로드에 실패했습니다.');
    }
    finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('로고를 삭제하시겠습니까?')) return;
    await updateSettings({ data: { logoUrl: undefined } });
    await queryClient.invalidateQueries({ queryKey: getServiceSettingsControllerFindOneQueryKey() });
    toast.success('로고가 삭제되었습니다.');
  };

  const displayName = settings?.displayName || 'Service Name';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Card className="shadow-smooth border-slate-200/60 overflow-hidden">
      <CardHeader>
        <CardTitle>기본 정보 및 브랜딩</CardTitle>
        <CardDescription>서비스의 명칭과 시각적 정체성을 설정합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-4xl mx-auto">
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="relative group">
              <Avatar className="w-32 h-32 rounded-3xl border-2 border-slate-100 shadow-sm ring-8 ring-slate-50 transition-all group-hover:ring-indigo-50/50">
                <AvatarImage src={settings?.logoUrl} className="object-contain p-2" />
                <AvatarFallback className="bg-slate-50 text-slate-300 text-4xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {canManage && (
                <div className="absolute -bottom-2 -right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLogoUploading}
                    className="p-2 bg-white rounded-full border border-slate-100 shadow-lg hover:bg-slate-50 transition-all text-slate-500 disabled:opacity-50"
                  >
                    {isLogoUploading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <Camera className="w-4 h-4" />}
                  </button>
                  {settings?.logoUrl && (
                    <button
                      type="button"
                      onClick={() => void handleLogoDelete()}
                      className="p-2 bg-white rounded-full border border-slate-100 shadow-lg hover:bg-red-50 hover:text-red-500 transition-all text-slate-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              {/* Mobile upload trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canManage || isLogoUploading}
                className="absolute inset-0 z-10 md:hidden flex items-center justify-center bg-black/5 rounded-3xl opacity-0 active:opacity-100 transition-opacity"
              >
                <Camera className="w-6 h-6 text-white drop-shadow-md" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => void handleLogoUpload(e)}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>

          {/* Form Section */}
          <div className="flex-1 w-full flex flex-col gap-6">
            <form.AppForm>
              <form.Layout onSubmit={() => void form.handleSubmit()} className="flex flex-col gap-6">
                <form.AppField name="displayName">
                  {({ Input }) => (
                    <div className="flex flex-col gap-3">
                      <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">서비스 표시명</Label>
                      <div className="flex gap-3">
                        <Input
                          placeholder="서비스의 이름을 입력하세요"
                          className="w-xs text-lg font-medium shadow-none border-slate-200 focus:border-indigo-500 transition-colors bg-white"
                          disabled={!canManage || isLoading}
                          rightSide={(
                            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                              {([canSubmit, isSubmitting]) => (
                                <Button
                                  type="submit"
                                  disabled={!canManage || !canSubmit || isSubmitting || isLoading}
                                  className="font-bold px-8 shadow-lg shadow-indigo-100/50"
                                >
                                  {isSubmitting ? '...' : '저장'}
                                </Button>
                              )}
                            </form.Subscribe>
                          )}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 ml-1">서비스의 공식 명칭을 설정하세요. 사용자들에게 이 이름으로 표시됩니다.</p>
                    </div>
                  )}
                </form.AppField>

                {!canManage && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] py-1 px-3 self-start">
                    조회 권한: 설정을 수정하려면 관리자 권한이 필요합니다.
                  </Badge>
                )}
              </form.Layout>
            </form.AppForm>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TermsSettingsCard({ canManage }: { readonly canManage: boolean }) {
  const { data, isLoading, refetch } = useServiceTermsControllerFindAll();
  const { mutateAsync: createTerm } = useServiceTermsControllerCreate();
  const { mutateAsync: updateTerm } = useServiceTermsControllerUpdate();
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [addingVersionTo, setAddingVersionTo] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);

  // Group terms by category id to show relationship between category and versions
  const terms = useMemo(() => {
    const rawTerms = data?.data ?? [];
    type TermWithHistory = TermResponseDto & { history: TermResponseDto[], versionId?: string };
    const categoriesMap = new Map<string, TermWithHistory>();

    rawTerms.forEach((term) => {
      const categoryId = term.id;
      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          ...term,
          history: [],
        });
      }
      categoriesMap.get(categoryId)!.history.push(term);
    });

    return Array.from(categoriesMap.values()).map((category) => {
      // Sort history by createdAt DESC to ensure the most recent is first
      category.history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      // Update the main category object details to reflect the latest version
      const latest = category.history[0];
      return {
        ...category,
        content: latest.content,
        version: latest.version,
        versionId: latest.versionId,
      };
    }).sort((a, b) => a.id.localeCompare(b.id));
  }, [data]);

  const getLocalISOString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const createTermForm = useForm({
    defaultValues: {
      title: '',
      content: '',
      version: '1.0',
      termType: 'required' as 'required' | 'optional',
      isActive: true,
      startDate: getLocalISOString(new Date()),
      endDate: getLocalISOString(new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
    },
    onSubmit: async ({ value }) => {
      await createTerm({
        data: {
          ...value,
          startDate: new Date(value.startDate).toISOString(),
          endDate: new Date(value.endDate).toISOString(),
        },
      });
      toast.success('새 약관이 생성되었습니다.');
      setIsAddingTerm(false);
      createTermForm.reset();
      await refetch();
    },
  });

  const addVersionForm = useForm({
    defaultValues: {
      content: '',
      version: '',
      startDate: getLocalISOString(new Date()),
      endDate: getLocalISOString(new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
    },
    onSubmit: async ({ value }) => {
      if (!addingVersionTo) return;
      const term = terms.find((t) => t.id === addingVersionTo);
      if (!term) return;

      await createTerm({
        data: {
          title: term.title,
          termType: term.termType,
          isActive: term.isActive,
          ...value,
          startDate: new Date(value.startDate).toISOString(),
          endDate: new Date(value.endDate).toISOString(),
        },
      });
      toast.success('새 버전이 추가되었습니다.');
      setAddingVersionTo(null);
      addVersionForm.reset();
      await refetch();
    },
  });

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await updateTerm({ id, data: { isActive: !currentStatus } });
    toast.success('상태가 변경되었습니다.');
    await refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>약관 관리</CardTitle>
          <CardDescription>서비스의 다양한 약관들을 등록하고 관리합니다.</CardDescription>
        </div>
        {canManage && !isAddingTerm && (
          <Button onClick={() => setIsAddingTerm(true)} size="sm">
            약관 생성
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading && <p>로딩 중...</p>}
        {!isLoading && terms.length === 0 && !isAddingTerm && (
          <p className="text-sm text-slate-500">등록된 약관이 없습니다.</p>
        )}

        {isAddingTerm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void createTermForm.handleSubmit();
            }}
            className="flex flex-col gap-4 rounded-md border p-4 bg-slate-50"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">새 약관 생성</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <createTermForm.Field name="title">
                {(field) => (
                  <div className="grid gap-2">
                    <Label>약관 제목</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="예) 이용약관"
                      required
                    />
                  </div>
                )}
              </createTermForm.Field>
              <createTermForm.Field name="version">
                {(field) => (
                  <div className="grid gap-2">
                    <Label>버전</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="예) 1.0"
                      required
                    />
                  </div>
                )}
              </createTermForm.Field>
              <createTermForm.Field name="termType">
                {(field) => (
                  <div className="grid gap-2">
                    <Label>약관 종류</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value as 'required' | 'optional')}
                    >
                      <option value="required">필수</option>
                      <option value="optional">선택</option>
                    </select>
                  </div>
                )}
              </createTermForm.Field>
              <div className="flex items-center pt-8">
                <createTermForm.Field name="isActive">
                  {(field) => (
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.checked)}
                      />
                      활성화 상태로 추가
                    </label>
                  )}
                </createTermForm.Field>
              </div>
              <createTermForm.Field name="startDate">
                {(field) => (
                  <div className="grid gap-2">
                    <Label>시작일</Label>
                    <Input
                      type="datetime-local"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                    />
                  </div>
                )}
              </createTermForm.Field>
              <createTermForm.Field name="endDate">
                {(field) => (
                  <div className="grid gap-2">
                    <Label>종료일</Label>
                    <Input
                      type="datetime-local"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                    />
                  </div>
                )}
              </createTermForm.Field>
            </div>

            <createTermForm.Field name="content">
              {(field) => (
                <div className="grid gap-2">
                  <Label>약관 내용</Label>
                  <Textarea
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="약관 전체 내용 입력"
                    rows={6}
                    required
                  />
                </div>
              )}
            </createTermForm.Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddingTerm(false)}>
                취소
              </Button>
              <createTermForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    저장
                  </Button>
                )}
              </createTermForm.Subscribe>
            </div>
          </form>
        )}

        {terms.length > 0 && (
          <Tabs defaultValue="required" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="required">필수 약관</TabsTrigger>
              <TabsTrigger value="optional">선택 약관</TabsTrigger>
            </TabsList>

            <TabsContent value="required" className="flex flex-col gap-4">
              {renderTerms(terms.filter((t) => t.termType === 'required'))}
            </TabsContent>
            <TabsContent value="optional" className="flex flex-col gap-4">
              {renderTerms(terms.filter((t) => t.termType === 'optional'))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );

  function renderTerms(filteredTerms: (TermResponseDto & { history: TermResponseDto[] })[]) {
    if (filteredTerms.length === 0) {
      return <p className="text-sm text-slate-500 py-4 text-center">해당하는 약관이 없습니다.</p>;
    }

    return (
      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={openAccordion}
        onValueChange={setOpenAccordion}
      >
        {filteredTerms.map((term) => (
          <AccordionItem key={term.id} value={term.id} className="border rounded-md px-4 mb-2">
            <div className="flex items-center justify-between w-full pr-4">
              <AccordionTrigger className="hover:no-underline py-4 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">{term.title}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {term.history?.length ?? 0}
                    {' '}
                    Versions
                  </Badge>
                  {!term.isActive && (
                    <Badge variant="destructive" className="text-[10px]">비활성</Badge>
                  )}
                </div>
              </AccordionTrigger>
              {canManage && (
                <div className="flex items-center gap-2 pr-4 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingVersionTo(term.id);
                      setOpenAccordion(term.id);
                    }}
                  >
                    버전 추가
                  </Button>
                  <Button
                    variant={term.isActive ? 'outline' : 'default'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleActive(term.id, term.isActive);
                    }}
                  >
                    {term.isActive ? '비활성화' : '활성화'}
                  </Button>
                </div>
              )}
            </div>
            <AccordionContent className="pb-4 pt-2 text-slate-600 overflow-visible">
              <div className="flex flex-col gap-6">
                {addingVersionTo === term.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void addVersionForm.handleSubmit();
                    }}
                    className="flex flex-col gap-4 rounded-md border p-4 bg-indigo-50/50 border-indigo-100 mb-6"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-indigo-900">
                        {'새 버전 추가 - '}
                        {term.title}
                      </h4>
                      <Button variant="ghost" size="sm" onClick={() => setAddingVersionTo(null)}>
                        취소
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <addVersionForm.Field name="version">
                        {(field) => (
                          <div className="grid gap-2">
                            <Label>신규 버전</Label>
                            <Input
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="예) 1.1"
                              required
                            />
                          </div>
                        )}
                      </addVersionForm.Field>
                      <div />
                      <addVersionForm.Field name="startDate">
                        {(field) => (
                          <div className="grid gap-2">
                            <Label>시작일</Label>
                            <Input
                              type="datetime-local"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </addVersionForm.Field>
                      <addVersionForm.Field name="endDate">
                        {(field) => (
                          <div className="grid gap-2">
                            <Label>종료일</Label>
                            <Input
                              type="datetime-local"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </addVersionForm.Field>
                    </div>
                    <addVersionForm.Field name="content">
                      {(field) => (
                        <div className="grid gap-2">
                          <Label>약관 내용</Label>
                          <Textarea
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="새로운 약관 본문 입력"
                            rows={4}
                            required
                          />
                        </div>
                      )}
                    </addVersionForm.Field>
                    <div className="flex justify-end gap-2">
                      <addVersionForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                        {([canSubmit, isSubmitting]) => (
                          <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
                            버전 저장
                          </Button>
                        )}
                      </addVersionForm.Subscribe>
                    </div>
                  </form>
                )}

                {term.history?.map((hv) => (
                  <div key={hv.versionId} className="flex flex-col gap-3 border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        v
                        {hv.version}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {new Date(hv.createdAt).toLocaleDateString()}
                        {' '}
                        업데이트
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-lg bg-slate-50 p-4 border border-slate-100">
                      {hv.content}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400/80">
                      {hv.startDate && (
                        <span>
                          시작:
                          {' '}
                          {new Date(hv.startDate).toLocaleString()}
                        </span>
                      )}
                      {hv.endDate && (
                        <span>
                          종료:
                          {' '}
                          {new Date(hv.endDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }
}
