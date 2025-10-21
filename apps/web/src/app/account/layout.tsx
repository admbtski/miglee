// app/account/layout.tsx
import type { ReactNode } from 'react';
import { SidebarNav } from './_components/sidebar-nav';
import { Navbar } from '../../components/navbar/navbar';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/libs/query-client/query-client';
import { QueryClientProvider } from '@/libs/query-client/query-client-provider';

export default function AccountLayout({ children }: { children: ReactNode }) {
  const client = getQueryClient();
  return (
    <QueryClientProvider>
      <HydrationBoundary state={dehydrate(client)}>
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          {/* <Navbar /> */}
          <Navbar />
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[300px_1fr] px-4 py-8">
            <aside
              className="
            rounded-3xl border border-zinc-200 bg-white/90 p-2 shadow-sm ring-1 ring-black/5
            dark:border-zinc-700 dark:bg-zinc-900/70 backdrop-blur-[2px]
          "
            >
              <SidebarNav />
              {/* Optional promo card */}
              <div className="p-3 mt-3 text-xs border rounded-xl border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                Need more power?
                <br />
                Supercharge your workspace with Pro features.{' '}
                <a
                  className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  href="#"
                >
                  Learn more
                </a>
              </div>
            </aside>

            <main
              className="
            rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm ring-1 ring-black/5
            dark:border-zinc-700 dark:bg-[#141518]/80 sm:p-6 lg:p-8 backdrop-blur-[2px]
          "
            >
              {children}
            </main>
          </div>
        </div>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
