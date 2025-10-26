/* eslint-disable no-console */
// prisma/seed.ts
import {
  PrismaClient,
  Prisma,
  Visibility,
  Mode,
  MeetingKind,
  Role,
  Level,
  IntentMemberRole,
  IntentMemberStatus,
  NotificationKind,
  NotificationEntity,
  // DB types (optional)
  User,
  Category,
  Tag,
  Intent,
} from '@prisma/client';

const prisma = new PrismaClient();

/** ---------- Fixed IDs (handy for tests/demos) ---------- */
const FIXED_IDS = {
  ADMIN: 'u_admin_00000000000000000001',
  MODERATOR: 'u_moderator_00000000000000000001',
  USER: 'u_user_00000000000000000001',
} as const;

/** ---------- Deterministic RNG ---------- */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);

/** ---------- Small helpers ---------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = () => rnd(); // semantic alias
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const pickMany = <T>(arr: T[], k: number): T[] => {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < k && pool.length; i++) {
    const idx = Math.floor(rnd() * pool.length);
    out.push(pool[idx]!);
    pool.splice(idx, 1);
  }
  return out;
};
const idLike = (prefix: string) => {
  // deterministic pseudo-id using rnd()
  const chunk = () =>
    Math.floor(rnd() * 36 ** 8)
      .toString(36)
      .padStart(8, '0');
  return `${prefix}_${chunk()}${chunk().slice(0, 4)}`;
};

const namesJson = (
  pl: string,
  de: string,
  en: string
): Prisma.InputJsonObject => ({
  pl,
  de,
  en,
});

/** ---------- Realistic-ish data pools ---------- */
const FIRST_NAMES = [
  'Adam',
  'Zuzanna',
  'Michał',
  'Kasia',
  'Bartek',
  'Ola',
  'Piotr',
  'Ania',
  'Tomek',
  'Magda',
  'Krzysztof',
  'Natalia',
  'Paweł',
  'Ewa',
  'Maciek',
  'Agnieszka',
  'Marcin',
  'Karolina',
];
const LAST_NAMES = [
  'Nowak',
  'Kowalska',
  'Wiśniewski',
  'Wójcik',
  'Kamińska',
  'Lewandowski',
  'Zielińska',
  'Szymański',
  'Dąbrowska',
  'Kozłowski',
  'Jankowska',
  'Mazur',
  'Krawczyk',
  'Piotrowska',
];

const AVATAR_ID_POOL = Array.from({ length: 50 }, (_, i) => 100 + i); // picsum 100..149

/** Cities with rough coords and sample places (for address realism) */
const CITIES = [
  {
    name: 'Warszawa',
    lat: 52.2297,
    lng: 21.0122,
    places: [
      { name: 'Plac Zbawiciela', placeId: 'ChIJ0fZbavUDFkcRZbawiciela01' },
      { name: 'PGE Narodowy', placeId: 'ChIJs7e8w40DFkcRPGENarodowy01' },
      { name: 'Muzeum POLIN', placeId: 'ChIJB7o3-mADFkcRPolinMuseum01' },
    ],
  },
  {
    name: 'Kraków',
    lat: 50.0647,
    lng: 19.945,
    places: [
      { name: 'Rynek Główny', placeId: 'ChIJ0T2TeoAFBUcRRynekGlowny01' },
      { name: 'Błonia', placeId: 'ChIJxzE9bR8FBUcRBloniaKrakow01' },
      { name: 'Kazimierz', placeId: 'ChIJBc7n8DkFBUcRKazimierz01' },
    ],
  },
  {
    name: 'Gdańsk',
    lat: 54.352,
    lng: 18.6466,
    places: [
      { name: 'Długi Targ', placeId: 'ChIJQ9jAQxq3_UYRDLugiTarg01' },
      { name: 'Molo Brzeźno', placeId: 'ChIJ-3b8rje3_UYRBrzeznoPier01' },
      { name: 'Park Oliwski', placeId: 'ChIJG2n2mxa3_UYROliwaPark01' },
    ],
  },
  {
    name: 'Wrocław',
    lat: 51.1079,
    lng: 17.0385,
    places: [
      { name: 'Hala Stulecia', placeId: 'ChIJG9XlgbJED0cRHalaStulecia01' },
      { name: 'Rynek', placeId: 'ChIJkz1c8bNED0cRWroclawRynek01' },
      { name: 'Wyspa Słodowa', placeId: 'ChIJq4xUj7JED0cRWyspaSlodowa01' },
    ],
  },
  {
    name: 'Poznań',
    lat: 52.4064,
    lng: 16.9252,
    places: [
      { name: 'Stary Rynek', placeId: 'ChIJw8tc1KqNG0cRStaryRynek01' },
      { name: 'Jezioro Malta', placeId: 'ChIJq2l1v6-NG0cRJezioroMalta01' },
      { name: 'Park Cytadela', placeId: 'ChIJ1y5V96GNG0cRCytadelaPark01' },
    ],
  },
];

const CATEGORY_DEFS = [
  {
    slug: 'running',
    pl: 'Bieganie',
    de: 'Laufen',
    en: 'Running',
    icon: '🏃',
    color: '#ef4444',
  },
  {
    slug: 'cycling',
    pl: 'Kolarstwo',
    de: 'Radfahren',
    en: 'Cycling',
    icon: '🚴',
    color: '#f59e0b',
  },
  {
    slug: 'reading',
    pl: 'Czytanie',
    de: 'Lesen',
    en: 'Reading',
    icon: '📚',
    color: '#10b981',
  },
  {
    slug: 'coding',
    pl: 'Programowanie',
    de: 'Programmieren',
    en: 'Coding',
    icon: '💻',
    color: '#3b82f6',
  },
  {
    slug: 'boardgames',
    pl: 'Planszówki',
    de: 'Brettspiele',
    en: 'Board games',
    icon: '🎲',
    color: '#8b5cf6',
  },
  {
    slug: 'hiking',
    pl: 'Wędrówki',
    de: 'Wandern',
    en: 'Hiking',
    icon: '🥾',
    color: '#22c55e',
  },
  {
    slug: 'language-exchange',
    pl: 'Wymiana językowa',
    de: 'Sprachaustausch',
    en: 'Language exchange',
    icon: '🗣️',
    color: '#06b6d4',
  },
  {
    slug: 'photography',
    pl: 'Fotografia',
    de: 'Fotografie',
    en: 'Photography',
    icon: '📷',
    color: '#f97316',
  },
  {
    slug: 'yoga',
    pl: 'Joga',
    de: 'Yoga',
    en: 'Yoga',
    icon: '🧘',
    color: '#a855f7',
  },
  {
    slug: 'cooking',
    pl: 'Gotowanie',
    de: 'Kochen',
    en: 'Cooking',
    icon: '🍳',
    color: '#84cc16',
  },
];

const TAGS = [
  'outdoor',
  'indoor',
  'free',
  'paid',
  'chill',
  'intense',
  'networking',
  'study',
  'team',
  'solo',
  'coffee',
  'evening',
  'morning',
  'weekend',
  'family',
];

const TITLE_BY_CATEGORY: Record<string, string[]> = {
  running: ['Easy 5k Run', 'Intervals by the River', 'Sunday Long Run'],
  cycling: ['City Ride After Work', 'Gravel Loop', 'Evening Sprint'],
  reading: ['Book Club – Chapter 1', 'Quiet Reading Hour', 'Discuss & Coffee'],
  coding: ['Hack Night', 'Open Source Sprint', 'Pair Programming'],
  boardgames: ['Strategy Night', 'Party Games', 'Eurogames Evening'],
  hiking: ['Forest Trail', 'Sunrise Walk', 'Weekend Hike'],
  'language-exchange': [
    'EN–PL Swap',
    'Deutsch Stammtisch',
    'Casual Language Chat',
  ],
  photography: [
    'Golden Hour Walk',
    'Portraits Basics',
    'Composition in the City',
  ],
  yoga: ['Morning Flow', 'Yin & Restore', 'Sunset Yoga'],
  cooking: ['Pasta Workshop', 'Street Food Night', 'Spices 101'],
};

/** ---------- Utilities for geo/time ---------- */
const jitterCoord = (base: number) => base + (rnd() - 0.5) * 0.18; // ~±0.09deg
const randomWithinCity = (city: { lat: number; lng: number }) => ({
  lat: jitterCoord(city.lat),
  lng: jitterCoord(city.lng),
});
const randomPlace = (city: (typeof CITIES)[number]) => pick(city.places);

function randomTimeWindow(i: number) {
  const start = new Date();
  const addDays = Math.floor(rnd() * 26) + (i % 7 === 0 ? 1 : 0); // 0..25(+1)
  start.setDate(start.getDate() + addDays);
  start.setMinutes(0, 0, 0);
  start.setHours(9 + Math.floor(rnd() * 10)); // 09:00..18:00
  const durMin = 75 + Math.floor(rnd() * 91); // 75–165
  const end = new Date(start.getTime() + durMin * 60_000);
  return { startAt: start, endAt: end, durMin };
}

/** ---------- DB cleanup (respect FK order) ---------- */
async function clearDb() {
  await prisma.notification.deleteMany();
  await prisma.intentMember.deleteMany();
  await prisma.intent.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}

/** ---------- Seed: Users ---------- */
function emailFor(first: string, last: string, i?: number) {
  const base = `${first}.${last}`.toLowerCase().replace(/\s+/g, '');
  const suffix = i != null ? `+${i}` : '';
  return `${base}${suffix}@example.com`;
}

async function seedUsers(): Promise<User[]> {
  const created: User[] = [];

  created.push(
    await prisma.user.create({
      data: {
        id: FIXED_IDS.ADMIN,
        email: 'admin@example.com',
        name: 'Admin One',
        role: Role.ADMIN,
        imageUrl: `https://picsum.photos/id/10/200/200`,
      },
    })
  );

  const mod1 = await prisma.user.create({
    data: {
      id: FIXED_IDS.MODERATOR,
      email: 'moderator.one@example.com',
      name: 'Moderator One',
      role: Role.MODERATOR,
      imageUrl: `https://picsum.photos/id/11/200/200`,
    },
  });
  created.push(mod1);

  for (let m = 2; m <= 3; m++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    created.push(
      await prisma.user.create({
        data: {
          email: emailFor(first, last),
          name: `${first} ${last}`,
          role: Role.MODERATOR,
          imageUrl: `https://picsum.photos/id/${11 + m}/200/200`,
        },
      })
    );
  }

  created.push(
    await prisma.user.create({
      data: {
        id: FIXED_IDS.USER,
        email: 'user.fixed@example.com',
        name: 'User Fixed',
        role: Role.USER,
        imageUrl: `https://picsum.photos/id/19/200/200`,
      },
    })
  );

  for (let i = 0; i < 20; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    created.push(
      await prisma.user.create({
        data: {
          email: emailFor(first, last, i),
          name: `${first} ${last}`,
          role: Role.USER,
          imageUrl: `https://picsum.photos/id/${pick(AVATAR_ID_POOL)}/200/200`,
        },
      })
    );
  }

  return created;
}

/** ---------- Seed: Categories ---------- */
async function seedCategories(): Promise<Category[]> {
  const created: Category[] = [];
  for (const c of CATEGORY_DEFS) {
    created.push(
      await prisma.category.create({
        data: {
          slug: c.slug,
          names: namesJson(c.pl, c.de, c.en),
          icon: c.icon,
          color: c.color,
        },
      })
    );
  }
  return created;
}

/** ---------- Seed: Tags ---------- */
async function seedTags(): Promise<Tag[]> {
  const created: Tag[] = [];
  for (const label of TAGS) {
    created.push(
      await prisma.tag.create({
        data: {
          label,
          slug: label.replace(/\s+/g, '-').toLowerCase(),
        },
      })
    );
  }
  return created;
}

/** ---------- Intent creation with realistic data & members ---------- */
const titleFor = (categorySlug: string) =>
  pick(TITLE_BY_CATEGORY[categorySlug] ?? ['Meetup']);

async function createIntentWithMembers(opts: {
  author: User;
  categories: Category[];
  tags: Tag[];
}): Promise<{ intent: Intent; owner: User; participants: number }> {
  const { author, categories, tags } = opts;
  const city = pick(CITIES);
  const coords = randomWithinCity(city);
  const place = randomPlace(city);
  const firstCategory = pick(categories);
  const { startAt, endAt } = randomTimeWindow(Math.floor(rnd() * 1000));

  const meetingKind = pick<MeetingKind>([
    MeetingKind.ONSITE,
    MeetingKind.ONLINE,
    MeetingKind.HYBRID,
  ]);
  const visibility = rand() > 0.15 ? Visibility.PUBLIC : Visibility.HIDDEN;
  const mode = pick<Mode>([Mode.GROUP, Mode.ONE_TO_ONE]);
  const allowJoinLate = rand() > 0.3;

  const min = mode === Mode.ONE_TO_ONE ? 2 : rand() > 0.5 ? 4 : 2;
  const baseMax = mode === Mode.ONE_TO_ONE ? 2 : pick([6, 8, 10, 12]);
  const max = Math.max(min, baseMax);

  const selectedCategories = [
    firstCategory,
    ...pickMany(
      categories.filter((c) => c.id !== firstCategory.id),
      2
    ),
  ];
  const selectedTags = pickMany(tags, 1 + Math.floor(rnd() * 3));
  const levels = pickMany(
    [Level.BEGINNER, Level.INTERMEDIATE, Level.ADVANCED],
    1 + Math.floor(rnd() * 3)
  );

  const address =
    meetingKind !== MeetingKind.ONLINE ? `${place.name}, ${city.name}` : null;
  const radiusKm =
    meetingKind !== MeetingKind.ONLINE
      ? rand() > 0.7
        ? Number((rnd() * 3).toFixed(1))
        : 0
      : null;
  const onlineUrl =
    meetingKind !== MeetingKind.ONSITE
      ? pick([
          'https://meet.google.com/abc-defg-hij',
          'https://zoom.us/j/123456789',
          'https://discord.gg/xyz123',
        ])
      : null;

  const title = titleFor(firstCategory.slug);
  const description =
    meetingKind === MeetingKind.ONSITE
      ? `${title} near ${place.name} in ${city.name}. Pace and distance adjusted to the group.`
      : meetingKind === MeetingKind.ONLINE
        ? `${title} (online). We'll meet on video and keep it interactive.`
        : `${title} (hybrid): meet at ${place.name} in ${city.name} or join online.`;
  const notes =
    rand() > 0.6
      ? pick([
          'Bring water and comfy shoes.',
          'Beginner friendly.',
          'We start on time, come 10 min earlier.',
          'Optional: camera for portraits.',
        ])
      : null;

  // Transaction: create Intent + memberships
  return prisma.$transaction(async (tx) => {
    const intent = await tx.intent.create({
      data: {
        title,
        description,
        notes,
        visibility,
        mode,
        min,
        max,
        startAt,
        endAt,
        allowJoinLate,
        meetingKind,
        onlineUrl,
        lat: meetingKind !== MeetingKind.ONLINE ? coords.lat : null,
        lng: meetingKind !== MeetingKind.ONLINE ? coords.lng : null,
        address: address ?? null,
        placeId: meetingKind !== MeetingKind.ONLINE ? place.placeId : null,
        radiusKm: radiusKm ?? null,
        levels,
        categories: { connect: selectedCategories.map((c) => ({ id: c.id })) },
        tags: { connect: selectedTags.map((t) => ({ id: t.id })) },
      },
    });

    // OWNER — always JOINED
    await tx.intentMember.create({
      data: {
        intentId: intent.id,
        userId: author.id,
        role: IntentMemberRole.OWNER,
        status: IntentMemberStatus.JOINED,
        joinedAt: new Date(),
      },
    });

    // Optional moderator
    const maybeModerator =
      rand() > 0.5
        ? await tx.user.findFirst({
            where: {
              id: { not: author.id },
              role: { in: [Role.MODERATOR, Role.ADMIN] },
            },
          })
        : null;
    if (maybeModerator) {
      await tx.intentMember.create({
        data: {
          intentId: intent.id,
          userId: maybeModerator.id,
          role: IntentMemberRole.MODERATOR,
          status: IntentMemberStatus.JOINED,
          addedById: author.id,
          joinedAt: new Date(),
        },
      });
    }

    // Participants: fill some JOINED, respect capacity
    const alreadyJoined = await tx.intentMember.count({
      where: { intentId: intent.id, status: IntentMemberStatus.JOINED },
    });
    const freeSlots = Math.max(0, max - alreadyJoined);
    const targetJoined =
      mode === Mode.ONE_TO_ONE
        ? Math.min(1, freeSlots)
        : Math.min(
            freeSlots,
            2 + Math.floor(rnd() * Math.min(6, freeSlots + 1))
          );

    const pool = await tx.user.findMany({
      where: {
        id: { notIn: [author.id, maybeModerator?.id ?? ''] },
        role: Role.USER,
      },
      take: 12,
    });

    const participants = pickMany(pool, Math.max(0, targetJoined));
    for (const u of participants) {
      await tx.intentMember.create({
        data: {
          intentId: intent.id,
          userId: u.id,
          role: IntentMemberRole.PARTICIPANT,
          status: IntentMemberStatus.JOINED,
          addedById: author.id,
          joinedAt: new Date(),
        },
      });
    }

    // Some PENDING/INVITED/REJECTED/BANNED
    const others = pool.filter((u) => !participants.find((p) => p.id === u.id));
    const extras = pickMany(others, Math.min(4, others.length));
    for (const u of extras) {
      const st = pick<IntentMemberStatus>([
        IntentMemberStatus.PENDING,
        IntentMemberStatus.INVITED,
        IntentMemberStatus.REJECTED,
        IntentMemberStatus.BANNED,
      ]);
      await tx.intentMember.create({
        data: {
          intentId: intent.id,
          userId: u.id,
          role: IntentMemberRole.PARTICIPANT,
          status: st,
          addedById: author.id,
          note:
            st === IntentMemberStatus.BANNED
              ? 'Spam/abusive behavior reported.'
              : st === IntentMemberStatus.REJECTED
                ? 'Does not meet event requirements.'
                : null,
        },
      });
    }

    return {
      intent,
      owner: author,
      participants: alreadyJoined + participants.length,
    };
  });
}

/** ---------- Seed: Intents ---------- */
async function seedIntents(opts: {
  users: User[];
  categories: Category[];
  tags: Tag[];
}): Promise<Array<{ intent: Intent; owner: User }>> {
  const { users, categories, tags } = opts;
  const out: Array<{ intent: Intent; owner: User }> = [];

  const authorPool = users.filter((u) => u.role !== Role.USER);
  const userPool = users;

  for (let i = 0; i < 30; i++) {
    const author = rand() > 0.65 ? pick(authorPool) : pick(userPool);
    const { intent, owner } = await createIntentWithMembers({
      author,
      categories,
      tags,
    });
    out.push({ intent, owner });
  }

  return out;
}

/** ---------- NEW: Seed some cancellations + notifications ---------- */
async function seedCanceledIntents(
  intentsCreated: Array<{ intent: Intent; owner: User }>
): Promise<Array<{ intent: Intent; owner: User }>> {
  // ~30% intentów oznacz jako anulowane
  const toCancel = intentsCreated.filter(() => rand() > 0.7);
  for (const item of toCancel) {
    const { intent, owner } = item;
    const reason = pick([
      'Venue unavailable due to maintenance.',
      'Organizer is ill. Sorry!',
      'Weather alert – safety first.',
      'Scheduling conflict, will reschedule soon.',
    ]);

    // Mark canceled (idempotent)
    const updated = await prisma.intent.update({
      where: { id: intent.id },
      data: {
        canceledAt: new Date(),
        canceledById: owner.id,
        cancelReason: reason,
      },
    });

    // Notify JOINED/PENDING/INVITED members
    const recipients = await prisma.intentMember.findMany({
      where: {
        intentId: updated.id,
        status: {
          in: [
            IntentMemberStatus.JOINED,
            IntentMemberStatus.PENDING,
            IntentMemberStatus.INVITED,
          ],
        },
      },
      select: { userId: true },
    });

    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((m) => ({
          kind: NotificationKind.INTENT_CANCELED,
          recipientId: m.userId,
          actorId: owner.id,
          entityType: NotificationEntity.INTENT,
          entityId: updated.id,
          intentId: updated.id,
          title: 'Meeting canceled',
          body: `Organizer’s note: ${reason}`,
          dedupeKey: `intent_canceled:${m.userId}:${updated.id}`,
          createdAt: new Date(),
        })),
      });
    }
  }
  return toCancel;
}

/** ---------- NEW: Seed some soft-deleted (after 30 days) ---------- */
async function seedDeletedIntentsAfterCancel(
  canceled: Array<{ intent: Intent; owner: User }>
) {
  // weź niewielką próbkę anulowanych i ustaw im canceledAt sprzed 35 dni, a następnie deletedAt=teraz
  const sample = canceled.filter(() => rand() > 0.6);
  const THIRTY_FIVE_DAYS_MS = 35 * 24 * 60 * 60 * 1000;
  for (const { intent, owner } of sample) {
    const canceledAtPast = new Date(Date.now() - THIRTY_FIVE_DAYS_MS);
    await prisma.intent.update({
      where: { id: intent.id },
      data: {
        canceledAt: canceledAtPast, // symulacja, że minęło >30 dni
        deletedAt: new Date(),
        deletedById: owner.id,
        deleteReason: 'Auto-cleanup after 30 days from cancellation (seed).',
      },
    });
  }
}

/** ---------- Seed: Generic Notifications (aligned with current enum) ---------- */
const CURRENCIES = ['PLN', 'EUR', 'USD'] as const;

async function seedNotificationsGeneric(
  intentsCreated: Array<{ intent: Intent; owner: User }>,
  users: User[]
) {
  // Intent-based: CREATED / REMINDER / occasional INVITE or MEMBERSHIP_APPROVED
  for (const { intent, owner } of intentsCreated) {
    const audience = users.filter((u) => u.id !== owner.id);
    const recipients = pickMany(audience, 2 + Math.floor(rnd() * 3)); // 2..4

    for (const r of recipients) {
      // INTENT_CREATED
      await prisma.notification.create({
        data: {
          kind: NotificationKind.INTENT_CREATED,
          recipientId: r.id,
          actorId: owner.id,
          entityType: NotificationEntity.INTENT,
          entityId: intent.id,
          intentId: intent.id,
          title: `New event: ${intent.title}`,
          body: `${owner.name ?? 'Someone'} created "${intent.title}".`,
          data: {
            address: intent.address,
            startAt: intent.startAt,
            meetingKind: intent.meetingKind,
          } as Prisma.InputJsonValue,
          dedupeKey: `intent_created:${r.id}:${intent.id}`,
        },
      });

      // Occasionally INVITE (pretend owner invited r)
      if (rand() > 0.7) {
        await prisma.notification.create({
          data: {
            kind: NotificationKind.INTENT_INVITE,
            recipientId: r.id,
            actorId: owner.id,
            entityType: NotificationEntity.INTENT,
            entityId: intent.id,
            intentId: intent.id,
            title: `You're invited: ${intent.title}`,
            body: `${owner.name ?? 'Someone'} invited you to join "${intent.title}".`,
            data: { invite: true } as Prisma.InputJsonValue,
            dedupeKey: `intent_invite:${r.id}:${intent.id}`,
          },
        });
      }

      // Sometimes REMINDER
      if (rand() > 0.6) {
        await prisma.notification.create({
          data: {
            kind: NotificationKind.INTENT_REMINDER,
            recipientId: r.id,
            actorId: owner.id,
            entityType: NotificationEntity.INTENT,
            entityId: intent.id,
            intentId: intent.id,
            title: `Reminder: ${intent.title}`,
            body: `Starts at ${new Date(intent.startAt).toLocaleString()}.`,
            data: {
              startsInMinutes: Math.floor(
                (new Date(intent.startAt).getTime() - Date.now()) / 60000
              ),
            } as Prisma.InputJsonValue,
            dedupeKey: `intent_reminder:${r.id}:${intent.id}`,
          },
        });
      }
    }
  }

  // Messages (use kind=SYSTEM; entityType=MESSAGE)
  for (let i = 0; i < 25; i++) {
    const sender = pick(users);
    const recipient = pick(users.filter((u) => u.id !== sender.id));
    const msgId = idLike('msg');

    await prisma.notification.create({
      data: {
        kind: NotificationKind.SYSTEM,
        recipientId: recipient.id,
        actorId: sender.id,
        entityType: NotificationEntity.MESSAGE,
        entityId: msgId,
        title: `New message from ${sender.name ?? 'User'}`,
        body: `“${pick(['Hey!', 'Are you coming?', 'Let’s connect.', 'See you soon!'])}”`,
        data: {
          subtype: 'MESSAGE_RECEIVED',
          conversationId: idLike('dm'),
          preview: pick(['👍', 'Got it', 'OK', 'See you', 'Thanks!']),
        } as Prisma.InputJsonValue,
        dedupeKey: `system_message:${recipient.id}:${msgId}`,
      },
    });
  }

  // Payments (use kind=SYSTEM; entityType=PAYMENT)
  for (let i = 0; i < 15; i++) {
    const payer = pick(users);
    const payId = idLike('pay');
    const amount = (Math.floor(rnd() * 5000) + 500) / 100; // 5.00–55.00
    const currency = pick([...CURRENCIES]);

    await prisma.notification.create({
      data: {
        kind: NotificationKind.SYSTEM,
        recipientId: payer.id,
        actorId: null,
        entityType: NotificationEntity.PAYMENT,
        entityId: payId,
        title: `Payment received`,
        body: `We registered your payment ${amount.toFixed(2)} ${currency}.`,
        data: {
          subtype: 'PAYMENT_REGISTERED',
          amount,
          currency,
          method: pick(['card', 'blik', 'transfer']),
          status: 'captured',
        } as Prisma.InputJsonValue,
        dedupeKey: `system_payment:${payer.id}:${payId}`,
      },
    });
  }
}

/** ---------- Main ---------- */
async function main() {
  console.log('🧹 Clearing DB…');
  await clearDb();

  console.log('👤 Seeding users…');
  const users = await seedUsers();

  console.log('🏷️  Seeding tags…');
  const tags = await seedTags();

  console.log('🗂️  Seeding categories…');
  const categories = await seedCategories();

  console.log('📝 Seeding intents (30) with realistic members…');
  const intentsCreated = await seedIntents({ users, categories, tags });

  console.log('⛔ Seeding some canceled intents + notifications…');
  const canceled = await seedCanceledIntents(intentsCreated);

  console.log('🗑️  Seeding some deleted intents (after 30 days)…');
  await seedDeletedIntentsAfterCancel(canceled);

  console.log('🔔 Seeding generic notifications…');
  await seedNotificationsGeneric(intentsCreated, users);

  console.log(
    `✅ Done: users=${users.length}, categories=${categories.length}, tags=${tags.length}, intents=${intentsCreated.length}`
  );
  console.log('🆔 Fixed IDs:', FIXED_IDS);
}

main()
  .then(async () => {
    await sleep(50);
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
