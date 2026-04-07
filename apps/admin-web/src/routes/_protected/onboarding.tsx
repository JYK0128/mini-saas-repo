import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label } from '@repo/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { useSignInControllerCreateOrganization } from '@/api/endpoints';

export const Route = createFileRoute('/_protected/onboarding')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const { mutateAsync: createOrg, isPending } = useSignInControllerCreateOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('조직 이름을 입력해주세요.');
      return;
    }

    try {
      await createOrg({ data: { name } });
      await navigate({ to: '/dashboard' });
    }
    catch (error) {
      console.error('Failed to create organization:', error);
      toast.error('조직 생성에 실패했습니다.');
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-xl ring-1 ring-slate-200">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <CardHeader>
            <CardTitle className="text-2xl">환영합니다!</CardTitle>
            <CardDescription>
              관리자 포털을 시작하기 위해 첫 번째 조직을 생성해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">조직 이름</Label>
              <Input
                id="name"
                placeholder="예: 내 멋진 기업"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? '생성 중...' : '조직 생성하고 시작하기'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
