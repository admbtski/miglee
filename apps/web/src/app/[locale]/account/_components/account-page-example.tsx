/**
 * Example Account Page - Shows the complete structure
 *
 * This demonstrates the clean architecture:
 * 1. Sidebar (left) - handled by layout
 * 2. Navbar (top) - handled by layout
 * 3. Header section - title + tabs
 * 4. Body section - 2-column empty state
 */

import { Plus, Calendar } from 'lucide-react';
import { AccountPageHeader } from './account-page-header';
import { AccountEmptyState } from './account-empty-state';

export function AccountPageExample() {
  return (
    <div className="space-y-8">
      {/* Header Section: Title + Tabs */}
      <AccountPageHeader
        title="My Events"
        description="Manage your upcoming and past events"
        tabs={[
          { key: 'upcoming', label: 'Upcoming', href: '/account/intents' },
          { key: 'past', label: 'Past', href: '/account/intents/past' },
          { key: 'drafts', label: 'Drafts', href: '/account/intents/drafts' },
        ]}
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        }
      />

      {/* Body Section: 2-column empty state */}
      <AccountEmptyState
        illustration={
          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-12 dark:from-indigo-900/20 dark:to-violet-900/20">
            <Calendar className="h-32 w-32 text-indigo-600 dark:text-indigo-400" />
          </div>
        }
        title="No events yet"
        description="You haven't created any events yet. Start by creating your first event and invite people to join."
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Your First Event
          </button>
        }
      />
    </div>
  );
}
