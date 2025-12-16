import { Suspense } from 'react';

// Event creation feature
import { 
  SimpleCreatorPageClient,
  SimpleCreatorSkeleton 
} from '@/features/event-creation';

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
