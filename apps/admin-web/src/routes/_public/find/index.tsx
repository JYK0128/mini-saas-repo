import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/find/')({
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/find/id' });
  },
});
