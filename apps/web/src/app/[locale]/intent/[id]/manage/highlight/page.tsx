/**
 * Highlight Color Page
 * Customize event highlight color
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { HighlightColorPageWrapper } from './_components/highlight-color-page-wrapper';
import { ManagementPageLayout } from '../_components';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function HighlightColorManagePage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Kolor wyróżnienia"
      description="Wybierz kolor ramki dla promowanego wydarzenia"
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
        <HighlightColorPageWrapper intentId={id} />
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Kolor wyróżnienia | Miglee',
    description: 'Zarządzaj kolorem wyróżnienia wydarzenia',
  };
}
