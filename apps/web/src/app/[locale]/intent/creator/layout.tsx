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
        <ErrorBoundary>
          <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <Navbar />

            <div className="container mx-auto max-w-6xl px-4 py-6">
              <main
                className="rounded-3xl border border-zinc-200 bg-white/95 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-[#141518]/80 backdrop-blur-[2px] p-4 sm:p-6 lg:p-8"
                role="main"
              >
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
          </div>
        </ErrorBoundary>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
