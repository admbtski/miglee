import { QueryClientProvider } from '@/lib/query-client/query-client-provider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider>{children}</QueryClientProvider>;
}
