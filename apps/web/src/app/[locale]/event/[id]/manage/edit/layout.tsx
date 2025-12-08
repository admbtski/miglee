'use client';

import { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { EditProvider } from './_components/edit-provider';

interface EditLayoutProps {
  children: ReactNode;
}

/**
 * Layout for event edit section
 * Each section saves independently - no shared form state needed
 * Navigation is handled by the main EventManagementSidebar
 */
export default function EditLayout({ children }: EditLayoutProps) {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  return (
    <EditProvider eventId={eventId}>
      <div className="flex-1 min-w-0">{children}</div>
    </EditProvider>
  );
}
