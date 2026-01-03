/**
 * Admin User Management Mutation Resolvers
 *
 * OBSERVABILITY: All admin actions require MANDATORY audit logging
 */

import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';
import { requireAdmin, requireAuthUser } from '../shared/auth-guards';
import {
  trackAdminAction,
  trackAccountDeleted,
  trackAccountSuspended,
  trackAccountUnsuspended,
} from '../../../lib/observability';

/**
 * Mutation: Admin update user (with SUPERADMIN control for role changes)
 */
export const adminUpdateUserMutation: MutationResolvers['adminUpdateUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminUpdateUser',
    async (_p, { id, input }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        throw new GraphQLError('User not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Prevent admins from changing their own role
      if (
        id === currentUser.id &&
        input.role &&
        input.role !== currentUser.role
      ) {
        throw new GraphQLError('Cannot change your own role.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // ✅ SECURITY: Only ADMIN can grant ADMIN role
      // TODO: Add SUPERADMIN role for better granularity
      if (input.role === 'ADMIN' && currentUser.role !== 'ADMIN') {
        throw new GraphQLError(
          'Only administrators can grant ADMIN role. Contact a superadmin.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      // ✅ SECURITY: Prevent downgrading other ADMINs (unless you are ADMIN)
      if (
        targetUser.role === 'ADMIN' &&
        input.role &&
        input.role !== 'ADMIN' &&
        currentUser.role !== 'ADMIN'
      ) {
        throw new GraphQLError(
          'Only administrators can change roles of other administrators.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      // Snapshot before update
      const before = {
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        verifiedAt: targetUser.verifiedAt,
        locale: targetUser.locale,
      };

      // Build update data
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.role !== undefined) updateData.role = input.role;
      if (input.locale !== undefined) updateData.locale = input.locale;

      // Handle verifiedAt - can be set to null or a date
      if (input.verifiedAt !== undefined) {
        updateData.verifiedAt = input.verifiedAt;
      }

      // Update user
      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      const after = {
        name: updated.name,
        email: updated.email,
        role: updated.role,
        verifiedAt: updated.verifiedAt,
        locale: updated.locale,
      };

      // ✅ AUDIT: Critical fields changed (role, verifiedAt)
      const isCriticalChange =
        input.role !== undefined || input.verifiedAt !== undefined;

      if (isCriticalChange) {
        await prisma.userAuditLog.create({
          data: {
            targetUserId: id,
            action:
              input.role !== undefined ? 'UPDATE_ROLE' : 'UPDATE_VERIFIED',
            actorId: currentUser.id,
            reason:
              input.role !== undefined
                ? `Role changed from ${before.role} to ${after.role}`
                : `Verification status changed`,
            before: before as never,
            after: after as never,
            diff: updateData as never,
            severity: input.role !== undefined ? 4 : 3, // Role change is high severity
            ipAddress: ctx.request.ip,
            userAgent: ctx.request.headers['user-agent'] || null,
          },
        });
      }

      // Track admin action (legacy telemetry)
      trackAdminAction({
        adminId: currentUser.id,
        action: 'update_user',
        targetType: 'user',
        targetId: id,
        diff: updateData,
      });

      return mapUser(updated);
    }
  );

/**
 * Mutation: Admin delete user (with mandatory reason and optional anonymization)
 */
export const adminDeleteUserMutation: MutationResolvers['adminDeleteUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminDeleteUser',
    async (_p, { id, input }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      const { deleteReason, anonymize = true } = input;

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        throw new GraphQLError('User not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Prevent admins from deleting themselves
      if (id === currentUser.id) {
        throw new GraphQLError('Cannot delete yourself.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Snapshot before deletion
      const before = {
        email: targetUser.email,
        name: targetUser.name,
        avatarKey: targetUser.avatarKey,
        verifiedAt: targetUser.verifiedAt,
        deletedAt: targetUser.deletedAt,
      };

      let after: Record<string, unknown>;

      if (anonymize) {
        // Anonymize user data (soft delete with PII removal)
        const updated = await prisma.user.update({
          where: { id },
          data: {
            email: `deleted_${id}@anonymized.local`,
            name: `deleted_user_${id.substring(0, 8)}`,
            avatarKey: null,
            verifiedAt: null,
            acceptedMarketingAt: null,
            acceptedTermsAt: null,
            suspendedAt: null,
            suspendedUntil: null,
            suspensionReason: null,
            suspendedById: null,
            locale: 'en', // Reset to default
            timezone: 'UTC', // Reset to default
            deletedAt: new Date(),
            deletedById: currentUser.id,
            deletedReason: deleteReason,
          },
        });

        after = {
          email: updated.email,
          name: updated.name,
          avatarKey: null,
          verifiedAt: null,
          deletedAt: updated.deletedAt,
        };
      } else {
        // Soft delete with reason (retain PII for compliance/recovery)
        const updated = await prisma.user.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedById: currentUser.id,
            deletedReason: deleteReason,
          },
        });

        after = {
          email: updated.email,
          name: updated.name,
          deletedAt: updated.deletedAt,
        };
      }

      // ✅ AUDIT: User deletion (mandatory for compliance)
      await prisma.userAuditLog.create({
        data: {
          targetUserId: id,
          action: 'DELETE',
          actorId: currentUser.id,
          reason: deleteReason,
          before: before as never,
          after: after as never,
          meta: { anonymize: anonymize ? true : false } as never,
          severity: 5, // Critical action
          ipAddress: ctx.request.ip,
          userAgent: ctx.request.headers['user-agent'] || null,
        },
      });

      // Track admin action (legacy telemetry)
      trackAdminAction({
        adminId: currentUser.id,
        action: 'delete_user',
        targetType: 'user',
        targetId: id,
        diff: { anonymize, deleteReason },
      });

      // Track account deletion specifically
      trackAccountDeleted({
        userId: id,
        deletionType: 'admin',
        actorId: currentUser.id,
        anonymize: anonymize ? true : false,
      });

      return true;
    }
  );

/**
 * Mutation: Admin invite user
 */
export const adminInviteUserMutation: MutationResolvers['adminInviteUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminInviteUser',
    async (_p, { input }, ctx: MercuriusContext) => {
      requireAuthUser(ctx);
      requireAdmin(ctx.user);

      // Validate required fields
      const email = input.email ?? '';
      if (!email) {
        throw new GraphQLError('Email is required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const name = input.name ?? input.email?.split('@')[0] ?? 'User';
      const role = input.role ?? 'USER';

      // Check if user with this email already exists
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        throw new GraphQLError('User with this email already exists.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Create user (unverified - they will need to verify email)
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          role,
          verifiedAt: null, // Not verified until they click the link
        },
      });

      // TODO: Send invitation email with verification link
      // This would typically be done via a background job or email service

      return mapUser(newUser);
    }
  );

/**
 * Mutation: Admin create user
 */
export const adminCreateUserMutation: MutationResolvers['adminCreateUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminCreateUser',
    async (_p, { input }, ctx: MercuriusContext) => {
      requireAuthUser(ctx);
      requireAdmin(ctx.user);

      // Validate required fields
      const email = input.email ?? '';
      if (!email) {
        throw new GraphQLError('Email is required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const name = input.name ?? input.email?.split('@')[0] ?? 'User';
      const role = input.role ?? 'USER';
      const verified = input.verified ?? false;

      // Check if user with this email already exists
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        throw new GraphQLError('User with this email already exists.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          role,
          verifiedAt: verified ? new Date() : null,
        },
      });

      return mapUser(newUser);
    }
  );

/**
 * Mutation: Admin suspend user (with mandatory reason and optional expiry)
 */
export const adminSuspendUserMutation: MutationResolvers['adminSuspendUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminSuspendUser',
    async (_p, { id, input }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      const { reason, suspendedUntil } = input;

      // Prevent self-suspension
      if (id === currentUser.id) {
        throw new GraphQLError('Cannot suspend your own account.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        throw new GraphQLError('User not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Validate suspendedUntil (must be in the future)
      if (suspendedUntil) {
        const futureDate = new Date(suspendedUntil);
        const now = new Date();
        if (futureDate <= now) {
          throw new GraphQLError(
            'suspendedUntil must be a future date. Use null for permanent suspension.',
            {
              extensions: { code: 'BAD_USER_INPUT' },
            }
          );
        }
      }

      // Snapshot before suspension
      const before = {
        suspendedAt: targetUser.suspendedAt,
        suspendedUntil: targetUser.suspendedUntil,
        suspensionReason: targetUser.suspensionReason,
        suspendedById: targetUser.suspendedById,
      };

      // Suspend user
      const now = new Date();
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          suspendedAt: now,
          suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
          suspensionReason: reason,
          suspendedById: currentUser.id,
        },
      });

      const after = {
        suspendedAt: updatedUser.suspendedAt,
        suspendedUntil: updatedUser.suspendedUntil,
        suspensionReason: updatedUser.suspensionReason,
        suspendedById: updatedUser.suspendedById,
      };

      // ✅ AUDIT: User suspension (mandatory for compliance)
      await prisma.userAuditLog.create({
        data: {
          targetUserId: id,
          action: 'SUSPEND',
          actorId: currentUser.id,
          reason,
          before: before as never,
          after: after as never,
          diff: {
            suspendedAt: { from: before.suspendedAt, to: after.suspendedAt },
            suspendedUntil: {
              from: before.suspendedUntil,
              to: after.suspendedUntil,
            },
            suspensionReason: {
              from: before.suspensionReason,
              to: after.suspensionReason,
            },
          } as never,
          meta: {
            suspensionType: suspendedUntil ? 'temporary' : 'permanent',
          } as never,
          severity: 4, // High severity
          ipAddress: ctx.request.ip,
          userAgent: ctx.request.headers['user-agent'] || null,
        },
      });

      // Track admin action (legacy telemetry)
      trackAdminAction({
        adminId: currentUser.id,
        action: 'suspend_user',
        targetType: 'user',
        targetId: id,
        reason,
      });

      // Track account suspension specifically
      trackAccountSuspended({
        userId: id,
        adminId: currentUser.id,
        reason,
      });

      return mapUser(updatedUser);
    }
  );

/**
 * Mutation: Admin unsuspend user (with optional reason)
 */
export const adminUnsuspendUserMutation: MutationResolvers['adminUnsuspendUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminUnsuspendUser',
    async (_p, { id, reason }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        throw new GraphQLError('User not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Snapshot before unsuspension
      const before = {
        suspendedAt: targetUser.suspendedAt,
        suspendedUntil: targetUser.suspendedUntil,
        suspensionReason: targetUser.suspensionReason,
        suspendedById: targetUser.suspendedById,
      };

      // Unsuspend user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          suspendedAt: null,
          suspendedUntil: null,
          suspensionReason: null,
          suspendedById: null,
        },
      });

      const after = {
        suspendedAt: null,
        suspendedUntil: null,
        suspensionReason: null,
        suspendedById: null,
      };

      // ✅ AUDIT: User unsuspension (mandatory for compliance)
      await prisma.userAuditLog.create({
        data: {
          targetUserId: id,
          action: 'UNSUSPEND',
          actorId: currentUser.id,
          reason: reason || 'Manual unsuspension by admin',
          before: before as never,
          after: after as never,
          diff: {
            suspendedAt: { from: before.suspendedAt, to: null },
            suspendedUntil: { from: before.suspendedUntil, to: null },
            suspensionReason: { from: before.suspensionReason, to: null },
          } as never,
          severity: 3, // Moderate severity
          ipAddress: ctx.request.ip,
          userAgent: ctx.request.headers['user-agent'] || null,
        },
      });

      // Track admin action (legacy telemetry)
      trackAdminAction({
        adminId: currentUser.id,
        action: 'unsuspend_user',
        targetType: 'user',
        targetId: id,
        reason: reason || undefined,
      });

      // Track account unsuspension specifically
      trackAccountUnsuspended({
        userId: id,
        adminId: currentUser.id,
      });

      logger.info(
        { userId: id, adminId: currentUser.id },
        'User unsuspended by admin'
      );

      return mapUser(updatedUser);
    }
  );
