/**
 * Intent View Management Component
 * Displays the public event view within the management interface
 */

'use client';

import { EventDetailClient } from '@/app/intent/[id]/_components/event-detail-client';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface IntentViewManagementProps {
  intentId: string;
}

/**
 * Intent View Management Component
 * Wraps the EventDetailClient with a management header
 */
export function IntentViewManagement({ intentId }: IntentViewManagementProps) {
  return (
    <div className="space-y-6">
      {/* Header with link to public view */}
      <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
        <div>
          <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
            Event Preview
          </h2>
          <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
            This is how your event appears to visitors
          </p>
        </div>
        <Link
          href={`/intent/${intentId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <ExternalLink className="h-4 w-4" />
          Open in New Tab
        </Link>
      </div>

      {/* Event Detail View */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <EventDetailClient intentId={intentId} />
      </div>
    </div>
  );
}
