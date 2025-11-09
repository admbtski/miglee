// app/account/layout.tsx
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export default function AccountLayout({ children }: { children: ReactNode }) {
  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        {children}
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
