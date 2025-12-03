/**
 * Intent Appearance Mutation Resolvers
 * Handles mutations for custom appearance configuration
 */

import type { MutationResolvers } from '../../__generated__/resolvers-types';
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
 * Update intent appearance configuration
 */
export const updateIntentAppearanceMutation: MutationResolvers['updateIntentAppearance'] =
  async (_parent, args, { user }) => {
    const userId = user?.id;
    const { input } = args;

    if (!userId) {
      throw new Error('Authentication required');
    }

    // Verify user is owner/moderator of the intent
    const member = await prisma.intentMember.findFirst({
      where: {
        intentId: input.intentId,
        userId,
        role: { in: ['OWNER', 'MODERATOR'] },
        status: 'JOINED',
      },
    });

    if (!member) {
      throw new Error('Only intent owner/moderator can update appearance');
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
      { userId, intentId: input.intentId, config },
      'Updating intent appearance'
    );

    // Upsert the appearance record
    const appearance = await prisma.intentAppearance.upsert({
      where: { intentId: input.intentId },
      create: {
        intentId: input.intentId,
        config,
      },
      update: {
        config,
      },
    });

    return {
      id: appearance.id,
      intentId: appearance.intentId,
      config: appearance.config,
      createdAt: appearance.createdAt,
      updatedAt: appearance.updatedAt,
    };
  };

