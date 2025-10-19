import { buildGetCategoriesOptions } from '@/hooks/categories';
import { getQueryClient } from '@/libs/query-client/query-client';
import { trace } from '@opentelemetry/api';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { IntentsPage } from './page-client';
import { AdminPanelLauncher } from '@/components/admin/admin-panel-launcher';

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
      <AdminPanelLauncher />
    </HydrationBoundary>
  );
}
