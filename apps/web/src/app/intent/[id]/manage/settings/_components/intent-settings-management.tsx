/**
 * Intent Settings Management Component
 * Manage event settings and configuration
 */

'use client';

import { useState } from 'react';
import {
  Settings,
  Lock,
  Users,
  MessageSquare,
  AlertTriangle,
  Save,
} from 'lucide-react';

import { useIntentQuery } from '@/lib/api/intents';
import { cn } from '@/lib/utils';

interface IntentSettingsManagementProps {
  intentId: string;
}

type SettingsTab = 'general' | 'privacy' | 'members' | 'chat' | 'danger';

/**
 * Intent Settings Management Component
 */
export function IntentSettingsManagement({
  intentId,
}: IntentSettingsManagementProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { data, isLoading } = useIntentQuery({ id: intentId });
  const intent = data?.intent;

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (!intent) {
    return (
      <div className="text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Settings
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Manage your event settings and configuration
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex -mb-px space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'group inline-flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-400'
                  )}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                General Settings
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Basic event information and configuration
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Event Title
                </label>
                <input
                  type="text"
                  defaultValue={intent.title}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Description
                </label>
                <textarea
                  rows={4}
                  defaultValue={intent.description || ''}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    defaultValue={intent.max}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Visibility
                  </label>
                  <select
                    defaultValue={intent.visibility}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="HIDDEN">Hidden</option>
                    <option value="INVITED_ONLY">Invited Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Privacy Settings
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Control who can see and interact with your event
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Public Event
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Anyone can see this event
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={intent.visibility === 'PUBLIC'}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Allow Late Join
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Members can join after event starts
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={intent.allowJoinLate}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Danger Zone
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Irreversible and destructive actions
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Cancel Event
                    </p>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      Cancel this event. Members will be notified.
                    </p>
                  </div>
                  <button className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/50">
                    Cancel Event
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Delete Event
                    </p>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      Permanently delete this event. This cannot be undone.
                    </p>
                  </div>
                  <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">
                    Delete Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
