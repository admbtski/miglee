import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { EventMemberResolvers } from '../../__generated__/resolvers-types';
import { mapEvent } from '../helpers';

/**
 * Field resolver: EventMember.event
 * Fetches the Event for a given EventMember
 */
export const eventMemberEventResolver: EventMemberResolvers['event'] =
  resolverWithMetrics('EventMember', 'event', async (parent, _args, _ctx) => {
    const eventId = parent.eventId;
    if (!eventId) {
      throw new GraphQLError('EventMember.eventId is required', {
        extensions: { code: 'BAD_REQUEST' },
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
            addedBy: true,
          },
        },
        categories: true,
        tags: true,
        canceledBy: true,
        deletedBy: true,
      },
    });

    if (!event) {
      throw new GraphQLError(`Event not found: ${eventId}`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return mapEvent(event);
  });
