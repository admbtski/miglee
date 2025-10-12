// apps/api/prisma/seed.ts
import {
  PrismaClient,
  NotificationKind,
  Visibility,
  Mode,
  MeetingKind,
} from '@prisma/client';

const prisma = new PrismaClient();

const sportsEvents = [
  'Champions League Final',
  'World Cup Semi-Final',
  'NBA Championship Game 7',
  'Super Bowl LVIII',
  "Wimbledon Men's Final",
  'Formula 1 Monaco Grand Prix',
  'UEFA Euro 2024 Final',
  'Olympic 100m Final',
  'Stanley Cup Final Game 6',
  'Masters Tournament Final Round',
];

async function main() {
  // -----------------------------------------
  // Clean (order matters due to FKs)
  // -----------------------------------------
  await prisma.notification.deleteMany();
  await prisma.intent.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.event.deleteMany();

  // -----------------------------------------
  // Seed Events (as-is, your original behavior)
  // -----------------------------------------
  const anchorDate = new Date(Date.UTC(2025, 0, 15));
  for (let i = 0; i < sportsEvents.length; i++) {
    const title = sportsEvents[i]!;
    const createdAt = new Date(anchorDate.getTime() - i * 24 * 60 * 60 * 1000);
    await prisma.event.create({ data: { title, createdAt } });
  }

  // -----------------------------------------
  // Seed Users
  // -----------------------------------------
  const [alice, bob] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        name: 'Alice',
        imageUrl: 'https://example.com/alice.png',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        name: 'Bob',
        imageUrl: 'https://example.com/bob.png',
      },
    }),
  ]);

  // -----------------------------------------
  // Seed Categories (names as JSON with translations)
  // -----------------------------------------
  const categories = await prisma.$transaction([
    prisma.category.create({
      data: {
        slug: 'running',
        names: { pl: 'Bieganie', de: 'Laufen', en: 'Running' },
        icon: '🏃',
        color: '#ef4444',
      },
    }),
    prisma.category.create({
      data: {
        slug: 'coffee',
        names: { pl: 'Kawa', de: 'Kaffee', en: 'Coffee' },
        icon: '☕️',
        color: '#a16207',
      },
    }),
    prisma.category.create({
      data: {
        slug: 'study',
        names: { pl: 'Nauka', de: 'Lernen', en: 'Study' },
        icon: '📚',
        color: '#2563eb',
      },
    }),
  ]);

  const catBySlug: Record<string, string> = Object.fromEntries(
    categories.map((c) => [c.slug, c.id])
  );

  // -----------------------------------------
  // Seed Intents
  // -----------------------------------------
  const now = new Date();
  const start1 = new Date(now.getTime() + 60 * 60 * 1000); // +1h
  const end1 = new Date(start1.getTime() + 90 * 60 * 1000); // +1.5h

  const start2 = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48h
  const end2 = new Date(start2.getTime() + 60 * 60 * 1000); // +1h

  const intent1 = await prisma.intent.create({
    data: {
      title: 'Morning 5k run',
      description: 'Easy pace around the river.',
      notes: 'Bring water.',
      visibility: Visibility.PUBLIC,
      mode: Mode.GROUP,
      min: 3,
      max: 8,
      startAt: start1,
      endAt: end1,
      allowJoinLate: true,
      meetingKind: MeetingKind.ONSITE,
      lat: 52.2297,
      lng: 21.0122,
      address: 'Warsaw Royal Route',
      radiusKm: 0.5,
      authorId: alice.id,
      categories: {
        connect: [{ id: catBySlug['running']! }, { id: catBySlug['coffee']! }],
      },
    },
  });

  const intent2 = await prisma.intent.create({
    data: {
      title: 'Virtual coffee chat',
      description: 'Meet folks from the community ☕️',
      visibility: Visibility.HIDDEN,
      mode: Mode.ONE_TO_ONE,
      min: 2,
      max: 2,
      startAt: start2,
      endAt: end2,
      allowJoinLate: false,
      meetingKind: MeetingKind.ONLINE,
      onlineUrl: 'https://meet.google.com/abcdef',
      authorId: bob.id,
      categories: { connect: [{ id: catBySlug['coffee']! }] },
    },
  });

  // -----------------------------------------
  // Seed Notifications (extensible)
  // - one per created intent (for author)
  // -----------------------------------------
  await prisma.notification.create({
    data: {
      kind: NotificationKind.INTENT_CREATED,
      message: `Your intent "${intent1.title}" has been created.`,
      payload: {
        intentId: intent1.id,
        title: intent1.title,
        startAt: intent1.startAt,
      } as any,
      recipientId: alice.id,
      intentId: intent1.id,
    },
  });

  await prisma.notification.create({
    data: {
      kind: NotificationKind.INTENT_CREATED,
      message: `Your intent "${intent2.title}" has been created.`,
      payload: {
        intentId: intent2.id,
        title: intent2.title,
        startAt: intent2.startAt,
      } as any,
      recipientId: bob.id,
      intentId: intent2.id,
    },
  });

  console.log('Seed OK:', {
    events: sportsEvents.length,
    users: 2,
    categories: categories.length,
    intents: 2,
    notifications: 2,
  });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
