import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { EventDetailClient } from '@/features/intents/components/event-detail-client';
import { EventDetailSkeleton } from '@/features/intents/components/event-detail-skeleton';

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
        <EventDetailClient intentId={id} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params; // Resolve params for Next.js

  // TODO: Fetch intent data for metadata
  return {
    title: 'Szczegóły wydarzenia | Miglee',
    description: 'Zobacz szczegóły wydarzenia',
  };
}
