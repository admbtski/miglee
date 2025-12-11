/**
 * EventInviteLink Field Resolvers
 */

import { prisma } from '../../../lib/prisma';
import type {
  EventInviteLinkResolvers,
  EventInviteLinkUsage,
} from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';

export const eventInviteLinkFieldResolvers: Partial<EventInviteLinkResolvers> =
  {
    uses: async (parent): Promise<EventInviteLinkUsage[]> => {
      const uses = await prisma.eventInviteLinkUsage.findMany({
        where: { linkId: parent.id },
        include: { user: true },
        orderBy: { usedAt: 'desc' },
      });

      return uses.map(
        (usage): EventInviteLinkUsage => ({
          id: usage.id,
          linkId: usage.linkId,
          userId: usage.userId,
          usedAt: usage.usedAt,
          user: mapUser(usage.user),
        })
      );
    },
  };
