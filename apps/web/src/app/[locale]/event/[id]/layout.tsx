// app/event/[id]/layout.tsx
import { ConditionalNavbar } from '@/features/events/components/conditional-navbar';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

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
