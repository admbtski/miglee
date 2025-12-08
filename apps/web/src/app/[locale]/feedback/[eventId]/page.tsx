import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { FeedbackPageClient } from './_components/feedback-page-client';
import { Loader2 } from 'lucide-react';

type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function FeedbackPage({
  params,
  searchParams,
}: PageProps) {
  const { eventId } = await params;
  const { token } = await searchParams;

  if (!eventId) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Ładowanie formularza...
            </p>
          </div>
        </div>
      }
    >
      <FeedbackPageClient eventId={eevent} token={token} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Oceń wydarzenie | Miglee',
    description: 'Podziel się swoją opinią o wydarzeniu',
  };
}
