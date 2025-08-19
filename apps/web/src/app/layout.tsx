import type { Metadata } from 'next';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import '../styles/globals.css';
import { QueryClientProvider } from '@/libs/query-client/query-client-provider';

export const metadata: Metadata = {
  title: 'Miglee - Sports Events',
  description: 'View the latest sports events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider>{children}</QueryClientProvider>
      </body>
    </html>
  );
}
