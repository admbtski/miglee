// app/account/layout.tsx
import type { ReactNode } from 'react';
import {
  AccountSidebarDesktop,
  AccountSidebarMobile,
} from './_components/sidebar-nav';
import { Navbar } from '@/components/layout/navbar';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

export default function AccountLayout({ children }: { children: ReactNode }) {
  const client = getQueryClient();

  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          <Navbar />

          <div
            className={[
              'mx-auto max-w-6xl px-4 sm:px-6 lg:px-8',
              'py-6 sm:py-8 lg:py-10',
              'grid gap-4 md:gap-6 md:grid-cols-[minmax(220px,280px)_1fr]',
              'isolate',
            ].join(' ')}
          >
            <div className="md:hidden p-2">
              <AccountSidebarMobile />
            </div>

            <aside
              className={[
                'rounded-3xl border border-zinc-200 bg-white/90 shadow-sm ring-1 ring-black/5',
                'dark:border-zinc-700 dark:bg-zinc-900/70',
                'backdrop-blur-[2px]',
                'md:sticky md:top-6',
                'p-2 sm:p-3',
                'hidden md:block p-2',
              ].join(' ')}
              aria-label="Account navigation"
            >
              <AccountSidebarDesktop />
            </aside>

            <main
              className={[
                'rounded-3xl border border-zinc-200 bg-white/95 shadow-sm ring-1 ring-black/5',
                'dark:border-zinc-700 dark:bg-[#141518]/80',
                'backdrop-blur-[2px]',
                'p-4 sm:p-6 lg:p-8',
              ].join(' ')}
              role="main"
            >
              {children}
            </main>
          </div>
        </div>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
