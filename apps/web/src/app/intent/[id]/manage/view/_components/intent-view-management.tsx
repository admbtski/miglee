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
      <div className="flex items-center justify-between p-4 border border-indigo-200 rounded-lg bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/20">
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
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <ExternalLink className="w-4 h-4" />
          Open in New Tab
        </Link>
      </div>

      {/* Event Detail View */}
      <div className="">
        <EventDetailClient intentId={intentId} />
      </div>
    </div>
  );
}
