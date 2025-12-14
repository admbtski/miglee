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
  Loader2,
  AlertCircle,
  Check,
  X,
  Clock,
  AlertTriangle,
} from 'lucide-react';

import { useEventManagement } from '../../_components/event-management-provider';
import {
  useUpdateEventCheckinConfigMutation,
  useCheckInMemberMutation,
  useUncheckInMemberMutation,
  useGetEventCheckinLogsQuery,
  type CheckinMethod,
} from '@/features/events/api/checkin';
import { useEventMembersQuery } from '@/features/events/api/event-members';
import { toast } from '@/lib/utils/toast-manager';

type TabId = 'overview' | 'settings' | 'qr' | 'logs';

export function CheckinManagementClient() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { event, isLoading, refetch } = useEventManagement();

  // Query for event members
  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useEventMembersQuery(
    { eventId: event?.id || '' },
    { enabled: !!event?.id }
  );

  // Query for check-in logs
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useGetEventCheckinLogsQuery({
    eventId: event?.id || '',
    limit: 50,
    enabled: !!event?.id && activeTab === 'logs',
  });

  // Mutation for updating check-in config
  const updateConfigMutation = useUpdateEventCheckinConfigMutation({
    onSuccess: () => {
      refetch();
      toast.success('Settings updated');
    },
    onError: (error) => {
      toast.error('Failed to update settings', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Mutations for check-in actions
  const checkInMutation = useCheckInMemberMutation({
    onSuccess: (data) => {
      refetchMembers();
      refetchLogs();
      toast.success('Member checked in', {
        description: data?.member?.user?.displayName || 'Success',
      });
    },
    onError: (error) => {
      toast.error('Check-in failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const uncheckMutation = useUncheckInMemberMutation({
    onSuccess: (data) => {
      refetchMembers();
      refetchLogs();
      toast.success('Member unchecked', {
        description: data?.member?.user?.displayName || 'Success',
      });
    },
    onError: (error) => {
      toast.error('Uncheck failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!event) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800/50 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Event not found
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              Unable to load event data. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get members from query (eventMembers is already an array)
  const members = Array.isArray(membersData?.eventMembers)
    ? membersData.eventMembers
    : [];
  const stats = {
    total: members.length,
    checkedIn: members.filter((m: any) => m.isCheckedIn).length,
    percentage:
      members.length > 0
        ? Math.round(
            (members.filter((m: any) => m.isCheckedIn).length /
              members.length) *
              100
          )
        : 0,
  };

  const handleToggleEnabled = async () => {
    if (!event.id) return;

    try {
      await updateConfigMutation.mutateAsync({
        input: {
          eventId: event.id,
          checkinEnabled: !event.checkinEnabled,
          enabledCheckinMethods: event.enabledCheckinMethods as CheckinMethod[],
        },
      });
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  const handleToggleMethod = async (method: CheckinMethod) => {
    if (!event.id) return;

    const currentMethods = (event.enabledCheckinMethods ||
      []) as CheckinMethod[];
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter((m) => m !== method)
      : [...currentMethods, method];

    try {
      await updateConfigMutation.mutateAsync({
        input: {
          eventId: event.id,
          checkinEnabled: event.checkinEnabled || false,
          enabledCheckinMethods: newMethods,
        },
      });
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  const handleCheckIn = async (userId: string) => {
    if (!event.id) return;

    try {
      await checkInMutation.mutateAsync({
        input: {
          eventId: event.id,
          userId,
          method: 'MODERATOR_PANEL',
        },
      });
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  const handleUncheck = async (userId: string) => {
    if (!event.id) return;

    try {
      await uncheckMutation.mutateAsync({
        input: {
          eventId: event.id,
          userId,
          method: 'MODERATOR_PANEL',
        },
      });
    } catch (error) {
      // Error handled by mutation onError
    }
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
        {activeTab === 'overview' && (
          <OverviewTab
            members={members}
            isLoading={membersLoading}
            error={membersError as Error | undefined}
            onCheckIn={handleCheckIn}
            onUncheck={handleUncheck}
            isCheckingIn={checkInMutation.isPending}
            isUnchecking={uncheckMutation.isPending}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            checkinEnabled={event.checkinEnabled || false}
            enabledMethods={
              (event.enabledCheckinMethods || []) as CheckinMethod[]
            }
            onToggleEnabled={handleToggleEnabled}
            onToggleMethod={handleToggleMethod}
            isUpdating={updateConfigMutation.isPending}
          />
        )}
        {activeTab === 'qr' && (
          <QrTab
            checkinEnabled={event.checkinEnabled || false}
            enabledMethods={
              (event.enabledCheckinMethods || []) as CheckinMethod[]
            }
            eventCheckinToken={event.eventCheckinToken}
          />
        )}
        {activeTab === 'logs' && (
          <LogsTab
            eventId={event.id}
            logs={logsData?.eventCheckinLogs?.items || []}
            isLoading={logsLoading}
            pageInfo={logsData?.eventCheckinLogs?.pageInfo}
          />
        )}
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

interface OverviewTabProps {
  members: any[];
  isLoading: boolean;
  error?: Error;
  onCheckIn: (userId: string) => void;
  onUncheck: (userId: string) => void;
  isCheckingIn: boolean;
  isUnchecking: boolean;
}

function OverviewTab({
  members,
  isLoading,
  error,
  onCheckIn,
  onUncheck,
  isCheckingIn,
  isUnchecking,
}: OverviewTabProps) {
  // Export participants list as CSV
  const handleExportList = () => {
    if (members.length === 0) {
      toast.error('No participants to export');
      return;
    }

    try {
      // Create CSV content
      const headers = ['Name', 'Email', 'Status', 'Checked In At'];
      const rows = members.map((member: any) => [
        member.user?.name || member.user?.displayName || 'Unknown',
        member.user?.email || '-',
        member.isCheckedIn ? 'Checked In' : 'Not Checked In',
        member.lastCheckinAt
          ? new Date(member.lastCheckinAt).toLocaleString()
          : '-',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `participants-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Participant list exported');
    } catch (error) {
      toast.error('Failed to export list');
      console.error('Export error:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800/50 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Failed to load participants
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error.message || 'Unknown error occurred'}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        <button
          onClick={handleExportList}
          disabled={members.length === 0}
          className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
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

      {/* Participants list */}
      {members.length > 0 && (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                {/* Status indicator */}
                <div
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    member.isCheckedIn
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-zinc-100 dark:bg-zinc-800',
                  ].join(' ')}
                >
                  {member.isCheckedIn ? (
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-zinc-400" />
                  )}
                </div>

                {/* Member info */}
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {member.user?.name ??
                      (member.user?.displayName || 'Unknown User')}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {member.isCheckedIn ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        Checked in
                        {member.lastCheckinAt &&
                          ` at ${new Date(member.lastCheckinAt).toLocaleTimeString()}`}
                      </span>
                    ) : (
                      <span className="text-zinc-400">Not checked in</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {member.isCheckedIn ? (
                  <button
                    onClick={() => onUncheck(member.userId)}
                    disabled={isUnchecking}
                    className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    {isUnchecking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Uncheck
                  </button>
                ) : (
                  <button
                    onClick={() => onCheckIn(member.userId)}
                    disabled={isCheckingIn}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {isCheckingIn ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Check In
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SettingsTabProps {
  checkinEnabled: boolean;
  enabledMethods: CheckinMethod[];
  onToggleEnabled: () => void;
  onToggleMethod: (method: CheckinMethod) => void;
  isUpdating: boolean;
}

function SettingsTab({
  checkinEnabled,
  enabledMethods,
  onToggleEnabled,
  onToggleMethod,
  isUpdating,
}: SettingsTabProps) {
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
          disabled={isUpdating}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            checkinEnabled
              ? 'bg-indigo-600 dark:bg-indigo-500'
              : 'bg-zinc-200 dark:bg-zinc-700',
          ].join(' ')}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin text-white mx-auto" />
          ) : (
            <span
              className={[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                checkinEnabled ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          )}
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
              id: 'SELF_MANUAL' as CheckinMethod,
              label: 'Manual',
              description: 'User clicks "I\'m here" button',
            },
            {
              id: 'MODERATOR_PANEL' as CheckinMethod,
              label: 'Moderator Panel',
              description: 'Check in from participant list',
            },
            {
              id: 'EVENT_QR' as CheckinMethod,
              label: 'Event QR Code',
              description: 'Shared QR for all attendees',
            },
            {
              id: 'USER_QR' as CheckinMethod,
              label: 'Individual QR Codes',
              description: "Scan attendee's personal QR",
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
                disabled={!checkinEnabled || isUpdating}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700"
              />
              <div className="flex-1">
                <div
                  className={[
                    'text-sm font-medium',
                    checkinEnabled && !isUpdating
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-400 dark:text-zinc-600',
                  ].join(' ')}
                >
                  {method.label}
                </div>
                <div
                  className={[
                    'text-xs',
                    checkinEnabled && !isUpdating
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
      {!checkinEnabled && !isUpdating && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Enable check-in above to configure check-in methods for your
              event.
            </p>
          </div>
        </div>
      )}

      {/* Saving indicator */}
      {isUpdating && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Saving settings...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface QrTabProps {
  checkinEnabled: boolean;
  enabledMethods: CheckinMethod[];
  eventCheckinToken: string | null | undefined;
}

function QrTab({
  checkinEnabled,
  enabledMethods,
  eventCheckinToken,
}: QrTabProps) {
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

      {!checkinEnabled ||
      !enabledMethods.includes('EVENT_QR' as CheckinMethod) ? (
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
              {eventCheckinToken
                ? `Token: ${eventCheckinToken.slice(0, 12)}...`
                : 'No token'}
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

interface LogsTabProps {
  eventId: string;
  logs: any[];
  isLoading: boolean;
  pageInfo?: { total: number; hasNext: boolean };
}

function LogsTab({ logs, isLoading, pageInfo }: LogsTabProps) {
  // Export logs as CSV
  const handleExportLogs = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    try {
      // Create CSV content
      const headers = [
        'Date',
        'Time',
        'Action',
        'Method',
        'Actor',
        'Result',
        'Comment',
      ];
      const rows = logs.map((log: any) => {
        const date = new Date(log.createdAt);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          log.action.replace(/_/g, ' '),
          log.method ? log.method.replace(/_/g, ' ') : '-',
          log.actor?.displayName || log.actor?.name || '-',
          log.result || '-',
          log.comment || '-',
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `checkin-logs-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Logs exported');
    } catch (error) {
      toast.error('Failed to export logs');
      console.error('Export error:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CHECK_IN':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
      case 'UNCHECK':
        return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
      case 'REJECT':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'BLOCK_ALL':
      case 'BLOCK_METHOD':
        return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30';
      case 'UNBLOCK_ALL':
      case 'UNBLOCK_METHOD':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CHECK_IN':
        return Check;
      case 'UNCHECK':
        return X;
      case 'REJECT':
        return AlertTriangle;
      default:
        return ScrollText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Activity Log
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {pageInfo?.total
              ? `${pageInfo.total} total events`
              : 'Complete audit trail of all check-in activities'}
          </p>
        </div>
        <button
          onClick={handleExportLogs}
          disabled={logs.length === 0}
          className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
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
      {logs.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <ScrollText className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No activity yet
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Check-in activity will appear here
          </p>
        </div>
      )}

      {/* Logs list */}
      {logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((log: any) => {
            const ActionIcon = getActionIcon(log.action);
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* Icon */}
                <div
                  className={[
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                    getActionColor(log.action),
                  ].join(' ')}
                >
                  <ActionIcon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {log.action.replace(/_/g, ' ')}
                        {log.method && (
                          <span className="ml-2 text-sm font-normal text-zinc-500">
                            via {log.method.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      {log.actor && (
                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          By {log.actor.displayName || 'Unknown'}
                        </div>
                      )}
                      {log.comment && (
                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {log.comment}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-xs text-zinc-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Result badge */}
                  {log.result && (
                    <div className="mt-2">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          log.result === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : log.result === 'DENIED'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
                        ].join(' ')}
                      >
                        {log.result}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more indicator */}
      {pageInfo?.hasNext && (
        <div className="text-center">
          <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            Load More
          </button>
        </div>
      )}
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
