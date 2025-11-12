import type { QueryResolvers } from '../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { GraphQLError } from 'graphql';

export const userEventsQuery: QueryResolvers['userEvents'] = async (
  _parent,
  args,
  context
) => {
  const { userId, limit = 20, offset = 0 } = args;

  // Check if user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      privacy: true,
    },
  });

  if (!targetUser) {
    throw new GraphQLError('User not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const viewerId = context.user?.id;
  const isOwnProfile = viewerId === userId;

  // Check privacy settings
  if (!isOwnProfile) {
    const privacy = targetUser.privacy;
    if (privacy?.showEvents === 'SELF') {
      throw new GraphQLError('Not authorized to view events', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
    if (privacy?.showEvents === 'HIDDEN') {
      return { items: [], total: 0 };
    }
    // MEMBERS check would go here
  }

  // Get events where user is owner or joined member
  const [items, total] = await Promise.all([
    prisma.intent.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                status: 'JOINED',
              },
            },
          },
        ],
        deletedAt: null,
        canceledAt: null,
        // Only show PUBLIC events to non-owners
        ...(isOwnProfile ? {} : { visibility: 'PUBLIC' }),
      },
      include: {
        categories: true,
        owner: true,
      },
      orderBy: { startAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.intent.count({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                status: 'JOINED',
              },
            },
          },
        ],
        deletedAt: null,
        canceledAt: null,
        ...(isOwnProfile ? {} : { visibility: 'PUBLIC' }),
      },
    }),
  ]);

  return {
    items,
    total,
  };
};
