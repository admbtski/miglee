import { NotificationEntity, NotificationKind, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { emitPubsub } from '../../lib/pubsub';
import { logger } from '../logger';

/**
 * Send feedback request notifications to all JOINED members of an intent
 * This runs ~1 hour after the event ends
 *
 * TODO: Replace console.log with actual email sending when ready
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
              profile: true,
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
      kind: NotificationKind.NEW_REVIEW, // Reusing NEW_REVIEW or add FEEDBACK_REQUEST
      recipientId: member.userId,
      actorId: null,
      entityType: NotificationEntity.INTENT,
      entityId: intent.id,
      intentId: intent.id,
      title: 'How was the event?',
      body: hasFeedbackQuestions
        ? 'Rate your experience and share your feedback'
        : 'Rate your experience',
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

  // TODO: Send actual emails
  // For now, just log what would be sent
  logger.info(
    { intentId, recipientCount: recipients.length },
    '[runFeedbackRequestForIntent] Would send emails to:'
  );

  for (const member of recipients) {
    const feedbackUrl = `${process.env.APP_URL}/feedback/${intentId}?token=TODO_GENERATE_JWT`;

    console.log('===============================================');
    console.log('📧 EMAIL NOTIFICATION (not actually sent yet)');
    console.log('===============================================');
    console.log(`To: ${member.user.email}`);
    console.log(`User: ${member.user.name || 'User'}`);
    console.log(`Subject: How was "${intent.title}"?`);
    console.log(`---`);
    console.log(`Hi ${member.user.name || 'there'},`);
    console.log('');
    console.log(`Thank you for attending "${intent.title}"!`);
    console.log('');
    console.log('We would love to hear your feedback:');
    console.log(`${feedbackUrl}`);
    console.log('');
    if (hasFeedbackQuestions) {
      console.log('Please rate the event and answer a few quick questions.');
    } else {
      console.log('Please rate the event.');
    }
    console.log('');
    console.log('Thanks,');
    console.log('The Miglee Team');
    console.log('===============================================');
    console.log('');
  }

  logger.info(
    { intentId, recipientCount: recipients.length },
    '[runFeedbackRequestForIntent] Feedback requests sent (console logged)'
  );
}
