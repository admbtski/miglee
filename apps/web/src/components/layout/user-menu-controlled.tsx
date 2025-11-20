'use client';

import { useCallback, useMemo } from 'react';
import { NavigateKey, UserMenu } from './user-menu';

import { GET_ME_KEY, useDevLogoutMutation, useMeQuery } from '@/lib/api/auth';
import { getQueryClient } from '@/lib/config/query-client';

export function UserMenuControlled({
  onNavigate,
}: {
  onNavigate?: (key: NavigateKey) => void;
}) {
  const qc = getQueryClient();

  const { data } = useMeQuery({ retry: false });
  const { mutateAsync: devLogout, isPending: loggingOut } =
    useDevLogoutMutation({
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: GET_ME_KEY() });
      },
    });

  const user = useMemo(() => {
    const me = data?.me;
    if (!me) return null;
    return {
      name: me.name ?? me.email ?? 'User',
      email: me.email,
      avatarKey: me.avatarKey,
      avatarBlurhash: me.avatarBlurhash,
    };
  }, [data]);

  const handleSignOut = useCallback(async () => {
    await devLogout();
  }, [devLogout]);

  const handleNavigate = useCallback(
    async (key: NavigateKey) => {
      if (!loggingOut) onNavigate?.(key);
    },
    [onNavigate, loggingOut]
  );

  if (!user) return null;

  return (
    <UserMenu
      user={user}
      onNavigate={handleNavigate}
      onSignOut={handleSignOut}
    />
  );
}
