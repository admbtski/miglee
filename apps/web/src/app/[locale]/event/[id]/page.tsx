import { Suspense } from 'react';
import { notFound } from 'next/navigation';

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetailClient eventId={id} />
      </Suspense>
    </div>
  );
}

// TODO i18n: metadata title and description
export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Szczegóły wydarzenia | Appname',
    description: 'Zobacz szczegóły wydarzenia',
  };
}
