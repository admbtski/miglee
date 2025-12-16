/**
 * Event Management Provider
 * Provides event data to management components via context
 */

'use client';

import { createContext, useContext } from 'react';
import { useEventDetailQuery } from '@/features/events/api/events';
import type { GetEventDetailQuery } from '@/lib/api/__generated__/react-query-update';

interface EventManagementContextValue {
  event: GetEventDetailQuery['event'] | null | undefined;
  isLoading: boolean;
  refetch: () => void;
}

const EventManagementContext = createContext<
  EventManagementContextValue | undefined
>(undefined);

interface EventManagementProviderProps {
  eventId: string;
  children: React.ReactNode;
}

/**
 * Provider component that fetches and provides event data
 */
export function EventManagementProvider({
  eventId,
  children,
}: EventManagementProviderProps) {
  const { data, isLoading, refetch } = useEventDetailQuery({ id: eventId });

  return (
    <EventManagementContext.Provider
      value={{ event: data?.event, isLoading, refetch }}
    >
      {children}
    </EventManagementContext.Provider>
  );
}

/**
 * Hook to access event management context
 */
export function useEventManagement() {
  const context = useContext(EventManagementContext);
  if (context === undefined) {
    throw new Error(
      'useEventManagement must be used within EventManagementProvider'
    );
  }
  return context;
}
