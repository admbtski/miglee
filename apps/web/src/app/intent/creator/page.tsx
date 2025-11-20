import { Suspense } from 'react';
import { IntentCreatorPageClient } from './_components/intent-creator-page-client';
import { IntentCreatorSkeleton } from './_components/intent-creator-skeleton';

/**
 * Server component for intent creator page
 * Renders the intent creator form as a full page (not modal)
 */
export default function IntentCreatorPage({
  searchParams,
}: {
  searchParams: Promise<{ intentId?: string }>;
}) {
  return (
    <Suspense fallback={<IntentCreatorSkeleton />}>
      <IntentCreatorPageClientWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function IntentCreatorPageClientWrapper({
  searchParams,
}: {
  searchParams: Promise<{ intentId?: string }>;
}) {
  const params = await searchParams;
  return <IntentCreatorPageClient intentId={params.intentId} />;
}
