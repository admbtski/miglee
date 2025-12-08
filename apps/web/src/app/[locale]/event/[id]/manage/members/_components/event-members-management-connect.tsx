'use client';

import * as React from 'react';
import type {
  EventMember as GQLEventMember,
  EventMemberRole as GQLRole,
} from '@/lib/api/__generated__/react-query-update';
import {
  useEventMembersQuery,
  useEventMemberStatsQuery,
  useUpdateMemberRoleMutation,
  useKickMemberMutation,
  useBanMemberMutation,
  useApproveMembershipMutation,
  useRejectMembershipMutation,
  useInviteMemberMutation,
  useCancelPendingOrInviteForUserMutation,
  useUnbanMemberMutation,
  usePromoteFromWaitlistMutation,
} from '@/features/events/api/event-members';
import { MembersPanel } from './members-panel';
import { MemberManageModal } from './member-manage-modal';
import type { EventMember } from './types';

function mapGqlMember(m: GQLEventMember): EventMember {
  return {
    id: m.id,
    eventId: m.eventId,
    userId: m.userId,
    role: m.role as any,
    status: m.status as any,
    joinedAt: (m.joinedAt as string | null) ?? null,
    leftAt: (m.leftAt as string | null) ?? null,
    note: (m.note as string | null) ?? null,
    user: {
      id: m.user.id,
      name: m.user.name ?? 'Użytkownik',
      avatarKey: m.user.avatarKey ?? undefined,
    },
  };
}

export function EventMembersManagementConnect({
  eventId,
}: {
  eventId: string;
}) {
  const [selected, setSelected] = React.useState<EventMember | null>(null);

  const {
    data: rawMembers,
    isLoading,
    isError,
    refetch,
  } = useEventMembersQuery({ eventId });

  const { data: statsData } = useEventMemberStatsQuery({ eventId });

  const promoteRole = useUpdateMemberRoleMutation();
  const kick = useKickMemberMutation();
  const ban = useBanMemberMutation();
  const unban = useUnbanMemberMutation();
  const approve = useApproveMembershipMutation();
  const reject = useRejectMembershipMutation();
  const invite = useInviteMemberMutation();
  const cancelPendingOrInvite = useCancelPendingOrInviteForUserMutation();
  const promoteFromWaitlist = usePromoteFromWaitlistMutation();

  const members: EventMember[] = React.useMemo(
    () => (rawMembers?.eventMembers ?? []).map(mapGqlMember as any),
    [rawMembers]
  );

  const stats = React.useMemo(
    () => ({
      JOINED: statsData?.eventMemberStats.joined ?? 0,
      INVITED: statsData?.eventMemberStats.invited ?? 0,
      PENDING: statsData?.eventMemberStats.pending ?? 0,
      REJECTED: statsData?.eventMemberStats.rejected ?? 0,
      LEFT: statsData?.eventMemberStats.left ?? 0,
      KICKED: statsData?.eventMemberStats.kicked ?? 0,
      BANNED: statsData?.eventMemberStats.banned ?? 0,
    }),
    [statsData]
  );

  const onPromoteToModerator = async (m: EventMember) => {
    await promoteRole.mutateAsync({
      input: { eventId, userId: m.userId, role: 'MODERATOR' as GQLRole },
    });
    await refetch();
  };

  const onDemoteToParticipant = async (m: EventMember) => {
    await promoteRole.mutateAsync({
      input: { eventId, userId: m.userId, role: 'PARTICIPANT' as GQLRole },
    });
    await refetch();
  };

  const onMakeOwner = async (m: EventMember) => {
    await promoteRole.mutateAsync({
      input: { eventId, userId: m.userId, role: 'OWNER' as GQLRole },
    });
    await refetch();
  };

  const onKick = async (m: EventMember) => {
    await kick.mutateAsync({
      input: { eventId, userId: m.userId, note: null },
    });
    await refetch();
  };

  const onBan = async (m: EventMember) => {
    await ban.mutateAsync({
      input: { eventId, userId: m.userId, note: 'Banned by moderator' },
    });
    await refetch();
  };

  const onUnban = async (m: EventMember) => {
    await unban.mutateAsync({
      input: { eventId, userId: m.userId },
    });
    await refetch();
  };

  const onApprovePending = async (m: EventMember) => {
    await approve.mutateAsync({ input: { eventId, userId: m.userId } });
    await refetch();
  };

  const onRejectPending = async (m: EventMember) => {
    await reject.mutateAsync({
      input: { eventId, userId: m.userId, note: null },
    });
    await refetch();
  };

  const onReinvite = async (m: EventMember) => {
    await invite.mutateAsync({ input: { eventId, userId: m.userId } });
    await refetch();
  };

  const onCancelInvite = async (m: EventMember) => {
    await cancelPendingOrInvite.mutateAsync({
      input: { eventId, userId: m.userId },
    });
    await refetch();
  };

  const onUnreject = async (m: EventMember) => {
    await cancelPendingOrInvite.mutateAsync({
      input: { eventId, userId: m.userId },
    });
    await refetch();
  };

  const onPromoteFromWaitlist = async (m: EventMember) => {
    await promoteFromWaitlist.mutateAsync({
      input: { eventId, userId: m.userId },
    });
    await refetch();
  };

  const onRemoveFromWaitlist = async (m: EventMember) => {
    await kick.mutateAsync({
      input: { eventId, userId: m.userId, note: 'Removed from waitlist' },
    });
    await refetch();
  };

  const callbacks = React.useMemo(
    () => ({
      onPromoteToModerator,
      onDemoteToParticipant,
      onMakeOwner,
      onKick,
      onBan,
      onUnban,
      onReinvite,
      onCancelInvite,
      onApprovePending,
      onRejectPending,
      onUnreject,
      onPromoteFromWaitlist,
      onRemoveFromWaitlist,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 rounded-full animate-spin border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 border rounded-lg border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <p className="text-sm text-red-800 dark:text-red-200">
          Nie udało się załadować członków. Spróbuj ponownie.
        </p>
      </div>
    );
  }

  return (
    <>
      <MembersPanel
        members={members}
        canManage={true}
        callbacks={callbacks}
        onOpenManage={setSelected}
        stats={stats}
        eventId={eventId}
        onInvited={async () => {
          await refetch();
        }}
      />

      {/* Member detail modal */}
      <MemberManageModal
        open={!!selected}
        onClose={() => setSelected(null)}
        member={selected}
        canManage={true}
        callbacks={{
          ...callbacks,
          onKick: async (m) => {
            await callbacks.onKick?.(m);
            setSelected(null);
          },
          onBan: async (m) => {
            await callbacks.onBan?.(m);
            setSelected(null);
          },
          onApprovePending: async (m) => {
            await callbacks.onApprovePending?.(m);
            setSelected(null);
          },
          onRejectPending: async (m) => {
            await callbacks.onRejectPending?.(m);
            setSelected(null);
          },
          onCancelInvite: async (m) => {
            await callbacks.onCancelInvite?.(m);
            setSelected(null);
          },
        }}
      />
    </>
  );
}
