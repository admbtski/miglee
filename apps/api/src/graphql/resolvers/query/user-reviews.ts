import type { QueryResolvers } from '../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { GraphQLError } from 'graphql';

export const userReviewsQuery: QueryResolvers['userReviews'] = async (
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
    if (privacy?.showReviews === 'SELF') {
      throw new GraphQLError('Not authorized to view reviews', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
    if (privacy?.showReviews === 'HIDDEN') {
      return { items: [], total: 0 };
    }
    // MEMBERS check would go here
  }

  // Get reviews written BY this user
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        authorId: userId,
        deletedAt: null,
        // Only show reviews for PUBLIC intents to non-owners
        ...(isOwnProfile
          ? {}
          : {
              intent: {
                visibility: 'PUBLIC',
                deletedAt: null,
                canceledAt: null,
              },
            }),
      },
      include: {
        author: true,
        intent: {
          include: {
            categories: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.review.count({
      where: {
        authorId: userId,
        deletedAt: null,
        ...(isOwnProfile
          ? {}
          : {
              intent: {
                visibility: 'PUBLIC',
                deletedAt: null,
                canceledAt: null,
              },
            }),
      },
    }),
  ]);

  return {
    items,
    total,
  };
};
