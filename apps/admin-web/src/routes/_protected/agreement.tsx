import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Checkbox, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Label, ScrollArea, Separator } from '@repo/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useSignInControllerGetNewAgreements,
         useSignInControllerSetNewAgreements } from '../../api/endpoints';
import type { SignInNewAgreementResponseDto } from '../../api/model';

export const Route = createFileRoute('/_protected/agreement')({
  component: AgreementComponent,
});

function AgreementComponent() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  // API Hooks
  const { data: termsResponse, isLoading } = useSignInControllerGetNewAgreements();
  const { mutateAsync: agree, isPending } = useSignInControllerSetNewAgreements();

  const terms = useMemo(() => {
    const data = termsResponse?.data;
    return data ?? [];
  }, [termsResponse]);

  const agreedVersionIds = useMemo((): string[] => {
    if (selectedIds !== null) return selectedIds;
    if (terms.length === 0) return [];
    return terms
      .filter((t) => t.termType === 'required' || t.agreementId)
      .map((t) => String(t.id));
  }, [selectedIds, terms]);

  const requiredTerms = terms.filter((t) => t.termType === 'required');
  const isAllRequiredAgreed = requiredTerms.every((rt) =>
    agreedVersionIds.includes(String(rt.id)),
  );

  const handleAgreeAll = () => {
    setSelectedIds(terms.map((t: SignInNewAgreementResponseDto) => String(t.id)));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleSelectTerm = (id: string) => {
    setSelectedIds((prev) => {
      const current = prev ?? agreedVersionIds;
      return current.includes(id) ? current : [...current, id];
    });
  };

  const handleDeselectTerm = (id: string) => {
    setSelectedIds((prev) => {
      const current = prev ?? agreedVersionIds;
      return current.filter((prevId) => prevId !== id);
    });
  };

  const handleSubmit = async () => {
    if (!isAllRequiredAgreed) {
      toast.error('필수 약관에 모두 동의해주세요.');
      return;
    }

    try {
      await agree({ data: { termIds: agreedVersionIds } });
      toast.success('약관 동의가 완료되었습니다.');
      await navigate({ to: '/dashboard' });
    }
    catch (error) {
      console.error('Failed to agree terms:', error);
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">약관 정보를 불러오는 중...</p>
      </div>
    );
  }

  const systemTerms = terms.filter((t) => !t.organizationId);
  const orgTerms = terms.filter((t) => !!t.organizationId);

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-110 flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">신규 약관 동의</h1>
          <p className="text-muted-foreground text-sm">원활한 서비스 이용을 위해 새로운 약관에 동의해주세요.</p>
        </div>

        <Card className="border-none shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
          <CardHeader>
            <CardTitle>약관 동의</CardTitle>
            <CardDescription>서비스 이용을 위해 아래 약관에 동의해주세요.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900/50">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all-terms"
                    checked={agreedVersionIds.length === terms.length && terms.length > 0}
                    onCheckedChange={(checked) => (checked ? handleAgreeAll() : handleClearAll())}
                  />
                  <Label htmlFor="all-terms" className="text-base font-bold cursor-pointer">
                    전체 동의하기
                  </Label>
                </div>
                <Separator />
                <div className="flex flex-col gap-6">
                  {systemTerms.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">서비스 이용 약관</p>
                      <div className="flex flex-col gap-3">
                        {systemTerms.map((term) => (
                          <TermSelectionItem
                            key={String(term.id)}
                            term={term}
                            agreedIds={agreedVersionIds}
                            onSelect={handleSelectTerm}
                            onDeselect={handleDeselectTerm}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {systemTerms.length > 0 && orgTerms.length > 0 && <Separator className="opacity-50" />}

                  {orgTerms.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">조직 이용 약관</p>
                      <div className="flex flex-col gap-3">
                        {orgTerms.map((term) => (
                          <TermSelectionItem
                            key={String(term.id)}
                            term={term}
                            agreedIds={agreedVersionIds}
                            onSelect={handleSelectTerm}
                            onDeselect={handleDeselectTerm}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-full items-start gap-3 rounded-xl bg-primary/5 p-4 text-sm text-primary/80 border border-primary/10">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="font-medium">
                필수 약관 동의 후 서비스를 즉시 이용하실 수 있습니다.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => { void handleSubmit(); }}
              disabled={!isAllRequiredAgreed || isPending}
            >
              {isPending ? '처리 중...' : '동의 완료 및 서비스 시작하기'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// 약관 항목 컴포넌트 (signup.tsx의 스타일과 동일하게)
function TermSelectionItem({ term, agreedIds, onSelect, onDeselect }: {
  readonly term: SignInNewAgreementResponseDto
  readonly agreedIds: string[]
  readonly onSelect: (id: string) => void
  readonly onDeselect: (id: string) => void
}) {
  const termIdStr = String(term.id);
  const isAgreed = agreedIds.includes(termIdStr);
  const isRequired = term.termType === 'required';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-2">
        <Checkbox
          id={termIdStr}
          checked={isAgreed}
          onCheckedChange={(checked) => (checked ? onSelect(termIdStr) : onDeselect(termIdStr))}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor={termIdStr} className="text-sm font-medium cursor-pointer">
            {term.title}
            <span
              className={
                isRequired
                  ? 'text-primary ml-1'
                  : 'text-muted-foreground ml-1'
              }
            >
              {isRequired ? '(필수)' : '(선택)'}
            </span>
          </Label>
          {term.content && (
            <p className="text-muted-foreground line-clamp-1 text-[12px]">
              {term.content}
            </p>
          )}
        </div>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs underline">
            보기
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>{term.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-100 rounded-md border p-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {term.content}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
