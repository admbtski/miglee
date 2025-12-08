'use client';

import { useMemo } from 'react';
import { Calendar } from 'lucide-react';

import { useMeQuery } from '@/features/auth/hooks/auth';
import {
  useMyIntentsQuery,
  useAcceptInviteMutation,
  useCancelJoinRequestMutation,
  useLeaveIntentMutationMembers,
} from '@/features/intents/api/intent-members';
import type {
  IntentLifecycleStatus,
  IntentMemberRole,
  IntentMemberStatus,
} from '@/lib/api/__generated__/react-query-update';

import { RoleFilter } from '@/features/intents/components/role-filter';
import { IntentStatusFilter } from '@/features/intents/components/intent-status-filter';
import { FiltersDropdown } from '@/features/intents/components/filters-dropdown';
import {
  MyIntentCard,
  type MyIntentCardData,
} from '@/features/intents/components/my-intent-card';
import { CancelIntentModals } from '@/features/intents/components/cancel-intent-modals';
import { DeleteIntentModals } from '@/features/intents/components/delete-intent-modals';
import {
  useMyIntentsFilters,
  useIntentsModals,
} from '@/features/intents/hooks';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { AccountPageHeader } from '../_components';

function mapToCardData(membership: any): MyIntentCardData {
  return {
    intent: {
      id: membership.intent.id,
      title: membership.intent.title,
      description: membership.intent.description,
      startAt: membership.intent.startAt,
      endAt: membership.intent.endAt,
      address: membership.intent.address,
      joinedCount: membership.intent.joinedCount,
      max: membership.intent.max,
      coverKey: membership.intent.coverKey,
      coverBlurhash: membership.intent.coverBlurhash,
      canceledAt: membership.intent.canceledAt,
      deletedAt: membership.intent.deletedAt,
    },
    membership: {
      id: membership.id,
      status: membership.status as IntentMemberStatus,
      role: membership.role as IntentMemberRole,
      joinedAt: membership.joinedAt,
      rejectReason: membership.rejectReason,
    },
  };
}

function mapRoleFilterToBackend(
  roleFilter: string
): IntentMemberRole | undefined {
  switch (roleFilter) {
    case 'owner':
      return 'OWNER' as IntentMemberRole;
    case 'moderator':
      return 'MODERATOR' as IntentMemberRole;
    case 'member':
      return 'PARTICIPANT' as IntentMemberRole;
    default:
      return undefined;
  }
}

function mapRoleFilterToMembershipStatus(
  roleFilter: string
): IntentMemberStatus | undefined {
  switch (roleFilter) {
    case 'pending':
      return 'PENDING' as IntentMemberStatus;
    case 'invited':
      return 'INVITED' as IntentMemberStatus;
    case 'rejected':
      return 'REJECTED' as IntentMemberStatus;
    case 'banned':
      return 'BANNED' as IntentMemberStatus;
    case 'waitlist':
      return 'WAITLIST' as IntentMemberStatus;
    default:
      return undefined;
  }
}

function LoadingState() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {t.myIntents.loading}
        </p>
      </div>
    </div>
  );
}

function UnauthenticatedState() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {t.myIntents.notAuthenticated}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t.myIntents.pleaseLogin}
        </p>
      </div>
    </div>
  );
}

type ErrorStateProps = {
  error: Error;
};

function ErrorState({ error }: ErrorStateProps) {
  const { t } = useI18n();
  return (
    <div className="p-4 text-red-800 border border-red-200 rounded-lg bg-red-50 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
      <p className="font-medium">{t.myIntents.errorLoading}</p>
      <p className="mt-1 text-sm">{error.message}</p>
    </div>
  );
}

type EmptyStateProps = {
  hasActiveFilters: boolean;
};

function EmptyState({ hasActiveFilters }: EmptyStateProps) {
  const { t } = useI18n();
  return (
    <div className="p-12 text-center border rounded-lg border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <Calendar className="w-12 h-12 mx-auto text-zinc-400" />
      <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
        {t.myIntents.noEvents}
      </h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {hasActiveFilters
          ? t.myIntents.tryChangeFilters
          : t.myIntents.noEventsYet}
      </p>
    </div>
  );
}

export default function MyIntentsPage() {
  const { t } = useI18n();
  const { data: authData, isLoading: isLoadingAuth } = useMeQuery();
  const currentUserId = authData?.me?.id;

  const {
    roleFilter,
    statusFilters,
    setRoleFilter,
    setStatusFilters,
    clearFilters,
    hasActiveFilters,
  } = useMyIntentsFilters();

  const { cancelId, deleteId, setCancelId, closeCancel, closeDelete } =
    useIntentsModals();

  const backendRole = useMemo(
    () => mapRoleFilterToBackend(roleFilter),
    [roleFilter]
  );

  const backendMembershipStatus = useMemo(
    () => mapRoleFilterToMembershipStatus(roleFilter),
    [roleFilter]
  );

  const backendIntentStatuses = useMemo(
    () => statusFilters.map((s) => s.toUpperCase()) as IntentLifecycleStatus[],
    [statusFilters]
  );

  const { data, isLoading, error } = useMyIntentsQuery({
    role: backendRole,
    membershipStatus: backendMembershipStatus,
    intentStatuses: backendIntentStatuses,
    limit: 200,
  });

  const acceptInvite = useAcceptInviteMutation();
  const cancelRequest = useCancelJoinRequestMutation();
  const leaveIntent = useLeaveIntentMutationMembers();

  const cardData = useMemo(() => {
    const memberships = data?.myIntents ?? [];
    return memberships.map(mapToCardData);
  }, [data?.myIntents]);

  if (isLoadingAuth) {
    return <LoadingState />;
  }

  if (!currentUserId) {
    return <UnauthenticatedState />;
  }

  const handleWithdraw = (intentId: string) => {
    cancelRequest.mutate({ intentId });
  };

  const handleAcceptInvite = (intentId: string) => {
    acceptInvite.mutate({ intentId });
  };

  const handleDeclineInvite = (intentId: string) => {
    // TODO: implement decline invite mutation
    console.log('Decline invite:', intentId);
  };

  const handleLeave = (intentId: string) => {
    leaveIntent.mutate({ intentId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AccountPageHeader
        title={t.myIntents.title}
        description={t.myIntents.subtitle}
      />

      {/* Filters - Desktop (hidden on mobile) */}
      <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
        <RoleFilter value={roleFilter} onChange={setRoleFilter} />
        <IntentStatusFilter
          values={statusFilters}
          onChange={setStatusFilters}
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium whitespace-nowrap"
          >
            {t.myIntents.clearFilters}
          </button>
        )}
      </div>

      {/* Filters - Mobile Dropdown (visible on mobile/tablet) */}
      <div className="lg:hidden">
        <FiltersDropdown
          roleFilter={roleFilter}
          statusFilters={statusFilters}
          onRoleChange={setRoleFilter}
          onStatusChange={setStatusFilters}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent" />
        </div>
      )}

      {(error as any) && <ErrorState error={error as any} />}

      {!isLoading && !error && cardData.length === 0 && (
        <EmptyState hasActiveFilters={hasActiveFilters} />
      )}

      {!isLoading && !error && cardData.length > 0 && (
        <div className="space-y-4">
          {cardData.map((item) => (
            <MyIntentCard
              key={item.membership.id}
              data={item}
              actions={{
                onCancel: setCancelId,
                onLeave: handleLeave,
                onWithdraw: handleWithdraw,
                onAcceptInvite: handleAcceptInvite,
                onDeclineInvite: handleDeclineInvite,
              }}
            />
          ))}

          <div className="mt-6 text-sm text-center text-zinc-600 dark:text-zinc-400">
            {t.myIntents.showing} {cardData.length}{' '}
            {cardData.length !== 1 ? t.myIntents.events : t.myIntents.event}
          </div>
        </div>
      )}

      <DeleteIntentModals
        deleteId={deleteId}
        onClose={closeDelete}
        onSuccess={() => {}}
      />

      <CancelIntentModals
        cancelId={cancelId}
        onClose={closeCancel}
        onSuccess={() => {}}
      />
    </div>
  );
}
