// app/intent/[id]/layout.tsx
import { ConditionalNavbar } from './_components/conditional-navbar';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export default function IntentDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <>
          <ConditionalNavbar />
          {children}
        </>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
