/**
 * Intent Chat Management Page
 * Manage event chat and messages
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IntentChatManagement } from './_components/intent-chat-management';
import { Loader2 } from 'lucide-react';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IntentChatPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Czat wydarzenia
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-[70ch]">
          Zarządzaj komunikacją z uczestnikami wydarzenia
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex min-h-[600px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Ładowanie czatu...
              </p>
            </div>
          </div>
        }
      >
        <IntentChatManagement intentId={id} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Chat Management | Miglee',
    description: 'Manage event chat',
  };
}
