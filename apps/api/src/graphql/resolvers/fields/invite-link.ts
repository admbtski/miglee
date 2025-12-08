/**
 * Field resolvers for EventInviteLink
 */

import { prisma } from '../../../lib/prisma';
import type { EventInviteLinkResolvers } from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';

export const eventInviteLinkFieldResolvers: EventInviteLinkResolvers = {
  uses: async (parent, _args, { user: viewer }) => {
    // Fetch uses with user data
    const uses = await prisma.eventInviteLinkUsage.findMany({
      where: { linkId: parent.id },
      include: { user: true },
      orderBy: { usedAt: 'desc' },
    });

    return uses.map((usage) => ({
      id: usage.id,
      linkId: usage.linkId,
      userId: usage.userId,
      usedAt: usage.usedAt,
      user: mapUser(usage.user, viewer?.id),
    }));
  },
};
