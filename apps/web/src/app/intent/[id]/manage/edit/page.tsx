/**
 * Intent Edit Page
 * Edit event details within management interface
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IntentEditorWrapper } from './_components/intent-editor-wrapper';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentEditPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading editor...
            </p>
          </div>
        </div>
      }
    >
      <IntentEditorWrapper intentId={id} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Edit Event | Miglee',
    description: 'Edit event details',
  };
}
