import type { Prisma } from '@prisma/client';
import {
  IntentMemberRole,
  IntentMemberStatus,
  NotificationEntity as PrismaNotificationEntity,
  NotificationKind as PrismaNotificationKind,
  MemberEvent,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { canStillJoin, promoteFromWaitlist } from '../../../lib/waitlist';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapIntent, mapNotification } from '../helpers';

/* ────────────────────────────────────────────────────────────────────────── */
/*                               Includes / types                             */
/* ────────────────────────────────────────────────────────────────────────── */

export const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  intent: {
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
      owner: true,
      canceledBy: true,
      deletedBy: true,
    },
  },
} satisfies Prisma.NotificationInclude;

type Tx = Omit<
  typeof prisma,
  '$extends' | '$transaction' | '$disconnect' | '$connect' | '$on'
>;

/* ────────────────────────────────────────────────────────────────────────── */
/*                               Auth / Roles                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function assertAuth(ctx: MercuriusContext): string {
  if (!ctx.user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user.id;
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

function requireModOrOwner(
  intent: { members: { userId: string; role: IntentMemberRole }[] },
  userId: string
) {
  if (!isModeratorOrOwner(intent, userId)) {
    throw new GraphQLError('Forbidden. Moderator or owner role required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

function requireOwner(
  intent: { members: { userId: string; role: IntentMemberRole }[] },
  userId: string
) {
  if (!isOwner(intent, userId)) {
    throw new GraphQLError('Only the owner can perform this action.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                          Intent loading & guards                            */
/* ────────────────────────────────────────────────────────────────────────── */

async function loadIntentWithMembers(tx: Tx, intentId: string) {
  const intent = await tx.intent.findUnique({
    where: { id: intentId },
    select: {
      id: true,
      // ─ join-window fields (ważne dla evaluateJoinWindow)
      startAt: true,
      endAt: true,
      allowJoinLate: true,
      max: true,
      joinMode: true,
      joinOpensMinutesBeforeStart: true,
      joinCutoffMinutesBeforeStart: true,
      lateJoinCutoffMinutesAfterStart: true,
      joinManuallyClosed: true,
      // ─ pola do guardów read-only
      deletedAt: true,
      canceledAt: true,
      // ─ członkowie do sprawdzania ról/uprawnień
      members: {
        select: {
          userId: true,
          role: true,
          status: true,
          id: true,
          createdAt: true,
          updatedAt: true,
          intentId: true,
          addedById: true,
          joinedAt: true,
          leftAt: true,
          note: true,
        },
      },
    },
  });

  if (!intent) {
    throw new GraphQLError('Intent not found.', {
      extensions: { code: 'NOT_FOUND', field: 'intentId' },
    });
  }
  if (intent.deletedAt) {
    throw new GraphQLError('Intent is deleted.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
  if (intent.canceledAt) {
    throw new GraphQLError('Intent is canceled and read-only.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }

  return intent;
}

function reloadFullIntent(tx: Tx, intentId: string) {
  return tx.intent.findUniqueOrThrow({
    where: { id: intentId },
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
      owner: true,
      canceledBy: true,
      deletedBy: true,
    },
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                          Join window / capacity                             */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @deprecated Use canStillJoin from lib/waitlist instead
 */
function evaluateJoinWindow(intent: {
  startAt: Date;
  endAt: Date;
  allowJoinLate: boolean;
  joinOpensMinutesBeforeStart: number | null;
  joinCutoffMinutesBeforeStart: number | null;
  lateJoinCutoffMinutesAfterStart: number | null;
  joinManuallyClosed: boolean;
}) {
  return canStillJoin({
    ...intent,
    canceledAt: null,
    deletedAt: null,
  });
}

function assertCanJoinNow(intent: Parameters<typeof evaluateJoinWindow>[0]) {
  const { open, reason } = evaluateJoinWindow(intent);
  if (!open) {
    throw new GraphQLError('Joining is locked.', {
      extensions: { code: 'FAILED_PRECONDITION', reason },
    });
  }
}

function isFull(currentJoined: number, max: number) {
  return currentJoined >= max;
}

function countJoined(tx: Tx, intentId: string) {
  return tx.intentMember.count({
    where: { intentId, status: IntentMemberStatus.JOINED },
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                           Status helpers / checks                           */
/* ────────────────────────────────────────────────────────────────────────── */

async function isBanned(tx: Tx, intentId: string, userId: string) {
  const banned = await tx.intentMember.findUnique({
    where: { intentId_userId: { intentId, userId } },
    select: { status: true },
  });
  return banned?.status === IntentMemberStatus.BANNED;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                          Notifications & audit                              */
/* ────────────────────────────────────────────────────────────────────────── */

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
  // If dedupeKey is provided, delete any existing notification with the same key
  // This allows re-sending notifications (e.g., re-inviting after cancellation)
  if (params.dedupeKey) {
    await tx.notification.deleteMany({
      where: {
        recipientId: params.recipientId,
        dedupeKey: params.dedupeKey,
      },
    });
  }

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

async function emitMemberEvent(
  tx: Tx,
  params: {
    intentId: string;
    userId: string; // subject
    actorId?: string | null;
    kind: MemberEvent;
    note?: string | null;
  }
) {
  await tx.intentMemberEvent.create({
    data: {
      intentId: params.intentId,
      userId: params.userId,
      actorId: params.actorId ?? null,
      kind: params.kind,
      note: params.note ?? null,
    },
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                                  Mutations                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export const joinMemberMutation: MutationResolvers['joinMember'] =
  resolverWithMetrics(
    'Mutation',
    'joinMember',
    async (_p, { intentId }, ctx) => {
      const userId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);

        // Ban: twarda blokada
        if (await isBanned(tx, intentId, userId)) {
          throw new GraphQLError('You are banned from this intent.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const existing = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });

        // Po KICKED — tylko zaproszenie od organizatora
        if (existing?.status === IntentMemberStatus.KICKED) {
          throw new GraphQLError(
            'You were removed from this intent. An organizer must invite you to join again.',
            { extensions: { code: 'FAILED_PRECONDITION' } }
          );
        }

        // Już JOINED → idempotentnie zwróć stan
        if (existing?.status === IntentMemberStatus.JOINED) {
          return reloadFullIntent(tx, intentId);
        }

        const joined = await countJoined(tx, intentId);
        const full = isFull(joined, intent.max);

        // Sprawdź okno zapisów (tylko jeśli próbujemy coś zmienić)
        assertCanJoinNow(intent);

        // Reaktywacja istniejącej relacji
        if (existing) {
          // INVITED przez orga → klik usera = join jeśli nie pełny i tryb OPEN; inaczej PENDING
          const shouldBePending = intent.joinMode !== 'OPEN' || full;

          await tx.intentMember.update({
            where: { intentId_userId: { intentId, userId } },
            data: {
              status: shouldBePending
                ? IntentMemberStatus.PENDING
                : IntentMemberStatus.JOINED,
              joinedAt: shouldBePending ? null : new Date(),
              addedById: null,
              note: null,
            },
          });

          // Update joinedCount if member actually joined (not pending)
          if (!shouldBePending) {
            await tx.intent.update({
              where: { id: intentId },
              data: { joinedCount: { increment: 1 } },
            });
          }

          await emitMemberEvent(tx, {
            intentId,
            userId,
            kind: shouldBePending ? MemberEvent.REQUEST : MemberEvent.JOIN,
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
                  kind: PrismaNotificationKind.JOIN_REQUEST,
                  recipientId: m.userId,
                  actorId: userId,
                  intentId,
                  title: 'Join request received',
                  body: 'A user requested to join your intent.',
                  dedupeKey: `join_request:${m.userId}:${intentId}:${userId}`,
                })
              )
            );
          }

          return reloadFullIntent(tx, intentId);
        }

        // Nowe podejście
        const shouldBePending = intent.joinMode !== 'OPEN' || full;

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

        // Update joinedCount if member actually joined (not pending)
        if (!shouldBePending) {
          await tx.intent.update({
            where: { id: intentId },
            data: { joinedCount: { increment: 1 } },
          });
        }

        await emitMemberEvent(tx, {
          intentId,
          userId,
          kind: shouldBePending ? MemberEvent.REQUEST : MemberEvent.JOIN,
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
                kind: PrismaNotificationKind.JOIN_REQUEST,
                recipientId: m.userId,
                actorId: userId,
                intentId,
                title: 'Join request received',
                body: 'A user requested to join your intent.',
                dedupeKey: `join_request:${m.userId}:${intentId}:${userId}`,
              })
            )
          );
        }

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
        if (isFull(joined, intent.max)) {
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

        // Increment joinedCount
        await tx.intent.update({
          where: { id: intentId },
          data: { joinedCount: { increment: 1 } },
        });

        await emitMemberEvent(tx, {
          intentId,
          userId,
          kind: MemberEvent.ACCEPT_INVITE,
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
    async (_p, { input: { intentId, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      if (actorId === userId) {
        throw new GraphQLError('You cannot invite yourself.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        requireModOrOwner(intent, actorId);

        if (isOwner(intent, userId)) {
          throw new GraphQLError('Cannot invite the owner.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        if (await isBanned(tx, intentId, userId)) {
          throw new GraphQLError('User is banned for this intent.', {
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

        await emitMemberEvent(tx, {
          intentId,
          userId,
          actorId,
          kind: MemberEvent.INVITE,
        });

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
      // alias do joinMember - wywołaj bezpośrednio
      return joinMemberMutation(_p, { intentId }, ctx, {} as any);
    }
  );

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

      // (opcjonalnie) event audytowy
      if (res.count > 0) {
        await prisma.intentMemberEvent.create({
          data: {
            intentId,
            userId,
            kind: MemberEvent.REJECT, // semantycznie „wycofanie”; można dodać osobny ENUM jeśli chcesz
          },
        });
      }

      return res.count > 0;
    }
  );

export const leaveIntentMutation: MutationResolvers['leaveIntent'] =
  resolverWithMetrics(
    'Mutation',
    'leaveIntent',
    async (_p, { intentId }, ctx) => {
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

        // Decrement joinedCount
        await tx.intent.update({
          where: { id: intentId },
          data: { joinedCount: { decrement: 1 } },
        });

        await emitMemberEvent(tx, {
          intentId,
          userId,
          kind: MemberEvent.LEAVE,
        });

        // Try to promote someone from waitlist
        await promoteFromWaitlist(tx, intentId);

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

export const approveMembershipMutation: MutationResolvers['approveMembership'] =
  resolverWithMetrics(
    'Mutation',
    'approveMembership',
    async (_p, { input: { intentId, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        requireModOrOwner(intent, actorId);

        if (await isBanned(tx, intentId, userId)) {
          throw new GraphQLError('User is banned for this intent.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!member || member.status !== IntentMemberStatus.PENDING) {
          throw new GraphQLError('No pending membership to approve.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        assertCanJoinNow(intent);
        const joined = await countJoined(tx, intentId);
        const full = isFull(joined, intent.max);

        if (full) {
          // Event is full - move to waitlist instead
          await tx.intentMember.update({
            where: { intentId_userId: { intentId, userId } },
            data: {
              status: IntentMemberStatus.WAITLIST,
              addedById: actorId,
            },
          });

          await emitMemberEvent(tx, {
            intentId,
            userId,
            actorId,
            kind: MemberEvent.APPROVE,
          });

          await emitMemberEvent(tx, {
            intentId,
            userId,
            actorId: null, // System action
            kind: MemberEvent.WAITLIST,
            note: 'Moved to waitlist - event full',
          });

          await emitIntentNotification(tx, ctx.pubsub, {
            kind: PrismaNotificationKind.INTENT_MEMBERSHIP_APPROVED,
            recipientId: userId,
            actorId,
            intentId,
            title: 'Prośba zaakceptowana - lista oczekujących',
            body: `Twoja prośba została zaakceptowana, ale wydarzenie "${intent.title}" jest pełne. Zostałeś dodany do listy oczekujących.`,
            dedupeKey: `membership_approved:${userId}:${intentId}`,
          });

          return reloadFullIntent(tx, intentId);
        }

        // Space available - join directly
        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: {
            status: IntentMemberStatus.JOINED,
            joinedAt: new Date(),
            addedById: actorId,
          },
        });

        // Increment joinedCount
        await tx.intent.update({
          where: { id: intentId },
          data: { joinedCount: { increment: 1 } },
        });

        await emitMemberEvent(tx, {
          intentId,
          userId,
          actorId,
          kind: MemberEvent.APPROVE,
        });

        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.INTENT_MEMBERSHIP_APPROVED,
          recipientId: userId,
          actorId,
          intentId,
          title: 'Membership approved',
          body: 'Your request to join has been approved.',
          dedupeKey: `membership_approved:${userId}:${intentId}`,
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
    async (_p, { input: { intentId, note, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        requireModOrOwner(intent, actorId);

        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!member || member.status !== IntentMemberStatus.PENDING) {
          throw new GraphQLError('No pending membership to reject.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: { status: IntentMemberStatus.REJECTED, note: note ?? null },
        });

        await emitMemberEvent(tx, {
          intentId,
          userId,
          actorId,
          kind: MemberEvent.REJECT,
          note: note ?? null,
        });

        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.INTENT_MEMBERSHIP_REJECTED,
          recipientId: userId,
          actorId,
          intentId,
          title: 'Membership rejected',
          body: 'Your request to join was rejected.',
          dedupeKey: `membership_rejected:${userId}:${intentId}`,
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
    async (_p, { input: { intentId, note, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        requireModOrOwner(intent, actorId);

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

        // Decrement joinedCount
        await tx.intent.update({
          where: { id: intentId },
          data: { joinedCount: { decrement: 1 } },
        });

        await emitMemberEvent(tx, {
          intentId,
          userId,
          actorId,
          kind: MemberEvent.KICK,
          note: note ?? null,
        });

        // Try to promote someone from waitlist
        await promoteFromWaitlist(tx, intentId);

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

export const banMemberMutation: MutationResolvers['banMember'] =
  resolverWithMetrics(
    'Mutation',
    'banIntentMember',
    async (_p, { input: { intentId, userId, note } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        requireModOrOwner(intent, actorId);

        if (isOwner(intent, userId)) {
          throw new GraphQLError('Cannot ban the owner.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        const existing = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });

        // Track if we need to decrement joinedCount (only if user was JOINED)
        const wasJoined = existing?.status === IntentMemberStatus.JOINED;

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

        // Decrement joinedCount if user was JOINED before ban
        if (wasJoined) {
          await tx.intent.update({
            where: { id: intentId },
            data: { joinedCount: { decrement: 1 } },
          });
        }

        await emitMemberEvent(tx, {
          intentId,
          userId,
          actorId,
          kind: MemberEvent.BAN,
          note: note ?? null,
        });

        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.BANNED,
          recipientId: userId,
          actorId,
          intentId,
          title: 'You were banned',
          body: 'You have been banned from this intent.',
          dedupeKey: `banned:${userId}:${intentId}`,
        });

        // Try to promote someone from waitlist if user was joined
        if (wasJoined) {
          await promoteFromWaitlist(tx, intentId);
        }

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

export const unbanMemberMutation: MutationResolvers['unbanMember'] =
  resolverWithMetrics(
    'Mutation',
    'unbanIntentMember',
    async (_p, { input: { intentId, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        requireModOrOwner(intent, actorId);

        const existing = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });
        if (!existing || existing.status !== IntentMemberStatus.BANNED) {
          return reloadFullIntent(tx, intentId);
        }

        // Po unbanie → REJECTED (neutralny stan, user musi złożyć nową prośbę)
        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: { status: IntentMemberStatus.REJECTED, note: null },
        });

        await emitMemberEvent(tx, {
          intentId,
          userId,
          actorId,
          kind: MemberEvent.UNBAN,
        });

        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.UNBANNED,
          recipientId: userId,
          actorId,
          intentId,
          title: 'Ban lifted',
          body: 'You can request to join again.',
          dedupeKey: `unbanned:${userId}:${intentId}`,
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
    async (_p, { input: { intentId, role, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        requireOwner(intent, actorId);

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

        await emitMemberEvent(tx, {
          intentId,
          userId,
          actorId,
          kind:
            role === IntentMemberRole.MODERATOR
              ? MemberEvent.APPROVE
              : MemberEvent.REJECT, // prosty mapping; rozważ dodanie osobnych eventów PROMOTE/DEMOTE
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
      const actorId = assertAuth(ctx);

      // uprawnienia: OWNER/MODERATOR oraz JOINED
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

      const res = await prisma.intentMember.deleteMany({
        where: {
          intentId,
          userId,
          status: {
            in: [
              IntentMemberStatus.PENDING,
              IntentMemberStatus.INVITED,
              IntentMemberStatus.REJECTED,
            ],
          },
        },
      });

      if (res.count > 0) {
        await prisma.intentMemberEvent.create({
          data: {
            intentId,
            userId,
            actorId,
            kind: MemberEvent.REJECT, // „odwołanie zaproszenia/pendingu" – możesz dodać osobny enum CANCEL_PENDING
          },
        });
      }

      return res.count > 0;
    }
  );

/* ────────────────────────────────────────────────────────────────────────── */
/*                            Waitlist Mutations                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Join waitlist for OPEN mode events when full.
 * User explicitly requests to be added to the waiting list.
 */
export const joinWaitlistOpenMutation: MutationResolvers['joinWaitlistOpen'] =
  resolverWithMetrics(
    'Mutation',
    'joinWaitlistOpen',
    async (_p, { intentId }, ctx) => {
      const userId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);

        // Only OPEN mode supports direct waitlist join
        if (intent.joinMode !== 'OPEN') {
          throw new GraphQLError(
            'Waitlist join is only available for OPEN events.',
            { extensions: { code: 'FAILED_PRECONDITION' } }
          );
        }

        // Check if banned
        if (await isBanned(tx, intentId, userId)) {
          throw new GraphQLError('You are banned from this intent.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Check join window
        assertCanJoinNow(intent);

        const existing = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });

        // Already joined
        if (existing?.status === IntentMemberStatus.JOINED) {
          throw new GraphQLError('You are already a participant.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        // Already on waitlist
        if (existing?.status === IntentMemberStatus.WAITLIST) {
          return reloadFullIntent(tx, intentId);
        }

        // Check if event is full
        const joined = await countJoined(tx, intentId);
        if (!isFull(joined, intent.max)) {
          throw new GraphQLError('Event is not full. Use joinMember instead.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        // Create or update membership to WAITLIST
        if (existing) {
          await tx.intentMember.update({
            where: { intentId_userId: { intentId, userId } },
            data: {
              status: IntentMemberStatus.WAITLIST,
              createdAt: new Date(), // Reset to end of queue
            },
          });
        } else {
          await tx.intentMember.create({
            data: {
              intentId,
              userId,
              role: IntentMemberRole.PARTICIPANT,
              status: IntentMemberStatus.WAITLIST,
            },
          });
        }

        await emitMemberEvent(tx, {
          intentId,
          userId,
          kind: MemberEvent.WAITLIST,
        });

        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.WAITLIST_JOINED,
          recipientId: userId,
          actorId: null,
          intentId,
          title: 'Dołączyłeś do listy oczekujących',
          body: `Wydarzenie "${intent.title}" jest pełne. Powiadomimy Cię, jeśli zwolni się miejsce.`,
          dedupeKey: `waitlist_joined:${userId}:${intentId}`,
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );

/**
 * Leave waitlist - user removes themselves from waiting list
 */
export const leaveWaitlistMutation: MutationResolvers['leaveWaitlist'] =
  resolverWithMetrics(
    'Mutation',
    'leaveWaitlist',
    async (_p, { intentId }, ctx) => {
      const userId = assertAuth(ctx);

      await prisma.$transaction(async (tx) => {
        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });

        if (!member || member.status !== IntentMemberStatus.WAITLIST) {
          throw new GraphQLError('You are not on the waitlist.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: {
            status: IntentMemberStatus.CANCELLED,
          },
        });

        await emitMemberEvent(tx, {
          intentId,
          userId,
          kind: MemberEvent.WAITLIST_LEAVE,
        });
      });

      return true;
    }
  );

/**
 * Manually promote a user from waitlist to joined (host/mod action)
 */
export const promoteFromWaitlistMutation: MutationResolvers['promoteFromWaitlist'] =
  resolverWithMetrics(
    'Mutation',
    'promoteFromWaitlist',
    async (_p, { input: { intentId, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const intent = await loadIntentWithMembers(tx, intentId);
        requireModOrOwner(intent, actorId);

        const member = await tx.intentMember.findUnique({
          where: { intentId_userId: { intentId, userId } },
        });

        if (!member || member.status !== IntentMemberStatus.WAITLIST) {
          throw new GraphQLError('User is not on the waitlist.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        // Check join window
        assertCanJoinNow(intent);

        // Check capacity with optimistic locking
        const updated = await tx.intent.updateMany({
          where: {
            id: intentId,
            joinedCount: { lt: intent.max },
          },
          data: { joinedCount: { increment: 1 } },
        });

        if (updated.count === 0) {
          throw new GraphQLError('Event is full. Cannot promote.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        // Promote user
        await tx.intentMember.update({
          where: { intentId_userId: { intentId, userId } },
          data: {
            status: IntentMemberStatus.JOINED,
            joinedAt: new Date(),
            addedById: actorId,
          },
        });

        await emitMemberEvent(tx, {
          intentId,
          userId,
          actorId,
          kind: MemberEvent.WAITLIST_PROMOTE,
          note: 'Manually promoted by moderator',
        });

        await emitIntentNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.WAITLIST_PROMOTED,
          recipientId: userId,
          actorId,
          intentId,
          title: 'Zostałeś dodany do wydarzenia!',
          body: `Organizator dodał Cię do wydarzenia "${intent.title}" z listy oczekujących.`,
          dedupeKey: `waitlist_promoted:${userId}:${intentId}`,
        });

        return reloadFullIntent(tx, intentId);
      });

      return mapIntent(result);
    }
  );
