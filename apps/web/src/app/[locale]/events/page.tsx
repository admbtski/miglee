// TODO i18n: Loading fallback text needs translation

import { buildGetCategoriesOptions } from '@/features/categories';
import { getQueryClient } from '@/lib/config/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { EventsPage } from './events-page-client';

export default async function Page() {
  const client = getQueryClient();

  await client.prefetchQuery(buildGetCategoriesOptions());

  return (
    <HydrationBoundary state={dehydrate(client)}>
      <Suspense fallback={<div className="p-8 text-center">Ładowanie...</div>}>
        <EventsPage />
      </Suspense>
    </HydrationBoundary>
  );
}
