import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { IntentMemberResolvers } from '../../__generated__/resolvers-types';
import { mapIntent } from '../helpers';

/**
 * Field resolver: IntentMember.intent
 * Fetches the Intent for a given IntentMember
 */
export const intentMemberIntentResolver: IntentMemberResolvers['intent'] =
  resolverWithMetrics('IntentMember', 'intent', async (parent, _args, _ctx) => {
    const intentId = parent.intentId;
    if (!intentId) {
      throw new GraphQLError('IntentMember.intentId is required', {
        extensions: { code: 'BAD_REQUEST' },
      });
    }

    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
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

    if (!intent) {
      throw new GraphQLError(`Intent not found: ${intentId}`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return mapIntent(intent);
  });
