/**
 * Event View Management Component
 * Displays the public event view within the management interface
 */

// TODO i18n: All hardcoded strings need translation keys
// - "Live Preview", "This is how your event appears to visitors"
// - "Open in New Tab", "Preview Mode", info text

'use client';

import { EventDetailClient } from '@/features/events';
import { useLocalePath } from '@/hooks/use-locale-path';
import { ExternalLink, Eye, Info } from 'lucide-react';
import Link from 'next/link';

interface EventViewManagementProps {
  eventId: string;
}

/**
 * Event View Management Component
 * Wraps the EventDetailClient with a management header
 */
export function EventViewManagement({ eventId }: EventViewManagementProps) {
  const { localePath } = useLocalePath();

  return (
    <div className="space-y-6">
      {/* Header with link to public view */}
      <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/50 dark:bg-indigo-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
              Live Preview
            </h2>
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              This is how your event appears to visitors
            </p>
          </div>
        </div>
        <Link
          href={localePath(`/event/${eventId}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-md dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <ExternalLink className="h-4 w-4" />
          Open in New Tab
        </Link>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <p className="font-medium">Preview Mode</p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            Some interactive features may behave differently in this preview.
            Open in a new tab for the full experience.
          </p>
        </div>
      </div>

      {/* Event Detail View */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <EventDetailClient eventId={eventId} />
      </div>
    </div>
  );
}
