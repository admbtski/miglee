/**
 * Intent Moderation Page
 * Moderate event content and members
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentModerationPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Moderation
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Moderate event content and members
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          Moderation tools coming soon...
        </p>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Moderation | Miglee',
    description: 'Moderate event content',
  };
}
