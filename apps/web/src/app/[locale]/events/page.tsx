import { buildGetCategoriesOptions } from '@/lib/api/categories';
import { getQueryClient } from '@/lib/config/query-client';
// import { trace } from '@opentelemetry/api';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { IntentsPage } from './intents-page-client';

// const tracer = trace.getTracer('react-components');

export default async function Page() {
  const client = getQueryClient();
  // const span = tracer.startSpan('prefetchQuery.categories');

  await client.prefetchQuery(buildGetCategoriesOptions());

  // span.end();

  return (
    <HydrationBoundary state={dehydrate(client)}>
      <Suspense fallback={<div className="p-8 text-center">Ładowanie...</div>}>
        <IntentsPage />
      </Suspense>
    </HydrationBoundary>
  );
}
