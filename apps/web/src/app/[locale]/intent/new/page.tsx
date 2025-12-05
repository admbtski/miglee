import { Suspense } from 'react';
import { SimpleCreatorPageClient } from './_components/simple-creator-page-client';
import { SimpleCreatorSkeleton } from './_components/simple-creator-skeleton';

/**
 * Server component for simplified intent creator page
 * Renders a lightweight, user-friendly event creation form
 */
export default function NewIntentPage() {
  return (
    <Suspense fallback={<SimpleCreatorSkeleton />}>
      <SimpleCreatorPageClient />
    </Suspense>
  );
}
