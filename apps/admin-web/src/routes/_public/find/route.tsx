import { Card, CardDescription, CardHeader, CardTitle, cn, Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';

export const Route = createFileRoute('/_public/find')({
  component: FindLayout,
});

function FindLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = location.pathname.includes('/password') ? 'password' : 'id';

  return (
    <Card className={cn(
      'mx-auto max-w-md size-full flex flex-col',
      'border-zinc-200/50 dark:border-zinc-800/50 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm',
      '*:data-[slot="card-content"]:flex-1',
    )}
    >
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <Search className="size-6" />
          <CardTitle>계정 정보 찾기</CardTitle>
        </div>
        <CardDescription className="text-base">
          아이디 또는 비밀번호를 잊으셨나요?
        </CardDescription>
      </CardHeader>
      <Tabs
        className="size-full"
        value={currentTab}
        onValueChange={(v) => {
          if (v === 'id' || v === 'password') {
            void navigate({ to: `/find/${v}` });
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="id" className="font-semibold">아이디 찾기</TabsTrigger>
          <TabsTrigger value="password" className="font-semibold">비밀번호 찾기</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="flex-1 flex flex-col">
          <Outlet />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
