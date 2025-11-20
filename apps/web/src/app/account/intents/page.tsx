'use client';

import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';

import { useMeQuery } from '@/lib/api/auth';
import {
  useMyIntentsQuery,
  useAcceptInviteMutation,
  useCancelJoinRequestMutation,
} from '@/lib/api/intent-members';
import type { IntentLifecycleStatus } from '@/lib/api/__generated__/react-query-update';
import { CreateEditIntentModalConnect } from '@/features/intents/components/create-edit-intent-modal-connect';

// Components
import { RoleFilter } from './_components/role-filter';
import { IntentStatusFilter } from './_components/intent-status-filter';
import {
  MyIntentCard,
  type MyIntentCardData,
} from './_components/my-intent-card';
import { CancelIntentModals } from './_components/cancel-intent-modals';
import { DeleteIntentModals } from './_components/delete-intent-modals';
import { LeaveIntentModals } from './_components/leave-intent-modals';
import { EventManagementModalConnect } from './_components/managemen/event-management-modal-connect';

// Hooks
import { useMyIntentsFilters } from './_hooks/use-my-intents-filters';
import { useIntentsModals } from './_hooks/use-intents-modals';

/* ───────────────────────────── Helpers ───────────────────────────── */

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
      status: membership.status,
      role: membership.role,
      joinedAt: membership.joinedAt,
      rejectReason: membership.rejectReason,
    },
  };
}

/* ───────────────────────────── Component ───────────────────────────── */

export default function MyIntentsPage() {
  // Get current user
  const { data: authData, isLoading: isLoadingAuth } = useMeQuery();
  const currentUserId = authData?.me?.id;

  // Filters
  const {
    roleFilter,
    statusFilters,
    setRoleFilter,
    setStatusFilters,
    clearFilters,
    hasActiveFilters,
  } = useMyIntentsFilters();

  // Modals
  const {
    editId,
    leaveId,
    cancelId,
    deleteId,
    manageId,
    setEditId,
    setLeaveId,
    setCancelId,
    setManageId,
    closeEdit,
    closeLeave,
    closeCancel,
    closeDelete,
    closeManage,
  } = useIntentsModals();

  // Convert frontend filters to backend format
  const backendRole = useMemo(() => {
    if (roleFilter === 'all') return undefined;
    if (roleFilter === 'owner') return 'OWNER';
    if (roleFilter === 'moderator') return 'MODERATOR';
    if (roleFilter === 'member') return 'PARTICIPANT';
    return undefined;
  }, [roleFilter]);

  const backendMembershipStatus = useMemo(() => {
    if (roleFilter === 'pending') return 'PENDING';
    if (roleFilter === 'invited') return 'INVITED';
    if (roleFilter === 'rejected') return 'REJECTED';
    if (roleFilter === 'banned') return 'BANNED';
    if (roleFilter === 'waitlist') return 'WAITLIST';
    return undefined;
  }, [roleFilter]);

  const backendIntentStatuses = useMemo(() => {
    return statusFilters.map((s) => s.toUpperCase()) as IntentLifecycleStatus[];
  }, [statusFilters]);

  // Query with backend filters
  const { data, isLoading, error } = useMyIntentsQuery({
    role: backendRole as any,
    membershipStatus: backendMembershipStatus as any,
    intentStatuses: backendIntentStatuses,
    limit: 200,
  });

  // Mutations
  const acceptInvite = useAcceptInviteMutation();
  const cancelRequest = useCancelJoinRequestMutation();

  // Map to card data
  const cardData = useMemo(() => {
    const memberships = data?.myIntents ?? [];
    return memberships.map(mapToCardData);
  }, [data?.myIntents]);

  // Loading authentication state
  if (isLoadingAuth) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!currentUserId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Not authenticated
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Please log in to view your events
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Moje Intenty
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Zarządzaj wszystkimi swoimi wydarzeniami w jednym miejscu
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <RoleFilter value={roleFilter} onChange={setRoleFilter} />
          <IntentStatusFilter
            values={statusFilters}
            onChange={setStatusFilters}
          />

          {hasActiveFilters ? (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-pink-600 transition-colors hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
              >
                Clear all filters
              </button>
            </div>
          ) : null}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-medium">Error loading events</p>
            <p className="mt-1 text-sm">{String(error)}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && cardData.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <Calendar className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Brak wydarzeń
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? 'Spróbuj zmienić filtry'
                : 'Nie masz jeszcze żadnych wydarzeń'}
            </p>
          </div>
        )}

        {/* List */}
        {!isLoading && !error && cardData.length > 0 && (
          <div className="space-y-4">
            {cardData.map((item) => {
              return (
                <MyIntentCard
                  key={item.membership.id}
                  data={item}
                  actions={{
                    onManage: setManageId,
                    onEdit: setEditId,
                    onCancel: setCancelId,
                    onLeave: setLeaveId,
                    onWithdraw: (intentId) =>
                      cancelRequest.mutate({ intentId }),
                    onAcceptInvite: (intentId) =>
                      acceptInvite.mutate({ intentId }),
                    onDeclineInvite: (intentId) => {
                      // TODO: implement decline invite mutation
                      console.log('Decline invite:', intentId);
                    },
                  }}
                />
              );
            })}

            {/* Results count */}
            <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Showing {cardData.length} event{cardData.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeleteIntentModals
        deleteId={deleteId}
        onClose={closeDelete}
        onSuccess={() => {}}
      />

      <LeaveIntentModals
        leaveId={leaveId}
        onClose={closeLeave}
        leaveAction={async () => Promise.resolve()}
        onSuccess={() => {}}
      />

      <CancelIntentModals
        cancelId={cancelId}
        onClose={closeCancel}
        onSuccess={() => {}}
      />

      {/* Edit */}
      <CreateEditIntentModalConnect
        intentId={editId ?? undefined}
        open={!!editId}
        onClose={closeEdit}
      />

      <EventManagementModalConnect
        intentId={manageId ?? ''}
        canManage={true}
        isPremium={true}
        open={!!manageId}
        onClose={closeManage}
      />
    </>
  );
}
