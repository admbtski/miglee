import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { Navbar } from '@/components/layout/navbar';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

export default function UserProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          <Navbar />
          {children}
        </div>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
