import { NotificationEntity, NotificationKind, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { emitPubsub } from '../../lib/pubsub';
import { logger } from '../logger';
import { sendFeedbackRequestEmail, generateFeedbackUrl } from '../../lib/email';

/**
 * Send feedback request notifications to all JOINED members of an intent
 * This runs ~1 hour after the event ends
 */
export async function runFeedbackRequestForIntent(intentId: string) {
  logger.info({ intentId }, '[runFeedbackRequestForIntent] Starting...');

  // Fetch intent with members
  const intent = await prisma.intent.findUnique({
    where: { id: intentId },
    include: {
      members: {
        where: { status: 'JOINED' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      feedbackQuestions: true,
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!intent) {
    logger.warn({ intentId }, '[runFeedbackRequestForIntent] Intent not found');
    return;
  }

  // Don't send if event is deleted or cancelled
  if (intent.deletedAt || intent.canceledAt) {
    logger.info(
      { intentId },
      '[runFeedbackRequestForIntent] Intent deleted/cancelled, skipping'
    );
    return;
  }

  // Don't send if event hasn't ended yet
  if (intent.endAt > new Date()) {
    logger.info(
      { intentId, endAt: intent.endAt },
      '[runFeedbackRequestForIntent] Event not ended yet, skipping'
    );
    return;
  }

  const recipients = intent.members;
  if (recipients.length === 0) {
    logger.info(
      { intentId },
      '[runFeedbackRequestForIntent] No JOINED members, skipping'
    );
    return;
  }

  logger.info(
    { intentId, recipientCount: recipients.length },
    '[runFeedbackRequestForIntent] Sending feedback requests...'
  );

  // Create in-app notifications
  const hasFeedbackQuestions = intent.feedbackQuestions.length > 0;

  await prisma.notification.createMany({
    data: recipients.map((member) => ({
      kind: NotificationKind.NEW_REVIEW,
      recipientId: member.userId,
      actorId: null,
      entityType: NotificationEntity.INTENT,
      entityId: intent.id,
      intentId: intent.id,
      title: 'Jak oceniasz wydarzenie?',
      body: hasFeedbackQuestions
        ? 'Wystawimy ocenę i podziel się swoją opinią'
        : 'Wystaw ocenę wydarzenia',
      dedupeKey: `feedback_request:${member.userId}:${intent.id}`,
      createdAt: new Date(),
      data: {
        intentId: intent.id,
        hasFeedback: hasFeedbackQuestions,
      } as Prisma.InputJsonValue,
    })),
    skipDuplicates: true,
  });

  // Emit pubsub events for in-app notifications
  await Promise.all(
    recipients.map(async (member) => {
      const notif = await prisma.notification.findFirst({
        where: {
          recipientId: member.userId,
          intentId: intent.id,
          kind: NotificationKind.NEW_REVIEW,
          dedupeKey: `feedback_request:${member.userId}:${intent.id}`,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: true,
          actor: true,
          intent: {
            include: {
              categories: true,
              tags: true,
              owner: true,
            },
          },
        },
      });

      if (notif) {
        await emitPubsub(`NOTIFICATION_ADDED:${member.userId}`, {
          notificationAdded: notif,
        });
      }
      await emitPubsub(`NOTIFICATION_BADGE:${member.userId}`, {
        notificationBadgeChanged: { recipientId: member.userId },
      });
    })
  );

  // Send actual emails via Resend
  logger.info(
    { intentId, recipientCount: recipients.length },
    '[runFeedbackRequestForIntent] Sending emails via Resend...'
  );

  const emailResults = await Promise.allSettled(
    recipients.map(async (member) => {
      const feedbackUrl = generateFeedbackUrl(intentId, member.userId);

      // Create/update feedback tracking
      await prisma.feedbackTracking.upsert({
        where: {
          intentId_userId: {
            intentId,
            userId: member.userId,
          },
        },
        update: {
          emailSentAt: new Date(),
          channel: 'EMAIL',
        },
        create: {
          intentId,
          userId: member.userId,
          emailSentAt: new Date(),
          channel: 'EMAIL',
        },
      });

      return sendFeedbackRequestEmail({
        to: member.user.email,
        userName: member.user.name || 'tam',
        intentTitle: intent.title,
        intentId: intent.id,
        feedbackUrl,
        hasFeedbackQuestions,
      });
    })
  );

  // Log results
  const successCount = emailResults.filter(
    (r) => r.status === 'fulfilled'
  ).length;
  const failureCount = emailResults.filter(
    (r) => r.status === 'rejected'
  ).length;

  logger.info(
    { intentId, successCount, failureCount, total: recipients.length },
    '[runFeedbackRequestForIntent] Email sending completed'
  );

  // Log failures
  emailResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error(
        {
          intentId,
          recipientEmail: recipients[index].user.email,
          error: result.reason,
        },
        '[runFeedbackRequestForIntent] Failed to send email'
      );
    }
  });
}
