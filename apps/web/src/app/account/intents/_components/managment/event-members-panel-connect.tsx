'use client';

import * as React from 'react';
import type {
  IntentMember as GQLIntentMember,
  IntentMemberRole as GQLRole,
} from '@/lib/graphql/__generated__/react-query-update';
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
} from '@/hooks/graphql/intent-members';
import type { IntentMember } from './types';
import { EventMembersPanel } from './event-members-panel';

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
      imageUrl: m.user.imageUrl ?? undefined,
    },
  };
}

export function EventMembersPanelConnect({
  intentId,
  isPremium,
  canManage,
  open,
  onClose,
}: {
  intentId: string;
  isPremium?: boolean;
  canManage: boolean;
  open: boolean;
  onClose: () => void;
}) {
  // Queries are enabled only when modal is open
  const {
    data: rawMembers,
    isLoading,
    isError,
    refetch,
  } = useIntentMembersQuery({ intentId }, { enabled: open });
  const { data: statsData } = useIntentMemberStatsQuery(
    { intentId },
    { enabled: open }
  );

  const promoteRole = useUpdateMemberRoleMutation();
  const kick = useKickMemberMutation();
  const ban = useBanMemberMutation();
  const unban = useUnbanMemberMutation();
  const approve = useApproveMembershipMutation();
  const reject = useRejectMembershipMutation();
  const invite = useInviteMemberMutation();
  const cancelPendingOrInvite = useCancelPendingOrInviteForUserMutation();

  const members: IntentMember[] = React.useMemo(
    () => (rawMembers?.intentMembers ?? []).map(mapGqlMember),
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
    console.dir({ m });
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

  // Skeleton / error placeholders rendered inside the modal frame for consistency
  if (!open) return null;

  if (isLoading) {
    return (
      <EventMembersPanel
        open={open}
        onClose={onClose}
        intentId={intentId}
        members={[]}
        canManage={canManage}
        isPremium={isPremium}
        stats={stats}
        onPromoteToModerator={onPromoteToModerator}
        onDemoteToParticipant={onDemoteToParticipant}
        onMakeOwner={onMakeOwner}
        onKick={onKick}
        onBan={onBan}
        onUnban={onUnban}
        onApprovePending={onApprovePending}
        onRejectPending={onRejectPending}
        onReinvite={onReinvite}
        onCancelInvite={onCancelInvite}
        onNotifyPremium={async () => {}}
        onInvited={async () => {
          await Promise.all([refetch()]);
        }}
      />
    );
  }

  if (isError) {
    // Render an empty modal with a simple error message (you can customize)
    return (
      <EventMembersPanel
        open={open}
        onClose={onClose}
        intentId={intentId}
        members={[]}
        canManage={canManage}
        isPremium={isPremium}
        stats={stats}
        onPromoteToModerator={onPromoteToModerator}
        onDemoteToParticipant={onDemoteToParticipant}
        onMakeOwner={onMakeOwner}
        onKick={onKick}
        onBan={onBan}
        onUnban={onUnban}
        onApprovePending={onApprovePending}
        onRejectPending={onRejectPending}
        onReinvite={onReinvite}
        onCancelInvite={onCancelInvite}
        onNotifyPremium={async () => {}}
        onInvited={async () => {
          await Promise.all([refetch()]);
        }}
      />
    );
  }

  return (
    <EventMembersPanel
      open={open}
      onClose={onClose}
      intentId={intentId}
      members={members}
      canManage={canManage}
      isPremium={isPremium}
      stats={stats}
      onPromoteToModerator={onPromoteToModerator}
      onDemoteToParticipant={onDemoteToParticipant}
      onMakeOwner={onMakeOwner}
      onKick={onKick}
      onBan={onBan}
      onUnban={onUnban}
      onApprovePending={onApprovePending}
      onRejectPending={onRejectPending}
      onReinvite={onReinvite}
      onCancelInvite={onCancelInvite}
      onNotifyPremium={async () => {
        console.info('[Premium] notify organizers – TODO');
      }}
      onInvited={async () => {
        await Promise.all([refetch()]);
      }}
    />
  );
}
