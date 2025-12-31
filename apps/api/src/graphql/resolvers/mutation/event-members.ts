import type { Prisma } from '../../../prisma-client/client';
import {
  EventMemberRole,
  EventMemberStatus,
  NotificationEntity as PrismaNotificationEntity,
  NotificationKind as PrismaNotificationKind,
  MemberEvent,
} from '../../../prisma-client/enums';
import { GraphQLError, GraphQLResolveInfo } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { canStillJoin, promoteFromWaitlist } from '../../../lib/waitlist';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapEvent, mapNotification } from '../helpers';
import { isAdminOrModerator, isAdmin } from '../shared/auth-guards';
import { assertEventWriteRateLimit } from '../../../lib/rate-limit/domainRateLimiter';
import { createAuditLog, type CreateAuditLogInput } from '../../../lib/audit';

// Temporary type aliases until prisma generate is run
type AuditScope = CreateAuditLogInput['scope'];
type AuditAction = CreateAuditLogInput['action'];

/* ────────────────────────────────────────────────────────────────────────── */
/*                               Includes / types                             */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Notification include for event member notifications.
 */
const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  event: {
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
  event: { members: { userId: string; role: EventMemberRole }[] },
  userId: string
) {
  return event.members.some(
    (m) =>
      m.userId === userId &&
      (m.role === EventMemberRole.OWNER || m.role === EventMemberRole.MODERATOR)
  );
}

function isOwner(
  event: { members: { userId: string; role: EventMemberRole }[] },
  userId: string
) {
  return event.members.some(
    (m) => m.userId === userId && m.role === EventMemberRole.OWNER
  );
}

/**
 * Require EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN.
 * Global ADMIN/MODERATOR always have access.
 */
function requireModOrOwner(
  event: { members: { userId: string; role: EventMemberRole }[] },
  userId: string,
  ctx: MercuriusContext
) {
  // Global ADMIN or MODERATOR always has access
  if (isAdminOrModerator(ctx.user)) {
    return;
  }
  if (!isModeratorOrOwner(event, userId)) {
    throw new GraphQLError('Forbidden. Moderator or owner role required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Require EVENT_OWNER or ADMIN_ONLY.
 * Global ADMIN always has OWNER privileges.
 * Global MODERATOR does NOT have OWNER privileges.
 */
function requireOwner(
  event: { members: { userId: string; role: EventMemberRole }[] },
  userId: string,
  ctx: MercuriusContext
) {
  // Global ADMIN always has access
  if (isAdmin(ctx.user)) {
    return;
  }
  if (!isOwner(event, userId)) {
    throw new GraphQLError('Only the owner can perform this action.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                          Event loading & guards                            */
/* ────────────────────────────────────────────────────────────────────────── */

async function loadEventWithMembers(tx: Tx, eventId: string) {
  const event = await tx.event.findUnique({
    where: { id: eventId },
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
          eventId: true,
          addedById: true,
          joinedAt: true,
          leftAt: true,
          note: true,
        },
      },
    },
  });

  if (!event) {
    throw new GraphQLError('Event not found.', {
      extensions: { code: 'NOT_FOUND', field: 'eventId' },
    });
  }
  if (event.deletedAt) {
    throw new GraphQLError('Event is deleted.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }
  if (event.canceledAt) {
    throw new GraphQLError('Event is canceled and read-only.', {
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  }

  return event;
}

function reloadFullEvent(tx: Tx, eventId: string) {
  return tx.event.findUniqueOrThrow({
    where: { id: eventId },
    include: {
      categories: true,
      tags: true,
      members: {
        include: {
          user: { include: { profile: true } },
          addedBy: { include: { profile: true } },
        },
      },
      owner: { include: { profile: true } },
      canceledBy: { include: { profile: true } },
      deletedBy: { include: { profile: true } },
      sponsorship: {
        include: {
          sponsor: { include: { profile: true } },
        },
      },
    },
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                          Join window / capacity                             */
/* ────────────────────────────────────────────────────────────────────────── */

function assertCanJoinNow(event: {
  startAt: Date;
  endAt: Date;
  allowJoinLate: boolean;
  joinOpensMinutesBeforeStart: number | null;
  joinCutoffMinutesBeforeStart: number | null;
  lateJoinCutoffMinutesAfterStart: number | null;
  joinManuallyClosed: boolean;
}) {
  const { open, reason } = canStillJoin({
    ...event,
    canceledAt: null,
    deletedAt: null,
  });
  if (!open) {
    throw new GraphQLError('Joining is locked.', {
      extensions: { code: 'FAILED_PRECONDITION', reason },
    });
  }
}

function isFull(currentJoined: number, max: number | null) {
  // If max is null, event has unlimited capacity
  if (max === null) return false;
  return currentJoined >= max;
}

function countJoined(tx: Tx, eventId: string) {
  return tx.eventMember.count({
    where: { eventId, status: EventMemberStatus.JOINED },
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                           Status helpers / checks                           */
/* ────────────────────────────────────────────────────────────────────────── */

async function isBanned(tx: Tx, eventId: string, userId: string) {
  const banned = await tx.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { status: true },
  });
  return banned?.status === EventMemberStatus.BANNED;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                          Notifications & audit                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Emit an event-related notification with proper data for i18n interpolation.
 *
 * The `data` field should contain all variables needed for frontend translation:
 * - eventId, eventTitle: for event context
 * - actorName: for "who did this" context
 * - reason, note: for rejection/kick/ban messages
 * - newRole: for role change notifications
 * - rating: for review/feedback notifications
 * - preview: for message previews
 *
 * Title and body are stored for backward compatibility but frontend should
 * use kind + data for localized rendering.
 */
async function emitEventNotification(
  tx: Tx,
  pubsub: MercuriusContext['pubsub'],
  params: {
    kind: PrismaNotificationKind;
    recipientId: string;
    actorId: string | null;
    eventId: string;
    dedupeKey?: string;
    /** Data for i18n interpolation - will be merged with auto-fetched data */
    data?: Record<string, unknown>;
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

  // Fetch event title for interpolation
  const event = await tx.event.findUnique({
    where: { id: params.eventId },
    select: { title: true },
  });

  // Fetch actor name for interpolation
  let actorName: string | undefined;
  if (params.actorId) {
    const actor = await tx.user.findUnique({
      where: { id: params.actorId },
      select: { name: true },
    });
    actorName = actor?.name || undefined;
  }

  // Build data object for i18n interpolation
  const notificationData: Record<string, unknown> = {
    eventId: params.eventId,
    eventTitle: event?.title || undefined,
    actorName,
    ...(params.data || {}),
  };

  const notif = await tx.notification.create({
    data: {
      kind: params.kind,
      // Title and body are now optional - frontend uses kind + data for i18n
      title: null,
      body: null,
      entityType: PrismaNotificationEntity.EVENT,
      entityId: params.eventId,
      eventId: params.eventId,
      recipientId: params.recipientId,
      actorId: params.actorId,
      data: notificationData as Prisma.InputJsonValue,
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
    eventId: string;
    userId: string; // subject
    actorId?: string | null;
    kind: MemberEvent;
    note?: string | null;
  }
) {
  await tx.eventMemberEvent.create({
    data: {
      eventId: params.eventId,
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
    async (_p, { eventId }, ctx) => {
      const userId = assertAuth(ctx);

      // RATE LIMIT: Prevent join spam
      await assertEventWriteRateLimit(userId);

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);

        // Ban: twarda blokada
        if (await isBanned(tx, eventId, userId)) {
          throw new GraphQLError('You are banned from this event.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const existing = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });

        // Po KICKED — tylko zaproszenie od organizatora
        if (existing?.status === EventMemberStatus.KICKED) {
          throw new GraphQLError(
            'You were removed from this event. An organizer must invite you to join again.',
            { extensions: { code: 'FAILED_PRECONDITION' } }
          );
        }

        // Już JOINED → idempotentnie zwróć stan
        if (existing?.status === EventMemberStatus.JOINED) {
          return reloadFullEvent(tx, eventId);
        }

        const joined = await countJoined(tx, eventId);
        const full = isFull(joined, event.max);

        // Sprawdź okno zapisów (tylko jeśli próbujemy coś zmienić)
        assertCanJoinNow(event);

        // Reaktywacja istniejącej relacji
        if (existing) {
          // INVITED przez orga → klik usera = join jeśli nie pełny i tryb OPEN; inaczej PENDING
          const shouldBePending = event.joinMode !== 'OPEN' || full;

          await tx.eventMember.update({
            where: { eventId_userId: { eventId, userId } },
            data: {
              status: shouldBePending
                ? EventMemberStatus.PENDING
                : EventMemberStatus.JOINED,
              joinedAt: shouldBePending ? null : new Date(),
              addedById: null,
              note: null,
            },
          });

          // Update joinedCount if member actually joined (not pending)
          if (!shouldBePending) {
            await tx.event.update({
              where: { id: eventId },
              data: { joinedCount: { increment: 1 } },
            });
          }

          await emitMemberEvent(tx, {
            eventId,
            userId,
            kind: shouldBePending ? MemberEvent.REQUEST : MemberEvent.JOIN,
          });

          if (shouldBePending) {
            const moderators = event.members.filter(
              (m) =>
                m.role === EventMemberRole.OWNER ||
                m.role === EventMemberRole.MODERATOR
            );
            await Promise.all(
              moderators.map((m) =>
                emitEventNotification(tx, ctx.pubsub, {
                  kind: PrismaNotificationKind.JOIN_REQUEST,
                  recipientId: m.userId,
                  actorId: userId,
                  eventId,
                  dedupeKey: `join_request:${m.userId}:${eventId}:${userId}`,
                })
              )
            );
          }

          return reloadFullEvent(tx, eventId);
        }

        // Nowe podejście
        const shouldBePending = event.joinMode !== 'OPEN' || full;

        await tx.eventMember.create({
          data: {
            eventId,
            userId,
            role: EventMemberRole.PARTICIPANT,
            status: shouldBePending
              ? EventMemberStatus.PENDING
              : EventMemberStatus.JOINED,
            joinedAt: shouldBePending ? null : new Date(),
          },
        });

        // Update joinedCount if member actually joined (not pending)
        if (!shouldBePending) {
          await tx.event.update({
            where: { id: eventId },
            data: { joinedCount: { increment: 1 } },
          });
        }

        await emitMemberEvent(tx, {
          eventId,
          userId,
          kind: shouldBePending ? MemberEvent.REQUEST : MemberEvent.JOIN,
        });

        if (shouldBePending) {
          const moderators = event.members.filter(
            (m) =>
              m.role === EventMemberRole.OWNER ||
              m.role === EventMemberRole.MODERATOR
          );
          await Promise.all(
            moderators.map((m) =>
              emitEventNotification(tx, ctx.pubsub, {
                kind: PrismaNotificationKind.JOIN_REQUEST,
                recipientId: m.userId,
                actorId: userId,
                eventId,
                dedupeKey: `join_request:${m.userId}:${eventId}:${userId}`,
              })
            )
          );
        }

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

export const acceptInviteMutation: MutationResolvers['acceptInvite'] =
  resolverWithMetrics(
    'Mutation',
    'acceptInvite',
    async (_p, { eventId }, ctx) => {
      const userId = assertAuth(ctx);
      const { pubsub } = ctx;

      // RATE LIMIT: Prevent accept spam
      await assertEventWriteRateLimit(userId);

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);

        if (await isBanned(tx, eventId, userId)) {
          throw new GraphQLError('You are banned from this event.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const member = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });
        if (!member || member.status !== EventMemberStatus.INVITED) {
          throw new GraphQLError('No pending invite to accept.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        assertCanJoinNow(event);
        const joined = await countJoined(tx, eventId);
        if (isFull(joined, event.max)) {
          throw new GraphQLError('Capacity reached. Cannot join now.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        await tx.eventMember.update({
          where: { eventId_userId: { eventId, userId } },
          data: {
            status: EventMemberStatus.JOINED,
            joinedAt: new Date(),
          },
        });

        // Increment joinedCount
        await tx.event.update({
          where: { id: eventId },
          data: { joinedCount: { increment: 1 } },
        });

        await emitMemberEvent(tx, {
          eventId,
          userId,
          kind: MemberEvent.ACCEPT_INVITE,
        });

        // Notify owner and moderators that the invite was accepted
        const moderators = event.members.filter(
          (m) =>
            m.role === EventMemberRole.OWNER ||
            m.role === EventMemberRole.MODERATOR
        );
        for (const m of moderators) {
          await emitEventNotification(tx, pubsub, {
            kind: PrismaNotificationKind.EVENT_INVITE_ACCEPTED,
            recipientId: m.userId,
            actorId: userId,
            eventId,
            dedupeKey: `invite_accepted:${userId}:${eventId}:${m.userId}`,
          });
        }

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

export const inviteMemberMutation: MutationResolvers['inviteMember'] =
  resolverWithMetrics(
    'Mutation',
    'inviteMember',
    async (_p, { input: { eventId, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      if (actorId === userId) {
        throw new GraphQLError('You cannot invite yourself.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);
        requireModOrOwner(event, actorId, ctx);

        if (isOwner(event, userId)) {
          throw new GraphQLError('Cannot invite the owner.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        if (await isBanned(tx, eventId, userId)) {
          throw new GraphQLError('User is banned for this event.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        const existing = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });

        if (!existing) {
          await tx.eventMember.create({
            data: {
              eventId,
              userId,
              role: EventMemberRole.PARTICIPANT,
              status: EventMemberStatus.INVITED,
              addedById: actorId,
            },
          });
        } else if (existing.status !== EventMemberStatus.INVITED) {
          await tx.eventMember.update({
            where: { eventId_userId: { eventId, userId } },
            data: {
              status: EventMemberStatus.INVITED,
              addedById: actorId,
              note: null,
            },
          });
        }

        await emitMemberEvent(tx, {
          eventId,
          userId,
          actorId,
          kind: MemberEvent.INVITE,
        });

        await emitEventNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.EVENT_INVITE,
          recipientId: userId,
          actorId,
          eventId,
          dedupeKey: `event_invite:${userId}:${eventId}`,
        });

        // Audit log: MEMBER/INVITE (severity 3)
        await createAuditLog(tx, {
          eventId,
          actorId,
          actorRole:
            event.members.find((m) => m.userId === actorId)?.role ?? null,
          scope: 'MEMBER' as AuditScope,
          action: 'INVITE' as AuditAction,
          entityType: 'EventMember',
          entityId: userId,
          meta: { targetUserId: userId, invitedBy: actorId },
          severity: 3,
        });

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

export const requestJoinEventMutation: MutationResolvers['requestJoinEvent'] =
  resolverWithMetrics(
    'Mutation',
    'requestJoinEvent',
    async (_p, { eventId }, ctx) => {
      // alias do joinMember - wywołaj bezpośrednio
      return joinMemberMutation(_p, { eventId }, ctx, {} as GraphQLResolveInfo);
    }
  );

export const cancelJoinRequestMutation: MutationResolvers['cancelJoinRequest'] =
  resolverWithMetrics(
    'Mutation',
    'cancelJoinRequest',
    async (_p, { eventId }, ctx) => {
      const userId = assertAuth(ctx);

      const res = await prisma.eventMember.deleteMany({
        where: {
          eventId,
          userId,
          status: {
            in: [EventMemberStatus.PENDING, EventMemberStatus.INVITED],
          },
        },
      });

      // (opcjonalnie) event audytowy
      if (res.count > 0) {
        await prisma.eventMemberEvent.create({
          data: {
            eventId,
            userId,
            kind: MemberEvent.REJECT, // semantycznie „wycofanie”; można dodać osobny ENUM jeśli chcesz
          },
        });
      }

      return res.count > 0;
    }
  );

export const leaveEventMutation: MutationResolvers['leaveEvent'] =
  resolverWithMetrics(
    'Mutation',
    'leaveEvent',
    async (_p, { eventId }, ctx) => {
      const userId = assertAuth(ctx);

      // RATE LIMIT: Prevent leave spam
      await assertEventWriteRateLimit(userId);

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);

        if (isOwner(event, userId)) {
          throw new GraphQLError(
            'Owner cannot leave the event. Transfer ownership first.',
            { extensions: { code: 'FAILED_PRECONDITION' } }
          );
        }

        const member = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });
        if (!member || member.status !== EventMemberStatus.JOINED) {
          return reloadFullEvent(tx, eventId);
        }

        await tx.eventMember.update({
          where: { eventId_userId: { eventId, userId } },
          data: { status: EventMemberStatus.LEFT, leftAt: new Date() },
        });

        // Decrement joinedCount
        await tx.event.update({
          where: { id: eventId },
          data: { joinedCount: { decrement: 1 } },
        });

        await emitMemberEvent(tx, {
          eventId,
          userId,
          kind: MemberEvent.LEAVE,
        });

        // Try to promote someone from waitlist
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await promoteFromWaitlist(tx as any, eventId);

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

export const approveMembershipMutation: MutationResolvers['approveMembership'] =
  resolverWithMetrics(
    'Mutation',
    'approveMembership',
    async (_p, { input: { eventId, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);
        requireModOrOwner(event, actorId, ctx);

        if (await isBanned(tx, eventId, userId)) {
          throw new GraphQLError('User is banned for this event.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        const member = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });
        if (!member || member.status !== EventMemberStatus.PENDING) {
          throw new GraphQLError('No pending membership to approve.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        assertCanJoinNow(event);
        const joined = await countJoined(tx, eventId);
        const full = isFull(joined, event.max);

        if (full) {
          // Event is full - move to waitlist instead
          await tx.eventMember.update({
            where: { eventId_userId: { eventId, userId } },
            data: {
              status: EventMemberStatus.WAITLIST,
              addedById: actorId,
            },
          });

          await emitMemberEvent(tx, {
            eventId,
            userId,
            actorId,
            kind: MemberEvent.APPROVE,
          });

          await emitMemberEvent(tx, {
            eventId,
            userId,
            actorId: null, // System action
            kind: MemberEvent.WAITLIST,
            note: 'Moved to waitlist - event full',
          });

          await emitEventNotification(tx, ctx.pubsub, {
            kind: PrismaNotificationKind.EVENT_MEMBERSHIP_APPROVED,
            recipientId: userId,
            actorId,
            eventId,
            dedupeKey: `membership_approved:${userId}:${eventId}`,
            data: { addedToWaitlist: true },
          });

          return reloadFullEvent(tx, eventId);
        }

        // Space available - join directly
        await tx.eventMember.update({
          where: { eventId_userId: { eventId, userId } },
          data: {
            status: EventMemberStatus.JOINED,
            joinedAt: new Date(),
            addedById: actorId,
          },
        });

        // Increment joinedCount
        await tx.event.update({
          where: { id: eventId },
          data: { joinedCount: { increment: 1 } },
        });

        await emitMemberEvent(tx, {
          eventId,
          userId,
          actorId,
          kind: MemberEvent.APPROVE,
        });

        await emitEventNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.EVENT_MEMBERSHIP_APPROVED,
          recipientId: userId,
          actorId,
          eventId,
          dedupeKey: `membership_approved:${userId}:${eventId}`,
        });

        // Audit log: MEMBER/APPROVE (severity 3)
        await createAuditLog(tx, {
          eventId,
          actorId,
          actorRole:
            event.members.find((m) => m.userId === actorId)?.role ?? null,
          scope: 'MEMBER' as AuditScope,
          action: 'APPROVE' as AuditAction,
          entityType: 'EventMember',
          entityId: userId,
          meta: { targetUserId: userId },
          severity: 3,
        });

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

export const rejectMembershipMutation: MutationResolvers['rejectMembership'] =
  resolverWithMetrics(
    'Mutation',
    'rejectMembership',
    async (_p, { input: { eventId, note, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);
        requireModOrOwner(event, actorId, ctx);

        const member = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });
        if (!member || member.status !== EventMemberStatus.PENDING) {
          throw new GraphQLError('No pending membership to reject.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        await tx.eventMember.update({
          where: { eventId_userId: { eventId, userId } },
          data: { status: EventMemberStatus.REJECTED, note: note ?? null },
        });

        await emitMemberEvent(tx, {
          eventId,
          userId,
          actorId,
          kind: MemberEvent.REJECT,
          note: note ?? null,
        });

        await emitEventNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.EVENT_MEMBERSHIP_REJECTED,
          recipientId: userId,
          actorId,
          eventId,
          dedupeKey: `membership_rejected:${userId}:${eventId}`,
          data: { reason: note || undefined },
        });

        // Audit log: MEMBER/REJECT (severity 3)
        await createAuditLog(tx, {
          eventId,
          actorId,
          actorRole:
            event.members.find((m) => m.userId === actorId)?.role ?? null,
          scope: 'MEMBER' as AuditScope,
          action: 'REJECT' as AuditAction,
          entityType: 'EventMember',
          entityId: userId,
          meta: { targetUserId: userId, reason: note || undefined },
          severity: 3,
        });

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

export const kickMemberMutation: MutationResolvers['kickMember'] =
  resolverWithMetrics(
    'Mutation',
    'kickMember',
    async (_p, { input: { eventId, note, userId } }, ctx) => {
      const actorId = assertAuth(ctx);
      const { pubsub } = ctx;

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);
        requireModOrOwner(event, actorId, ctx);

        if (isOwner(event, userId)) {
          throw new GraphQLError('Cannot kick the owner.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        const member = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });
        if (!member || member.status !== EventMemberStatus.JOINED) {
          return reloadFullEvent(tx, eventId);
        }

        await tx.eventMember.update({
          where: { eventId_userId: { eventId, userId } },
          data: {
            status: EventMemberStatus.KICKED,
            leftAt: new Date(),
            note: note ?? null,
          },
        });

        // Decrement joinedCount
        await tx.event.update({
          where: { id: eventId },
          data: { joinedCount: { decrement: 1 } },
        });

        await emitMemberEvent(tx, {
          eventId,
          userId,
          actorId,
          kind: MemberEvent.KICK,
          note: note ?? null,
        });

        // Notify kicked user
        await emitEventNotification(tx, pubsub, {
          kind: PrismaNotificationKind.EVENT_MEMBER_KICKED,
          recipientId: userId,
          actorId,
          eventId,
          dedupeKey: `kicked:${userId}:${eventId}`,
          data: { reason: note || undefined },
        });

        // Audit log: MEMBER/KICK (severity 4)
        await createAuditLog(tx, {
          eventId,
          actorId,
          actorRole:
            event.members.find((m) => m.userId === actorId)?.role ?? null,
          scope: 'MEMBER' as AuditScope,
          action: 'KICK' as AuditAction,
          entityType: 'EventMember',
          entityId: member.id,
          meta: { targetUserId: userId, reason: note || undefined },
          severity: 4,
        });

        // Try to promote someone from waitlist
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await promoteFromWaitlist(tx as any, eventId);

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

export const banMemberMutation: MutationResolvers['banMember'] =
  resolverWithMetrics(
    'Mutation',
    'banEventMember',
    async (_p, { input: { eventId, userId, note } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);
        requireModOrOwner(event, actorId, ctx);

        if (isOwner(event, userId)) {
          throw new GraphQLError('Cannot ban the owner.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        const existing = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });

        // Track if we need to decrement joinedCount (only if user was JOINED)
        const wasJoined = existing?.status === EventMemberStatus.JOINED;

        if (!existing) {
          await tx.eventMember.create({
            data: {
              eventId,
              userId,
              role: EventMemberRole.PARTICIPANT,
              status: EventMemberStatus.BANNED,
              note: note ?? null,
            },
          });
        } else if (existing.status !== EventMemberStatus.BANNED) {
          await tx.eventMember.update({
            where: { eventId_userId: { eventId, userId } },
            data: {
              status: EventMemberStatus.BANNED,
              leftAt: new Date(),
              note: note ?? null,
            },
          });
        }

        // Decrement joinedCount if user was JOINED before ban
        if (wasJoined) {
          await tx.event.update({
            where: { id: eventId },
            data: { joinedCount: { decrement: 1 } },
          });
        }

        await emitMemberEvent(tx, {
          eventId,
          userId,
          actorId,
          kind: MemberEvent.BAN,
          note: note ?? null,
        });

        await emitEventNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.BANNED,
          recipientId: userId,
          actorId,
          eventId,
          dedupeKey: `banned:${userId}:${eventId}`,
        });

        // Audit log: MODERATION/BAN (severity 5 - critical)
        await createAuditLog(tx, {
          eventId,
          actorId,
          actorRole:
            event.members.find((m) => m.userId === actorId)?.role ?? null,
          scope: 'MODERATION' as AuditScope,
          action: 'BAN' as AuditAction,
          entityType: 'EventMember',
          entityId: userId,
          meta: { targetUserId: userId, reason: note || undefined },
          severity: 5,
        });

        // Try to promote someone from waitlist if user was joined
        if (wasJoined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await promoteFromWaitlist(tx as any, eventId);
        }

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

export const unbanMemberMutation: MutationResolvers['unbanMember'] =
  resolverWithMetrics(
    'Mutation',
    'unbanEventMember',
    async (_p, { input: { eventId, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);
        requireModOrOwner(event, actorId, ctx);

        const existing = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });
        if (!existing || existing.status !== EventMemberStatus.BANNED) {
          return reloadFullEvent(tx, eventId);
        }

        // Po unbanie → REJECTED (neutralny stan, user musi złożyć nową prośbę)
        await tx.eventMember.update({
          where: { eventId_userId: { eventId, userId } },
          data: { status: EventMemberStatus.REJECTED, note: null },
        });

        await emitMemberEvent(tx, {
          eventId,
          userId,
          actorId,
          kind: MemberEvent.UNBAN,
        });

        await emitEventNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.UNBANNED,
          recipientId: userId,
          actorId,
          eventId,
          dedupeKey: `unbanned:${userId}:${eventId}`,
        });

        // Audit log: MODERATION/UNBAN (severity 4)
        await createAuditLog(tx, {
          eventId,
          actorId,
          actorRole:
            event.members.find((m) => m.userId === actorId)?.role ?? null,
          scope: 'MODERATION' as AuditScope,
          action: 'UNBAN' as AuditAction,
          entityType: 'EventMember',
          entityId: userId,
          meta: { targetUserId: userId },
          severity: 4,
        });

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

export const updateMemberRoleMutation: MutationResolvers['updateMemberRole'] =
  resolverWithMetrics(
    'Mutation',
    'updateMemberRole',
    async (_p, { input: { eventId, role, userId } }, ctx) => {
      const actorId = assertAuth(ctx);
      const { pubsub } = ctx;

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);
        requireOwner(event, actorId, ctx);

        if (isOwner(event, userId)) {
          throw new GraphQLError(
            'Owner role cannot be changed via this mutation.',
            { extensions: { code: 'FAILED_PRECONDITION' } }
          );
        }

        const member = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });
        if (!member) {
          throw new GraphQLError('Membership not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const oldRole = member.role;
        await tx.eventMember.update({
          where: { eventId_userId: { eventId, userId } },
          data: { role },
        });

        await emitMemberEvent(tx, {
          eventId,
          userId,
          actorId,
          kind:
            role === EventMemberRole.MODERATOR
              ? MemberEvent.APPROVE
              : MemberEvent.REJECT, // prosty mapping; rozważ dodanie osobnych eventów PROMOTE/DEMOTE
        });

        // Notify user about role change
        if (oldRole !== role) {
          await emitEventNotification(tx, pubsub, {
            kind: PrismaNotificationKind.EVENT_MEMBER_ROLE_CHANGED,
            recipientId: userId,
            actorId,
            eventId,
            dedupeKey: `role_changed:${userId}:${eventId}`,
            data: { newRole: role },
          });

          // Audit log: MEMBER/ROLE_CHANGE (severity 4)
          await createAuditLog(tx, {
            eventId,
            actorId,
            actorRole:
              event.members.find((m) => m.userId === actorId)?.role ?? null,
            scope: 'MEMBER' as AuditScope,
            action: 'ROLE_CHANGE' as AuditAction,
            entityType: 'EventMember',
            entityId: member.id,
            diff: { role: { from: oldRole, to: role } },
            meta: { targetUserId: userId },
            severity: 4,
          });
        }

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

/**
 * Cancel pending or invite for a user (owner/mod action)
 * Required level: EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
 */
export const cancelPendingOrInviteForUserMutation: MutationResolvers['cancelPendingOrInviteForUser'] =
  resolverWithMetrics(
    'Mutation',
    'cancelPendingOrInviteForUser',
    async (_p, { input: { eventId, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      // Global ADMIN or MODERATOR always has access
      if (!isAdminOrModerator(ctx.user)) {
        // Check event membership: OWNER/MODERATOR and JOINED
        const actorMembership = await prisma.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId: actorId } },
          select: { role: true, status: true },
        });

        if (
          !actorMembership ||
          actorMembership.status !== EventMemberStatus.JOINED ||
          (actorMembership.role !== EventMemberRole.OWNER &&
            actorMembership.role !== EventMemberRole.MODERATOR)
        ) {
          throw new GraphQLError(
            'Forbidden. Moderator or owner role required for this action.',
            { extensions: { code: 'FORBIDDEN' } }
          );
        }
      }

      const res = await prisma.eventMember.deleteMany({
        where: {
          eventId,
          userId,
          status: {
            in: [
              EventMemberStatus.PENDING,
              EventMemberStatus.INVITED,
              EventMemberStatus.REJECTED,
            ],
          },
        },
      });

      if (res.count > 0) {
        await prisma.eventMemberEvent.create({
          data: {
            eventId,
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
    async (_p, { eventId }, ctx) => {
      const userId = assertAuth(ctx);

      // RATE LIMIT: Prevent waitlist spam
      await assertEventWriteRateLimit(userId);

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);

        // Only OPEN mode supports direct waitlist join
        if (event.joinMode !== 'OPEN') {
          throw new GraphQLError(
            'Waitlist join is only available for OPEN events.',
            { extensions: { code: 'FAILED_PRECONDITION' } }
          );
        }

        // Check if banned
        if (await isBanned(tx, eventId, userId)) {
          throw new GraphQLError('You are banned from this event.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Check join window
        assertCanJoinNow(event);

        const existing = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });

        // Already joined
        if (existing?.status === EventMemberStatus.JOINED) {
          throw new GraphQLError('You are already a participant.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        // Already on waitlist
        if (existing?.status === EventMemberStatus.WAITLIST) {
          return reloadFullEvent(tx, eventId);
        }

        // Check if event is full
        const joined = await countJoined(tx, eventId);
        if (!isFull(joined, event.max)) {
          throw new GraphQLError('Event is not full. Use joinMember instead.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        // Create or update membership to WAITLIST
        if (existing) {
          await tx.eventMember.update({
            where: { eventId_userId: { eventId, userId } },
            data: {
              status: EventMemberStatus.WAITLIST,
              createdAt: new Date(), // Reset to end of queue
            },
          });
        } else {
          await tx.eventMember.create({
            data: {
              eventId,
              userId,
              role: EventMemberRole.PARTICIPANT,
              status: EventMemberStatus.WAITLIST,
            },
          });
        }

        await emitMemberEvent(tx, {
          eventId,
          userId,
          kind: MemberEvent.WAITLIST,
        });

        await emitEventNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.WAITLIST_JOINED,
          recipientId: userId,
          actorId: null,
          eventId,
          dedupeKey: `waitlist_joined:${userId}:${eventId}`,
        });

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );

/**
 * Leave waitlist - user removes themselves from waiting list
 */
export const leaveWaitlistMutation: MutationResolvers['leaveWaitlist'] =
  resolverWithMetrics(
    'Mutation',
    'leaveWaitlist',
    async (_p, { eventId }, ctx) => {
      const userId = assertAuth(ctx);

      // RATE LIMIT: Prevent leave spam
      await assertEventWriteRateLimit(userId);

      await prisma.$transaction(async (tx) => {
        const member = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });

        if (!member || member.status !== EventMemberStatus.WAITLIST) {
          throw new GraphQLError('You are not on the waitlist.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        await tx.eventMember.update({
          where: { eventId_userId: { eventId, userId } },
          data: {
            status: EventMemberStatus.CANCELLED,
          },
        });

        await emitMemberEvent(tx, {
          eventId,
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
    async (_p, { input: { eventId, userId } }, ctx) => {
      const actorId = assertAuth(ctx);

      const result = await prisma.$transaction(async (tx) => {
        const event = await loadEventWithMembers(tx, eventId);
        requireModOrOwner(event, actorId, ctx);

        const member = await tx.eventMember.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });

        if (!member || member.status !== EventMemberStatus.WAITLIST) {
          throw new GraphQLError('User is not on the waitlist.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        // Check join window
        assertCanJoinNow(event);

        // Check capacity with optimistic locking
        // If max is null, event has unlimited capacity
        const updated = await tx.event.updateMany({
          where: {
            id: eventId,
            ...(event.max !== null && { joinedCount: { lt: event.max } }),
          },
          data: { joinedCount: { increment: 1 } },
        });

        if (updated.count === 0) {
          throw new GraphQLError('Event is full. Cannot promote.', {
            extensions: { code: 'FAILED_PRECONDITION' },
          });
        }

        // Promote user
        await tx.eventMember.update({
          where: { eventId_userId: { eventId, userId } },
          data: {
            status: EventMemberStatus.JOINED,
            joinedAt: new Date(),
            addedById: actorId,
          },
        });

        await emitMemberEvent(tx, {
          eventId,
          userId,
          actorId,
          kind: MemberEvent.WAITLIST_PROMOTE,
          note: 'Manually promoted by moderator',
        });

        await emitEventNotification(tx, ctx.pubsub, {
          kind: PrismaNotificationKind.WAITLIST_PROMOTED,
          recipientId: userId,
          actorId,
          eventId,
          dedupeKey: `waitlist_promoted:${userId}:${eventId}`,
        });

        // Audit log: MEMBER/WAITLIST_PROMOTE (severity 3)
        await createAuditLog(tx, {
          eventId,
          actorId,
          actorRole:
            event.members.find((m) => m.userId === actorId)?.role ?? null,
          scope: 'MEMBER' as AuditScope,
          action: 'STATUS_CHANGE' as AuditAction,
          entityType: 'EventMember',
          entityId: member.id,
          meta: { targetUserId: userId, from: 'WAITLIST', to: 'JOINED' },
          severity: 3,
        });

        return reloadFullEvent(tx, eventId);
      });

      return mapEvent(result);
    }
  );
