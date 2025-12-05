import type { ReactNode } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { Navbar } from '@/components/layout/navbar';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

export const metadata = {
  title: 'Create Event | Miglee',
  description: 'Create a new event quickly with our simplified creator',
};

export default function NewIntentLayout({ children }: { children: ReactNode }) {
  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <ErrorBoundary>
          <div className="min-h-dvh bg-gradient-to-br from-zinc-50 via-white to-indigo-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950/20 text-zinc-900 dark:text-zinc-100">
            <Navbar />

            <div className="container mx-auto max-w-3xl px-4 py-8">
              <main role="main">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
          </div>
        </ErrorBoundary>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
