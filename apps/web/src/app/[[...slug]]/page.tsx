import { buildGetCategoriesOptions } from '@/hooks/categories';
import { buildEventsOptions } from '@/hooks/events';
import { getQueryClient } from '@/libs/query-client/query-client';
import { trace } from '@opentelemetry/api';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { IntentsPage } from './page-client';

const tracer = trace.getTracer('react-components');

export default async function Page() {
  const client = getQueryClient();
  const span = tracer.startSpan('prefetchQuery.Promise.all[...]');
  // fetch ssr
  await Promise.all([
    await client.prefetchQuery(buildEventsOptions()),
    await client.prefetchQuery(buildGetCategoriesOptions()),
  ]);
  span.end();

  return (
    <HydrationBoundary state={dehydrate(client)}>
      <IntentsPage />
    </HydrationBoundary>
  );
}
