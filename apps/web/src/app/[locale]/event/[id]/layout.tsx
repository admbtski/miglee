/**
 * Event Detail Layout
 * Layout for viewing event details with conditional navbar
 */

import type { ReactNode } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

// Features
import { ConditionalNavbar } from '@/features/events';

// Config
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

export default function EventDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <ConditionalNavbar />
        {children}
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
