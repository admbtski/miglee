import { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';
import crypto from 'crypto';
import {
  sendAccountRestorationEmail,
  generateRestorationUrl,
} from '../../../lib/email';

const GRACE_PERIOD_DAYS = 30;
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Request account restoration - generates token and sends email
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
 */
export const restoreMyAccountMutation: MutationResolvers['restoreMyAccount'] =
  async (_parent, args) => {
    const { email, token } = args;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.deletedAt || !user.restorationToken) {
      throw new Error('Invalid restoration request');
    }

    if (
      user.restorationToken !== token ||
      !user.restorationTokenExpiry ||
      user.restorationTokenExpiry < new Date()
    ) {
      throw new Error('Invalid or expired restoration token');
    }

    const daysSinceDeletion = Math.floor(
      (Date.now() - user.deletedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDeletion > GRACE_PERIOD_DAYS) {
      throw new Error('Grace period expired');
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

    logger.info(
      { userId: user.id, email },
      'User account restored via self-service'
    );

    return true;
  };
