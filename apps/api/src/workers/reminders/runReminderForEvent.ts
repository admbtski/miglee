import { prisma } from '../../lib/prisma';
import { emitPubsub } from '../../lib/pubsub';
import { Prisma } from '../../prisma-client/client';
import {
  NotificationEntity,
  NotificationKind,
} from '../../prisma-client/enums';
import { trackScheduleFire } from '../../lib/observability';

function humanTime(minutes: number) {
  if (minutes >= 60) {
    const h = Math.round(minutes / 60);
    return `Starts in ${h} hour${h === 1 ? '' : 's'}.`;
  }
  return `Starts in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

export async function runReminderForEvent(
  eventId: string,
  minutesBefore: number
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { members: { select: { userId: true, status: true } } },
  });
  if (!event) {
    // Track schedule fire failure
    trackScheduleFire({
      scheduleType: 'reminder',
      eventId,
      scheduledAt: new Date(),
      actualFiredAt: new Date(),
      result: 'failed',
    });
    return;
  }
  if (event.deletedAt || event.canceledAt) {
    // Track schedule fire skipped
    trackScheduleFire({
      scheduleType: 'reminder',
      eventId,
      scheduledAt: new Date(),
      actualFiredAt: new Date(),
      result: 'failed',
    });
    return;
  }

  const recipients = event.members
    .filter((m) => m.status === 'JOINED')
    .map((m) => m.userId);
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((recipientId) => ({
      kind: NotificationKind.EVENT_REMINDER,
      recipientId,
      actorId: null,
      entityType: NotificationEntity.EVENT,
      entityId: event.id,
      eventId: event.id,
      title: 'Upcoming meeting',
      body: humanTime(minutesBefore),
      dedupeKey: `event_reminder:${minutesBefore}m:${recipientId}:${event.id}`,
      createdAt: new Date(),
      data: {
        eventId: event.id,
        startAt: event.startAt,
        minutesBefore,
      } as Prisma.InputJsonValue,
    })),
    skipDuplicates: true,
  });

  await Promise.all(
    recipients.map(async (recipientId) => {
      const notif = await prisma.notification.findFirst({
        where: {
          recipientId,
          eventId: event.id,
          kind: NotificationKind.EVENT_REMINDER,
          dedupeKey: `event_reminder:${minutesBefore}m:${recipientId}:${event.id}`,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: true,
          actor: true,
          event: {
            include: {
              categories: true,
              tags: true,
              members: { include: { user: true, addedBy: true } },
              canceledBy: true,
              deletedBy: true,
            },
          },
        },
      });

      if (notif) {
        await emitPubsub(`NOTIFICATION_ADDED:${recipientId}`, {
          notificationAdded: notif,
        });
      }
      await emitPubsub(`NOTIFICATION_BADGE:${recipientId}`, {
        notificationBadgeChanged: { recipientId },
      });
    })
  );

  // Track successful schedule fire
  trackScheduleFire({
    scheduleType: 'reminder',
    eventId,
    scheduledAt: new Date(),
    actualFiredAt: new Date(),
    result: 'ok',
  });
}
