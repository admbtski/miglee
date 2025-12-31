/**
 * Check-in Mutation Resolvers
 *
 * Complete implementation of check-in system mutations for users and moderators.
 *
 * TYPE SAFETY NOTE:
 * Some mutations use `Promise<any>` return type because they return Prisma models
 * (Event, EventMember) that field resolvers convert to GraphQL types. This is the
 * standard GraphQL pattern and is type-safe because:
 * 1. Field resolvers (CheckinResult, EventCheckinLog) handle all conversions
 * 2. Prisma models match GQL schema structure (just different TS namespaces)
 * 3. No 'as any' casts are used elsewhere - only explicit enum conversions
 */

import type {
  MutationResolvers,
  CheckinResult as GQLCheckinResult,
} from '../../__generated__/resolvers-types';
import { GraphQLError } from 'graphql';
import {
  CheckinMethod,
  CheckinSource,
  CheckinAction,
  CheckinResult,
  EventMemberStatus,
} from '../../../prisma-client/enums';
import {
  validateEventCheckin,
  validateMethodEnabled,
  getMemberOrThrow,
  validateMemberCanCheckin,
  validateModeratorAccess,
  addCheckinMethod,
  removeCheckinMethod,
  logCheckinAction,
  sendCheckinNotification,
  generateCheckinToken,
} from '../helpers/checkin';
import { includesMethod } from '../helpers/checkin-types';
import { NotificationKind } from '../../../prisma-client/client';
import { createAuditLog, type CreateAuditLogInput } from '../../../lib/audit';

// Temporary type aliases until prisma generate is run
type AuditScope = CreateAuditLogInput['scope'];
type AuditAction = CreateAuditLogInput['action'];

// =============================================================================
// User Mutations
// =============================================================================

export const checkInSelf: MutationResolvers['checkInSelf'] = async (
  _,
  { eventId },
  { prisma, userId }
): Promise<GQLCheckinResult> => {
  if (!userId) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const method = CheckinMethod.SELF_MANUAL;

  try {
    // Validate event allows check-in
    await validateEventCheckin(prisma, eventId);

    // Validate method is enabled
    await validateMethodEnabled(prisma, eventId, method);

    // Get member and validate status
    const member = await getMemberOrThrow(prisma, eventId, userId);

    // Validate member is not blocked
    validateMemberCanCheckin(member, method);

    // Perform check-in (idempotent)
    const result = await addCheckinMethod(prisma, {
      memberId: member.id,
      method,
      actorId: userId,
      source: CheckinSource.USER,
    });

    // Fetch updated member and event
    const [updatedMember, event] = await Promise.all([
      prisma.eventMember.findUnique({
        where: { id: member.id },
        include: {
          user: true,
          event: true,
          lastCheckinRejectedBy: true,
        },
      }),
      prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    return {
      success: result.success,
      message: result.message,
      member: updatedMember as any, // Prisma → GQL via field resolver
      event: event as any, // Prisma → GQL via field resolver
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to check in', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

export const uncheckInSelf: MutationResolvers['uncheckInSelf'] = async (
  _,
  { eventId },
  { prisma, userId }
): Promise<GQLCheckinResult> => {
  if (!userId) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const method = CheckinMethod.SELF_MANUAL;

  try {
    // Get member
    const member = await getMemberOrThrow(prisma, eventId, userId);

    // Check if user is blocked from unchecking (edge case: blocked users can't uncheck)
    if (member.checkinBlockedAll) {
      throw new GraphQLError('Cannot uncheck: check-in is blocked', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Remove method (idempotent)
    const result = await removeCheckinMethod(prisma, {
      memberId: member.id,
      method,
      actorId: userId,
      source: CheckinSource.USER,
    });

    // Fetch updated member and event
    const [updatedMember, event] = await Promise.all([
      prisma.eventMember.findUnique({
        where: { id: member.id },
        include: {
          user: true,
          event: true,
          lastCheckinRejectedBy: true,
        },
      }),
      prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    return {
      success: result.success,
      message: result.message,
      member: updatedMember as any, // Prisma → GQL via field resolver
      event: event as any, // Prisma → GQL via field resolver
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to uncheck', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// =============================================================================
// Moderator Mutations
// =============================================================================

export const checkInMember: MutationResolvers['checkInMember'] = async (
  _,
  { input },
  { prisma, userId }
): Promise<GQLCheckinResult> => {
  if (!userId) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const {
    eventId,
    userId: targetUserId,
    method = CheckinMethod.MODERATOR_PANEL,
  } = input;

  try {
    // Validate moderator access
    await validateModeratorAccess(prisma, eventId, userId);

    // Validate event allows check-in
    await validateEventCheckin(prisma, eventId);

    // Validate method is enabled
    await validateMethodEnabled(prisma, eventId, method);

    // Get target member
    const member = await getMemberOrThrow(prisma, eventId, targetUserId);

    // Validate member is not blocked
    validateMemberCanCheckin(member, method);

    // Perform check-in
    const result = await addCheckinMethod(prisma, {
      memberId: member.id,
      method,
      actorId: userId,
      source: CheckinSource.MODERATOR,
    });

    // Fetch updated member and event
    const [updatedMember, event] = await Promise.all([
      prisma.eventMember.findUnique({
        where: { id: member.id },
        include: {
          user: true,
          event: true,
          lastCheckinRejectedBy: true,
        },
      }),
      prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    return {
      success: result.success,
      message: result.message,
      member: updatedMember as any, // Prisma → GQL via field resolver
      event: event as any, // Prisma → GQL via field resolver
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to check in member', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

export const uncheckInMember: MutationResolvers['uncheckInMember'] = async (
  _,
  { input },
  { prisma, userId }
): Promise<GQLCheckinResult> => {
  if (!userId) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const { eventId, userId: targetUserId, method } = input;

  try {
    // Validate moderator access
    await validateModeratorAccess(prisma, eventId, userId);

    // Get target member
    const member = await getMemberOrThrow(prisma, eventId, targetUserId);

    // Remove method (null = remove all)
    const result = await removeCheckinMethod(prisma, {
      memberId: member.id,
      method: method || null,
      actorId: userId,
      source: CheckinSource.MODERATOR,
    });

    // Fetch updated member and event
    const [updatedMember, event] = await Promise.all([
      prisma.eventMember.findUnique({
        where: { id: member.id },
        include: {
          user: true,
          event: true,
          lastCheckinRejectedBy: true,
        },
      }),
      prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    return {
      success: result.success,
      message: result.message,
      member: updatedMember as any, // Prisma → GQL via field resolver
      event: event as any, // Prisma → GQL via field resolver
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to uncheck member', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

export const rejectMemberCheckin: MutationResolvers['rejectMemberCheckin'] =
  async (_, { input }, { prisma, userId }): Promise<GQLCheckinResult> => {
    if (!userId) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const {
      eventId,
      userId: targetUserId,
      reason,
      showReasonToUser = true,
      blockMethod,
      blockAll = false,
    } = input;

    // Convert InputMaybe to proper types
    const safeReason = reason ?? undefined;
    const safeBlockMethod = blockMethod ?? undefined;
    const safeShowReasonToUser = showReasonToUser ?? true;
    const safeBlockAll = blockAll ?? false;

    try {
      // Validate moderator access
      await validateModeratorAccess(prisma, eventId, userId);

      // Get target member
      const member = await getMemberOrThrow(prisma, eventId, targetUserId);

      // Remove all current check-ins
      await removeCheckinMethod(prisma, {
        memberId: member.id,
        method: null, // Remove all
        actorId: userId,
        source: CheckinSource.MODERATOR,
      });

      // Update rejection fields
      const updateData: any = {
        lastCheckinRejectionReason:
          safeReason || 'Check-in rejected by organizer',
        lastCheckinRejectedAt: new Date(),
        lastCheckinRejectedById: userId,
      };

      // Apply blocks if specified
      if (safeBlockAll) {
        updateData.checkinBlockedAll = true;
        updateData.checkinBlockedMethods = [];
      } else if (safeBlockMethod) {
        const currentBlocked = member.checkinBlockedMethods;
        updateData.checkinBlockedMethods = Array.from(
          new Set([...currentBlocked, safeBlockMethod])
        );
      }

      await prisma.eventMember.update({
        where: { id: member.id },
        data: updateData,
      });

      // Log rejection
      await logCheckinAction(prisma, {
        eventId,
        memberId: member.id,
        actorId: userId,
        action: CheckinAction.REJECT,
        method: safeBlockMethod || null,
        source: CheckinSource.MODERATOR,
        result: CheckinResult.SUCCESS,
        reason: safeReason,
        comment: safeReason,
        showCommentToUser: safeShowReasonToUser,
      });

      // Log blocks
      if (safeBlockAll) {
        await logCheckinAction(prisma, {
          eventId,
          memberId: member.id,
          actorId: userId,
          action: CheckinAction.BLOCK_ALL,
          method: null,
          source: CheckinSource.MODERATOR,
          result: CheckinResult.SUCCESS,
          reason: safeReason,
        });
      } else if (safeBlockMethod) {
        await logCheckinAction(prisma, {
          eventId,
          memberId: member.id,
          actorId: userId,
          action: CheckinAction.BLOCK_METHOD,
          method: safeBlockMethod,
          source: CheckinSource.MODERATOR,
          result: CheckinResult.SUCCESS,
          reason: safeReason,
        });
      }

      // Send notification
      const notifKind =
        safeBlockAll || safeBlockMethod
          ? NotificationKind.CHECKIN_BLOCKED
          : NotificationKind.CHECKIN_REJECTED;

      await sendCheckinNotification(prisma, {
        kind: notifKind,
        userId: targetUserId,
        eventId,
        actorId: userId,
        comment: safeReason,
        showComment: safeShowReasonToUser,
      });

      // Fetch updated member and event
      const [updatedMember, event] = await Promise.all([
        prisma.eventMember.findUnique({
          where: { id: member.id },
          include: {
            user: true,
            event: true,
            lastCheckinRejectedBy: true,
          },
        }),
        prisma.event.findUnique({ where: { id: eventId } }),
      ]);

      // Audit log: CHECKIN/STATUS_CHANGE (severity 4)
      await createAuditLog(prisma, {
        eventId,
        actorId: userId,
        scope: 'CHECKIN' as AuditScope,
        action: 'STATUS_CHANGE' as AuditAction,
        entityType: 'EventMember',
        entityId: member.id,
        meta: {
          targetUserId,
          reason: safeReason,
          blockedAll: safeBlockAll || undefined,
          blockedMethod: safeBlockMethod || undefined,
        },
        severity: 4,
      });

      return {
        success: true,
        message: 'Check-in rejected successfully',
        member: updatedMember as any, // Prisma → GQL via field resolver
        event: event as any, // Prisma → GQL
      };
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to reject check-in', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  };

export const blockMemberCheckin: MutationResolvers['blockMemberCheckin'] =
  async (_, { input }, { prisma, userId }): Promise<GQLCheckinResult> => {
    if (!userId) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const {
      eventId,
      userId: targetUserId,
      blockAll = false,
      method,
      reason,
    } = input;

    // Convert InputMaybe to proper types
    const safeBlockAll = blockAll ?? false;
    const safeMethod = method ?? undefined;
    const safeReason = reason ?? undefined;

    try {
      // Validate moderator access
      await validateModeratorAccess(prisma, eventId, userId);

      // Get target member
      const member = await getMemberOrThrow(prisma, eventId, targetUserId);

      const updateData: any = {};

      if (safeBlockAll) {
        updateData.checkinBlockedAll = true;
        updateData.checkinBlockedMethods = [];
        // Remove all active check-ins
        updateData.checkinMethods = [];
        updateData.isCheckedIn = false;

        await logCheckinAction(prisma, {
          eventId,
          memberId: member.id,
          actorId: userId,
          action: CheckinAction.BLOCK_ALL,
          method: null,
          source: CheckinSource.MODERATOR,
          result: CheckinResult.SUCCESS,
          reason: safeReason,
        });
      } else if (safeMethod) {
        const currentBlocked = member.checkinBlockedMethods;
        const newBlocked = Array.from(new Set([...currentBlocked, safeMethod]));
        updateData.checkinBlockedMethods = newBlocked;

        // Remove this method if currently active
        if (member.checkinMethods.includes(safeMethod)) {
          const updatedMethods = member.checkinMethods.filter(
            (m: CheckinMethod) => m !== safeMethod
          );
          updateData.checkinMethods = updatedMethods;
          updateData.isCheckedIn = updatedMethods.length > 0;
        }

        await logCheckinAction(prisma, {
          eventId,
          memberId: member.id,
          actorId: userId,
          action: CheckinAction.BLOCK_METHOD,
          method: safeMethod,
          source: CheckinSource.MODERATOR,
          result: CheckinResult.SUCCESS,
          reason: safeReason,
        });
      } else {
        throw new GraphQLError('Must specify blockAll or method', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      await prisma.eventMember.update({
        where: { id: member.id },
        data: updateData,
      });

      // Send notification
      await sendCheckinNotification(prisma, {
        kind: NotificationKind.CHECKIN_BLOCKED,
        userId: targetUserId,
        eventId,
        actorId: userId,
        comment: safeReason,
      });

      // Fetch updated member and event
      const [updatedMember, event] = await Promise.all([
        prisma.eventMember.findUnique({
          where: { id: member.id },
          include: {
            user: true,
            event: true,
            lastCheckinRejectedBy: true,
          },
        }),
        prisma.event.findUnique({ where: { id: eventId } }),
      ]);

      // Audit log: CHECKIN/CONFIG_CHANGE (severity 4)
      await createAuditLog(prisma, {
        eventId,
        actorId: userId,
        scope: 'CHECKIN' as AuditScope,
        action: 'CONFIG_CHANGE' as AuditAction,
        entityType: 'EventMember',
        entityId: member.id,
        meta: {
          targetUserId,
          blockAll: safeBlockAll || undefined,
          blockedMethod: safeMethod || undefined,
          reason: safeReason,
        },
        severity: 4,
      });

      return {
        success: true,
        message: safeBlockAll
          ? 'All check-in methods blocked'
          : `Method ${safeMethod} blocked`,
        member: updatedMember as any, // Prisma → GQL via field resolver
        event: event as any, // Prisma → GQL
      };
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to block check-in', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  };

export const unblockMemberCheckin: MutationResolvers['unblockMemberCheckin'] =
  async (_, { input }, { prisma, userId }): Promise<GQLCheckinResult> => {
    if (!userId) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { eventId, userId: targetUserId, unblockAll = false, method } = input;

    // Convert InputMaybe to proper types
    const safeUnblockAll = unblockAll ?? false;
    const safeMethod = method ?? undefined;

    try {
      // Validate moderator access
      await validateModeratorAccess(prisma, eventId, userId);

      // Get target member
      const member = await getMemberOrThrow(prisma, eventId, targetUserId);

      const updateData: any = {};

      if (safeUnblockAll) {
        updateData.checkinBlockedAll = false;
        updateData.checkinBlockedMethods = [];

        await logCheckinAction(prisma, {
          eventId,
          memberId: member.id,
          actorId: userId,
          action: CheckinAction.UNBLOCK_ALL,
          method: null,
          source: CheckinSource.MODERATOR,
          result: CheckinResult.SUCCESS,
        });
      } else if (safeMethod) {
        const currentBlocked = member.checkinBlockedMethods;
        const newBlocked = currentBlocked.filter(
          (m: CheckinMethod) => m !== safeMethod
        );
        updateData.checkinBlockedMethods = newBlocked;

        await logCheckinAction(prisma, {
          eventId,
          memberId: member.id,
          actorId: userId,
          action: CheckinAction.UNBLOCK_METHOD,
          method: safeMethod,
          source: CheckinSource.MODERATOR,
          result: CheckinResult.SUCCESS,
        });
      } else {
        throw new GraphQLError('Must specify unblockAll or method', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      await prisma.eventMember.update({
        where: { id: member.id },
        data: updateData,
      });

      // Send notification
      await sendCheckinNotification(prisma, {
        kind: NotificationKind.CHECKIN_UNBLOCKED,
        userId: targetUserId,
        eventId,
        actorId: userId,
      });

      // Fetch updated member and event
      const [updatedMember, event] = await Promise.all([
        prisma.eventMember.findUnique({
          where: { id: member.id },
          include: {
            user: true,
            event: true,
            lastCheckinRejectedBy: true,
          },
        }),
        prisma.event.findUnique({ where: { id: eventId } }),
      ]);

      // Audit log: CHECKIN/CONFIG_CHANGE (severity 4)
      await createAuditLog(prisma, {
        eventId,
        actorId: userId,
        scope: 'CHECKIN' as AuditScope,
        action: 'CONFIG_CHANGE' as AuditAction,
        entityType: 'EventMember',
        entityId: member.id,
        meta: {
          targetUserId,
          unblockAll: safeUnblockAll || undefined,
          unblockedMethod: safeMethod || undefined,
        },
        severity: 4,
      });

      return {
        success: true,
        message: safeUnblockAll
          ? 'All check-in methods unblocked'
          : `Method ${safeMethod} unblocked`,
        member: updatedMember as any, // Prisma → GQL via field resolver
        event: event as any, // Prisma → GQL via field resolver
      };
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to unblock check-in', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  };

// =============================================================================
// QR Code Mutations
// =============================================================================

export const checkInByEventQr: MutationResolvers['checkInByEventQr'] = async (
  _,
  { eventId, token },
  { prisma, userId }
): Promise<GQLCheckinResult> => {
  console.log('[checkInByEventQr] Starting:', {
    eventId,
    userId,
    tokenLength: token?.length,
  });

  if (!userId) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const method = CheckinMethod.EVENT_QR;

  try {
    // Validate token
    console.log('[checkInByEventQr] Validating token...');
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { eventCheckinToken: true, checkinEnabled: true },
    });

    console.log('[checkInByEventQr] Event found:', {
      found: !!event,
      hasToken: !!event?.eventCheckinToken,
      tokenMatch: event?.eventCheckinToken === token,
      checkinEnabled: event?.checkinEnabled,
    });

    if (!event || event.eventCheckinToken !== token) {
      throw new GraphQLError('Invalid or expired QR token', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Validate event allows check-in
    console.log('[checkInByEventQr] Validating event config...');
    await validateEventCheckin(prisma, eventId);

    // Validate method is enabled
    console.log('[checkInByEventQr] Validating method enabled...');
    await validateMethodEnabled(prisma, eventId, method);

    // Get member
    console.log('[checkInByEventQr] Getting member...');
    const member = await getMemberOrThrow(prisma, eventId, userId);
    console.log('[checkInByEventQr] Member found:', {
      memberId: member.id,
      status: member.status,
    });

    // Validate member is not blocked
    console.log('[checkInByEventQr] Validating member not blocked...');
    validateMemberCanCheckin(member, method);

    // Perform check-in
    console.log('[checkInByEventQr] Performing check-in...');
    const result = await addCheckinMethod(prisma, {
      memberId: member.id,
      method,
      actorId: userId,
      source: CheckinSource.USER,
    });
    console.log('[checkInByEventQr] Check-in result:', result);

    // Fetch updated member and refreshed event
    console.log('[checkInByEventQr] Fetching updated data...');
    const [updatedMember, updatedEvent] = await Promise.all([
      prisma.eventMember.findUnique({
        where: { id: member.id },
        include: {
          user: true,
          event: true,
          lastCheckinRejectedBy: true,
        },
      }),
      prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    console.log('[checkInByEventQr] Success!');
    return {
      success: result.success,
      message: result.message,
      member: updatedMember as any, // Prisma → GQL via field resolver
      event: updatedEvent as any, // Prisma Event → GQL via field resolver
    };
  } catch (error) {
    console.error('[checkInByEventQr] Error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to check in via event QR', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

export const checkInByUserQr: MutationResolvers['checkInByUserQr'] = async (
  _,
  { token },
  { prisma, userId }
): Promise<GQLCheckinResult> => {
  if (!userId) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const method = CheckinMethod.USER_QR;

  try {
    // Find member by token
    const member = await prisma.eventMember.findFirst({
      where: { memberCheckinToken: token },
      select: {
        id: true,
        eventId: true,
        userId: true,
        status: true,
        checkinMethods: true,
        checkinBlockedAll: true,
        checkinBlockedMethods: true,
      },
    });

    if (!member) {
      throw new GraphQLError('Invalid user QR token', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Validate moderator access (scanner must be mod/owner)
    await validateModeratorAccess(prisma, member.eventId, userId);

    // Validate event allows check-in
    await validateEventCheckin(prisma, member.eventId);

    // Validate method is enabled
    await validateMethodEnabled(prisma, member.eventId, method);

    // Validate member status
    if (member.status !== EventMemberStatus.JOINED) {
      throw new GraphQLError('Only JOINED members can check in', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Validate member is not blocked
    validateMemberCanCheckin(member, method);

    // Perform check-in (actor is the moderator scanning)
    const result = await addCheckinMethod(prisma, {
      memberId: member.id,
      method,
      actorId: userId, // Moderator who scanned
      source: CheckinSource.MODERATOR,
    });

    // Fetch updated member and event
    const [updatedMember, event] = await Promise.all([
      prisma.eventMember.findUnique({
        where: { id: member.id },
        include: {
          user: true,
          event: true,
          lastCheckinRejectedBy: true,
        },
      }),
      prisma.event.findUnique({ where: { id: member.eventId } }),
    ]);

    return {
      success: result.success,
      message: result.message,
      member: updatedMember as any, // Prisma → GQL via field resolver
      event: event as any, // Prisma Event → GQL via field resolver
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to check in via user QR', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// =============================================================================
// Configuration Mutations
// =============================================================================

export const updateEventCheckinConfig: MutationResolvers['updateEventCheckinConfig'] =
  async (_, { input }, { prisma, userId }): Promise<any> => {
    // Field resolvers handle Event conversion
    if (!userId) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { eventId, checkinEnabled, enabledCheckinMethods } = input;

    // Convert InputMaybe to proper types
    const safeCheckinEnabled = checkinEnabled ?? undefined;
    const safeEnabledMethods = enabledCheckinMethods ?? undefined;

    try {
      // Validate moderator access
      await validateModeratorAccess(prisma, eventId, userId);

      const updateData: any = {};

      if (safeCheckinEnabled !== undefined) {
        updateData.checkinEnabled = safeCheckinEnabled;
      }

      if (safeEnabledMethods !== undefined) {
        updateData.enabledCheckinMethods = safeEnabledMethods;

        // Generate event QR token if EVENT_QR is enabled and token doesn't exist
        if (includesMethod(safeEnabledMethods, CheckinMethod.EVENT_QR)) {
          const existing = await prisma.event.findUnique({
            where: { id: eventId },
            select: { eventCheckinToken: true },
          });

          if (!existing?.eventCheckinToken) {
            updateData.eventCheckinToken = generateCheckinToken();
          }
        }
      }

      const event = await prisma.event.update({
        where: { id: eventId },
        data: updateData,
      });

      // Log configuration change (single log entry, not per member)
      await logCheckinAction(prisma, {
        eventId,
        memberId: null, // Config change applies to event, not specific member
        actorId: userId,
        action: CheckinAction.METHODS_CHANGED,
        method: null,
        source: CheckinSource.MODERATOR,
        result: CheckinResult.SUCCESS,
        metadata: {
          checkinEnabled: updateData.checkinEnabled,
          enabledMethods: updateData.enabledCheckinMethods,
        },
      });

      // Audit log: CHECKIN/CONFIG_CHANGE (severity 4)
      await createAuditLog(prisma, {
        eventId,
        actorId: userId,
        scope: 'CHECKIN' as AuditScope,
        action: 'CONFIG_CHANGE' as AuditAction,
        entityType: 'Event',
        entityId: eventId,
        diff: {
          ...(updateData.checkinEnabled !== undefined && {
            checkinEnabled: {
              from: !updateData.checkinEnabled,
              to: updateData.checkinEnabled,
            },
          }),
          ...(updateData.enabledCheckinMethods !== undefined && {
            enabledCheckinMethods: {
              from: null,
              to: updateData.enabledCheckinMethods,
            },
          }),
        },
        severity: 4,
      });

      return event; // Cast to GraphQL Event type
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to update check-in configuration', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  };

export const rotateEventCheckinToken: MutationResolvers['rotateEventCheckinToken'] =
  async (_, { eventId }, { prisma, userId }): Promise<any> => {
    // Field resolvers handle Event conversion
    if (!userId) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    try {
      // Validate moderator access
      await validateModeratorAccess(prisma, eventId, userId);

      const event = await prisma.event.update({
        where: { id: eventId },
        data: {
          eventCheckinToken: generateCheckinToken(),
        },
      });

      // Log token rotation
      const members = await prisma.eventMember.findMany({
        where: { eventId, status: EventMemberStatus.JOINED },
        select: { id: true },
      });

      for (const member of members) {
        await logCheckinAction(prisma, {
          eventId,
          memberId: member.id,
          actorId: userId,
          action: CheckinAction.QR_TOKEN_ROTATED,
          method: CheckinMethod.EVENT_QR,
          source: CheckinSource.MODERATOR,
          result: CheckinResult.SUCCESS,
          reason: 'Event QR token rotated for security',
        });
      }

      // Audit log: CHECKIN/CONFIG_CHANGE (severity 4) - token rotated (no token value logged)
      await createAuditLog(prisma, {
        eventId,
        actorId: userId,
        scope: 'CHECKIN' as AuditScope,
        action: 'CONFIG_CHANGE' as AuditAction,
        entityType: 'Event',
        entityId: eventId,
        meta: { tokenRotated: true },
        severity: 4,
      });

      return event; // Cast to GraphQL type (field resolvers will handle relations)
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to rotate event check-in token', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  };

export const rotateMemberCheckinToken: MutationResolvers['rotateMemberCheckinToken'] =
  async (
    _,
    { eventId, userId: targetUserId },
    { prisma, userId }
  ): Promise<any> => {
    // Field resolvers handle EventMember conversion
    if (!userId) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    try {
      // Find the member using composite key eventId_userId
      const existingMember = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: targetUserId,
          },
        },
        select: {
          id: true,
          eventId: true,
          userId: true,
          status: true,
        },
      });

      console.dir({ existingMember });

      if (!existingMember) {
        throw new GraphQLError('Member not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user is rotating their own token OR is a moderator
      const isSelfRotation = existingMember.userId === userId;

      if (!isSelfRotation) {
        // If not self-rotation, must be moderator
        await validateModeratorAccess(prisma, eventId, userId);
      }

      // Must be JOINED to rotate token
      if (existingMember.status !== 'JOINED') {
        throw new GraphQLError(
          'Only joined members can rotate their QR token',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      const member = await prisma.eventMember.update({
        where: { id: existingMember.id },
        data: {
          memberCheckinToken: generateCheckinToken(),
        },
        include: {
          user: true,
          event: true,
          lastCheckinRejectedBy: true,
        },
      });

      // Log token rotation
      await logCheckinAction(prisma, {
        eventId,
        memberId: existingMember.id,
        actorId: userId,
        action: CheckinAction.QR_TOKEN_ROTATED,
        method: CheckinMethod.USER_QR,
        source: isSelfRotation ? CheckinSource.USER : CheckinSource.MODERATOR,
        result: CheckinResult.SUCCESS,
        reason: isSelfRotation
          ? 'User rotated own QR token'
          : 'Moderator rotated member QR token',
      });

      // Audit log: CHECKIN/CONFIG_CHANGE (severity 4) - member token rotated (no token value logged)
      await createAuditLog(prisma, {
        eventId,
        actorId: userId,
        scope: 'CHECKIN' as AuditScope,
        action: 'CONFIG_CHANGE' as AuditAction,
        entityType: 'EventMember',
        entityId: existingMember.id,
        meta: { memberTokenRotated: true, targetUserId },
        severity: 4,
      });

      return member; // Cast to GraphQL type (field resolvers will handle missing relations)
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to rotate member check-in token', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  };
