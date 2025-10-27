import { NotificationEntity, NotificationKind, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { emitPubsub } from '../../lib/pubsub';

function humanTime(minutes: number) {
  if (minutes >= 60) {
    const h = Math.round(minutes / 60);
    return `Starts in ${h} hour${h === 1 ? '' : 's'}.`;
  }
  return `Starts in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

export async function runReminderForIntent(
  intentId: string,
  minutesBefore: number
) {
  const intent = await prisma.intent.findUnique({
    where: { id: intentId },
    include: { members: { select: { userId: true, status: true } } },
  });
  if (!intent) return;
  if (intent.deletedAt || intent.canceledAt) return;

  const recipients = intent.members
    .filter((m) => m.status === 'JOINED')
    .map((m) => m.userId);
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((recipientId) => ({
      kind: NotificationKind.INTENT_REMINDER,
      recipientId,
      actorId: null,
      entityType: NotificationEntity.INTENT,
      entityId: intent.id,
      intentId: intent.id,
      title: 'Upcoming meeting',
      body: humanTime(minutesBefore),
      dedupeKey: `intent_reminder:${minutesBefore}m:${recipientId}:${intent.id}`,
      createdAt: new Date(),
      data: {
        intentId: intent.id,
        startAt: intent.startAt,
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
          intentId: intent.id,
          kind: NotificationKind.INTENT_REMINDER,
          dedupeKey: `intent_reminder:${minutesBefore}m:${recipientId}:${intent.id}`,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: true,
          actor: true,
          intent: {
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
}
