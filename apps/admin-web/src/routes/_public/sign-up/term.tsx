import { Button, CardContent, CardFooter, Checkbox, cn, Label, Separator } from '@repo/ui';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import { Fragment } from 'react';
import { toast } from 'sonner';

import { useSignUpControllerGetTerms } from '@/api/endpoints';
import type { TermResponseDto } from '@/api/model';
import { agreedTermIdsAtom } from '@/lib/atoms';

export const Route = createFileRoute('/_public/sign-up/term')({
  component: RouteComponent,
});

/**
 * 약관 동의 화면
 */
function RouteComponent() {
  const router = useRouter();
  const navigate = useNavigate();

  const { token } = Route.useSearch();
  const [agreedTermIds, setAgreedTermIds] = useAtom(agreedTermIdsAtom);

  const { data: termsData } = useSignUpControllerGetTerms({ token: token as string });
  const terms = (termsData?.data || []) as TermResponseDto[];

  const isAllChecked = agreedTermIds.length === terms.length && terms.length > 0;

  /**
   * 전체 동의 체크박스 처리
   */
  const handleCheckAll = (checked: boolean | string) => {
    if (checked) {
      setAgreedTermIds(terms.map((t) => t.id));
    }
    else {
      setAgreedTermIds([]);
    }
  };

  /**
   * 개별 약관 동의 토글 처리
   */
  const handleCheckTerm = (termId: string, checked: boolean | string) => {
    if (checked) {
      setAgreedTermIds((prev) => [...prev, termId]);
    }
    else {
      setAgreedTermIds((prev) => prev.filter((id: string) => id !== termId));
    }
  };

  /**
   * 다음 단계로 진행 (필수 약관 동의 체크)
   */
  const handleNext = () => {
    const requiredTerms = terms.filter((t) => t.termType === 'required');
    const allRequiredAgreed = requiredTerms.every((t) => agreedTermIds.includes(t.id));

    if (!allRequiredAgreed) {
      toast.error('필수 약관에 동의해 주세요.');
      return;
    }

    void navigate({ to: '/sign-up/form', search: { token } });
  };

  return (
    <Fragment>
      <CardContent>
        <div className="flex items-center gap-5">
          <Checkbox
            id="check-all"
            onCheckedChange={handleCheckAll}
            checked={isAllChecked}
          />
          <Label
            htmlFor="check-all"
            className="font-semibold text-lg cursor-pointer"
          >
            전체 동의
          </Label>
        </div>

        <Separator className="my-4" />

        <ul className="flex flex-col gap-3">
          {terms.map((term) => (
            <li key={term.id} className="flex gap-3">
              <Checkbox
                id={term.id}
                checked={agreedTermIds.includes(term.id)}
                onCheckedChange={(checked) => handleCheckTerm(term.id, checked)}
                className="mt-1"
              />

              <Label
                htmlFor={term.id}
                className={cn(
                  'flex-1 cursor-pointer',
                  'flex items-center',
                )}
              >
                <span className="font-medium">
                  {term.title}
                </span>
                <span className={cn(
                  term.termType === 'required'
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
                >
                  {term.termType === 'required'
                    ? '(필수)'
                    : '(선택)'}
                </span>
              </Label>

              <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                내용 보기
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.history.back()}
        >
          이전
        </Button>
        <Button
          type="button"
          className="flex-2"
          onClick={() => handleNext()}
        >
          동의
        </Button>
      </CardFooter>
    </Fragment>
  );
}
