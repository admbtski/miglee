import {
  NotificationEntity,
  NotificationKind,
  Prisma,
} from '../../prisma-client/client';
import { prisma } from '../../lib/prisma';
import { emitPubsub } from '../../lib/pubsub';
import { logger } from '../logger';
import { sendFeedbackRequestEmail, generateFeedbackUrl } from '../../lib/email';

/**
 * Send feedback request notifications to all JOINED members of an event
 * This runs ~1 hour after the event ends
 */
export async function runFeedbackRequestForEvent(eventId: string) {
  logger.info({ eventId }, '[runFeedbackRequestForEvent] Starting...');

  // Fetch event with members
  const event = await prisma.event.findUnique({
    where: { id: eventId },
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

  if (!event) {
    logger.warn({ eventId }, '[runFeedbackRequestForEvent] Event not found');
    return;
  }

  // Don't send if event is deleted or cancelled
  if (event.deletedAt || event.canceledAt) {
    logger.info(
      { eventId },
      '[runFeedbackRequestForEvent] Event deleted/cancelled, skipping'
    );
    return;
  }

  // Don't send if event hasn't ended yet
  if (event.endAt > new Date()) {
    logger.info(
      { eventId, endAt: event.endAt },
      '[runFeedbackRequestForEvent] Event not ended yet, skipping'
    );
    return;
  }

  const recipients = event.members;
  if (recipients.length === 0) {
    logger.info(
      { eventId },
      '[runFeedbackRequestForEvent] No JOINED members, skipping'
    );
    return;
  }

  logger.info(
    { eventId, recipientCount: recipients.length },
    '[runFeedbackRequestForEvent] Sending feedback requests...'
  );

  // Create in-app notifications
  const hasFeedbackQuestions = event.feedbackQuestions.length > 0;

  await prisma.notification.createMany({
    data: recipients.map((member) => ({
      kind: NotificationKind.NEW_REVIEW,
      recipientId: member.userId,
      actorId: null,
      entityType: NotificationEntity.EVENT,
      entityId: event.id,
      eventId: event.id,
      title: 'Jak oceniasz wydarzenie?',
      body: hasFeedbackQuestions
        ? 'Wystawimy ocenę i podziel się swoją opinią'
        : 'Wystaw ocenę wydarzenia',
      dedupeKey: `feedback_request:${member.userId}:${event.id}`,
      createdAt: new Date(),
      data: {
        eventId: event.id,
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
          eventId: event.id,
          kind: NotificationKind.NEW_REVIEW,
          dedupeKey: `feedback_request:${member.userId}:${event.id}`,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: true,
          actor: true,
          event: {
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
    { eventId, recipientCount: recipients.length },
    '[runFeedbackRequestForEvent] Sending emails via Resend...'
  );

  const emailResults = await Promise.allSettled(
    recipients.map(async (member) => {
      const feedbackUrl = generateFeedbackUrl(eventId, member.userId);

      return sendFeedbackRequestEmail({
        to: member.user.email,
        userName: member.user.name || 'tam',
        eventTitle: event.title,
        eventId: event.id,
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
    { eventId, successCount, failureCount, total: recipients.length },
    '[runFeedbackRequestForEvent] Email sending completed'
  );

  // Log failures
  emailResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      const recipient = recipients[index];
      logger.error(
        {
          eventId,
          recipientEmail: recipient?.user.email,
          error: result.reason,
        },
        '[runFeedbackRequestForEvent] Failed to send email'
      );
    }
  });
}
