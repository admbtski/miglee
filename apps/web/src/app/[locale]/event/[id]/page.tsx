import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// Features
import { EventDetailClient, EventDetailSkeleton } from '@/features/events';

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

// TODO: Add i18n for metadata and fetch event data for dynamic title
export async function generateMetadata({ params }: PageProps) {
  await params; // Resolve params for Next.js

  return {
    title: 'Szczegóły wydarzenia | Miglee',
    description: 'Zobacz szczegóły wydarzenia',
  };
}
