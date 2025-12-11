/**
 * Event Appearance Mutation Resolvers
 * Handles mutations for custom appearance configuration
 */

import type {
  MutationResolvers,
  EventAppearance,
} from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';

/**
 * Appearance config structure
 */
interface AppearanceConfig {
  card: {
    background: string | null;
    shadow: string | null;
  };
  detail: {
    background: string | null;
    panel: {
      background: string | null;
      shadow: string | null;
    };
  };
}

/**
 * Update event appearance configuration
 */
export const updateEventAppearanceMutation: MutationResolvers['updateEventAppearance'] =
  async (_parent, args, { user }) => {
    const userId = user?.id;
    const { input } = args;

    if (!userId) {
      throw new Error('Authentication required');
    }

    // Verify user is owner/moderator of the event
    const member = await prisma.eventMember.findFirst({
      where: {
        eventId: input.eventId,
        userId,
        role: { in: ['OWNER', 'MODERATOR'] },
        status: 'JOINED',
      },
    });

    if (!member) {
      throw new Error('Only event owner/moderator can update appearance');
    }

    // Build the config object
    const config: AppearanceConfig = {
      card: {
        background: input.card?.background ?? null,
        shadow: input.card?.shadow ?? null,
      },
      detail: {
        background: input.detail?.background ?? null,
        panel: {
          background: input.detail?.panel?.background ?? null,
          shadow: input.detail?.panel?.shadow ?? null,
        },
      },
    };

    logger.info(
      { userId, eventId: input.eventId, config },
      'Updating event appearance'
    );

    // Upsert the appearance record
    const appearance = await prisma.eventAppearance.upsert({
      where: { eventId: input.eventId },
      create: {
        eventId: input.eventId,
        config,
      },
      update: {
        config,
      },
    });

    return {
      id: appearance.id,
      eventId: appearance.eventId,
      config: appearance.config,
      createdAt: appearance.createdAt,
      updatedAt: appearance.updatedAt,
      event: null, // Field resolver handles this
    } as unknown as EventAppearance;
  };
