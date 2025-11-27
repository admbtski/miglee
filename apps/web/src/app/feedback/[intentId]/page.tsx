import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { FeedbackPageClient } from './_components/feedback-page-client';
import { Loader2 } from 'lucide-react';

type PageProps = {
  params: Promise<{ intentId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function FeedbackPage({
  params,
  searchParams,
}: PageProps) {
  const { intentId } = await params;
  const { token } = await searchParams;

  if (!intentId) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Ładowanie formularza...
            </p>
          </div>
        </div>
      }
    >
      <FeedbackPageClient intentId={intentId} token={token} />
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
