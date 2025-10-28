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
      canceledBy: true,
      deletedBy: true,
    },
  },
} satisfies Prisma.NotificationInclude;

type Tx = Omit<
  typeof prisma,
  '$extends' | '$transaction' | '$disconnect' | '$connect' | '$on'
>;

function assertAuth(ctx: MercuriusContext): string {
  if (!ctx.user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user.id;
}

async function isBanned(tx: Tx, intentId: string, userId: string) {
  const banned = await tx.intentMember.findUnique({
    where: { intentId_userId: { intentId, userId } },
    select: { status: true },
  });
  return banned?.status === IntentMemberStatus.BANNED;
}

async function loadIntentWithMembers(tx: Tx, intentId: string) {
  const intent = await tx.intent.findUnique({
    where: { id: intentId },
    include: {
      members: true,
    },
  });
  if (!intent) {
    throw new GraphQLError('Intent not found.', {
      extensions: { code: 'NOT_FOUND', field: 'intentId' },
    });
  }
  // READ-ONLY: zablokuj każdą mutację członkowską dla canceled/deleted
  if ((intent as any).deletedAt) {
    throw new GraphQLError('Intent is deleted.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
  if ((intent as any).canceledAt) {
    throw new GraphQLError('Intent is canceled and read-only.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
  return intent;
}

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

function isOwner(
  intent: { members: { userId: string; role: IntentMemberRole }[] },
  userId: string
) {
  return intent.members.some(
    (m) => m.userId === userId && m.role === IntentMemberRole.OWNER
  );
}

function countJoined(tx: Tx, intentId: string) {
  return tx.intentMember.count({
    where: { intentId, status: IntentMemberStatus.JOINED },
  });
}

function assertCanJoinNow(intent: { allowJoinLate: boolean; startAt: Date }) {
  const now = new Date();
  if (!intent.allowJoinLate && now >= new Date(intent.startAt)) {
    throw new GraphQLError('Joining is locked after the event start.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
}

function reloadFullIntent(tx: Tx, intentId: string) {
  return tx.intent.findUniqueOrThrow({
    where: { id: intentId },
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
      canceledBy: true,
      deletedBy: true,
    },
  });
}

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

export const joinMemberMutation: MutationResolvers['joinMember'] =
  resolverWithMetrics(
    'Mutation',
    'joinMember',
    async (_p, { intentId }, ctx) => {
      const userId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);

        if (await isBanned(tx, intentId, userId)) {
          throw new GraphQLError('You are banned from this intent.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const existing = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (existing) {
          if (existing.status === IntentMemberStatus.JOINED) {
            return reloadFullIntent(tx, intentId);
          }
          // reaktywacja wniosku: INVITED/PENDING ⇒ PENDING (user prosi o dołączenie)
          await tx.intentMember.update({
            where: { intentId_userId: { intentId, userId } },
            data: {
              status: intent.requiresApproval
                ? IntentMemberStatus.PENDING
                : IntentMemberStatus.JOINED,
              joinedAt: intent.requiresApproval ? null : new Date(),
              addedById: null,
              note: null,
            },
          });
          return reloadFullIntent(tx, intentId);
        }

        assertCanJoinNow(intent);
        const joined = await countJoined(tx, intentId);

        const isFull = joined >= intent.max;
        const shouldBePending = intent.requiresApproval || isFull;

        await tx.intentMember.create({
          data: {
            intentId,
            userId,
            role: IntentMemberRole.PARTICIPANT,
            status: shouldBePending
              ? IntentMemberStatus.PENDING
              : IntentMemberStatus.JOINED,
            joinedAt: shouldBePending ? null : new Date(),
          },
        });

        if (shouldBePending) {
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

export const banIntentMemberMutation: MutationResolvers['banIntentMember'] =
  resolverWithMetrics(
    'Mutation',
    'banIntentMember',
    async (_p, { intentId, userId, note }, ctx): Promise<any> => {
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
          throw new GraphQLError('Cannot ban the owner.', {
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
              status: IntentMemberStatus.BANNED,
              note: note ?? null,
            },
          });
        } else if (existing.status !== IntentMemberStatus.BANNED) {
          await tx.intentMember.update({
            where: { intentId_userId: { intentId, userId } },
            data: {
              status: IntentMemberStatus.BANNED,
              leftAt: new Date(),
              note: note ?? null,
            },
          });
        }

        // (opcjonalnie) notyfikacja o banie:
        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.SYSTEM, // albo nowy enum INTENT_MEMBERSHIP_BANNED
          recipientId: userId,
          actorId,
          intentId,
          title: 'You were banned',
          body: 'You have been banned from this intent.',
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

export const unbanIntentMemberMutation: MutationResolvers['unbanIntentMember'] =
  resolverWithMetrics(
    'Mutation',
    'unbanIntentMember',
    async (_p, { intentId, userId }, ctx): Promise<any> => {
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

        const existing = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!existing || existing.status !== IntentMemberStatus.BANNED) {
          return reloadFullIntent(tx, intentId);
        }

        // Neutralny stan po unbanie — zwykle REJECTED (żeby join wymagał nowej akcji usera)
        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: { status: IntentMemberStatus.REJECTED, note: null },
        });

        // (opcjonalnie) notyfikacja o unbanie:
        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.SYSTEM, // albo INTENT_MEMBERSHIP_UNBANNED
          recipientId: userId,
          actorId,
          intentId,
          title: 'Ban lifted',
          body: 'You can request to join again.',
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

export const acceptInviteMutation: MutationResolvers['acceptInvite'] =
  resolverWithMetrics(
    'Mutation',
    'acceptInvite',
    async (_p, { intentId }, ctx) => {
      const userId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);

        if (await isBanned(tx, intentId, userId)) {
          throw new GraphQLError('You are banned from this intent.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!member || member.status !== IntentMemberStatus.INVITED) {
          throw new GraphQLError('No pending invite to accept.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        assertCanJoinNow(intent);
        const joined = await countJoined(tx, intentId);
        if (joined >= intent.max) {
          throw new GraphQLError('Capacity reached. Cannot join now.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: {
            status: IntentMemberStatus.JOINED,
            joinedAt: new Date(),
          },
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

export const inviteMemberMutation: MutationResolvers['inviteMember'] =
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
            { extensions: { code: 'FORBIDDEN' } }
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

        if (await isBanned(tx, intentId, userId)) {
          throw new GraphQLError('User is banned for this intent.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

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

export const requestJoinIntentMutation: MutationResolvers['requestJoinIntent'] =
  resolverWithMetrics(
    'Mutation',
    'requestJoinIntent',
    async (_p, { intentId }, ctx) => {
      return (joinMemberMutation as any).resolve?.(
        undefined,
        { intentId },
        ctx,
        {} as any
      );
    }
  );

export const cancelJoinRequestMutation: MutationResolvers['cancelJoinRequest'] =
  resolverWithMetrics(
    'Mutation',
    'cancelJoinRequest',
    async (_p, { intentId }, ctx) => {
      const userId = assertAuth(ctx);

      // Jeśli intent jest read-only, nie musimy rzucać — usuwamy swoją prośbę.
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

export const approveMembershipMutation: MutationResolvers['approveMembership'] =
  resolverWithMetrics(
    'Mutation',
    'approveMembership',
    async (_p, { input: { intentId, userId } }, ctx): Promise<any> => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);

        if (await isBanned(tx, intentId, userId)) {
          throw new GraphQLError('User is banned for this intent.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        if (!isModeratorOrOwner(intent, actorId)) {
          throw new GraphQLError(
            'Forbidden. Moderator or owner role required.',
            { extensions: { code: 'FORBIDDEN' } }
          );
        }

        assertCanJoinNow(intent);
        const joined = await countJoined(tx, intentId);
        if (joined >= intent.max) {
          throw new GraphQLError(
            'Capacity reached. Cannot approve more members.',
            { extensions: { code: 'FAILED_PRECONDITION' } }
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
            { extensions: { code: 'FORBIDDEN' } }
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
            { extensions: { code: 'FORBIDDEN' } }
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
            { extensions: { code: 'FAILED_PRECONDITION' } }
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
export const cancelPendingOrInviteForUserMutation: MutationResolvers['cancelPendingOrInviteForUser'] =
  resolverWithMetrics(
    'Mutation',
    'cancelPendingOrInviteForUser',
    async (_p, { input: { intentId, userId } }, ctx) => {
      const actorId = ctx.user?.id;
      if (!actorId) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check permissions: actor must be OWNER or MODERATOR and JOINED in this intent
      const actorMembership = await prisma.intentMember.findUnique({
        where: { intentId_userId: { intentId, userId: actorId } },
        select: { role: true, status: true },
      });

      if (
        !actorMembership ||
        actorMembership.status !== IntentMemberStatus.JOINED ||
        (actorMembership.role !== IntentMemberRole.OWNER &&
          actorMembership.role !== IntentMemberRole.MODERATOR)
      ) {
        throw new GraphQLError(
          'Forbidden. Moderator or owner role required for this action.',
          { extensions: { code: 'FORBIDDEN' } }
        );
      }

      // Remove the target user's PENDING or INVITED membership (if any)
      const res = await prisma.intentMember.deleteMany({
        where: {
          intentId,
          userId,
          status: {
            in: [IntentMemberStatus.PENDING, IntentMemberStatus.INVITED],
          },
        },
      });

      // Optional: you could emit a notification here if needed
      // (np. INTENT_UPDATED do właściciela / użytkownika)
      // Pomijamy, bo mutacja zwraca tylko Boolean.

      return res.count > 0;
    }
  );
