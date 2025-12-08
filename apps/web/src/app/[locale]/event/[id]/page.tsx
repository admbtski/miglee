import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { EventDetailClient } from '@/features/events/components/event-detail-client';
import { EventDetailSkeleton } from '@/features/events/components/event-detail-skeleton';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetailClient eventId={id} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params; // Resolve params for Next.js

  // TODO: Fetch eventIdata for metadata
  return {
    title: 'Szczegóły wydarzenia | Miglee',
    description: 'Zobacz szczegóły wydarzenia',
  };
}
