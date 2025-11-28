import { QueryClientProvider } from '@/lib/config/query-client-provider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider>{children}</QueryClientProvider>;
}
