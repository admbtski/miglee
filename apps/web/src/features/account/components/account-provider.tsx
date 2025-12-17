/**
 * Account Provider
 * Provides authenticated user data to account components via context
 */

'use client';

import { createContext, useContext } from 'react';
import { useMeQuery } from '@/features/auth';
import type { GetMeQuery } from '@/lib/api/__generated__/react-query-update';

interface AccountContextValue {
  user: GetMeQuery['me'] | null | undefined;
  isLoading: boolean;
  refetch: () => void;
}

const AccountContext = createContext<AccountContextValue | undefined>(
  undefined
);

interface AccountProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that fetches and provides authenticated user data
 *
 * @example
 * ```tsx
 * <AccountProvider>
 *   <AccountContent />
 * </AccountProvider>
 * ```
 */
export function AccountProvider({ children }: AccountProviderProps) {
  const { data, isLoading, refetch } = useMeQuery();

  return (
    <AccountContext.Provider value={{ user: data?.me, isLoading, refetch }}>
      {children}
    </AccountContext.Provider>
  );
}

/**
 * Hook to access account context
 *
 * @throws {Error} If used outside of AccountProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, refetch } = useAccount();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return <div>Hello {user?.name}</div>;
 * }
 * ```
 */
export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return context;
}
