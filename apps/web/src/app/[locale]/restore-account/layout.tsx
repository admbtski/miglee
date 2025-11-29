import type { ReactNode } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { Navbar } from '@/components/layout/navbar';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

export const metadata = {
  title: 'Create Event | Miglee',
  description: 'Create a new event and invite people to join',
};

export default function IntentCreatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
