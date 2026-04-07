import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui';
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/reset-password')({
  component: RouteComponent,
});

function RouteComponent() {
  const { pathname } = useLocation();
  const isComplete = pathname.endsWith('/complete');

  return (
    <Card className="mx-auto w-full max-w-md h-full *:data-[slot='card-content']:flex-1 flex flex-col border-zinc-200/50 dark:border-zinc-800/50 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {isComplete ? '비밀번호 변경 완료' : '비밀번호 변경'}
        </CardTitle>
        <CardDescription className="text-center">
          {isComplete ? '비밀번호가 성공적으로 변경되었습니다.' : '새 비밀번호를 설정해주세요.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        <Outlet />
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Link to="/login" className="text-sm text-primary hover:underline font-semibold">
          로그인 화면으로 돌아가기
        </Link>
      </CardFooter>
    </Card>
  );
}
