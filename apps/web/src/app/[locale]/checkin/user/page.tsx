/**
 * User QR Check-in Page
 * Moderators scan participant QR codes and land here to check them in
 */

import { QueryClientProvider } from '@/lib/config/query-client-provider';
import { UserQRCheckinClient } from '@/features/checkin/components/user-qr-checkin-client';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function UserQRCheckinPage({
  params,
  searchParams,
}: PageProps) {
  await params;
  const { token } = await searchParams;

  return (
    <QueryClientProvider>
      <UserQRCheckinClient token={token} />
    </QueryClientProvider>
  );
}
