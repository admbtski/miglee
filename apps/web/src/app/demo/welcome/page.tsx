import { buildEventsOptions } from '@/hooks/useEvents';
import { getQueryClient } from '@/libs/query-client/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { WelcomePage } from './page-client';
import { buildNotificationsOptions } from '@/hooks/useNotifications';

export default async function Page() {
  const client = getQueryClient();

  // fetch ssr
  await Promise.all([
    await client.prefetchQuery(buildEventsOptions()),
    await client.prefetchQuery(buildNotificationsOptions()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(client)}>
      <WelcomePage />
    </HydrationBoundary>
  );
}
