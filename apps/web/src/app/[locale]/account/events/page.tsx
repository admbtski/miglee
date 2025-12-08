'use client';

import { useMemo } from 'react';

// Auth
import { useMeQuery } from '@/features/auth/hooks/auth';

// Events API
import {
  useAcceptInviteMutation,
  useCancelJoinRequestMutation,
  useLeaveEventMutationMembers,
  useMyEventsQuery,
} from '@/features/events/api/event-members';

// Events Feature (components, hooks, types, mappers)
import {
  // Components
  CancelEventModals,
  DeleteEventModals,
  EventStatusFilter,
  FiltersDropdown,
  MyEventCard,
  RoleFilter,
  MyEventsLoadingState,
  MyEventsUnauthenticatedState,
  MyEventsErrorState,
  MyEventsEmptyState,
  MyEventsInlineLoading,
  // Hooks
  useEventsModals,
  useMyEventsFilters,
  // Types & Mappers
  mapMembershipToCardData,
  mapRoleFilterToBackend,
  mapRoleFilterToMembershipStatus,
  mapStatusFiltersToBackend,
} from '@/features/events';

// i18n & Layout
import { useI18n } from '@/lib/i18n/provider-ssr';
import { AccountPageHeader } from '../_components';

export default function MyEventsPage() {
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
    () => mapStatusFiltersToBackend(statusFilters),
    [statusFilters]
  );

  // TODO: Add pagination support (infinite scroll or load more button)
  // Currently limited to 200 events which should be enough for most users
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
    return memberships.map(mapMembershipToCardData);
  }, [data?.myEvents]);

  // ─── Auth Loading State ───
  if (isLoadingAuth) {
    return <MyEventsLoadingState />;
  }

  // ─── Unauthenticated State ───
  if (!currentUserId) {
    return <MyEventsUnauthenticatedState />;
  }

  // ─── Action Handlers ───
  const handleWithdraw = (eventId: string) => {
    cancelRequest.mutate({ eventId });
  };

  const handleAcceptInvite = (eventId: string) => {
    acceptInvite.mutate({ eventId });
  };

  const handleDeclineInvite = (eventId: string) => {
    // TODO: Implement decline invite mutation (requires backend support)
    // For now, users can use "withdraw" action after accepting
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

      {/* Loading State */}
      {isLoading && <MyEventsInlineLoading />}

      {/* Error State */}
      {error && <MyEventsErrorState error={error} />}

      {/* Empty State */}
      {!isLoading && !error && cardData.length === 0 && (
        <MyEventsEmptyState hasActiveFilters={hasActiveFilters} />
      )}

      {/* Events List */}
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

      {/* Modals */}
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
