'use client';

import * as React from 'react';
import type {
  IntentMember as GQLIntentMember,
  IntentMemberRole as GQLRole,
} from '@/lib/api/__generated__/react-query-update';
import {
  useIntentMembersQuery,
  useIntentMemberStatsQuery,
  useUpdateMemberRoleMutation,
  useKickMemberMutation,
  useBanMemberMutation,
  useApproveMembershipMutation,
  useRejectMembershipMutation,
  useInviteMemberMutation,
  useCancelPendingOrInviteForUserMutation,
  useUnbanMemberMutation,
  usePromoteFromWaitlistMutation,
} from '@/features/intents/api/intent-members';
import { MembersPanel } from './members-panel';
import { MemberManageModal } from './member-manage-modal';
import type { IntentMember } from './types';

function mapGqlMember(m: GQLIntentMember): IntentMember {
  return {
    id: m.id,
    intentId: m.intentId,
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

export function IntentMembersManagementConnect({
  intentId,
}: {
  intentId: string;
}) {
  const [selected, setSelected] = React.useState<IntentMember | null>(null);

  const {
    data: rawMembers,
    isLoading,
    isError,
    refetch,
  } = useIntentMembersQuery({ intentId });

  const { data: statsData } = useIntentMemberStatsQuery({ intentId });

  const promoteRole = useUpdateMemberRoleMutation();
  const kick = useKickMemberMutation();
  const ban = useBanMemberMutation();
  const unban = useUnbanMemberMutation();
  const approve = useApproveMembershipMutation();
  const reject = useRejectMembershipMutation();
  const invite = useInviteMemberMutation();
  const cancelPendingOrInvite = useCancelPendingOrInviteForUserMutation();
  const promoteFromWaitlist = usePromoteFromWaitlistMutation();

  const members: IntentMember[] = React.useMemo(
    () => (rawMembers?.intentMembers ?? []).map(mapGqlMember as any),
    [rawMembers]
  );

  const stats = React.useMemo(
    () => ({
      JOINED: statsData?.intentMemberStats.joined ?? 0,
      INVITED: statsData?.intentMemberStats.invited ?? 0,
      PENDING: statsData?.intentMemberStats.pending ?? 0,
      REJECTED: statsData?.intentMemberStats.rejected ?? 0,
      LEFT: statsData?.intentMemberStats.left ?? 0,
      KICKED: statsData?.intentMemberStats.kicked ?? 0,
      BANNED: statsData?.intentMemberStats.banned ?? 0,
    }),
    [statsData]
  );

  const onPromoteToModerator = async (m: IntentMember) => {
    await promoteRole.mutateAsync({
      input: { intentId, userId: m.userId, role: 'MODERATOR' as GQLRole },
    });
    await refetch();
  };

  const onDemoteToParticipant = async (m: IntentMember) => {
    await promoteRole.mutateAsync({
      input: { intentId, userId: m.userId, role: 'PARTICIPANT' as GQLRole },
    });
    await refetch();
  };

  const onMakeOwner = async (m: IntentMember) => {
    await promoteRole.mutateAsync({
      input: { intentId, userId: m.userId, role: 'OWNER' as GQLRole },
    });
    await refetch();
  };

  const onKick = async (m: IntentMember) => {
    await kick.mutateAsync({
      input: { intentId, userId: m.userId, note: null },
    });
    await refetch();
  };

  const onBan = async (m: IntentMember) => {
    await ban.mutateAsync({
      input: { intentId, userId: m.userId, note: 'Banned by moderator' },
    });
    await refetch();
  };

  const onUnban = async (m: IntentMember) => {
    await unban.mutateAsync({
      input: { intentId, userId: m.userId },
    });
    await refetch();
  };

  const onApprovePending = async (m: IntentMember) => {
    await approve.mutateAsync({ input: { intentId, userId: m.userId } });
    await refetch();
  };

  const onRejectPending = async (m: IntentMember) => {
    await reject.mutateAsync({
      input: { intentId, userId: m.userId, note: null },
    });
    await refetch();
  };

  const onReinvite = async (m: IntentMember) => {
    await invite.mutateAsync({ input: { intentId, userId: m.userId } });
    await refetch();
  };

  const onCancelInvite = async (m: IntentMember) => {
    await cancelPendingOrInvite.mutateAsync({
      input: { intentId, userId: m.userId },
    });
    await refetch();
  };

  const onUnreject = async (m: IntentMember) => {
    await cancelPendingOrInvite.mutateAsync({
      input: { intentId, userId: m.userId },
    });
    await refetch();
  };

  const onPromoteFromWaitlist = async (m: IntentMember) => {
    await promoteFromWaitlist.mutateAsync({
      input: { intentId, userId: m.userId },
    });
    await refetch();
  };

  const onRemoveFromWaitlist = async (m: IntentMember) => {
    await kick.mutateAsync({
      input: { intentId, userId: m.userId, note: 'Removed from waitlist' },
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
        intentId={intentId}
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
