/**
 * Admin User Management Mutation Resolvers
 */

import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';
import { requireAdmin, requireAuthUser } from '../shared/auth-guards';

/**
 * Mutation: Admin update user
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
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

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

      return mapUser(updated);
    }
  );

/**
 * Mutation: Admin delete user
 */
export const adminDeleteUserMutation: MutationResolvers['adminDeleteUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminDeleteUser',
    async (_p, { id, anonymize }, ctx: MercuriusContext) => {
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

      // Prevent admins from deleting themselves
      if (id === currentUser.id) {
        throw new GraphQLError('Cannot delete yourself.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (anonymize) {
        // Anonymize user data instead of hard delete
        await prisma.user.update({
          where: { id },
          data: {
            email: `deleted_${id}@anonymized.local`,
            name: 'Deleted User',
            avatarKey: null,
            verifiedAt: null,
            acceptedMarketingAt: null,
            acceptedTermsAt: null,
            locale: 'en', // Reset to default
            timezone: 'UTC', // Reset to default
          },
        });
      } else {
        // Hard delete (cascade will handle related records based on schema)
        await prisma.user.delete({
          where: { id },
        });
      }

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
 * Mutation: Admin suspend user
 */
export const adminSuspendUserMutation: MutationResolvers['adminSuspendUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminSuspendUser',
    async (_p, { id, reason }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

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

      // Suspend user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          suspendedAt: new Date(),
          suspensionReason: reason || null,
        },
      });

      return mapUser(updatedUser);
    }
  );

/**
 * Mutation: Admin unsuspend user
 */
export const adminUnsuspendUserMutation: MutationResolvers['adminUnsuspendUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminUnsuspendUser',
    async (_p, { id }, ctx: MercuriusContext) => {
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

      // Unsuspend user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          suspendedAt: null,
          suspensionReason: null,
        },
      });

      logger.info(
        { userId: id, adminId: currentUser.id },
        'User unsuspended by admin'
      );

      return mapUser(updatedUser);
    }
  );
