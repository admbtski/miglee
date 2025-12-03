/**
 * Appearance Page
 * Customize event card and detail appearance
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AppearancePageWrapper } from './_components/appearance-page-wrapper';
import { ManagementPageLayout } from '../_components';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AppearanceManagePage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Wygląd wydarzenia"
      description="Dostosuj wygląd karty i strony szczegółów wydarzenia"
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
        <AppearancePageWrapper intentId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Wygląd wydarzenia | Miglee',
    description: 'Dostosuj wygląd karty i strony szczegółów wydarzenia',
  };
}

