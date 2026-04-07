import { useRouteContext } from '@tanstack/react-router';

export type UserRole = 'owner' | 'admin' | 'member';

const normalizeRole = (value: unknown): UserRole | undefined => {
  if (typeof value !== 'string') return undefined;

  const lowered = value.toLowerCase();
  if (lowered === 'owner' || lowered === 'admin' || lowered === 'member') {
    return lowered;
  }

  return undefined;
};

export const useSessionRole = () => {
  const context = useRouteContext({ from: '/_protected' });
  const userData = 'user' in context ? context.user : undefined;
  const member = userData?.member;
  const role = normalizeRole(member?.role);

  return {
    userData,
    member,
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isMember: role === 'member',
  };
};
