import type { ReactNode } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

export const metadata = {
  title: 'Restore Account | Miglee',
  description: 'Restore your deleted account',
};

export default function RestoreAccountLayout({
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
