import { buildGetCategoriesOptions } from '@/lib/api/categories';
import { getQueryClient } from '@/lib/config/query-client';
import { trace } from '@opentelemetry/api';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { IntentsPage } from './page-client';

const tracer = trace.getTracer('react-components');

export default async function Page() {
  const client = getQueryClient();
  const span = tracer.startSpan('prefetchQuery.Promise.all[...]');
  // fetch ssr
  await Promise.all([await client.prefetchQuery(buildGetCategoriesOptions())]);
  span.end();

  return (
    <HydrationBoundary state={dehydrate(client)}>
      <IntentsPage />
    </HydrationBoundary>
  );
}
