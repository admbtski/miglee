/**
 * Check-in Management Client Component
 * Full-featured check-in system with tabs for list, settings, QR, and logs
 */

'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Users,
  Settings,
  QrCode,
  ScrollText,
  Download,
  Info,
} from 'lucide-react';

// TODO: Replace with actual GraphQL hooks and queries
// import { useEventCheckin } from '@/features/events/api/checkin';

type TabId = 'overview' | 'settings' | 'qr' | 'logs';

export function CheckinManagementClient() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  
  // Local state for settings (will be replaced with GraphQL mutations)
  const [checkinEnabled, setCheckinEnabled] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);

  // TODO: Replace with actual data fetching
  const isLoading = false;
  const event = {
    checkinEnabled,
    enabledCheckinMethods: enabledMethods,
    eventCheckinToken: null,
  };
  const members: any[] = [];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const stats = {
    total: members.length,
    checkedIn: members.filter((m) => m.isCheckedIn).length,
    percentage:
      members.length > 0
        ? Math.round(
            (members.filter((m) => m.isCheckedIn).length / members.length) *
              100
          )
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Participants"
          value={stats.total}
          description="JOINED members"
          icon={Users}
          color="zinc"
        />
        <StatCard
          label="Checked In"
          value={stats.checkedIn}
          description="Present at event"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="Attendance Rate"
          value={`${stats.percentage}%`}
          description="Check-in percentage"
          icon={CheckCircle2}
          color="indigo"
        />
      </div>

      {/* Check-in disabled notice */}
      {!event.checkinEnabled && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800/50 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Check-in is disabled
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Enable check-in in the settings tab to start tracking attendee
                presence at your event.
              </p>
              <button
                onClick={() => setActiveTab('settings')}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'group inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300',
              ].join(' ')}
            >
              <tab.icon
                className={[
                  'h-4 w-4',
                  activeTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-400',
                ].join(' ')}
              />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {activeTab === 'overview' && <OverviewTab members={members} />}
        {activeTab === 'settings' && (
          <SettingsTab
            checkinEnabled={checkinEnabled}
            enabledMethods={enabledMethods}
            onToggleEnabled={() => setCheckinEnabled(!checkinEnabled)}
            onToggleMethod={(method) => {
              if (enabledMethods.includes(method)) {
                setEnabledMethods(enabledMethods.filter((m) => m !== method));
              } else {
                setEnabledMethods([...enabledMethods, method]);
              }
            }}
          />
        )}
        {activeTab === 'qr' && <QrTab event={event} />}
        {activeTab === 'logs' && <LogsTab />}
      </div>
    </div>
  );
}

// =============================================================================
// Tabs Configuration
// =============================================================================

const tabs: Array<{
  id: TabId;
  label: string;
  icon: typeof Users;
}> = [
  { id: 'overview', label: 'Participants', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'logs', label: 'Activity Log', icon: ScrollText },
];

// =============================================================================
// Stat Card Component
// =============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: typeof Users;
  color: 'zinc' | 'emerald' | 'indigo';
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  color,
}: StatCardProps) {
  const colors = {
    zinc: 'text-zinc-900 dark:text-zinc-100',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
          <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {label}
          </div>
          <div className={`mt-1 text-3xl font-bold ${colors[color]}`}>
            {value}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Tab Components
// =============================================================================

function OverviewTab({ members }: { members: any[] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Participant List
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Check in attendees and manage presence status
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
          <Download className="h-4 w-4" />
          Export List
        </button>
      </div>

      {/* Empty state */}
      {members.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <Users className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No participants yet
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Participants will appear here once they join the event
          </p>
        </div>
      )}

      {/* Participants list would go here */}
    </div>
  );
}

function SettingsTab({
  checkinEnabled,
  enabledMethods,
  onToggleEnabled,
  onToggleMethod,
}: {
  checkinEnabled: boolean;
  enabledMethods: string[];
  onToggleEnabled: () => void;
  onToggleMethod: (method: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Check-in Settings
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Configure how attendees can check in to your event
        </p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">
            Enable Check-in
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Allow attendees to check in to this event
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleEnabled}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            checkinEnabled
              ? 'bg-indigo-600 dark:bg-indigo-500'
              : 'bg-zinc-200 dark:bg-zinc-700',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              checkinEnabled ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Methods */}
      <div>
        <div className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">
          Check-in Methods
        </div>
        <div className="space-y-2">
          {[
            {
              id: 'SELF_MANUAL',
              label: 'Manual',
              description: 'User clicks "I\'m here" button',
            },
            {
              id: 'MODERATOR_PANEL',
              label: 'Moderator Panel',
              description: 'Check in from participant list',
            },
            {
              id: 'EVENT_QR',
              label: 'Event QR Code',
              description: 'Shared QR for all attendees',
            },
            {
              id: 'USER_QR',
              label: 'Individual QR Codes',
              description: 'Scan attendee\'s personal QR',
            },
          ].map((method) => (
            <label
              key={method.id}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 cursor-pointer dark:border-zinc-800 dark:hover:bg-zinc-900/50"
            >
              <input
                type="checkbox"
                checked={enabledMethods.includes(method.id)}
                onChange={() => onToggleMethod(method.id)}
                disabled={!checkinEnabled}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700"
              />
              <div className="flex-1">
                <div
                  className={[
                    'text-sm font-medium',
                    checkinEnabled
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-400 dark:text-zinc-600',
                  ].join(' ')}
                >
                  {method.label}
                </div>
                <div
                  className={[
                    'text-xs',
                    checkinEnabled
                      ? 'text-zinc-600 dark:text-zinc-400'
                      : 'text-zinc-400 dark:text-zinc-600',
                  ].join(' ')}
                >
                  {method.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Info message when disabled */}
      {!checkinEnabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Enable check-in above to configure check-in methods for your event.
            </p>
          </div>
        </div>
      )}

      {/* Save info */}
      {checkinEnabled && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium">Settings updated locally</p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                Changes are stored in local state. Integration with backend API coming soon.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QrTab({ event }: { event: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Event QR Code
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Display this QR code at your event entrance for easy check-in
        </p>
      </div>

      {!event.checkinEnabled ||
      !event.enabledCheckinMethods.includes('EVENT_QR') ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <QrCode className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            QR Code not enabled
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Enable "Event QR Code" method in settings to use this feature
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-50 py-12 dark:bg-zinc-900/50">
            <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
              <QrCode className="h-48 w-48 text-zinc-400" />
            </div>
            <p className="mt-4 font-mono text-xs text-zinc-500">
              QR Code will appear here
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
              Full Screen
            </button>
            <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
              Download PNG
            </button>
            <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
              Download PDF
            </button>
            <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
              Rotate Token
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LogsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Activity Log
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Complete audit trail of all check-in activities
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
          <Download className="h-4 w-4" />
          Export Log
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <option>All Actions</option>
          <option>Check In</option>
          <option>Uncheck</option>
          <option>Reject</option>
          <option>Block</option>
        </select>
        <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <option>All Methods</option>
          <option>Manual</option>
          <option>Moderator Panel</option>
          <option>Event QR</option>
          <option>User QR</option>
        </select>
      </div>

      {/* Empty state */}
      <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <ScrollText className="mx-auto h-12 w-12 text-zinc-400" />
        <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          No activity yet
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Check-in activity will appear here
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />

      {/* Content */}
      <div className="h-96 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
