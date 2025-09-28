import { buildEventsOptions } from '@/hooks/useEvents';
import { buildNotificationsOptions } from '@/hooks/useNotifications';
import { getQueryClient } from '@/libs/query-client/query-client';
import { trace } from '@opentelemetry/api';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { WelcomePage } from './page-client';

const tracer = trace.getTracer('react-components');

export default async function Page() {
  const client = getQueryClient();
  const span = tracer.startSpan('prefetchQuery.Promise.all[...]');
  // fetch ssr
  await Promise.all([
    await client.prefetchQuery(buildEventsOptions()),
    await client.prefetchQuery(buildNotificationsOptions()),
  ]);
  span.end();
  return (
    <HydrationBoundary state={dehydrate(client)}>
      <WelcomePage />
    </HydrationBoundary>
  );
}
