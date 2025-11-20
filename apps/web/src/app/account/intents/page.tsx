'use client';

import { useMemo } from 'react';
import { Calendar } from 'lucide-react';

import { useMeQuery } from '@/lib/api/auth';
import {
  useMyIntentsQuery,
  useAcceptInviteMutation,
  useCancelJoinRequestMutation,
} from '@/lib/api/intent-members';
import type {
  IntentLifecycleStatus,
  IntentMemberRole,
  IntentMemberStatus,
} from '@/lib/api/__generated__/react-query-update';
import { CreateEditIntentModalConnect } from '@/features/intents/components/create-edit-intent-modal-connect';

import { RoleFilter } from './_components/role-filter';
import { IntentStatusFilter } from './_components/intent-status-filter';
import {
  MyIntentCard,
  type MyIntentCardData,
} from './_components/my-intent-card';
import { CancelIntentModals } from './_components/cancel-intent-modals';
import { DeleteIntentModals } from './_components/delete-intent-modals';
import { LeaveIntentModals } from './_components/leave-intent-modals';
import { EventManagementModalConnect } from './_components/management';
import { useMyIntentsFilters } from './_hooks/use-my-intents-filters';
import { useIntentsModals } from './_hooks/use-intents-modals';

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

function UnauthenticatedState() {
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

type ErrorStateProps = {
  error: Error;
};

function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
      <p className="font-medium">Error loading events</p>
      <p className="mt-1 text-sm">{error.message}</p>
    </div>
  );
}

type EmptyStateProps = {
  hasActiveFilters: boolean;
};

function EmptyState({ hasActiveFilters }: EmptyStateProps) {
  return (
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
  );
}

export default function MyIntentsPage() {
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

  return (
    <>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Moje Intenty
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Zarządzaj wszystkimi swoimi wydarzeniami w jednym miejscu
          </p>
        </div>

        <div className="mb-8 space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <RoleFilter value={roleFilter} onChange={setRoleFilter} />
          <IntentStatusFilter
            values={statusFilters}
            onChange={setStatusFilters}
          />

          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-pink-600 transition-colors hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
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
                  onManage: setManageId,
                  onEdit: setEditId,
                  onCancel: setCancelId,
                  onLeave: setLeaveId,
                  onWithdraw: handleWithdraw,
                  onAcceptInvite: handleAcceptInvite,
                  onDeclineInvite: handleDeclineInvite,
                }}
              />
            ))}

            <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Showing {cardData.length} event{cardData.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

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

      <CreateEditIntentModalConnect
        intentId={editId ?? undefined}
        open={Boolean(editId)}
        onClose={closeEdit}
      />

      <EventManagementModalConnect
        intentId={manageId ?? ''}
        canManage={true}
        isPremium={true}
        open={Boolean(manageId)}
        onClose={closeManage}
      />
    </>
  );
}
