/**
 * Event Audit Log Mutation Resolvers
 *
 * Mutations for managing event audit logs.
 */

import { GraphQLError } from 'graphql';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { validateModeratorAccess } from '../helpers/checkin';
import { runAuditLogArchive } from '../../../workers/audit-archive/run-audit-archive';
import { logger } from '../../../lib/pino';

/**
 * Manually archive audit logs for an event
 *
 * Access: Owner, Moderator, App Admin
 * Archives logs to storage (S3 or local) and removes from hot table.
 */
export const archiveEventAuditLogs: MutationResolvers['archiveEventAuditLogs'] =
  async (_, { eventId }, { prisma, user }) => {
    const userId = user?.id;
    if (!userId) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    try {
      // Validate owner access (only owner can manually archive)
      await validateModeratorAccess(prisma, eventId, userId);

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          auditArchivedAt: true,
          sponsorshipPlan: true,
        },
      });

      if (!event) {
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if already archived
      if (event.auditArchivedAt) {
        throw new GraphQLError('Audit logs already archived for this event', {
          extensions: {
            code: 'BAD_REQUEST',
            archivedAt: event.auditArchivedAt.toISOString(),
          },
        });
      }

      // Check PRO plan requirement
      if (event.sponsorshipPlan !== 'PRO') {
        throw new GraphQLError('Manual audit archive requires PRO plan', {
          extensions: { code: 'FORBIDDEN', requiredPlan: 'PRO' },
        });
      }

      // Count logs before archiving
      const logCount = await prisma.eventAuditLog.count({
        where: { eventId },
      });

      if (logCount === 0) {
        // No logs to archive, just mark as archived
        await prisma.event.update({
          where: { id: eventId },
          data: { auditArchivedAt: new Date() },
        });

        return {
          success: true,
          eventId,
          archivedCount: 0,
          archiveLocation: null,
          archivedAt: new Date(),
        };
      }

      logger.info(
        { eventId, logCount, userId },
        '[archiveEventAuditLogs] Starting manual archive...'
      );

      // Run the archive process
      await runAuditLogArchive(eventId);

      // Fetch the updated event to get archive location
      const updatedEvent = await prisma.event.findUnique({
        where: { id: eventId },
        select: { auditArchivedAt: true },
      });

      logger.info(
        { eventId, logCount, userId },
        '[archiveEventAuditLogs] Manual archive completed.'
      );

      return {
        success: true,
        eventId,
        archivedCount: logCount,
        archiveLocation: `audit-archives/${eventId}.jsonl.gz`,
        archivedAt: updatedEvent?.auditArchivedAt || new Date(),
      };
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      logger.error(
        { err: error, eventId, userId },
        '[archiveEventAuditLogs] Failed to archive audit logs.'
      );
      throw new GraphQLError('Failed to archive audit logs', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  };

