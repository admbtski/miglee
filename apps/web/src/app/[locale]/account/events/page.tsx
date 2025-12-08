'use client';

import { Calendar } from 'lucide-react';
import { useMemo } from 'react';

import { useMeQuery } from '@/features/auth/hooks/auth';
import {
  useAcceptInviteMutation,
  useCancelJoinRequestMutation,
  useLeaveEventMutationMembers,
  useMyEventsQuery,
} from '@/features/events/api/event-members';
import type {
  EventLifecycleStatus,
  EventMemberRole,
  EventMemberStatus,
  GetMyEventsQuery_myEvents_EventMember,
} from '@/lib/api/__generated__/react-query-update';

import { useEventsModals, useMyEventsFilters } from '@/features/events';
import { CancelEventModals } from '@/features/events/components/cancel-event-modals';
import { DeleteEventModals } from '@/features/events/components/delete-event-modals';
import { EventStatusFilter } from '@/features/events/components/event-status-filter';
import { FiltersDropdown } from '@/features/events/components/filters-dropdown';
import {
  MyEventCard,
  type MyEventCardData,
} from '@/features/events/components/my-event-card';
import { RoleFilter } from '@/features/events/components/role-filter';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { AccountPageHeader } from '../_components';

function mapToCardData(
  membership: GetMyEventsQuery_myEvents_EventMember
): MyEventCardData {
  return {
    event: {
      id: membership.event.id,
      title: membership.event.title,
      description: membership.event.description,
      startAt: membership.event.startAt,
      endAt: membership.event.endAt,
      address: membership.event.address,
      joinedCount: membership.event.joinedCount,
      max: membership.event.max,
      coverKey: membership.event.coverKey,
      coverBlurhash: membership.event.coverBlurhash,
      canceledAt: membership.event.canceledAt,
      deletedAt: membership.event.deletedAt,
    },
    membership: {
      id: membership.id,
      status: membership.status as EventMemberStatus,
      role: membership.role as EventMemberRole,
      joinedAt: membership.joinedAt,
      rejectReason: membership.rejectReason,
    },
  };
}

function mapRoleFilterToBackend(
  roleFilter: string
): EventMemberRole | undefined {
  switch (roleFilter) {
    case 'owner':
      return 'OWNER' as EventMemberRole;
    case 'moderator':
      return 'MODERATOR' as EventMemberRole;
    case 'member':
      return 'PARTICIPANT' as EventMemberRole;
    default:
      return undefined;
  }
}

function mapRoleFilterToMembershipStatus(
  roleFilter: string
): EventMemberStatus | undefined {
  switch (roleFilter) {
    case 'pending':
      return 'PENDING' as EventMemberStatus;
    case 'invited':
      return 'INVITED' as EventMemberStatus;
    case 'rejected':
      return 'REJECTED' as EventMemberStatus;
    case 'banned':
      return 'BANNED' as EventMemberStatus;
    case 'waitlist':
      return 'WAITLIST' as EventMemberStatus;
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
          {t.myEvents.loading}
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
          {t.myEvents.notAuthenticated}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t.myEvents.pleaseLogin}
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
      <p className="font-medium">{t.myEvents.errorLoading}</p>
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
        {t.myEvents.noEvents}
      </h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {hasActiveFilters
          ? t.myEvents.tryChangeFilters
          : t.myEvents.noEventsYet}
      </p>
    </div>
  );
}

export default function MyEventPage() {
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
  } = useMyEventsFilters();

  const { cancelId, deleteId, setCancelId, closeCancel, closeDelete } =
    useEventsModals();

  const backendRole = useMemo(
    () => mapRoleFilterToBackend(roleFilter),
    [roleFilter]
  );

  const backendMembershipStatus = useMemo(
    () => mapRoleFilterToMembershipStatus(roleFilter),
    [roleFilter]
  );

  const backendEventStatuses = useMemo(
    () => statusFilters.map((s) => s.toUpperCase()) as EventLifecycleStatus[],
    [statusFilters]
  );

  // todo: add pagination
  const { data, isLoading, error } = useMyEventsQuery({
    role: backendRole,
    membershipStatus: backendMembershipStatus,
    eventStatuses: backendEventStatuses,
    offset: 0,
    limit: 200,
  });

  const acceptInvite = useAcceptInviteMutation();
  const cancelRequest = useCancelJoinRequestMutation();
  const leaveEvent = useLeaveEventMutationMembers();

  const cardData = useMemo(() => {
    const memberships = data?.myEvents ?? [];
    return memberships.map(mapToCardData);
  }, [data?.myEvents]);

  if (isLoadingAuth) {
    return <LoadingState />;
  }

  if (!currentUserId) {
    return <UnauthenticatedState />;
  }

  const handleWithdraw = (eventId: string) => {
    cancelRequest.mutate({ eventId });
  };

  const handleAcceptInvite = (eventId: string) => {
    acceptInvite.mutate({ eventId });
  };

  const handleDeclineInvite = (eventId: string) => {
    // todo: implement decline invite mutation
    console.log('Decline invite:', eventId);
  };

  const handleLeave = (eventId: string) => {
    leaveEvent.mutate({ eventId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AccountPageHeader
        title={t.myEvents.title}
        description={t.myEvents.subtitle}
      />

      {/* Filters - Desktop (hidden on mobile) */}
      <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
        <RoleFilter value={roleFilter} onChange={setRoleFilter} />
        <EventStatusFilter values={statusFilters} onChange={setStatusFilters} />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium whitespace-nowrap"
          >
            {t.myEvents.clearFilters}
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

      {error && <ErrorState error={error} />}

      {!isLoading && !error && cardData.length === 0 && (
        <EmptyState hasActiveFilters={hasActiveFilters} />
      )}

      {!isLoading && !error && cardData.length > 0 && (
        <div className="space-y-4">
          {cardData.map((item) => (
            <MyEventCard
              key={item.event.id}
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
            {t.myEvents.showing} {cardData.length}{' '}
            {cardData.length !== 1 ? t.myEvents.events : t.myEvents.event}
          </div>
        </div>
      )}

      <DeleteEventModals
        deleteId={deleteId}
        onClose={closeDelete}
        onSuccess={() => {}}
      />

      <CancelEventModals
        cancelId={cancelId}
        onClose={closeCancel}
        onSuccess={() => {}}
      />
    </div>
  );
}
