/**
 * Field resolvers for IntentInviteLink
 */

import { prisma } from '../../../lib/prisma';
import type { IntentInviteLinkResolvers } from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';

export const IntentInviteLinkFieldResolvers: IntentInviteLinkResolvers = {
  uses: async (parent, _args, { user: viewer }) => {
    // Fetch uses with user data
    const uses = await prisma.intentInviteLinkUsage.findMany({
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
