'use client';

import { useState, useCallback, useEffect } from 'react';
import { AuthModal, type AuthMode } from './auth-modal';
import { getQueryClient } from '@/lib/config/query-client';
import { authKeys } from '@/features/auth/api/auth-query-keys';
import { useDevLoginMutation } from '@/features/auth/api/use-dev-login';
import { env } from 'process';

export function AuthModalDev({
  open,
  onClose,
  defaultTab = 'signin',
}: {
  open: boolean;
  onClose: () => void;
  defaultTab?: AuthMode;
}) {
  useEffect(() => {
    if (env.NODE_ENV === 'production') {
      throw new Error('Component should not be used in production env.');
    }
  }, []);

  const qc = getQueryClient();
  const { mutateAsync: devLogin } = useDevLoginMutation();
  const [mode, setMode] = useState<AuthMode>(defaultTab);

  const handleSubmit = useCallback(
    async (payload: { username?: string }) => {
      const name = (payload.username ?? '').trim();
      if (!name || name.length < 3) return;
      await devLogin({ name });
      await qc.invalidateQueries({ queryKey: authKeys.me() });
      onClose();
    },
    [devLogin, qc, onClose]
  );

  return (
    <AuthModal
      open={open}
      mode={mode}
      onModeChange={setMode}
      defaultTab={defaultTab}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
}
