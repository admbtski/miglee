import { buildEventsOptions } from '@/hooks/useEvents';
import { getQueryClient } from '@/libs/query-client/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { WelcomePage } from './page-client';

export default async function Page() {
  const client = getQueryClient();

  await client.prefetchQuery(buildEventsOptions());

  return (
    <HydrationBoundary state={dehydrate(client)}>
      <WelcomePage />
    </HydrationBoundary>
  );
}
