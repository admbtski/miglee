/**
 * Local Push Notifications Page
 * Send push notifications to local users
 */

// Note: This page uses Polish strings - already i18n ready pattern

import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// Local components
import { LocalPushPageWrapper } from './_components/local-push-page-wrapper';
import { ManagementPageLayout } from '../_components';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LocalPushPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Powiadomienia lokalne"
      description="Wyślij powiadomienie push do użytkowników w okolicy wydarzenia"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Ładowanie...
              </p>
            </div>
          </div>
        }
      >
        <LocalPushPageWrapper eventId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Powiadomienia lokalne | Miglee',
    description: 'Zarządzaj powiadomieniami lokalnymi',
  };
}
