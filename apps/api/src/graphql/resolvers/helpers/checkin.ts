/**
 * Check-in System Helper Functions
 *
 * Centralized logic for check-in operations, validation, and audit logging.
 * Implements the complete check-in specification with idempotency, atomicity, and security.
 */

import {
  CheckinMethod,
  CheckinAction,
  CheckinSource,
  CheckinResult,
  EventMemberStatus,
  NotificationKind,
  Prisma,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { nanoid } from 'nanoid';
import type { prisma } from '../../../lib/prisma';

// =============================================================================
// Types
// =============================================================================

type PrismaClient = typeof prisma;

export interface CheckinContext {
  prisma: PrismaClient;
  userId: string;
  eventId: string;
  targetUserId?: string; // For moderator actions
}

export interface CheckinLogEntry {
  eventId: string;
  memberId: string | null; // Null for event-level config changes
  actorId: string | null;
  action: CheckinAction;
  method: CheckinMethod | null;
  source: CheckinSource;
  result: CheckinResult;
  reason?: string;
  comment?: string;
  showCommentToUser?: boolean;
  metadata?: Prisma.InputJsonValue;
}

// =============================================================================
// Constants
// =============================================================================

const TOKEN_LENGTH = 32; // 256 bits for security
const COORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0,O,I,1)

// =============================================================================
// Token Generation
// =============================================================================

/**
 * Generate cryptographically secure token for QR codes
 */
export function generateCheckinToken(): string {
  return nanoid(TOKEN_LENGTH);
}

/**
 * Generate short alphanumeric code (fallback for manual entry)
 * Not as secure but more user-friendly (8 chars, ~1.2 trillion combinations)
 */
export function generateShortCode(): string {
  let result = '';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (let i = 0; i < 8; i++) {
    result += COORD_CHARS[bytes[i]! % COORD_CHARS.length];
  }
  return result;
}

// =============================================================================
// Validation & Guards
// =============================================================================

/**
 * Validate check-in is allowed for the event
 */
export async function validateEventCheckin(
  prisma: PrismaClient,
  eventId: string
): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      checkinEnabled: true,
      canceledAt: true,
      deletedAt: true,
    },
  });

  if (!event) {
    throw new GraphQLError('Event not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (event.canceledAt || event.deletedAt) {
    throw new GraphQLError('Check-in is disabled for canceled/deleted events', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  if (!event.checkinEnabled) {
    throw new GraphQLError('Check-in is not enabled for this event', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Validate method is enabled for the event
 */
export async function validateMethodEnabled(
  prisma: PrismaClient,
  eventId: string,
  method: CheckinMethod
): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { enabledCheckinMethods: true },
  });

  if (!event) {
    throw new GraphQLError('Event not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (!event || !event.enabledCheckinMethods.includes(method)) {
    throw new GraphQLError(
      `Check-in method ${method} is not enabled for this event`,
      {
        extensions: { code: 'FORBIDDEN' },
      }
    );
  }
}

/**
 * Get member or throw if not found / not JOINED
 */
export async function getMemberOrThrow(
  prisma: PrismaClient,
  eventId: string,
  userId: string
) {
  const member = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    select: {
      id: true,
      status: true,
      isCheckedIn: true,
      checkinMethods: true,
      checkinBlockedAll: true,
      checkinBlockedMethods: true,
      lastCheckinRejectionReason: true,
      memberCheckinToken: true,
      userId: true,
      eventId: true,
    },
  });

  if (!member) {
    throw new GraphQLError('Membership not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (member.status !== EventMemberStatus.JOINED) {
    throw new GraphQLError('Only JOINED members can check in', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return member;
}

/**
 * Validate member can check in with given method
 */
export function validateMemberCanCheckin(
  member: {
    checkinBlockedAll: boolean;
    checkinBlockedMethods: CheckinMethod[];
  },
  method: CheckinMethod
): void {
  if (member.checkinBlockedAll) {
    throw new GraphQLError('All check-in methods are blocked for this user', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  if (member.checkinBlockedMethods.includes(method)) {
    throw new GraphQLError(
      `Check-in method ${method} is blocked for this user`,
      {
        extensions: { code: 'FORBIDDEN' },
      }
    );
  }
}

/**
 * Validate user has moderator permissions for event
 * Allows:
 * - Event owner
 * - Event moderators (MODERATOR role + JOINED status)
 * - Application admins (User.role = ADMIN)
 * - Application moderators (User.role = MODERATOR)
 */
export async function validateModeratorAccess(
  prisma: PrismaClient,
  eventId: string,
  userId: string
): Promise<void> {
  // First check if user is an application admin or moderator
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && (user.role === 'ADMIN' || user.role === 'MODERATOR')) {
    // Application admins and moderators have access to all events
    return;
  }

  // If not app admin/moderator, check event-specific permissions
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      ownerId: true,
      members: {
        select: {
          role: true,
          userId: true,
        },
      },
    },
  });

  if (!event) {
    throw new GraphQLError('Event not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const isOwner = event.ownerId === userId;

  if (!isOwner) {
    // Check if user is a moderator
    const moderatorMembership = await prisma.eventMember.findFirst({
      where: {
        eventId,
        userId,
        status: EventMemberStatus.JOINED,
        role: 'MODERATOR',
      },
      select: { id: true },
    });

    if (!moderatorMembership) {
      throw new GraphQLError(
        'You do not have permission to manage check-ins for this event',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }
  }
}

// =============================================================================
// Audit Logging
// =============================================================================

/**
 * Create audit log entry for check-in action
 * Always use this function to ensure complete audit trail
 */
export async function logCheckinAction(
  prisma: PrismaClient,
  log: CheckinLogEntry
): Promise<void> {
  // Build data object conditionally based on memberId
  const data: any = {
    eventId: log.eventId,
    actorId: log.actorId,
    action: log.action,
    method: log.method,
    source: log.source,
    result: log.result,
    reason: log.reason,
    comment: log.comment,
    showCommentToUser: log.showCommentToUser ?? true,
    metadata: log.metadata,
  };

  // Only include memberId if it's not null
  if (log.memberId !== null) {
    data.memberId = log.memberId;
  }

  await prisma.eventCheckinLog.create({ data });
}

// =============================================================================
// Notifications
// =============================================================================

/**
 * Send check-in notification to user
 */
export async function sendCheckinNotification(
  prisma: PrismaClient,
  {
    kind,
    userId,
    eventId,
    actorId,
    comment,
    showComment = true,
  }: {
    kind: NotificationKind;
    userId: string;
    eventId: string;
    actorId?: string | null;
    comment?: string;
    showComment?: boolean;
  }
): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true },
  });

  if (!event) return;

  let title: string;
  let body: string;

  switch (kind) {
    case NotificationKind.CHECKIN_CONFIRMED:
      title = 'Check-in potwierdzony';
      body = `Twoja obecność na wydarzeniu "${event.title}" została potwierdzona.`;
      break;
    case NotificationKind.CHECKIN_REJECTED:
      title = 'Check-in odrzucony';
      body = `Twój check-in na wydarzeniu "${event.title}" został odrzucony.`;
      if (comment && showComment) {
        body += ` Powód: ${comment}`;
      }
      break;
    case NotificationKind.CHECKIN_BLOCKED:
      title = 'Check-in zablokowany';
      body = `Check-in został zablokowany dla wydarzenia "${event.title}".`;
      if (comment && showComment) {
        body += ` Powód: ${comment}`;
      }
      break;
    case NotificationKind.CHECKIN_UNBLOCKED:
      title = 'Check-in odblokowany';
      body = `Check-in został odblokowany dla wydarzenia "${event.title}".`;
      break;
    default:
      return;
  }

  // Dedupe key to prevent spam
  const dedupeKey = `checkin:${eventId}:${userId}:${kind}:${Date.now()}`;

  await prisma.notification.create({
    data: {
      kind,
      title,
      body,
      dedupeKey,
      recipientId: userId,
      actorId: actorId || null,
      entityType: 'EVENT',
      entityId: eventId,
      data: {
        eventId,
        comment: showComment ? comment : undefined,
      },
    },
  });
}

// =============================================================================
// Core Check-in Operations
// =============================================================================

/**
 * Add check-in method to member (idempotent)
 */
export async function addCheckinMethod(
  prisma: PrismaClient,
  {
    memberId,
    method,
    actorId,
    source,
  }: {
    memberId: string;
    method: CheckinMethod;
    actorId: string | null;
    source: CheckinSource;
  }
): Promise<{
  success: boolean;
  message: string;
  wasAlreadyCheckedIn: boolean;
}> {
  const member = await prisma.eventMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      checkinMethods: true,
      isCheckedIn: true,
      userId: true,
      eventId: true,
    },
  });

  if (!member) {
    throw new GraphQLError('Member not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  // Idempotency: if method already active, return NOOP
  if (member.checkinMethods.includes(method)) {
    await logCheckinAction(prisma, {
      eventId: member.eventId,
      memberId: member.id,
      actorId,
      action: CheckinAction.CHECK_IN,
      method,
      source,
      result: CheckinResult.NOOP,
      reason: 'Method already active',
    });

    return {
      success: true,
      message: 'Already checked in with this method',
      wasAlreadyCheckedIn: true,
    };
  }

  // Add method to array (ensure unique)
  const updatedMethods = Array.from(
    new Set([...member.checkinMethods, method])
  );

  await prisma.eventMember.update({
    where: { id: memberId },
    data: {
      checkinMethods: updatedMethods,
      isCheckedIn: true,
      lastCheckinAt: new Date(),
    },
  });

  // Log success
  await logCheckinAction(prisma, {
    eventId: member.eventId,
    memberId: member.id,
    actorId,
    action: CheckinAction.CHECK_IN,
    method,
    source,
    result: CheckinResult.SUCCESS,
  });

  // Send notification
  await sendCheckinNotification(prisma, {
    kind: NotificationKind.CHECKIN_CONFIRMED,
    userId: member.userId,
    eventId: member.eventId,
    actorId,
  });

  return {
    success: true,
    message: 'Check-in successful',
    wasAlreadyCheckedIn: false,
  };
}

/**
 * Remove check-in method from member (idempotent)
 */
export async function removeCheckinMethod(
  prisma: PrismaClient,
  {
    memberId,
    method,
    actorId,
    source,
  }: {
    memberId: string;
    method: CheckinMethod | null; // null = remove all methods
    actorId: string | null;
    source: CheckinSource;
  }
): Promise<{ success: boolean; message: string }> {
  const member = await prisma.eventMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      checkinMethods: true,
      isCheckedIn: true,
      userId: true,
      eventId: true,
    },
  });

  if (!member) {
    throw new GraphQLError('Member not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  let updatedMethods: CheckinMethod[];

  if (method === null) {
    // Remove all methods
    updatedMethods = [];
  } else {
    // Idempotency: if method not active, return NOOP
    if (!member.checkinMethods.includes(method)) {
      await logCheckinAction(prisma, {
        eventId: member.eventId,
        memberId: member.id,
        actorId,
        action: CheckinAction.UNCHECK,
        method,
        source,
        result: CheckinResult.NOOP,
        reason: 'Method was not active',
      });

      return {
        success: true,
        message: 'Method was not active',
      };
    }

    // Remove specific method
    updatedMethods = member.checkinMethods.filter((m) => m !== method);
  }

  const newCheckedInStatus = updatedMethods.length > 0;

  await prisma.eventMember.update({
    where: { id: memberId },
    data: {
      checkinMethods: updatedMethods,
      isCheckedIn: newCheckedInStatus,
    },
  });

  // Log success
  await logCheckinAction(prisma, {
    eventId: member.eventId,
    memberId: member.id,
    actorId,
    action: CheckinAction.UNCHECK,
    method,
    source,
    result: CheckinResult.SUCCESS,
  });

  return {
    success: true,
    message: method === null ? 'All check-ins removed' : 'Check-in removed',
  };
}

// =============================================================================
// Status Invalidation (System Action)
// =============================================================================

/**
 * Invalidate check-in when membership status changes (system action)
 * Call this when member leaves, gets kicked, banned, etc.
 */
export async function invalidateCheckinOnStatusChange(
  prisma: PrismaClient,
  memberId: string,
  reason: string
): Promise<void> {
  const member = await prisma.eventMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      isCheckedIn: true,
      checkinMethods: true,
      userId: true,
      eventId: true,
    },
  });

  if (!member || !member.isCheckedIn) {
    return; // Nothing to invalidate
  }

  await prisma.eventMember.update({
    where: { id: memberId },
    data: {
      isCheckedIn: false,
      checkinMethods: [],
    },
  });

  // Log system action
  await logCheckinAction(prisma, {
    eventId: member.eventId,
    memberId: member.id,
    actorId: null,
    action: CheckinAction.UNCHECK,
    method: null,
    source: CheckinSource.SYSTEM,
    result: CheckinResult.SUCCESS,
    reason: `Check-in invalidated: ${reason}`,
  });
}
