/**
 * Admin User Management Mutation Resolvers
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';
import { requireAdmin } from '../shared/auth-guards';

/**
 * Mutation: Admin update user
 */
export const adminUpdateUserMutation: MutationResolvers['adminUpdateUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminUpdateUser',
    async (_p, { id, input }, { user }) => {
      requireAdmin(user);

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
      if (id === user.id && input.role && input.role !== user.role) {
        throw new GraphQLError('Cannot change your own role.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Build update data
      const updateData: any = {};
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

      return mapUser(updated as any);
    }
  );

/**
 * Mutation: Admin delete user
 */
export const adminDeleteUserMutation: MutationResolvers['adminDeleteUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminDeleteUser',
    async (_p, { id, anonymize }, { user }) => {
      requireAdmin(user);

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
      if (id === user.id) {
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
            locale: null,
            tz: null,
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
    async (_p, { input }, { user }) => {
      requireAdmin(user);

      const { email, name, role = 'USER' } = input;

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
          name: name || email.split('@')[0],
          role,
          verifiedAt: null, // Not verified until they click the link
        },
      });

      // TODO: Send invitation email with verification link
      // This would typically be done via a background job or email service

      return mapUser(newUser as any);
    }
  );

/**
 * Mutation: Admin create user
 */
export const adminCreateUserMutation: MutationResolvers['adminCreateUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminCreateUser',
    async (_p, { input }, { user }) => {
      requireAdmin(user);

      const { email, name, role = 'USER', verified = false } = input;

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
          name: name || email.split('@')[0],
          role,
          verifiedAt: verified ? new Date() : null,
        },
      });

      return mapUser(newUser as any);
    }
  );

/**
 * Mutation: Admin suspend user
 */
export const adminSuspendUserMutation: MutationResolvers['adminSuspendUser'] =
  resolverWithMetrics(
    'Mutation',
    'adminSuspendUser',
    async (_p, { id, reason }, { user }) => {
      requireAdmin(user);

      // Prevent self-suspension
      if (id === user?.id) {
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
    async (_p, { id }, { user }) => {
      requireAdmin(user);

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
        { userId: id, adminId: user?.id },
        'User unsuspended by admin'
      );

      return mapUser(updatedUser as any);
    }
  );
