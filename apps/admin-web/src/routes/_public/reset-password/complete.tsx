import { Button } from '@repo/ui';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/_public/reset-password/complete')({
  validateSearch: z.object({
    email: z.string().optional(),
    token: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4 py-2 text-center">
      <p className="text-lg font-semibold text-primary">비밀번호가 변경되었습니다.</p>
      <p className="text-muted-foreground text-sm">이제 새 비밀번호로 다시 로그인하실 수 있습니다.</p>
      <Button asChild className="w-full mt-4 font-bold">
        <Link to="/login">로그인하러 가기</Link>
      </Button>
    </div>
  );
}
