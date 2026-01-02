import { GraphQLError } from 'graphql';
import { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';
import crypto from 'crypto';
import {
  sendAccountRestorationEmail,
  generateRestorationUrl,
} from '../../../lib/email';
import {
  trackRestorationRequested,
  trackAccountRestored,
  traceAccountOperation,
} from '../../../lib/observability';

const GRACE_PERIOD_DAYS = 30;
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Request account restoration - generates token and sends email
 *
 * CRITICAL for observability: Spike in restoration requests may indicate phishing or deliverability issues.
 */
export const requestAccountRestorationMutation: MutationResolvers['requestAccountRestoration'] =
  async (_parent, args) => {
    const { email } = args;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if account exists or deletion status for security
    if (!user || !user.deletedAt) {
      logger.info({ email }, 'Restoration requested for non-deleted account');
      return true;
    }

    // Track restoration request
    trackRestorationRequested({
      userId: user.id,
      email,
    });

    const daysSinceDeletion = Math.floor(
      (Date.now() - user.deletedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDeletion > GRACE_PERIOD_DAYS) {
      logger.warn(
        { userId: user.id, daysSinceDeletion },
        'Account restoration requested but grace period expired'
      );
      // Still return true to not reveal account state
      return true;
    }

    // Generate restoration token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(
      Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    );

    // Store token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        restorationToken: token,
        restorationTokenExpiry: tokenExpiry,
      },
    });

    // Send restoration email
    const restorationUrl = generateRestorationUrl(email, token);

    try {
      await sendAccountRestorationEmail({
        to: email,
        userName: user.name,
        restorationUrl,
        expiresInHours: TOKEN_EXPIRY_HOURS,
      });

      logger.info(
        { userId: user.id, tokenExpiry },
        'Account restoration email sent'
      );
    } catch (error) {
      logger.error(
        { userId: user.id, error },
        'Failed to send restoration email'
      );
      // Don't throw - we still return true to not reveal account state
    }

    return true;
  };

/**
 * Restore account using token from email
 *
 * CRITICAL for observability: Account restoration is a high-impact action.
 */
export const restoreMyAccountMutation: MutationResolvers['restoreMyAccount'] =
  async (_parent, args) => {
    const { email, token } = args;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.deletedAt || !user.restorationToken) {
      throw new GraphQLError('Invalid restoration request', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    return traceAccountOperation(
      'restore',
      { userId: user.id },
      async (span) => {
        span.setAttribute('account.has_token', true);

        if (
          user.restorationToken !== token ||
          !user.restorationTokenExpiry ||
          user.restorationTokenExpiry < new Date()
        ) {
          trackAccountRestored({
            userId: user.id,
            actorId: user.id,
            success: false,
            errorReason: 'invalid_or_expired_token',
          });

          throw new GraphQLError('Invalid or expired restoration token', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const daysSinceDeletion = Math.floor(
          (Date.now() - user.deletedAt!.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceDeletion > GRACE_PERIOD_DAYS) {
          trackAccountRestored({
            userId: user.id,
            actorId: user.id,
            success: false,
            errorReason: 'grace_period_expired',
          });

          throw new GraphQLError('Grace period expired', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Restore account
        await prisma.user.update({
          where: { id: user.id },
          data: {
            deletedAt: null,
            deletedReason: null,
            restorationToken: null,
            restorationTokenExpiry: null,
          },
        });

        // Track successful restoration
        trackAccountRestored({
          userId: user.id,
          actorId: user.id,
          success: true,
        });

        logger.info(
          { userId: user.id, email },
          'User account restored via self-service'
        );

        return true;
      }
    );
  };
