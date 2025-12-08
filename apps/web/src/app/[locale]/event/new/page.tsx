import { Suspense } from 'react';

// Local components
import { SimpleCreatorPageClient } from './_components/simple-creator-page-client';
import { SimpleCreatorSkeleton } from './_components/simple-creator-skeleton';

/**
 * Server component for simplified event creator page
 * Renders a lightweight, user-friendly event creation form
 */
export default function NewEventPage() {
  return (
    <Suspense fallback={<SimpleCreatorSkeleton />}>
      <SimpleCreatorPageClient />
    </Suspense>
  );
}
