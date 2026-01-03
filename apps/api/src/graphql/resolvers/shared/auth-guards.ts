/**
 * =============================================================================
 * AUTH GUARDS - Centralized Authorization Module
 * =============================================================================
 *
 * This module provides consistent authorization checking across all GraphQL resolvers.
 * All resolvers should use these functions instead of inline auth checks.
 *
 * ## Authorization Levels (from least to most restrictive):
 *
 * | Level                 | Description                                      |
 * |-----------------------|--------------------------------------------------|
 * | ANY                   | No authentication required                       |
 * | AUTH                  | Any authenticated user                           |
 * | SELF                  | Only the resource owner (current user)           |
 * | EVENT_PARTICIPANT     | Joined member of an event                        |
 * | EVENT_MOD_OR_OWNER    | Event moderator/owner OR app mod/admin           |
 * | APP_MOD_OR_ADMIN      | Global Role.MODERATOR or Role.ADMIN              |
 * | ADMIN_ONLY            | Only Role.ADMIN                                  |
 *
 * ## Global Role Privileges:
 *
 * - ADMIN: Has at least OWNER privileges in all event contexts
 * - MODERATOR: Has at least MODERATOR privileges in all event contexts
 *
 * ## Usage Examples:
 *
 * ```typescript
 * // Simple auth check
 * const userId = requireAuth(ctx);
 *
 * // Check if user is app mod/admin
 * requireAppModOrAdmin(ctx.user);
 *
 * // Check event-level access with app mod bypass
 * await requireEventModOrOwner(ctx.user, eventId);
 *
 * // Check if user is participant or has global mod access
 * await requireEventParticipantOrAppMod(ctx.user, eventId);
 * ```
 */

import {
  EventMemberRole,
  EventMemberStatus,
} from '../../../prisma-client/enums';
import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import {
  trackAuthzDenied,
  trackUnauthorizedAdminAttempt,
} from '../../../lib/observability';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Context user type - represents the user object from MercuriusContext.
 * This is a subset of the full SessionUser GraphQL type.
 */
export interface ContextUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarKey: string | null;
  verifiedAt: Date | null;
  locale: string;
  timezone: string;
}

/**
 * Minimal user type for auth checks.
 * Accepts any object with id and role properties.
 */
export interface AuthCheckUser {
  id?: string | null;
  role?: string | null;
}

/**
 * Event membership info returned by authorization checks.
 */
export interface EventMemberInfo {
  role: EventMemberRole;
  status: EventMemberStatus;
  userId: string;
  eventId: string;
}

// =============================================================================
// Basic Predicates (no throwing)
// =============================================================================

/**
 * Check if user is authenticated (has valid id).
 */
export function isAuthenticated(
  user: AuthCheckUser | null | undefined
): user is AuthCheckUser & { id: string } {
  return Boolean(user?.id);
}

/**
 * Check if user has ADMIN role.
 */
export function isAdmin(user: AuthCheckUser | null | undefined): boolean {
  return user?.role === 'ADMIN';
}

/**
 * Check if user has MODERATOR role.
 */
export function isModerator(user: AuthCheckUser | null | undefined): boolean {
  return user?.role === 'MODERATOR';
}

/**
 * Check if user is either ADMIN or MODERATOR (app-level moderation access).
 */
export function isAdminOrModerator(
  user: AuthCheckUser | null | undefined
): boolean {
  return isAdmin(user) || isModerator(user);
}

/**
 * Check if a role is an event moderator role (OWNER or MODERATOR).
 */
export function isEventModeratorRole(
  role: EventMemberRole | null | undefined
): boolean {
  return role === EventMemberRole.OWNER || role === EventMemberRole.MODERATOR;
}

// =============================================================================
// Throwing Guards - Basic Auth
// =============================================================================

/**
 * Require an authenticated user.
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 * @returns The user ID for convenience.
 */
export function requireAuth(ctx: MercuriusContext): string {
  if (!ctx.user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user.id;
}

/**
 * Require an authenticated user and return the full context user object.
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 */
export function requireAuthUser(ctx: MercuriusContext): ContextUser {
  if (!ctx.user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user as ContextUser;
}

// =============================================================================
// Throwing Guards - App-Level Roles
// =============================================================================

/**
 * Require ADMIN role.
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 * @throws GraphQLError with code FORBIDDEN if not admin.
 */
export function requireAdmin(
  user: AuthCheckUser | null | undefined
): asserts user is AuthCheckUser & { id: string; role: 'ADMIN' } {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (user.role !== 'ADMIN') {
    trackAuthzDenied('ROLE_TOO_LOW', {
      operation: 'event_admin',
      userId: user.id,
      resourceType: 'admin',
    });
    // Track unauthorized admin attempt (security alert)
    trackUnauthorizedAdminAttempt(user.id, 'admin_access', user.role || 'USER');
    throw new GraphQLError('Admin access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Require ADMIN or MODERATOR role (APP_MOD_OR_ADMIN level).
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 * @throws GraphQLError with code FORBIDDEN if not admin or moderator.
 */
export function requireAppModOrAdmin(
  user: AuthCheckUser | null | undefined
): void {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
    trackAuthzDenied('ROLE_TOO_LOW', {
      operation: 'event_admin',
      userId: user.id,
      resourceType: 'app_mod',
    });
    // Track unauthorized admin/mod attempt (security alert)
    trackUnauthorizedAdminAttempt(
      user.id,
      'app_mod_access',
      user.role || 'USER'
    );
    throw new GraphQLError('Admin or moderator access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

// Alias for backwards compatibility
export const requireAdminOrModerator = requireAppModOrAdmin;

// =============================================================================
// Throwing Guards - Resource Ownership (SELF)
// =============================================================================

/**
 * Require that the user is the owner of a resource (SELF level).
 * @param user - The authenticated user.
 * @param resourceOwnerId - The ID of the resource owner.
 * @param options.allowAdminOverride - If true, ADMIN can access any resource.
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 * @throws GraphQLError with code FORBIDDEN if not the owner (and not admin if override enabled).
 */
export function requireSelf(
  user: AuthCheckUser | null | undefined,
  resourceOwnerId: string,
  options?: { allowAdminOverride?: boolean }
): void {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  if (user.id === resourceOwnerId) {
    return;
  }

  if (options?.allowAdminOverride && user.role === 'ADMIN') {
    return;
  }

  trackAuthzDenied('NOT_OWNER', {
    operation: 'event_read',
    userId: user.id,
    resourceType: 'self',
  });
  throw new GraphQLError('You can only access your own resources.', {
    extensions: { code: 'FORBIDDEN' },
  });
}

// Alias for backwards compatibility
export const requireSelfOrAdmin = requireSelf;

/**
 * Require that the user is the owner OR has APP_MOD_OR_ADMIN access.
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 * @throws GraphQLError with code FORBIDDEN if not owner and not app mod/admin.
 */
export function requireSelfOrAppMod(
  user: AuthCheckUser | null | undefined,
  resourceOwnerId: string
): void {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // Owner can access
  if (user.id === resourceOwnerId) {
    return;
  }

  // App mod/admin can access
  if (isAdminOrModerator(user)) {
    return;
  }

  trackAuthzDenied('NOT_OWNER', {
    operation: 'event_read',
    userId: user.id,
    resourceType: 'self_or_mod',
  });
  throw new GraphQLError(
    'You can only access your own resources or be a moderator.',
    { extensions: { code: 'FORBIDDEN' } }
  );
}

// =============================================================================
// Event Membership Helpers
// =============================================================================

/**
 * Get user's membership in an event.
 * @returns Membership info or null if not a member.
 */
export async function getEventMembership(
  userId: string,
  eventId: string
): Promise<EventMemberInfo | null> {
  const member = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
    select: {
      role: true,
      status: true,
      userId: true,
      eventId: true,
    },
  });

  return member;
}

/**
 * Get user's event role if they are a JOINED member.
 * @returns The role or null if not a joined member.
 */
export async function getJoinedEventRole(
  userId: string,
  eventId: string
): Promise<EventMemberRole | null> {
  const member = await getEventMembership(userId, eventId);
  if (!member || member.status !== EventMemberStatus.JOINED) {
    return null;
  }
  return member.role;
}

/**
 * Calculate effective event role considering global app roles.
 * - ADMIN is treated as OWNER
 * - MODERATOR is treated as MODERATOR
 * - Otherwise returns actual event membership role
 */
export async function getEffectiveEventRole(
  user: AuthCheckUser | null | undefined,
  eventId: string
): Promise<EventMemberRole | null> {
  if (!user?.id) return null;

  // Global ADMIN has OWNER privileges
  if (user.role === 'ADMIN') {
    return EventMemberRole.OWNER;
  }

  // Global MODERATOR has MODERATOR privileges
  if (user.role === 'MODERATOR') {
    return EventMemberRole.MODERATOR;
  }

  // Check actual event membership
  return getJoinedEventRole(user.id, eventId);
}

// =============================================================================
// Throwing Guards - Event-Level Access
// =============================================================================

/**
 * Require EVENT_PARTICIPANT level.
 * User must be a JOINED member of the event.
 * @throws GraphQLError with code FORBIDDEN if not a joined member.
 */
export async function requireEventParticipant(
  userId: string,
  eventId: string
): Promise<EventMemberInfo> {
  const member = await getEventMembership(userId, eventId);

  if (!member || member.status !== EventMemberStatus.JOINED) {
    trackAuthzDenied('NOT_MEMBER', {
      operation: 'event_read',
      userId,
      resourceType: 'event',
      resourceId: eventId,
    });
    throw new GraphQLError('You must be a joined member of this event.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return member;
}

/**
 * Require EVENT_PARTICIPANT OR APP_MOD_OR_ADMIN level.
 * Global mods/admins bypass the membership requirement.
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 * @throws GraphQLError with code FORBIDDEN if not a participant and not app mod/admin.
 */
export async function requireEventParticipantOrAppMod(
  user: AuthCheckUser | null | undefined,
  eventId: string
): Promise<void> {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // App mod/admin bypass
  if (isAdminOrModerator(user)) {
    return;
  }

  // Check event membership
  await requireEventParticipant(user.id, eventId);
}

/**
 * Require EVENT_MOD_OR_OWNER level (with APP_MOD_OR_ADMIN bypass).
 * User must be event OWNER/MODERATOR or global ADMIN/MODERATOR.
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 * @throws GraphQLError with code FORBIDDEN if not authorized.
 */
export async function requireEventModOrOwner(
  user: AuthCheckUser | null | undefined,
  eventId: string
): Promise<void> {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // App mod/admin always has access
  if (isAdminOrModerator(user)) {
    return;
  }

  // Check event membership
  const member = await getEventMembership(user.id, eventId);

  if (!member || member.status !== EventMemberStatus.JOINED) {
    trackAuthzDenied('NOT_MEMBER', {
      operation: 'member_manage',
      userId: user.id,
      resourceType: 'event',
      resourceId: eventId,
    });
    throw new GraphQLError('Event moderator or owner access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  if (!isEventModeratorRole(member.role)) {
    trackAuthzDenied('ROLE_TOO_LOW', {
      operation: 'member_manage',
      userId: user.id,
      resourceType: 'event',
      resourceId: eventId,
    });
    throw new GraphQLError('Event moderator or owner access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

// Alias for backwards compatibility
export const requireEventModOrOwnerOrAppMod = requireEventModOrOwner;

/**
 * Require EVENT_OWNER level (with ADMIN bypass).
 * User must be event OWNER or global ADMIN.
 * Note: Global MODERATOR does NOT have OWNER privileges.
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 * @throws GraphQLError with code FORBIDDEN if not authorized.
 */
export async function requireEventOwner(
  user: AuthCheckUser | null | undefined,
  eventId: string
): Promise<void> {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // Only ADMIN has global owner bypass (not MODERATOR)
  if (user.role === 'ADMIN') {
    return;
  }

  // Check event membership
  const member = await getEventMembership(user.id, eventId);

  if (!member || member.status !== EventMemberStatus.JOINED) {
    throw new GraphQLError('Event owner access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  if (member.role !== EventMemberRole.OWNER) {
    throw new GraphQLError('Event owner access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

// Alias for backwards compatibility
export const requireEventOwnerOrAdmin = requireEventOwner;

// =============================================================================
// Combined Guards - Self OR Event Access
// =============================================================================

/**
 * Require SELF OR EVENT_MOD_OR_OWNER OR APP_MOD_OR_ADMIN level.
 * Used for mutations like editEventMessage, deleteEventMessage.
 * @throws GraphQLError with code UNAUTHENTICATED if not logged in.
 * @throws GraphQLError with code FORBIDDEN if not authorized.
 */
export async function requireSelfOrEventModOrAppMod(
  user: AuthCheckUser | null | undefined,
  resourceOwnerId: string,
  eventId: string
): Promise<void> {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // Self can always access
  if (user.id === resourceOwnerId) {
    return;
  }

  // App mod/admin can access
  if (isAdminOrModerator(user)) {
    return;
  }

  // Check if event mod/owner
  const member = await getEventMembership(user.id, eventId);

  if (
    member &&
    member.status === EventMemberStatus.JOINED &&
    isEventModeratorRole(member.role)
  ) {
    return;
  }

  throw new GraphQLError(
    'You can only access your own resources or be a moderator.',
    { extensions: { code: 'FORBIDDEN' } }
  );
}

// =============================================================================
// DM Guards
// =============================================================================

/**
 * Require that user is a participant in a DM thread.
 * @throws GraphQLError with code NOT_FOUND if thread doesn't exist.
 * @throws GraphQLError with code FORBIDDEN if not a participant.
 */
export async function requireDmParticipant(
  userId: string,
  threadId: string
): Promise<void> {
  const thread = await prisma.dmThread.findUnique({
    where: { id: threadId },
    select: {
      aUserId: true,
      bUserId: true,
    },
  });

  if (!thread) {
    throw new GraphQLError('DM thread not found.', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (thread.aUserId !== userId && thread.bUserId !== userId) {
    throw new GraphQLError('You are not a participant in this thread.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Check if users can create a DM thread (no blocks, not self).
 * @throws GraphQLError with code BAD_USER_INPUT if trying to DM self.
 * @throws GraphQLError with code FORBIDDEN if blocked.
 */
export async function requireDmAllowed(
  userId1: string,
  userId2: string
): Promise<void> {
  if (userId1 === userId2) {
    throw new GraphQLError('Cannot create DM thread with yourself.', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    },
  });

  if (block) {
    throw new GraphQLError(
      'Cannot send messages to this user due to blocking.',
      { extensions: { code: 'FORBIDDEN' } }
    );
  }
}

// Alias for backwards compatibility
export const checkDmAllowed = requireDmAllowed;

// =============================================================================
// Message Guards
// =============================================================================

/**
 * Require that user is the author of a message.
 * @throws GraphQLError with code NOT_FOUND if message doesn't exist.
 * @throws GraphQLError with code FORBIDDEN if not the author.
 */
export async function requireMessageAuthor(
  userId: string,
  messageId: string,
  messageType: 'event' | 'dm'
): Promise<void> {
  let authorId: string | null = null;

  if (messageType === 'event') {
    const message = await prisma.eventChatMessage.findUnique({
      where: { id: messageId },
      select: { authorId: true },
    });
    authorId = message?.authorId ?? null;
  } else {
    const message = await prisma.dmMessage.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    });
    authorId = message?.senderId ?? null;
  }

  if (!authorId) {
    throw new GraphQLError('Message not found.', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (authorId !== userId) {
    throw new GraphQLError('You can only edit/delete your own messages.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}
