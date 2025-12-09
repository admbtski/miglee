/**
 * My Events Page
 *
 * Displays user's events with filtering by role and status.
 * Header and filters render immediately, events list loads async.
 *
 * All text uses i18n via useI18n hook.
 */

'use client';

import { Suspense, useMemo } from 'react';

import { useMeQuery } from '@/features/auth/hooks/auth';
import {
  useAcceptInviteMutation,
  useCancelJoinRequestMutation,
  useLeaveEventMutationMembers,
  useMyEventsQuery,
} from '@/features/events/api/event-members';
import {
  CancelEventModals,
  DeleteEventModals,
  EventStatusFilter,
  FiltersDropdown,
  MyEventCard,
  MyEventsEmptyState,
  MyEventsErrorState,
  MyEventsInlineLoading,
  MyEventsUnauthenticatedState,
  RoleFilter,
  mapMembershipToCardData,
  mapRoleFilterToBackend,
  mapRoleFilterToMembershipStatus,
  mapStatusFiltersToBackend,
  useEventsModals,
  useMyEventsFilters,
  type EventStatusFilterValue,
  type RoleFilterValue,
} from '@/features/events';
import { useI18n } from '@/lib/i18n/provider-ssr';

import { AccountPageHeader } from '../_components';

/**
 * Events list content component that handles data fetching
 * This allows header and filters to render immediately while events load
 */
function EventsListContent({
  roleFilter,
  statusFilters,
  hasActiveFilters,
  setCancelId,
}: {
  roleFilter: RoleFilterValue;
  statusFilters: EventStatusFilterValue[];
  hasActiveFilters: boolean;
  setCancelId: (id: string) => void;
}) {
  const { t } = useI18n();

  // useMeQuery with staleTime to use cached data from sidebar
  // Don't show loading state if we have cached data
  const { data: authData, isLoading: isLoadingAuth } = useMeQuery({
    staleTime: 5 * 60 * 1000, // 5 minutes - use cached data
  });
  const currentUserId = authData?.me?.id;

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
  const { data, isLoading, error } = useMyEventsQuery(
    {
      role: backendRole,
      membershipStatus: backendMembershipStatus,
      eventStatuses: backendEventStatuses,
      offset: 0,
      limit: 200,
    },
    {
      enabled: !!currentUserId,
    }
  );

  const acceptInvite = useAcceptInviteMutation();
  const cancelRequest = useCancelJoinRequestMutation();
  const leaveEvent = useLeaveEventMutationMembers();

  const cardData = useMemo(() => {
    const memberships = data?.myEvents ?? [];
    return memberships.map(mapMembershipToCardData);
  }, [data?.myEvents]);

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

  // Show loader only when events are loading (not when auth is loading if we have cached data)
  // If auth is still loading and we don't have userId yet, show loader
  // If we have userId but events are loading, show loader
  const showLoading =
    (isLoadingAuth && !currentUserId) || (currentUserId && isLoading);

  if (showLoading) {
    return <MyEventsInlineLoading />;
  }

  // Only show unauthenticated state if auth is done and we don't have userId
  if (!isLoadingAuth && !currentUserId) {
    return <MyEventsUnauthenticatedState />;
  }

  if (error) {
    return <MyEventsErrorState error={error} />;
  }

  if (cardData.length === 0) {
    return <MyEventsEmptyState hasActiveFilters={hasActiveFilters} />;
  }

  return (
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
  );
}

export default function MyEventsPage() {
  const { t } = useI18n();

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

  return (
    <div className="space-y-6">
      {/* Header - always visible immediately */}
      <AccountPageHeader
        title={t.myEvents.title}
        description={t.myEvents.subtitle}
      />

      {/* Filters - Desktop (hidden on mobile) - always visible immediately */}
      <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <RoleFilter value={roleFilter} onChange={setRoleFilter} />
        <EventStatusFilter values={statusFilters} onChange={setStatusFilters} />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 whitespace-nowrap"
          >
            {t.myEvents.clearFilters}
          </button>
        )}
      </div>

      {/* Filters - Mobile Dropdown (visible on mobile/tablet) - always visible immediately */}
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

      {/* Events List - loads with single loader */}
      <Suspense fallback={<MyEventsInlineLoading />}>
        <EventsListContent
          roleFilter={roleFilter}
          statusFilters={statusFilters}
          hasActiveFilters={hasActiveFilters}
          setCancelId={setCancelId}
        />
      </Suspense>

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
