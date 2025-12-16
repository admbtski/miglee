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
  Smartphone,
  UserCircle2,
  Shield,
  Ban,
} from 'lucide-react';

import { useEventManagement } from '@/features/event-management/components/event-management-provider';
import {
  useUpdateEventCheckinConfigMutation,
  useCheckInMemberMutation,
  useUncheckInMemberMutation,
  useGetEventCheckinLogsQuery,
} from '@/features/checkin/api/checkin';
import {
  CheckinMethod,
  EventMemberCoreFragment,
} from '@/lib/api/__generated__/react-query-update';
import { useEventMembersQuery } from '@/features/events/api/event-members';
import { toast } from '@/lib/utils/toast-manager';
import { EventQRCode } from '@/features/checkin/components/event-qr-code';
import { MemberActionsMenu } from './member-actions-menu';
import { RejectCheckinModal } from './reject-checkin-modal';
import { MethodActionsDropdown } from './method-actions-dropdown';
import { AnimatePresence, motion } from 'framer-motion';

type TabId = 'overview' | 'settings' | 'qr' | 'logs';

export function CheckinManagementClient() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { event, isLoading, refetch } = useEventManagement();

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectUserName, setRejectUserName] = useState<string>('');
  const [rejectMethod, setRejectMethod] = useState<CheckinMethod | null>(null);

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
  } = useGetEventCheckinLogsQuery(
    {
      eventId: event?.id ?? '',
      limit: 50,
    },
    {
      enabled: !!event?.id && activeTab === 'logs',
    }
  );

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
        description: data?.checkInMember?.member?.user?.name || 'Success',
      });
    },
    onError: (error) => {
      toast.error('Check-in failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const uncheckMutation = useUncheckInMemberMutation({
    onSuccess: () => {
      refetchMembers();
      refetchLogs();
      toast.success('Member unchecked');
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
          method: CheckinMethod.ModeratorPanel,
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
          method: CheckinMethod.ModeratorPanel,
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
            eventId={event.id}
            onOpenRejectModal={(userId, userName, method) => {
              setRejectUserId(userId);
              setRejectUserName(userName);
              setRejectMethod(method || null);
              setRejectModalOpen(true);
            }}
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
            eventId={event.id}
            eventName={event.title || 'Event'}
          />
        )}
        {activeTab === 'logs' && (
          <LogsTab
            eventId={event.id}
            logs={logsData?.items || []}
            isLoading={logsLoading}
            pageInfo={logsData?.pageInfo}
          />
        )}
      </div>

      {/* Reject Modal */}
      {rejectUserId && (
        <RejectCheckinModal
          isOpen={rejectModalOpen}
          onClose={() => {
            setRejectModalOpen(false);
            setRejectUserId(null);
            setRejectUserName('');
            setRejectMethod(null);
          }}
          eventId={event.id}
          userId={rejectUserId}
          userName={rejectUserName}
          method={rejectMethod}
        />
      )}
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
// Helper: Get Check-in Method Icon
// =============================================================================

function getCheckinMethodIcon(method: CheckinMethod) {
  switch (method) {
    case CheckinMethod.SelfManual:
      return Smartphone;
    case CheckinMethod.ModeratorPanel:
      return Shield;
    case CheckinMethod.EventQr:
      return QrCode;
    case CheckinMethod.UserQr:
      return UserCircle2;
    default:
      return CheckCircle2;
  }
}

function getCheckinMethodLabel(method: CheckinMethod) {
  switch (method) {
    case CheckinMethod.SelfManual:
      return 'Self Check-in';
    case CheckinMethod.ModeratorPanel:
      return 'Moderator Panel';
    case CheckinMethod.EventQr:
      return 'Event QR';
    case CheckinMethod.UserQr:
      return 'User QR';
    default:
      return method;
  }
}

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
  members: EventMemberCoreFragment[];
  isLoading: boolean;
  error?: Error;
  onCheckIn: (userId: string) => void;
  onUncheck: (userId: string) => void;
  isCheckingIn: boolean;
  isUnchecking: boolean;
  eventId: string;
  onOpenRejectModal: (
    userId: string,
    userName: string,
    method?: CheckinMethod
  ) => void;
}

function OverviewTab({
  members,
  isLoading,
  error,
  onCheckIn,
  onUncheck,
  isCheckingIn,
  isUnchecking,
  eventId,
  onOpenRejectModal,
}: OverviewTabProps) {
  // Export configuration state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    name: true,
    email: true,
    username: false,
    status: true,
    checkedInAt: true,
    checkinMethods: true,
    role: false,
  });

  // Toggle export column
  const toggleExportColumn = (column: keyof typeof exportConfig) => {
    setExportConfig((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  // Format check-in methods for display
  const formatCheckinMethods = (
    methods: string[] | null | undefined
  ): string => {
    if (!methods || methods.length === 0) return '-';
    return methods
      .map((method) => {
        switch (method) {
          case 'SELF_MANUAL':
            return 'Manual';
          case 'MODERATOR_PANEL':
            return 'By Organizer';
          case 'EVENT_QR':
            return 'Event QR';
          case 'USER_QR':
            return 'Personal QR';
          default:
            return method;
        }
      })
      .join(', ');
  };

  // Export participants list as CSV
  const handleExportList = () => {
    if (members.length === 0) {
      toast.error('No participants to export');
      return;
    }

    try {
      // Build headers based on selected columns
      const headers: string[] = [];
      if (exportConfig.name) headers.push('Name');
      if (exportConfig.email) headers.push('Email');
      if (exportConfig.username) headers.push('Username');
      if (exportConfig.role) headers.push('Role');
      if (exportConfig.status) headers.push('Status');
      if (exportConfig.checkedInAt) headers.push('Checked In At');
      if (exportConfig.checkinMethods) headers.push('Check-in Methods');

      // Build rows based on selected columns
      const rows = members.map((member) => {
        const row: string[] = [];
        if (exportConfig.name)
          row.push(
            member.user?.name || member.user?.profile?.displayName || 'Unknown'
          );
        if (exportConfig.email) row.push(member.user?.email || '-');
        if (exportConfig.username)
          row.push(member.user?.profile?.displayName || '-');
        if (exportConfig.role) row.push(member.role || '-');
        if (exportConfig.status)
          row.push(member.isCheckedIn ? 'Checked In' : 'Not Checked In');
        if (exportConfig.checkedInAt)
          row.push(
            member.lastCheckinAt
              ? new Date(member.lastCheckinAt).toLocaleString()
              : '-'
          );
        if (exportConfig.checkinMethods)
          row.push(formatCheckinMethods(member.checkinMethods));
        return row;
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
        `participants-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Participant list exported');
      setShowExportModal(false);
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
          onClick={() => setShowExportModal(true)}
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
        <div className="space-y-3">
          {members.map((member: EventMemberCoreFragment) => {
            const allMethods = [
              CheckinMethod.SelfManual,
              CheckinMethod.ModeratorPanel,
              CheckinMethod.EventQr,
              CheckinMethod.UserQr,
            ];

            return (
              <div
                key={member.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Status indicator */}
                    <div
                      className={[
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
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
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {member.user?.name || 'Unknown User'}
                      </div>

                      {/* Check-in status */}
                      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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

                      {/* Check-in methods icons */}
                      {member.isCheckedIn &&
                        member.checkinMethods &&
                        member.checkinMethods.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-zinc-500 dark:text-zinc-500">
                              Methods:
                            </span>
                            <div className="flex gap-1.5">
                              {allMethods.map((method) => {
                                const Icon = getCheckinMethodIcon(method);
                                const isActive =
                                  member.checkinMethods?.includes(method);
                                const isBlocked =
                                  member.checkinBlockedAll ||
                                  member.checkinBlockedMethods?.includes(
                                    method
                                  );

                                return (
                                  <div
                                    key={method}
                                    className={[
                                      'group relative flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                                      isActive
                                        ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30'
                                        : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50',
                                    ].join(' ')}
                                    title={getCheckinMethodLabel(method)}
                                  >
                                    <Icon
                                      className={[
                                        'h-4 w-4',
                                        isActive
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-zinc-400 dark:text-zinc-600',
                                      ].join(' ')}
                                    />
                                    {isBlocked && (
                                      <div className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500">
                                        <Ban className="h-2 w-2 text-white" />
                                      </div>
                                    )}
                                    {/* Method Actions Dropdown */}
                                    {isActive && (
                                      <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100">
                                        <MethodActionsDropdown
                                          member={member}
                                          eventId={eventId}
                                          method={method}
                                          isActive={isActive}
                                          isBlocked={isBlocked}
                                          onReject={() =>
                                            onOpenRejectModal(
                                              member.userId,
                                              member.user?.name || 'User',
                                              method
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* Blocking info */}
                      {(member.checkinBlockedAll ||
                        (member.checkinBlockedMethods &&
                          member.checkinBlockedMethods.length > 0)) && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                          <Ban className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                          <div className="text-xs text-red-700 dark:text-red-300">
                            {member.checkinBlockedAll ? (
                              <span>All check-in methods blocked</span>
                            ) : (
                              <span>
                                Blocked methods:{' '}
                                {member.checkinBlockedMethods
                                  ?.map(getCheckinMethodLabel)
                                  .join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Rejection info */}
                      {member.lastCheckinRejectionReason &&
                        member.lastCheckinRejectedAt && (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="flex-1 text-xs text-amber-700 dark:text-amber-300">
                              <div className="font-medium">Last rejected:</div>
                              <div className="mt-0.5">
                                {member.lastCheckinRejectionReason}
                              </div>
                              <div className="mt-1 text-[11px] text-amber-600/80 dark:text-amber-400/80">
                                {new Date(
                                  member.lastCheckinRejectedAt
                                ).toLocaleString()}
                                {member.lastCheckinRejectedBy && (
                                  <span>
                                    {' '}
                                    by {member.lastCheckinRejectedBy.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <MemberActionsMenu member={member} eventId={eventId} />

                    {/* Always show Check In button (can add multiple methods) */}
                    <button
                      onClick={() => onCheckIn(member.userId)}
                      disabled={
                        isCheckingIn ||
                        member.checkinBlockedAll ||
                        member.checkinBlockedMethods?.includes(
                          CheckinMethod.ModeratorPanel
                        )
                      }
                      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                      title={
                        member.isCheckedIn
                          ? 'Add MODERATOR_PANEL check-in method'
                          : 'Check in via MODERATOR_PANEL'
                      }
                    >
                      {isCheckingIn ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Check In
                    </button>

                    {/* Show Uncheck button only if already checked in via MODERATOR_PANEL */}
                    {member.checkinMethods?.includes(
                      CheckinMethod.ModeratorPanel
                    ) && (
                      <button
                        onClick={() => onUncheck(member.userId)}
                        disabled={isUnchecking}
                        className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        title="Remove MODERATOR_PANEL check-in method"
                      >
                        {isUnchecking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Uncheck
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export Configuration Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Export Configuration
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Select which columns to include in the export
                  </p>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Name */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                  <input
                    type="checkbox"
                    checked={exportConfig.name}
                    onChange={() => toggleExportColumn('name')}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 dark:border-zinc-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      Name
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      User's display name
                    </div>
                  </div>
                </label>

                {/* Email */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                  <input
                    type="checkbox"
                    checked={exportConfig.email}
                    onChange={() => toggleExportColumn('email')}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 dark:border-zinc-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      Email
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      User's email address
                    </div>
                  </div>
                </label>

                {/* Username */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                  <input
                    type="checkbox"
                    checked={exportConfig.username}
                    onChange={() => toggleExportColumn('username')}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 dark:border-zinc-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      Username
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      User's username
                    </div>
                  </div>
                </label>

                {/* Role */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                  <input
                    type="checkbox"
                    checked={exportConfig.role}
                    onChange={() => toggleExportColumn('role')}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 dark:border-zinc-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      Role
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Event role (Owner, Moderator, Member)
                    </div>
                  </div>
                </label>

                {/* Status */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                  <input
                    type="checkbox"
                    checked={exportConfig.status}
                    onChange={() => toggleExportColumn('status')}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 dark:border-zinc-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      Check-in Status
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Checked In / Not Checked In
                    </div>
                  </div>
                </label>

                {/* Checked In At */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                  <input
                    type="checkbox"
                    checked={exportConfig.checkedInAt}
                    onChange={() => toggleExportColumn('checkedInAt')}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 dark:border-zinc-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      Checked In At
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Date and time of check-in
                    </div>
                  </div>
                </label>

                {/* Check-in Methods */}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30">
                  <input
                    type="checkbox"
                    checked={exportConfig.checkinMethods}
                    onChange={() => toggleExportColumn('checkinMethods')}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 dark:border-zinc-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-indigo-900 dark:text-indigo-100">
                      Check-in Methods
                    </div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">
                      How the user checked in (Manual, QR, etc.)
                    </div>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportList}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  eventId: string;
  eventName: string;
}

function QrTab({
  checkinEnabled,
  enabledMethods,
  eventCheckinToken,
  eventId,
  eventName,
}: QrTabProps) {
  const isQrEnabled =
    checkinEnabled && enabledMethods.includes('EVENT_QR' as CheckinMethod);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Event QR Code
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Display this QR code at your event entrance for easy check-in
        </p>
      </div>

      {/* Not enabled state */}
      {!isQrEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/50 dark:bg-amber-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-amber-900 dark:text-amber-100">
                Event QR Code Not Enabled
              </div>
              <div className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {!checkinEnabled ? (
                  <>
                    Check-in is currently disabled for this event. Enable it in
                    the <span className="font-medium">Settings</span> tab to use
                    QR codes.
                  </>
                ) : (
                  <>
                    The "Event QR Code" method is not enabled. Go to the{' '}
                    <span className="font-medium">Settings</span> tab and enable
                    it to generate a QR code.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* QR Code Card */
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-6">
            {/* Info Card */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/50 dark:bg-indigo-900/20">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                <div className="text-sm text-indigo-900 dark:text-indigo-100">
                  <div className="font-medium">How it works</div>
                  <div className="mt-1 text-indigo-700 dark:text-indigo-300">
                    Display this QR code at your event entrance. Attendees scan
                    it with their phone to automatically check in.
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Component */}
            <EventQRCode
              eventId={eventId}
              token={eventCheckinToken || null}
              eventName={eventName}
            />

            {/* Security Notice */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600 dark:text-zinc-400" />
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    Security Tip
                  </div>
                  <div className="mt-1">
                    This QR code is shared by all attendees. If compromised, you
                    can generate a new one using the "Rotate Token" button
                    above.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface LogsTabProps {
  eventId: string;
  logs: Array<{
    id: string;
    action: string;
    method?: string | null;
    source: string;
    result: string;
    reason?: string | null;
    comment?: string | null;
    createdAt: string;
    actor?: {
      id: string;
      name?: string | null;
      profile?: {
        displayName?: string | null;
      } | null;
    } | null;
  }>;
  isLoading: boolean;
  pageInfo?: { total: number; hasNext: boolean };
}

function LogsTab({ logs, isLoading, pageInfo }: LogsTabProps) {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Filter logs based on selected filters
  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (methodFilter !== 'all' && log.method !== methodFilter) return false;
    return true;
  });

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
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <option value="all">All Actions</option>
          <option value="CHECK_IN">Check In</option>
          <option value="UNCHECK">Uncheck</option>
          <option value="REJECT">Reject</option>
          <option value="BLOCK_ALL">Block All</option>
          <option value="BLOCK_METHOD">Block Method</option>
          <option value="METHODS_CHANGED">Methods Changed</option>
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <option value="all">All Methods</option>
          <option value="SELF_MANUAL">Manual</option>
          <option value="MODERATOR_PANEL">Moderator Panel</option>
          <option value="EVENT_QR">Event QR</option>
          <option value="USER_QR">User QR</option>
        </select>
      </div>

      {/* Empty state */}
      {filteredLogs.length === 0 && logs.length === 0 && (
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

      {/* No results from filters */}
      {filteredLogs.length === 0 && logs.length > 0 && (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <ScrollText className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No matching logs
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Try adjusting your filters
          </p>
        </div>
      )}

      {/* Logs list */}
      {filteredLogs.length > 0 && (
        <div className="space-y-2">
          {filteredLogs.map((log) => {
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
                          By{' '}
                          {log.actor?.name ??
                            (log.actor?.profile?.displayName || 'Unknown')}
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

      {/* Load more indicator - TODO: implement pagination */}
      {pageInfo?.hasNext && filteredLogs.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => {
              console.log('Load more clicked - pagination not yet implemented');
              toast.info('Pagination coming soon');
            }}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
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
