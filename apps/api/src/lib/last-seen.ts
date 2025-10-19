import { prisma } from './prisma';

const MIN_INTERVAL_MS = 60_000; // do not write more often than once per minute
const lastWrite = new Map<string, number>();

export async function touchLastSeen(userId: string) {
  const now = Date.now();
  const prev = lastWrite.get(userId) ?? 0;
  if (now - prev < MIN_INTERVAL_MS) return;

  lastWrite.set(userId, now);

  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date(now) },
    select: { id: true },
  });
}
