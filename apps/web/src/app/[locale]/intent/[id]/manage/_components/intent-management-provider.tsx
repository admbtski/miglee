/**
 * Intent Management Provider
 * Provides intent data to management components via context
 */

'use client';

import { createContext, useContext } from 'react';
import { useIntentQuery } from '@/lib/api/intents';
import type { GetIntentQuery } from '@/lib/api/__generated__/react-query-update';

interface IntentManagementContextValue {
  intent: GetIntentQuery['intent'] | null | undefined;
  isLoading: boolean;
}

const IntentManagementContext = createContext<
  IntentManagementContextValue | undefined
>(undefined);

interface IntentManagementProviderProps {
  intentId: string;
  children: React.ReactNode;
}

/**
 * Provider component that fetches and provides intent data
 */
export function IntentManagementProvider({
  intentId,
  children,
}: IntentManagementProviderProps) {
  const { data, isLoading } = useIntentQuery({ id: intentId });

  return (
    <IntentManagementContext.Provider
      value={{ intent: data?.intent, isLoading }}
    >
      {children}
    </IntentManagementContext.Provider>
  );
}

/**
 * Hook to access intent management context
 */
export function useIntentManagement() {
  const context = useContext(IntentManagementContext);
  if (context === undefined) {
    throw new Error(
      'useIntentManagement must be used within IntentManagementProvider'
    );
  }
  return context;
}
