// src/api/resolvers/mutations/intent-members.ts
import type { Prisma } from '@prisma/client';
import {
  IntentMemberRole,
  IntentMemberStatus,
  NotificationEntity as PrismaNotificationEntity,
  NotificationKind as PrismaNotificationKind,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapIntent, mapNotification } from '../helpers';

export const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  intent: {
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
    },
  },
} satisfies Prisma.NotificationInclude;

/**
 * Transaction client type compatible with Prisma Client Extensions.
 * Matches the actual 'tx' type provided to prisma.$transaction callback.
 */
type Tx = Omit<
  typeof prisma,
  '$extends' | '$transaction' | '$disconnect' | '$connect' | '$on'
>;

/* ----------------------------- Helpers ----------------------------- */

/** Ensure authenticated user and return their id. */
function assertAuth(ctx: MercuriusContext): string {
  if (!ctx.user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user.id;
}

/** Load intent with members for moderation decisions. */
async function loadIntentWithMembers(tx: Tx, intentId: string) {
  const intent = await tx.intent.findUnique({
    where: { id: intentId },
    include: { members: true },
  });
  if (!intent) {
    throw new GraphQLError('Intent not found.', {
      extensions: { code: 'NOT_FOUND', field: 'intentId' },
    });
  }
  return intent;
}

/** Check user has moderator or owner role in the intent. */
function isModeratorOrOwner(
  intent: { members: { userId: string; role: IntentMemberRole }[] },
  userId: string
) {
  return intent.members.some(
    (m) =>
      m.userId === userId &&
      (m.role === IntentMemberRole.OWNER ||
        m.role === IntentMemberRole.MODERATOR)
  );
}

/** Check user is the owner. */
function isOwner(
  intent: { members: { userId: string; role: IntentMemberRole }[] },
  userId: string
) {
  return intent.members.some(
    (m) => m.userId === userId && m.role === IntentMemberRole.OWNER
  );
}

/** Count current JOINED members. */
function countJoined(tx: Tx, intentId: string) {
  return tx.intentMember.count({
    where: { intentId, status: IntentMemberStatus.JOINED },
  });
}

/** Enforce late-join policy. */
function assertCanJoinNow(intent: { allowJoinLate: boolean; startAt: Date }) {
  const now = new Date();
  if (!intent.allowJoinLate && now >= new Date(intent.startAt)) {
    throw new GraphQLError('Joining is locked after the event start.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
}

/** Reload full intent graph for response mapping. */
function reloadFullIntent(tx: Tx, intentId: string) {
  return tx.intent.findUniqueOrThrow({
    where: { id: intentId },
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
    },
  });
}

/** Emit a generic notification related to an intent. */
async function emitIntentNotification(
  tx: Tx,
  pubsub: MercuriusContext['pubsub'],
  params: {
    kind: PrismaNotificationKind;
    recipientId: string;
    actorId: string | null;
    intentId: string;
    title: string;
    body: string;
    dedupeKey?: string;
    data?: Prisma.InputJsonValue;
  }
) {
  const notif = await tx.notification.create({
    data: {
      kind: params.kind,
      title: params.title,
      body: params.body,
      entityType: PrismaNotificationEntity.INTENT,
      entityId: params.intentId,
      intentId: params.intentId,
      recipientId: params.recipientId,
      actorId: params.actorId,
      data:
        params.data ?? ({ intentId: params.intentId } as Prisma.InputJsonValue),
      ...(params.dedupeKey ? { dedupeKey: params.dedupeKey } : {}),
    },
    include: NOTIFICATION_INCLUDE,
  });

  await pubsub?.publish({
    topic: `NOTIFICATION_ADDED:${notif.recipientId}`,
    payload: { notificationAdded: mapNotification(notif) },
  });
}

/* ----------------------------- Mutations ----------------------------- */

/**
 * joinMember: authenticated user attempts to join an intent.
 * - If capacity allows and policy permits: JOINED.
 * - Otherwise: PENDING (awaiting approval).
 * - Idempotent for existing memberships.
 */
export const joinMemberMutation: MutationResolvers['joinMember'] =
  resolverWithMetrics(
    'Mutation',
    'joinMember',
    async (_p, { intentId }, ctx): Promise<any> => {
      const userId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);

        // Existing membership path (idempotent updates)
        const existing = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (existing) {
          if (existing.status === IntentMemberStatus.JOINED) {
            return reloadFullIntent(tx, intentId);
          }
          await tx.intentMember.update({
            where: { intentId_userId: { intentId, userId } },
            data: {
              status: IntentMemberStatus.PENDING,
              addedById: null,
              note: null,
            },
          });
          return reloadFullIntent(tx, intentId);
        }

        // Policy & capacity
        assertCanJoinNow(intent);
        const joined = await countJoined(tx, intentId);
        const canAutoJoin = joined < intent.max;

        await tx.intentMember.create({
          data: {
            intentId,
            userId,
            role: IntentMemberRole.PARTICIPANT,
            status: canAutoJoin
              ? IntentMemberStatus.JOINED
              : IntentMemberStatus.PENDING,
            joinedAt: canAutoJoin ? new Date() : null,
          },
        });

        // Notify moderators/owner when request is pending
        if (!canAutoJoin) {
          const moderators = intent.members.filter(
            (m) =>
              m.role === IntentMemberRole.OWNER ||
              m.role === IntentMemberRole.MODERATOR
          );
          await Promise.all(
            moderators.map((m) =>
              emitIntentNotification(tx, ctx.pubsub, {
                kind: PrismaNotificationKind.INTENT_UPDATED,
                recipientId: m.userId,
                actorId: userId,
                intentId,
                title: 'Join request received',
                body: 'A user requested to join your intent.',
              })
            )
          );
        }

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

/**
 * inviteMember: moderator/owner invites a user to an intent.
 * - Upserts membership to INVITED (idempotent).
 * - Sends INTENT_INVITE notification to the invitee.
 */
export const inviteIntentMutation: MutationResolvers['inviteMember'] =
  resolverWithMetrics(
    'Mutation',
    'inviteMember',
    async (_p, { input: { intentId, userId } }, ctx): Promise<any> => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);

        if (!isModeratorOrOwner(intent, actorId)) {
          throw new GraphQLError(
            'Forbidden. Moderator or owner role required.',
            {
              extensions: { code: 'FORBIDDEN' },
            }
          );
        }
        if (isOwner(intent, userId)) {
          throw new GraphQLError('Cannot invite the owner.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        const existing = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });

        if (!existing) {
          await tx.intentMember.create({
            data: {
              intentId,
              userId,
              role: IntentMemberRole.PARTICIPANT,
              status: IntentMemberStatus.INVITED,
              addedById: actorId,
            },
          });
        } else if (existing.status !== IntentMemberStatus.INVITED) {
          await tx.intentMember.update({
            where: { intentId_userId: { intentId, userId } },
            data: {
              status: IntentMemberStatus.INVITED,
              addedById: actorId,
              note: null,
            },
          });
        }

        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.INTENT_INVITE,
          recipientId: userId,
          actorId,
          intentId,
          title: 'Invitation to join',
          body: 'You have been invited to join an intent.',
          dedupeKey: `intent_invite:${userId}:${intentId}`,
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

/**
 * requestJoinIntent: alias of joinMember (kept for semantic API).
 */
export const requestJoinIntentMutation: MutationResolvers['requestJoinIntent'] =
  resolverWithMetrics(
    'Mutation',
    'requestJoinIntent',
    async (_p, { intentId }, ctx) => {
      // Delegate to joinMember to keep logic in one place
      return (joinMemberMutation as any).resolve?.(
        undefined,
        { intentId },
        ctx,
        {} as any
      );
    }
  );

/**
 * cancelJoinRequest: user cancels their own PENDING/INVITED membership.
 */
export const cancelJoinRequestMutation: MutationResolvers['cancelJoinRequest'] =
  resolverWithMetrics(
    'Mutation',
    'cancelJoinRequest',
    async (_p, { intentId }, ctx) => {
      const userId = assertAuth(ctx);

      const res = await prisma.intentMember.deleteMany({
        where: {
          intentId,
          userId,
          status: {
            in: [IntentMemberStatus.PENDING, IntentMemberStatus.INVITED],
          },
        },
      });

      return res.count > 0;
    }
  );

/**
 * leaveIntent: user leaves when JOINED (owner cannot leave).
 */
export const leaveIntentMutation: MutationResolvers['leaveIntent'] =
  resolverWithMetrics(
    'Mutation',
    'leaveIntent',
    async (_p, { intentId }, ctx): Promise<any> => {
      const userId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);

        if (isOwner(intent, userId)) {
          throw new GraphQLError(
            'Owner cannot leave the intent. Transfer ownership first.',
            { extensions: { code: 'FAILED_PRECONDITION' } }
          );
        }

        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!member || member.status !== IntentMemberStatus.JOINED) {
          // idempotent
          return reloadFullIntent(tx, intentId);
        }

        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: { status: IntentMemberStatus.LEFT, leftAt: new Date() },
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

/**
 * approveMembership: moderator/owner approves PENDING/INVITED → JOINED.
 * Respects capacity and late-join policy.
 */
export const approveMembershipMutation: MutationResolvers['approveMembership'] =
  resolverWithMetrics(
    'Mutation',
    'approveMembership',
    async (_p, { input: { intentId, userId } }, ctx): Promise<any> => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        if (!isModeratorOrOwner(intent, actorId)) {
          throw new GraphQLError(
            'Forbidden. Moderator or owner role required.',
            {
              extensions: { code: 'FORBIDDEN' },
            }
          );
        }

        assertCanJoinNow(intent);
        const joined = await countJoined(tx, intentId);
        if (joined >= intent.max) {
          throw new GraphQLError(
            'Capacity reached. Cannot approve more members.',
            {
              extensions: { code: 'FAILED_PRECONDITION' },
            }
          );
        }

        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!member) {
          throw new GraphQLError('Membership not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: {
            status: IntentMemberStatus.JOINED,
            joinedAt: new Date(),
            addedById: actorId,
          },
        });

        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.INTENT_MEMBERSHIP_APPROVED,
          recipientId: userId,
          actorId,
          intentId,
          title: 'Membership approved',
          body: 'Your request to join has been approved.',
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

/**
 * rejectMembership: moderator/owner rejects membership → REJECTED.
 */
export const rejectMembershipMutation: MutationResolvers['rejectMembership'] =
  resolverWithMetrics(
    'Mutation',
    'rejectMembership',
    async (_p, { input: { intentId, note, userId } }, ctx): Promise<any> => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        if (!isModeratorOrOwner(intent, actorId)) {
          throw new GraphQLError(
            'Forbidden. Moderator or owner role required.',
            {
              extensions: { code: 'FORBIDDEN' },
            }
          );
        }

        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!member) {
          throw new GraphQLError('Membership not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: { status: IntentMemberStatus.REJECTED, note: note ?? null },
        });

        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.INTENT_MEMBERSHIP_REJECTED,
          recipientId: userId,
          actorId,
          intentId,
          title: 'Membership rejected',
          body: 'Your request to join was rejected.',
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

/**
 * kickMember: moderator/owner removes a JOINED member → KICKED.
 * Cannot kick the OWNER.
 */
export const kickMemberMutation: MutationResolvers['kickMember'] =
  resolverWithMetrics(
    'Mutation',
    'kickMember',
    async (_p, { input: { intentId, note, userId } }, ctx): Promise<any> => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        if (!isModeratorOrOwner(intent, actorId)) {
          throw new GraphQLError(
            'Forbidden. Moderator or owner role required.',
            {
              extensions: { code: 'FORBIDDEN' },
            }
          );
        }
        if (isOwner(intent, userId)) {
          throw new GraphQLError('Cannot kick the owner.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!member || member.status !== IntentMemberStatus.JOINED) {
          // idempotent
          return reloadFullIntent(tx, intentId);
        }

        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: {
            status: IntentMemberStatus.KICKED,
            leftAt: new Date(),
            note: note ?? null,
          },
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

/**
 * updateMemberRole: OWNER can change roles (PARTICIPANT <-> MODERATOR).
 * OWNER cannot be demoted via this mutation.
 */
export const updateMemberRoleMutation: MutationResolvers['updateMemberRole'] =
  resolverWithMetrics(
    'Mutation',
    'updateMemberRole',
    async (_p, { input: { intentId, role, userId } }, ctx): Promise<any> => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        if (!isOwner(intent, actorId)) {
          throw new GraphQLError('Only the owner can change member roles.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        if (isOwner(intent, userId)) {
          throw new GraphQLError(
            'Owner role cannot be changed via this mutation.',
            {
              extensions: { code: 'FAILED_PRECONDITION' },
            }
          );
        }

        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!member) {
          throw new GraphQLError('Membership not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: { role },
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );
