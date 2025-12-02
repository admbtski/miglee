/**
 * FAQ Resolvers
 * Handles frequently asked questions for events
 */

import { GraphQLError } from 'graphql';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';

export const faqMutations: Partial<MutationResolvers> = {
  /**
   * Update (replace) all FAQs for an intent
   * Only owner/moderators can update FAQs
   * This is a bulk replace operation - all existing FAQs are deleted and replaced
   */
  updateIntentFaqs: async (_parent, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('You must be logged in to update FAQs', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { intentId, faqs } = input;

    // Validate input
    if (faqs.length > 50) {
      throw new GraphQLError('Cannot add more than 50 FAQs', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Validate each FAQ
    for (const faq of faqs) {
      if (!faq.question || faq.question.trim().length === 0) {
        throw new GraphQLError('FAQ question cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (faq.question.length > 500) {
        throw new GraphQLError('FAQ question cannot exceed 500 characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!faq.answer || faq.answer.trim().length === 0) {
        throw new GraphQLError('FAQ answer cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (faq.answer.length > 2000) {
        throw new GraphQLError('FAQ answer cannot exceed 2000 characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    // Check if intent exists
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: {
            userId: user.id,
            status: 'JOINED',
            role: {
              in: ['OWNER', 'MODERATOR'],
            },
          },
          select: { role: true },
        },
      },
    });

    if (!intent) {
      throw new GraphQLError('Intent not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions (owner or moderator)
    const isOwner = intent.ownerId === user.id;
    const isModerator = intent.members.some((m) => m.role === 'MODERATOR');

    if (!isOwner && !isModerator) {
      throw new GraphQLError('Only event owner or moderators can manage FAQs', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Delete all existing FAQs and create new ones in a transaction
    const updatedFaqs = await prisma.$transaction(async (tx) => {
      // Delete all existing FAQs
      await tx.intentFaq.deleteMany({
        where: { intentId },
      });

      // Create new FAQs with order
      const createdFaqs = await Promise.all(
        faqs.map((faq, index) =>
          tx.intentFaq.create({
            data: {
              intentId,
              question: faq.question.trim(),
              answer: faq.answer.trim(),
              order: index,
            },
          })
        )
      );

      return createdFaqs;
    });

    return updatedFaqs as any;
  },
};
