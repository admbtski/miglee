import { Suspense } from 'react';

// Event creation module
import { 
  SimpleCreatorPageClient,
  SimpleCreatorSkeleton 
} from '@/features/events';

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
