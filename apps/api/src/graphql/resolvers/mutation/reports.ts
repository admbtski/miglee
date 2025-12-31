/**
 * Reports Mutation Resolvers
 *
 * Authorization:
 * - createReport: AUTH
 * - updateReportStatus, deleteReport: APP_MOD_OR_ADMIN
 */

import type { Prisma, ReportEntity } from '../../../prisma-client/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapReport, ReportWithGraph } from '../helpers';
import { requireAuth, requireAdminOrModerator } from '../shared/auth-guards';
import { assertReportRateLimit } from '../../../lib/rate-limit/domainRateLimiter';

const REPORT_INCLUDE = {
  reporter: true,
} satisfies Prisma.ReportInclude;

/**
 * Mutation: Create a report
 * Authorization: AUTH
 */
export const createReportMutation: MutationResolvers['createReport'] =
  resolverWithMetrics(
    'Mutation',
    'createReport',
    async (_p, { input }, ctx) => {
      const userId = requireAuth(ctx);

      // RATE LIMIT: Prevent report spam
      await assertReportRateLimit(userId);

      const { entity, entityId, reason } = input;

      // Validate reason
      if (!reason || reason.trim().length === 0) {
        throw new GraphQLError('Report reason cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'reason' },
        });
      }

      if (reason.length > 1000) {
        throw new GraphQLError(
          'Report reason too long (max 1000 characters).',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'reason' },
          }
        );
      }

      // Verify entity exists based on type
      let entityExists = false;
      switch (entity) {
        case 'EVENT': {
          const event = await prisma.event.findUnique({
            where: { id: entityId },
            select: { id: true, deletedAt: true },
          });
          entityExists = !!event && !event.deletedAt;
          break;
        }
        case 'COMMENT': {
          const comment = await prisma.comment.findUnique({
            where: { id: entityId },
            select: { id: true, deletedAt: true },
          });
          entityExists = !!comment && !comment.deletedAt;
          break;
        }
        case 'REVIEW': {
          const review = await prisma.review.findUnique({
            where: { id: entityId },
            select: { id: true, deletedAt: true },
          });
          entityExists = !!review && !review.deletedAt;
          break;
        }
        case 'USER': {
          const reportedUser = await prisma.user.findUnique({
            where: { id: entityId },
            select: { id: true },
          });
          entityExists = !!reportedUser;
          break;
        }
        case 'MESSAGE': {
          const message = await prisma.dmMessage.findUnique({
            where: { id: entityId },
            select: { id: true, deletedAt: true },
          });
          entityExists = !!message && !message.deletedAt;
          break;
        }
        default:
          throw new GraphQLError('Invalid entity type.', {
            extensions: { code: 'BAD_USER_INPUT', field: 'entity' },
          });
      }

      if (!entityExists) {
        throw new GraphQLError('Reported entity not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check for duplicate reports (same user, same entity)
      const existing = await prisma.report.findFirst({
        where: {
          reporterId: userId,
          entity: entity as ReportEntity,
          entityId,
          status: { in: ['OPEN', 'INVESTIGATING'] },
        },
      });

      if (existing) {
        throw new GraphQLError('You have already reported this content.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const report = await prisma.report.create({
        data: {
          reporterId: userId,
          entity: entity as ReportEntity,
          entityId,
          reason: reason.trim(),
          status: 'OPEN',
        },
        include: REPORT_INCLUDE,
      });

      return mapReport(report as unknown as ReportWithGraph);
    }
  );

/**
 * Mutation: Update report status
 * Authorization: APP_MOD_OR_ADMIN
 */
export const updateReportStatusMutation: MutationResolvers['updateReportStatus'] =
  resolverWithMetrics(
    'Mutation',
    'updateReportStatus',
    async (_p, { id, input }, ctx) => {
      requireAdminOrModerator(ctx.user);

      const { status } = input;

      const existing = await prisma.report.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new GraphQLError('Report not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const data: Prisma.ReportUpdateInput = {
        status,
      };

      // Set resolvedAt when status changes to RESOLVED or DISMISSED
      if (status === 'RESOLVED' || status === 'DISMISSED') {
        data.resolvedAt = new Date();
      }

      const updated = await prisma.report.update({
        where: { id },
        data,
        include: REPORT_INCLUDE,
      });

      return mapReport(updated);
    }
  );

/**
 * Mutation: Delete a report
 * Authorization: APP_MOD_OR_ADMIN
 */
export const deleteReportMutation: MutationResolvers['deleteReport'] =
  resolverWithMetrics('Mutation', 'deleteReport', async (_p, { id }, ctx) => {
    requireAdminOrModerator(ctx.user);

    const existing = await prisma.report.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return false; // Idempotent
    }

    await prisma.report.delete({
      where: { id },
    });

    return true;
  });
