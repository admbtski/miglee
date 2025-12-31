/* eslint-disable no-console */
// prisma/seed.ts
import {
  AddressVisibility,
  Category,
  Event,
  EventMemberRole,
  EventMemberStatus,
  PublicationStatus,
  JoinMode,
  Level,
  MeetingKind,
  MembersVisibility,
  Mode,
  NotificationEntity,
  NotificationKind,
  Prisma,
  PrismaClient,
  Role,
  Tag,
  // DB types (optional)
  User,
  Visibility,
} from '../src/prisma-client/client';
import {
  CATEGORY_DEFS,
  CITIES,
  FIRST_NAMES,
  FIXED_IDS,
  FIXED_EVENTS_TARGET,
  LAST_NAMES,
  TAGS,
  TITLE_BY_CATEGORY,
} from './constants';

const prisma = new PrismaClient();

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

/** ---------- Utilities for geo/time ---------- */
const jitterCoord = (base: number) => base + (rnd() - 0.5) * 0.18; // ~±0.09deg
const randomWithinCity = (city: { lat: number; lng: number }) => ({
  lat: Number(jitterCoord(city.lat).toFixed(6)),
  lng: Number(jitterCoord(city.lng).toFixed(6)),
});
const randomPlace = (city: (typeof CITIES)[number]) => pick(city.places);

/**
 * 60% terminów w przyszłości (0..25 dni), 40% lekko wstecz (−10..−1 dni)
 * przydatne do testów statusów STARTED/ONGOING/HAS_ENDED.
 */
function randomTimeWindow() {
  const now = new Date();
  const future = rand() > 0.4;
  const start = new Date(now);
  const deltaDays = future
    ? Math.floor(rand() * 26)
    : -1 * (1 + Math.floor(rand() * 10));
  start.setDate(start.getDate() + deltaDays);
  start.setMinutes(0, 0, 0);
  start.setHours(9 + Math.floor(rand() * 10)); // 09:00..18:00
  const durMin = 75 + Math.floor(rand() * 91); // 75–165
  const end = new Date(start.getTime() + durMin * 60_000);
  return { startAt: start, endAt: end, durMin };
}

/** ---------- DB cleanup (respect FK order) ---------- */
async function clearDb() {
  try {
    await prisma.notification.deleteMany();
    await prisma.eventCheckinLog.deleteMany(); // Check-in audit logs
    await prisma.eventMember.deleteMany();
    await prisma.event.deleteMany();
    await prisma.category.deleteMany();
    await prisma.tag.deleteMany();

    // Clear user profile related tables
    await prisma.userBadge.deleteMany();
    await prisma.userAvailability.deleteMany();
    await prisma.userCategoryLevel.deleteMany();
    await prisma.userSocialLink.deleteMany();
    await prisma.userStats.deleteMany();
    await prisma.userPrivacy.deleteMany();
    await prisma.userProfile.deleteMany();

    // Clear billing tables
    await prisma.userPlanPeriod.deleteMany();
    await prisma.userSubscription.deleteMany();
    await prisma.eventSponsorship.deleteMany();
    await prisma.paymentEvent.deleteMany();

    await prisma.user.deleteMany();

    // Clear media assets
    await prisma.mediaAsset.deleteMany();
  } catch (error) {
    // If tables don't exist (e.g., after migrate reset), skip cleanup
    console.log('   ℹ️  Skipping cleanup (tables may not exist yet)');
  }
}

/** ---------- Seed: Users ---------- */
const LOCALES: string[] = ['en', 'pl', 'de'];
const TIMEZONES: string[] = [
  'Europe/Warsaw',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'UTC',
];

function emailFor(first: string, last: string, i?: number) {
  const base = `${first}.${last}`.toLowerCase().replace(/\s+/g, '');
  const suffix = i != null ? `+${i}` : '';
  return `${base}${suffix}@example.com`;
}

/**
 * Generate Instagram-style handle (username)
 * - lowercase only
 * - letters, numbers, dots, underscores
 * - no spaces
 * Examples: john.doe, anna_smith, mike.jones23
 */
function generateHandle(first: string, last: string, index?: number): string {
  // Clean names: remove special chars, convert to lowercase
  const cleanFirst = first.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLast = last.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Random style variations
  const styles = [
    `${cleanFirst}.${cleanLast}`, // john.doe
    `${cleanFirst}_${cleanLast}`, // john_smith
    `${cleanFirst}${cleanLast}`, // johndoe
    `${cleanFirst}.${cleanLast[0]}`, // john.d
    `${cleanFirst[0]}.${cleanLast}`, // j.doe
    `${cleanFirst}_${cleanLast[0]}`, // john_d
  ];

  let handle = pick(styles);

  // Add number suffix if index provided or randomly (30% chance)
  if (index !== undefined) {
    handle += index;
  } else if (rand() > 0.7) {
    handle += Math.floor(rand() * 100);
  }

  return handle;
}

async function seedUsers(): Promise<User[]> {
  const created: User[] = [];

  created.push(
    await prisma.user.create({
      data: {
        id: FIXED_IDS.ADMIN,
        email: 'admin@example.com',
        name: 'admin.appname',
        role: Role.ADMIN,
        avatarKey: null, // In production, would be set via upload
        verifiedAt: new Date(),
        locale: 'en',
        timezone: 'Europe/Warsaw',
      },
    })
  );

  const mod1 = await prisma.user.create({
    data: {
      id: FIXED_IDS.MODERATOR,
      email: 'moderator.one@example.com',
      name: 'moderator.one',
      role: Role.MODERATOR,
      avatarKey: null, // In production, would be set via upload
      verifiedAt: new Date(),
      locale: 'pl',
      timezone: 'Europe/Warsaw',
    },
  });
  created.push(mod1);

  for (let m = 2; m <= 3; m++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    created.push(
      await prisma.user.create({
        data: {
          email: emailFor(first, last, m),
          name: generateHandle(first, last, m),
          role: Role.MODERATOR,
          avatarKey: null, // In production, would be set via upload
          ...(rand() > 0.6 ? { verifiedAt: new Date() } : {}),
          locale: pick(LOCALES),
          timezone: pick(TIMEZONES),
        },
      })
    );
  }

  created.push(
    await prisma.user.create({
      data: {
        id: FIXED_IDS.USER,
        email: 'user.fixed@example.com',
        name: 'user.fixed',
        role: Role.USER,
        avatarKey: null, // In production, would be set via upload
        verifiedAt: new Date(),
        locale: 'en',
        timezone: 'Europe/Warsaw',
      },
    })
  );

  // Create simple test users (2-10) - regular users without plans
  console.log('   Creating 9 simple test users (USER_2 to USER_10)...');

  const testUserData = [
    {
      id: FIXED_IDS.USER_2,
      name: 'test.user.two',
      email: 'user.two@example.com',
      locale: 'en',
    },
    {
      id: FIXED_IDS.USER_3,
      name: 'test.user.three',
      email: 'user.three@example.com',
      locale: 'pl',
    },
    {
      id: FIXED_IDS.USER_4,
      name: 'test.user.four',
      email: 'user.four@example.com',
      locale: 'de',
    },
    {
      id: FIXED_IDS.USER_5,
      name: 'test.user.five',
      email: 'user.five@example.com',
      locale: 'en',
    },
    {
      id: FIXED_IDS.USER_6,
      name: 'test.user.six',
      email: 'user.six@example.com',
      locale: 'pl',
    },
    {
      id: FIXED_IDS.USER_7,
      name: 'test.user.seven',
      email: 'user.seven@example.com',
      locale: 'en',
    },
    {
      id: FIXED_IDS.USER_8,
      name: 'test.user.eight',
      email: 'user.eight@example.com',
      locale: 'de',
    },
    {
      id: FIXED_IDS.USER_9,
      name: 'test.user.nine',
      email: 'user.nine@example.com',
      locale: 'pl',
    },
    {
      id: FIXED_IDS.USER_10,
      name: 'test.user.ten',
      email: 'user.ten@example.com',
      locale: 'en',
    },
  ];

  for (const userData of testUserData) {
    created.push(
      await prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: Role.USER,
          avatarKey: null,
          verifiedAt: new Date(),
          locale: userData.locale,
          timezone: 'Europe/Warsaw',
        },
      })
    );
  }

  // Create users with active plans for testing billing
  created.push(
    await prisma.user.create({
      data: {
        id: FIXED_IDS.USER_PLUS_MONTHLY,
        email: 'plus.monthly@example.com',
        name: 'plus.monthly',
        role: Role.USER,
        avatarKey: null,
        verifiedAt: new Date(),
        locale: 'en',
        timezone: 'America/New_York',
      },
    })
  );

  created.push(
    await prisma.user.create({
      data: {
        id: FIXED_IDS.USER_PRO_MONTHLY,
        email: 'pro.monthly@example.com',
        name: 'pro.monthly',
        role: Role.USER,
        avatarKey: null,
        verifiedAt: new Date(),
        locale: 'de',
        timezone: 'Europe/Berlin',
      },
    })
  );

  created.push(
    await prisma.user.create({
      data: {
        id: FIXED_IDS.USER_PLUS_YEARLY,
        email: 'plus.yearly@example.com',
        name: 'plus.yearly',
        role: Role.USER,
        avatarKey: null,
        verifiedAt: new Date(),
        locale: 'pl',
        timezone: 'Europe/Warsaw',
      },
    })
  );

  created.push(
    await prisma.user.create({
      data: {
        id: FIXED_IDS.USER_PRO_YEARLY,
        email: 'pro.yearly@example.com',
        name: 'pro.yearly',
        role: Role.USER,
        avatarKey: null,
        verifiedAt: new Date(),
        locale: 'en',
        timezone: 'UTC',
      },
    })
  );

  // Zwiększona liczba użytkowników: 100 dla większej różnorodności
  const USERS_COUNT = 100;
  console.log(`   Creating ${USERS_COUNT} regular users...`);

  for (let i = 0; i < USERS_COUNT; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    created.push(
      await prisma.user.create({
        data: {
          email: emailFor(first, last, i),
          name: generateHandle(first, last, i),
          role: Role.USER,
          avatarKey: null, // In production, would be set via upload
          ...(rand() > 0.6 ? { verifiedAt: new Date() } : {}),
          lastSeenAt:
            rand() > 0.5
              ? new Date(Date.now() - Math.floor(rand() * 7) * 86400000)
              : null,
          locale: pick(LOCALES),
          timezone: pick(TIMEZONES),
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

/** ---------- Event creation with realistic data & members ---------- */
const titleFor = (categorySlug: string) =>
  pick(TITLE_BY_CATEGORY[categorySlug] ?? ['Meetup']);

async function createEventWithMembers(opts: {
  author: User;
  categories: Category[];
  tags: Tag[];
}): Promise<{ event: Event; owner: User; participants: number }> {
  const { author, categories, tags } = opts;
  const city = pick(CITIES);
  const coords = randomWithinCity(city);
  const place = randomPlace(city);
  const firstCategory = pick(categories);
  const { startAt, endAt } = randomTimeWindow();

  const meetingKind = pick<MeetingKind>([
    MeetingKind.ONSITE,
    MeetingKind.ONLINE,
    MeetingKind.HYBRID,
  ]);
  const visibility = rand() > 0.15 ? Visibility.PUBLIC : Visibility.HIDDEN;
  const joinMode = pick<JoinMode>([
    JoinMode.OPEN,
    JoinMode.REQUEST,
    JoinMode.INVITE_ONLY,
  ]);
  const mode = pick<Mode>([Mode.GROUP, Mode.ONE_TO_ONE, Mode.CUSTOM]);
  const allowJoinLate = rand() > 0.3;

  // Join window settings (realistic variations)
  // 60% have some join window restrictions, 40% fully open
  const hasJoinWindowRestrictions = rand() > 0.4;
  const joinOpensMinutesBeforeStart = hasJoinWindowRestrictions
    ? rand() > 0.5
      ? pick([60, 120, 180, 240, 360, 720, 1440]) // 1h, 2h, 3h, 4h, 6h, 12h, 24h
      : null
    : null;
  const joinCutoffMinutesBeforeStart = hasJoinWindowRestrictions
    ? rand() > 0.6
      ? pick([5, 10, 15, 30, 60]) // 5min, 10min, 15min, 30min, 1h
      : null
    : null;
  const lateJoinCutoffMinutesAfterStart =
    allowJoinLate && rand() > 0.5
      ? pick([10, 15, 30, 45, 60]) // 10min, 15min, 30min, 45min, 1h
      : null;

  // 5% of events are manually closed by owner/moderator
  const joinManuallyClosed = rand() > 0.95;
  const joinManuallyClosedAt = joinManuallyClosed ? new Date() : null;
  const joinManuallyClosedById = joinManuallyClosed ? author.id : null;
  const joinManualCloseReason = joinManuallyClosed
    ? pick([
        'Osiągnięto maksymalną liczbę uczestników (reason)',
        'Wydarzenie zostało przeniesione (reason)',
        'Zmiana planów organizatora (reason)',
        'Problemy techniczne z lokalizacją (reason)',
        null,
      ])
    : null;

  // Members visibility: mostly PUBLIC, sometimes AFTER_JOIN, rarely HIDDEN
  const membersVisibility = pick<MembersVisibility>([
    MembersVisibility.PUBLIC,
    MembersVisibility.PUBLIC,
    MembersVisibility.PUBLIC,
    MembersVisibility.AFTER_JOIN,
    MembersVisibility.HIDDEN,
  ]);

  // Address visibility: if event is HIDDEN, address can vary; otherwise mostly PUBLIC
  const addressVisibility =
    visibility === Visibility.HIDDEN
      ? pick<AddressVisibility>([
          AddressVisibility.PUBLIC,
          AddressVisibility.AFTER_JOIN,
          AddressVisibility.HIDDEN,
        ])
      : pick<AddressVisibility>([
          AddressVisibility.PUBLIC,
          AddressVisibility.PUBLIC,
          AddressVisibility.AFTER_JOIN,
        ]);

  // ONE_TO_ONE = 2/2, GROUP = 2..(6/8/10/12), CUSTOM = 1..99 (varied)
  const min =
    mode === Mode.ONE_TO_ONE
      ? 2
      : mode === Mode.CUSTOM
        ? pick([1, 1, 2, 3, 5])
        : rand() > 0.5
          ? 4
          : 2;
  const baseMax =
    mode === Mode.ONE_TO_ONE
      ? 2
      : mode === Mode.CUSTOM
        ? pick([5, 10, 15, 20, 50, 100])
        : pick([6, 8, 10, 12]);
  const max = Math.max(min, baseMax);

  const selectedCategories = [
    firstCategory,
    ...pickMany(
      categories.filter((c) => c.id !== firstCategory.id),
      2
    ),
  ];
  const selectedTags = pickMany(tags, 1 + Math.floor(rand() * 3));
  const levels = pickMany(
    [Level.BEGINNER, Level.INTERMEDIATE, Level.ADVANCED],
    1 + Math.floor(rand() * 3)
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

  // City information for filtering
  const cityName = meetingKind !== MeetingKind.ONLINE ? city.name : null;
  const cityPlaceId = meetingKind !== MeetingKind.ONLINE ? city.placeId : null;

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

  // Transaction: create Event + memberships
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        title,
        description,
        notes,
        visibility,
        joinMode,
        mode,
        min,
        max,
        startAt,
        endAt,
        allowJoinLate,
        joinOpensMinutesBeforeStart,
        joinCutoffMinutesBeforeStart,
        lateJoinCutoffMinutesAfterStart,
        joinManuallyClosed,
        joinManuallyClosedAt,
        joinManuallyClosedById,
        joinManualCloseReason,
        meetingKind,
        onlineUrl,
        lat: meetingKind !== MeetingKind.ONLINE ? coords.lat : null,
        lng: meetingKind !== MeetingKind.ONLINE ? coords.lng : null,
        address: address ?? null,
        placeId: meetingKind !== MeetingKind.ONLINE ? place.placeId : null,
        radiusKm: radiusKm ?? null,
        cityName: cityName ?? null,
        cityPlaceId: cityPlaceId ?? null,
        levels,
        membersVisibility,
        addressVisibility,
        ownerId: author.id,
        categories: { connect: selectedCategories.map((c) => ({ id: c.id })) },
        tags: { connect: selectedTags.map((t) => ({ id: t.id })) },
        // All seeded events are published
        status: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // OWNER — always JOINED
    await tx.eventMember.create({
      data: {
        eventId: event.id,
        userId: author.id,
        role: EventMemberRole.OWNER,
        status: EventMemberStatus.JOINED,
        joinedAt: new Date(),
      },
    });

    // Optional moderator (JOINED)
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
      await tx.eventMember.create({
        data: {
          eventId: event.id,
          userId: maybeModerator.id,
          role: EventMemberRole.MODERATOR,
          status: EventMemberStatus.JOINED,
          addedById: author.id,
          joinedAt: new Date(),
        },
      });
    }

    // Participants: fill some JOINED, respect capacity strictly
    const alreadyJoined = await tx.eventMember.count({
      where: { eventId: event.id, status: EventMemberStatus.JOINED },
    });
    const freeSlots = Math.max(0, max - alreadyJoined);

    // ONE_TO_ONE: max 1 dodatkowy JOINED poza ownerem (moderator mógł już zabrać slot)
    const maxExtraForO2O = Math.max(0, 2 - alreadyJoined);
    const targetJoined =
      mode === Mode.ONE_TO_ONE
        ? Math.min(freeSlots, maxExtraForO2O)
        : Math.min(
            freeSlots,
            2 + Math.floor(rand() * Math.min(6, freeSlots + 1))
          );

    const pool = await tx.user.findMany({
      where: {
        id: { notIn: [author.id, maybeModerator?.id ?? ''] },
        role: Role.USER,
      },
      take: 20,
    });

    const participants = pickMany(pool, Math.max(0, targetJoined));
    for (const u of participants) {
      await tx.eventMember.create({
        data: {
          eventId: event.id,
          userId: u.id,
          role: EventMemberRole.PARTICIPANT,
          status: EventMemberStatus.JOINED,
          addedById: author.id,
          joinedAt: new Date(),
        },
      });
    }

    // Some PENDING/INVITED/REJECTED/BANNED (bez łamania capacity)
    const others = pool.filter((u) => !participants.find((p) => p.id === u.id));
    const extras = pickMany(others, Math.min(4, others.length));
    for (const u of extras) {
      const st = pick<EventMemberStatus>([
        EventMemberStatus.PENDING,
        EventMemberStatus.INVITED,
        EventMemberStatus.REJECTED,
        EventMemberStatus.BANNED,
      ]);
      await tx.eventMember.create({
        data: {
          eventId: event.id,
          userId: u.id,
          role: EventMemberRole.PARTICIPANT,
          status: st,
          addedById: author.id,
          note:
            st === EventMemberStatus.BANNED
              ? 'Banned during moderation (seed).'
              : st === EventMemberStatus.REJECTED
                ? 'Rejected due to capacity or profile mismatch (seed).'
                : null,
        },
      });
    }

    // Update event joinedCount with actual count
    const finalJoinedCount = await tx.eventMember.count({
      where: { eventId: event.id, status: EventMemberStatus.JOINED },
    });
    await tx.event.update({
      where: { id: event.id },
      data: { joinedCount: finalJoinedCount },
    });

    return {
      event,
      owner: author,
      participants: finalJoinedCount,
    };
  });
}

/** ---------- Seed: Events (random realistic) ---------- */
async function seedEvents(opts: {
  users: User[];
  categories: Category[];
  tags: Tag[];
}): Promise<Array<{ event: Event; owner: User }>> {
  const { users, categories, tags } = opts;
  const out: Array<{ event: Event; owner: User }> = [];

  const authorPool = users.filter((u) => u.role !== Role.USER);
  const userPool = users;

  // Zwiększona liczba eventów: 500 dla lepszego testowania map clustering
  const EVENTS_COUNT = 500;

  console.log(`   Creating ${EVENTS_COUNT} events...`);

  for (let i = 0; i < EVENTS_COUNT; i++) {
    const author = rand() > 0.65 ? pick(authorPool) : pick(userPool);
    const { event, owner } = await createEventWithMembers({
      author,
      categories,
      tags,
    });
    out.push({ event, owner });

    // Progress indicator co 50 eventów
    if ((i + 1) % 50 === 0) {
      console.log(`   Progress: ${i + 1}/${EVENTS_COUNT} events created`);
    }
  }

  return out;
}

/** ---------- EXTRA: Curated, diverse events for FIXED IDS ---------- */

type Scenario = {
  title?: string;
  city: (typeof CITIES)[number]['name'];
  meetingKind: MeetingKind;
  visibility: Visibility;
  joinMode?: JoinMode;
  mode: Mode;
  min?: number;
  max?: number;
  allowJoinLate?: boolean;
  radiusKm?: number | null;
  levels?: Level[];
  tagSlugs?: string[];
  when?: 'past' | 'soon' | 'future';
};

function buildScenarios(total: number): Scenario[] {
  const scenarios: Scenario[] = [];
  const cities = CITIES.map((c) => c.name);
  const kinds = [
    MeetingKind.ONSITE,
    MeetingKind.ONLINE,
    MeetingKind.HYBRID,
  ] as const;
  const vis = [Visibility.PUBLIC, Visibility.HIDDEN] as const;
  const joinModes = [
    JoinMode.OPEN,
    JoinMode.REQUEST,
    JoinMode.INVITE_ONLY,
  ] as const;
  const modes = [Mode.GROUP, Mode.ONE_TO_ONE, Mode.CUSTOM] as const;
  const whens: Scenario['when'][] = ['past', 'soon', 'future'];

  // Kategorie → użyjemy do tytułów, by brzmiało sensownie
  const categorySlugs = CATEGORY_DEFS.map((c) => c.slug);

  for (let i = 0; i < total; i++) {
    // deterministyczne, ale „losowe"
    const city = cities[i % cities.length]!;
    const meetingKind = kinds[i % kinds.length]!;
    const visibility = vis[i % vis.length]!;
    const joinMode = joinModes[i % joinModes.length]!;
    const mode = modes[i % modes.length]!;
    const when = whens[i % whens.length]!;
    const catSlug = categorySlugs[i % categorySlugs.length]!;
    const titles = TITLE_BY_CATEGORY[catSlug] ?? ['Meetup'];
    const title = titles[Math.floor(rnd() * titles.length)]!;

    // pojemności – 1:1 → 2/2, GROUP → 2..12, CUSTOM → 1..99
    const min =
      mode === Mode.ONE_TO_ONE
        ? 2
        : mode === Mode.CUSTOM
          ? pick([1, 1, 2, 3, 5])
          : rand() > 0.5
            ? 4
            : 2;
    const max =
      mode === Mode.ONE_TO_ONE
        ? 2
        : mode === Mode.CUSTOM
          ? pick([5, 10, 15, 20, 50, 100])
          : pick([6, 8, 10, 12]);

    // radius dla onsite/hybrid, bywa 0, 0.5, 1 lub ~losowy
    const radiusKm =
      meetingKind === MeetingKind.ONLINE
        ? null
        : i % 4 === 0
          ? 0
          : i % 4 === 1
            ? 0.5
            : i % 4 === 2
              ? 1
              : Number((rnd() * 3).toFixed(1));

    // poziomy
    const levels = pickMany(
      [Level.BEGINNER, Level.INTERMEDIATE, Level.ADVANCED],
      1 + Math.floor(rand() * 3)
    );

    // tagi po slugach (TAGS to etykiety – ich slug w seedzie = lower-case z myślnikami)
    const tagSlugs = pickMany(
      TAGS.map((t) => t.replace(/\s+/g, '-').toLowerCase()),
      1 + Math.floor(rand() * 3)
    );

    scenarios.push({
      title,
      city,
      meetingKind,
      visibility,
      joinMode,
      mode,
      min,
      max,
      allowJoinLate: rand() > 0.5,
      radiusKm,
      levels,
      tagSlugs,
      when,
    });
  }

  return scenarios;
}

const SCENARIOS: Scenario[] = buildScenarios(FIXED_EVENTS_TARGET);

function findCityDef(name: string) {
  const c = CITIES.find((x) => x.name === name)!;
  return c ?? CITIES[0];
}

function skewedTime(when?: Scenario['when']) {
  const base = new Date();
  const start = new Date(base);
  if (when === 'past') {
    start.setDate(base.getDate() - (1 + Math.floor(rand() * 7))); // 1–7 dni temu
  } else if (when === 'soon') {
    start.setDate(base.getDate() + (1 + Math.floor(rand() * 5))); // 1–5 dni
  } else {
    start.setDate(base.getDate() + (6 + Math.floor(rand() * 20))); // 6–25 dni
  }
  start.setHours(9 + Math.floor(rand() * 10), 0, 0, 0);
  const durMin = 60 + Math.floor(rand() * 121); // 60–180
  const end = new Date(start.getTime() + durMin * 60_000);
  return { startAt: start, endAt: end };
}

async function createPresetEvent(
  tx: Prisma.TransactionClient,
  author: User,
  categories: Category[],
  tags: Tag[],
  s: Scenario
): Promise<{ event: Event; owner: User }> {
  const city = findCityDef(s.city);
  const coords = randomWithinCity(city);
  const place = randomPlace(city);
  const { startAt, endAt } = skewedTime(s.when);

  const selectedCategories = pickMany(categories, 1 + Math.floor(rand() * 3));
  const selectedTags =
    (s.tagSlugs?.length
      ? tags.filter((t) => s.tagSlugs!.includes(t.slug))
      : pickMany(tags, 1 + Math.floor(rand() * 3))) || [];

  const title =
    s.title ??
    titleFor(selectedCategories[0]?.slug ?? pick(CATEGORY_DEFS).slug);

  const address =
    s.meetingKind !== MeetingKind.ONLINE ? `${place.name}, ${city.name}` : null;
  const onlineUrl =
    s.meetingKind !== MeetingKind.ONSITE
      ? pick([
          'https://meet.google.com/abc-defg-hij',
          'https://zoom.us/j/123456789',
          'https://discord.gg/xyz123',
        ])
      : null;

  // City information for filtering
  const cityName = s.meetingKind !== MeetingKind.ONLINE ? city.name : null;
  const cityPlaceId =
    s.meetingKind !== MeetingKind.ONLINE ? city.placeId : null;

  const desc =
    s.meetingKind === MeetingKind.ONSITE
      ? `${title} near ${place.name} in ${city.name}.`
      : s.meetingKind === MeetingKind.ONLINE
        ? `${title} (online).`
        : `${title} (hybrid): ${place.name}, ${city.name} or online.`;

  const min =
    s.min ?? (s.mode === Mode.ONE_TO_ONE ? 2 : s.mode === Mode.CUSTOM ? 1 : 2);
  const max =
    s.max ??
    (s.mode === Mode.ONE_TO_ONE
      ? 2
      : s.mode === Mode.CUSTOM
        ? 10
        : pick([6, 8, 10, 12]));

  // Members visibility: mostly PUBLIC, sometimes AFTER_JOIN, rarely HIDDEN
  const membersVisibility = pick<MembersVisibility>([
    MembersVisibility.PUBLIC,
    MembersVisibility.PUBLIC,
    MembersVisibility.PUBLIC,
    MembersVisibility.AFTER_JOIN,
    MembersVisibility.HIDDEN,
  ]);

  // Address visibility: based on event visibility
  const addressVisibility =
    s.visibility === Visibility.HIDDEN
      ? pick<AddressVisibility>([
          AddressVisibility.PUBLIC,
          AddressVisibility.AFTER_JOIN,
          AddressVisibility.HIDDEN,
        ])
      : pick<AddressVisibility>([
          AddressVisibility.PUBLIC,
          AddressVisibility.PUBLIC,
          AddressVisibility.AFTER_JOIN,
        ]);

  // Join window settings (similar to createEventWithMembers)
  const hasJoinWindowRestrictions = rand() > 0.4;
  const joinOpensMinutesBeforeStart = hasJoinWindowRestrictions
    ? rand() > 0.5
      ? pick([60, 120, 180, 240, 360, 720, 1440])
      : null
    : null;
  const joinCutoffMinutesBeforeStart = hasJoinWindowRestrictions
    ? rand() > 0.6
      ? pick([5, 10, 15, 30, 60])
      : null
    : null;
  const allowJoinLate = s.allowJoinLate ?? rand() > 0.5;
  const lateJoinCutoffMinutesAfterStart =
    allowJoinLate && rand() > 0.5 ? pick([10, 15, 30, 45, 60]) : null;

  // 5% manually closed
  const joinManuallyClosed = rand() > 0.95;
  const joinManuallyClosedAt = joinManuallyClosed ? new Date() : null;
  const joinManuallyClosedById = joinManuallyClosed ? author.id : null;
  const joinManualCloseReason = joinManuallyClosed
    ? pick([
        'Osiągnięto maksymalną liczbę uczestników',
        'Wydarzenie zostało przeniesione',
        'Zmiana planów organizatora',
        'Problemy techniczne z lokalizacją',
        null,
      ])
    : null;

  const event = await tx.event.create({
    data: {
      title,
      description: desc,
      notes:
        rand() > 0.6
          ? pick([
              'Bring water and comfy shoes.',
              'Beginner friendly.',
              'We start on time, come 10 min earlier.',
              'Optional: camera for portraits.',
            ])
          : null,
      visibility: s.visibility,
      joinMode: s.joinMode ?? JoinMode.OPEN,
      mode: s.mode,
      min,
      max,
      startAt,
      endAt,
      allowJoinLate,
      joinOpensMinutesBeforeStart,
      joinCutoffMinutesBeforeStart,
      lateJoinCutoffMinutesAfterStart,
      joinManuallyClosed,
      joinManuallyClosedAt,
      joinManuallyClosedById,
      joinManualCloseReason,
      meetingKind: s.meetingKind,
      onlineUrl,
      lat: s.meetingKind !== MeetingKind.ONLINE ? coords.lat : null,
      lng: s.meetingKind !== MeetingKind.ONLINE ? coords.lng : null,
      address,
      placeId: s.meetingKind !== MeetingKind.ONLINE ? place.placeId : null,
      radiusKm:
        s.meetingKind !== MeetingKind.ONLINE
          ? (s.radiusKm ?? (rand() > 0.7 ? Number((rnd() * 3).toFixed(1)) : 0))
          : null,
      cityName: cityName ?? null,
      cityPlaceId: cityPlaceId ?? null,
      levels: s.levels?.length
        ? s.levels
        : pickMany(
            [Level.BEGINNER, Level.INTERMEDIATE, Level.ADVANCED],
            1 + Math.floor(rand() * 3)
          ),
      membersVisibility,
      addressVisibility,
      ownerId: author.id,
      categories: { connect: selectedCategories.map((c) => ({ id: c.id })) },
      tags: { connect: selectedTags.map((t) => ({ id: t.id })) },
      // All seeded events are published
      status: PublicationStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  // OWNER
  await tx.eventMember.create({
    data: {
      eventId: event.id,
      userId: author.id,
      role: EventMemberRole.OWNER,
      status: EventMemberStatus.JOINED,
      joinedAt: new Date(),
    },
  });

  // Wypełnij część miejsc
  const alreadyJoined = await tx.eventMember.count({
    where: { eventId: event.id, status: EventMemberStatus.JOINED },
  });
  const freeSlots = Math.max(0, (event.max ?? 10) - alreadyJoined);
  const howMany =
    event.mode === Mode.ONE_TO_ONE
      ? Math.min(freeSlots, 1)
      : Math.min(
          freeSlots,
          2 + Math.floor(rand() * Math.min(6, freeSlots + 1))
        );

  const pool = await tx.user.findMany({
    where: { id: { not: author.id }, role: Role.USER },
    take: 20,
  });
  const participants = pickMany(pool, Math.max(0, howMany));
  for (const u of participants) {
    await tx.eventMember.create({
      data: {
        eventId: event.id,
        userId: u.id,
        role: EventMemberRole.PARTICIPANT,
        status: EventMemberStatus.JOINED,
        addedById: author.id,
        joinedAt: new Date(),
      },
    });
  }

  // Update event joinedCount with actual count
  const finalJoinedCount = await tx.eventMember.count({
    where: { eventId: event.id, status: EventMemberStatus.JOINED },
  });
  await tx.event.update({
    where: { id: event.id },
    data: { joinedCount: finalJoinedCount },
  });

  return { event, owner: author };
}

async function seedEventsForFixedUsers(opts: {
  users: User[];
  categories: Category[];
  tags: Tag[];
}): Promise<Array<{ event: Event; owner: User }>> {
  const { users, categories, tags } = opts;
  const byId = new Map(users.map((u) => [u.id, u]));
  const admin = byId.get(FIXED_IDS.ADMIN);
  const mod = byId.get(FIXED_IDS.MODERATOR);
  const user = byId.get(FIXED_IDS.USER);

  const authors: User[] = [admin, mod, user].filter(Boolean) as User[];
  if (!authors.length) return [];

  const pairs: Array<{ event: Event; owner: User }> = [];

  await prisma.$transaction(async (tx) => {
    // round-robin autorów
    for (let i = 0; i < SCENARIOS.length; i++) {
      const author = authors[i % authors.length]!;
      const s = SCENARIOS[i]!;
      const pair = await createPresetEvent(tx, author, categories, tags, s);
      pairs.push(pair);
    }

    // Opcjonalnie anuluj 1–2 z nich + notyfikacje
    const cancelSome = pickMany(pairs, Math.min(2, pairs.length));
    for (const { event, owner } of cancelSome) {
      const updated = await tx.event.update({
        where: { id: event.id },
        data: {
          canceledAt: new Date(),
          canceledById: owner.id,
          cancelReason: pick([
            'Organizer is ill. Sorry!',
            'Venue unavailable.',
            'Unexpected conflict.',
          ]),
        },
      });

      const recips = await tx.eventMember.findMany({
        where: {
          eventId: updated.id,
          status: {
            in: [
              EventMemberStatus.JOINED,
              EventMemberStatus.PENDING,
              EventMemberStatus.INVITED,
            ],
          },
        },
        select: { userId: true },
      });

      if (recips.length) {
        await tx.notification.createMany({
          data: recips.map((m) => ({
            kind: NotificationKind.EVENT_CANCELED,
            recipientId: m.userId,
            actorId: owner.id,
            entityType: NotificationEntity.EVENT,
            entityId: updated.id,
            eventId: updated.id,
            data: {
              eventTitle: updated.title,
              reason: updated.cancelReason,
            } as Prisma.InputJsonValue,
            dedupeKey: `event_canceled:${m.userId}:${updated.id}`,
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  return pairs;
}

/** ---------- NEW: Seed some cancellations + notifications ---------- */
async function seedCanceledEvents(
  eventsCreated: Array<{ event: Event; owner: User }>
): Promise<Array<{ event: Event; owner: User }>> {
  // ~30% eventów oznacz jako anulowane
  const toCancel = eventsCreated.filter(() => rand() > 0.7);
  for (const item of toCancel) {
    const { event, owner } = item;
    const reason = pick([
      'Venue unavailable due to maintenance.',
      'Organizer is ill. Sorry!',
      'Weather alert – safety first.',
      'Scheduling conflict, will reschedule soon.',
    ]);

    // Mark canceled (idempotent)
    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        canceledAt: new Date(),
        canceledById: owner.id,
        cancelReason: reason,
      },
    });

    // Notify JOINED/PENDING/INVITED members
    const recipients = await prisma.eventMember.findMany({
      where: {
        eventId: updated.id,
        status: {
          in: [
            EventMemberStatus.JOINED,
            EventMemberStatus.PENDING,
            EventMemberStatus.INVITED,
            EventMemberStatus.WAITLIST,
          ],
        },
      },
      select: { userId: true },
    });

    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((m) => ({
          kind: NotificationKind.EVENT_CANCELED,
          recipientId: m.userId,
          actorId: owner.id,
          entityType: NotificationEntity.EVENT,
          entityId: updated.id,
          eventId: updated.id,
          data: {
            eventTitle: updated.title,
            reason,
          } as Prisma.InputJsonValue,
          dedupeKey: `event_canceled:${m.userId}:${updated.id}`,
          createdAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }
  }
  return toCancel;
}

/** ---------- NEW: Seed some soft-deleted (after 30 days) ---------- */
async function seedDeletedEventsAfterCancel(
  canceled: Array<{ event: Event; owner: User }>
) {
  const sample = canceled.filter(() => rand() > 0.6);
  const THIRTY_FIVE_DAYS_MS = 35 * 24 * 60 * 60 * 1000;
  for (const { event, owner } of sample) {
    const canceledAtPast = new Date(Date.now() - THIRTY_FIVE_DAYS_MS);
    await prisma.event.update({
      where: { id: event.id },
      data: {
        canceledAt: canceledAtPast,
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
  eventsCreated: Array<{ event: Event; owner: User }>,
  users: User[]
) {
  for (const { event, owner } of eventsCreated) {
    const audience = users.filter((u) => u.id !== owner.id);
    const recipients = pickMany(audience, 2 + Math.floor(rand() * 3)); // 2..4

    for (const r of recipients) {
      // EVENT_CREATED
      await prisma.notification.create({
        data: {
          kind: NotificationKind.EVENT_CREATED,
          recipientId: r.id,
          actorId: owner.id,
          entityType: NotificationEntity.EVENT,
          entityId: event.id,
          eventId: event.id,
          data: {
            eventTitle: event.title,
            address: event.address,
            startAt: event.startAt.toISOString(),
            meetingKind: event.meetingKind,
          } as Prisma.InputJsonValue,
          dedupeKey: `event_created:${r.id}:${event.id}`,
        },
      });

      // Occasionally INVITE (pretend owner invited r)
      if (rand() > 0.7) {
        await prisma.notification.create({
          data: {
            kind: NotificationKind.EVENT_INVITE,
            recipientId: r.id,
            actorId: owner.id,
            entityType: NotificationEntity.EVENT,
            entityId: event.id,
            eventId: event.id,
            data: {
              eventTitle: event.title,
            } as Prisma.InputJsonValue,
            dedupeKey: `event_invite:${r.id}:${event.id}`,
          },
        });
      }

      // Sometimes REMINDER
      if (rand() > 0.6) {
        await prisma.notification.create({
          data: {
            kind: NotificationKind.EVENT_REMINDER,
            recipientId: r.id,
            actorId: owner.id,
            entityType: NotificationEntity.EVENT,
            entityId: event.id,
            eventId: event.id,
            data: {
              eventTitle: event.title,
              startsAt: event.startAt.toISOString(),
            } as Prisma.InputJsonValue,
            dedupeKey: `event_reminder:${r.id}:${event.id}`,
          },
        });
      }

      // Sometimes EVENT_UPDATED with changedFields
      if (rand() > 0.5) {
        const possibleChanges = [
          'title',
          'description',
          'startAt',
          'endAt',
          'address',
          'max',
        ];
        // Pick 1-3 random changes
        const numChanges = 1 + Math.floor(rand() * 3);
        const changedFields: string[] = [];
        for (let c = 0; c < numChanges && possibleChanges.length > 0; c++) {
          const idx = Math.floor(rand() * possibleChanges.length);
          changedFields.push(possibleChanges.splice(idx, 1)[0]!);
        }

        await prisma.notification.create({
          data: {
            kind: NotificationKind.EVENT_UPDATED,
            recipientId: r.id,
            actorId: owner.id,
            entityType: NotificationEntity.EVENT,
            entityId: event.id,
            eventId: event.id,
            data: {
              eventId: event.id,
              eventTitle: event.title,
              changedFields,
              changes: {
                ...(changedFields.includes('startAt')
                  ? {
                      startAt: {
                        old: new Date(
                          event.startAt.getTime() - 3600000
                        ).toISOString(),
                        new: event.startAt.toISOString(),
                      },
                    }
                  : {}),
                ...(changedFields.includes('address')
                  ? { address: { old: 'Old Location', new: event.address } }
                  : {}),
                ...(changedFields.includes('max')
                  ? { max: { old: 10, new: 20 } }
                  : {}),
              },
            } as Prisma.InputJsonValue,
            dedupeKey: `event_updated:${r.id}:${event.id}:${Date.now()}`,
          },
        });
      }
    }
  }

  // DM Messages (use kind=NEW_MESSAGE; entityType=MESSAGE)
  for (let i = 0; i < 25; i++) {
    const sender = pick(users);
    const recipient = pick(users.filter((u) => u.id !== sender.id));
    const msgId = idLike('msg');
    const messageContent = pick([
      'Hey!',
      'Are you coming?',
      "Let's connect.",
      'See you soon!',
    ]);

    await prisma.notification.create({
      data: {
        kind: NotificationKind.NEW_MESSAGE,
        recipientId: recipient.id,
        actorId: sender.id,
        entityType: NotificationEntity.MESSAGE,
        entityId: msgId,
        data: {
          messageContent,
          threadId: idLike('dm'),
        } as Prisma.InputJsonValue,
        dedupeKey: `dm_message:${recipient.id}:${msgId}`,
      },
    });
  }

  // Payments (use kind=SYSTEM; entityType=PAYMENT)
  for (let i = 0; i < 15; i++) {
    const payer = pick(users);
    const payId = idLike('pay');
    const amount = (Math.floor(rand() * 5000) + 500) / 100; // 5.00–55.00
    const currency = pick([...CURRENCIES]);

    await prisma.notification.create({
      data: {
        kind: NotificationKind.SYSTEM,
        recipientId: payer.id,
        actorId: null,
        entityType: NotificationEntity.PAYMENT,
        entityId: payId,
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

/** ---------- Seed: DM Threads and Messages ---------- */
async function seedDmThreads(users: User[]) {
  const threads: any[] = [];
  const messages: any[] = [];

  // Create 15-20 random DM threads between users
  const threadCount = 15 + Math.floor(rand() * 6); // 15-20 threads

  for (let i = 0; i < threadCount; i++) {
    const user1 = pick(users);
    let user2 = pick(users);

    // Ensure different users
    while (user2.id === user1.id) {
      user2 = pick(users);
    }

    const sortedIds = [user1.id, user2.id].sort();
    const aUserId = sortedIds[0]!;
    const bUserId = sortedIds[1]!;
    const pairKey = `${aUserId}|${bUserId}`;

    // Check if thread already exists
    const existing = threads.find((t) => t.pairKey === pairKey);
    if (existing) continue;

    const thread = await prisma.dmThread.create({
      data: {
        aUserId,
        bUserId,
        pairKey,
      },
    });

    threads.push(thread);

    // Create 3-10 messages in this thread
    const messageCount = 3 + Math.floor(rand() * 8);
    let lastMessageAt = new Date(
      Date.now() - Math.floor(rand() * 7) * 86400000
    ); // 0-7 days ago

    for (let j = 0; j < messageCount; j++) {
      const sender = rand() > 0.5 ? user1 : user2;
      const messageContent = pick([
        'Hey! How are you?',
        'Are you coming to the event?',
        'Thanks for the invite!',
        'See you there!',
        'Let me know if you need anything.',
        'That sounds great!',
        "I'm interested in joining.",
        'What time does it start?',
        'Can I bring a friend?',
        'Looking forward to it!',
        'Do you have more details?',
        'Count me in!',
        "Sorry, I can't make it.",
        'Maybe next time!',
        'Thanks for organizing this.',
        'Where exactly is the location?',
        'Is there a fee?',
        'What should I bring?',
        'See you soon!',
        'Thanks for the update!',
      ]);

      // Messages are spread over time
      const messageTime = new Date(
        lastMessageAt.getTime() + Math.floor(rand() * 3600000)
      ); // 0-1 hour after previous

      const message = await prisma.dmMessage.create({
        data: {
          threadId: thread.id,
          senderId: sender.id,
          content: messageContent,
          createdAt: messageTime,
          // 70% of messages are read
          readAt:
            rand() > 0.3 ? new Date(messageTime.getTime() + 300000) : null,
        },
      });

      messages.push(message);
      lastMessageAt = messageTime;
    }

    // Update thread's lastMessageAt
    await prisma.dmThread.update({
      where: { id: thread.id },
      data: { lastMessageAt },
    });

    // 20% chance of muting the thread for one user
    if (rand() > 0.8) {
      const muteUser = rand() > 0.5 ? user1 : user2;
      await prisma.dmMute.create({
        data: {
          threadId: thread.id,
          userId: muteUser.id,
          muted: true,
        },
      });
    }
  }

  console.log(
    `💬 Created ${threads.length} DM threads with ${messages.length} messages`
  );
  return { threads, messages };
}

/** ---------- Seed: Comments ---------- */
async function seedComments(
  allEvents: Array<{ event: any; owner: User }>,
  _users: User[]
) {
  const comments: any[] = [];

  // Add comments to 60% of events
  const eventsToComment = allEvents.filter(() => rand() > 0.4).slice(0, 20);

  for (const { event } of eventsToComment) {
    // Skip deleted or canceled events
    if (event.deletedAt || event.canceledAt) continue;

    // Get members of this event
    const members = await prisma.eventMember.findMany({
      where: {
        eventId: event.id,
        status: 'JOINED',
      },
      select: { userId: true },
    });

    if (members.length === 0) continue;

    // Create 2-8 root comments
    const rootCount = 2 + Math.floor(rand() * 7);

    for (let i = 0; i < rootCount; i++) {
      const author = members[Math.floor(rand() * members.length)];
      const commentContent = pick([
        'Looking forward to this event!',
        'Great idea, count me in!',
        'What should I bring?',
        'Is parking available nearby?',
        'Can I bring a friend?',
        'Excited to meet everyone!',
        'Thanks for organizing this!',
        'What time should we arrive?',
        'Is there a backup plan for bad weather?',
        'This sounds amazing!',
      ]);

      const createdAt = new Date(
        Date.now() - Math.floor(rand() * 5) * 86400000
      ); // 0-5 days ago

      // 5% of comments are deleted by author
      const isDeleted = rand() > 0.95;
      const deletedAt = isDeleted
        ? new Date(createdAt.getTime() + Math.floor(rand() * 86400000))
        : null;

      const rootComment = await prisma.comment.create({
        data: {
          eventId: event.id,
          authorId: author!.userId,
          content: commentContent,
          threadId: event.id, // Root comments use event ID as threadId
          createdAt,
          deletedAt,
          deletedById: isDeleted ? author!.userId : null,
        },
      });

      comments.push(rootComment);

      // Notify event owners/moderators about new comment (if not deleted)
      if (!isDeleted) {
        const ownersAndMods = await prisma.eventMember.findMany({
          where: {
            eventId: event.id,
            role: { in: ['OWNER', 'MODERATOR'] },
            status: 'JOINED',
            userId: { not: author!.userId },
          },
          select: { userId: true },
        });

        if (ownersAndMods.length > 0) {
          await prisma.notification.createMany({
            data: ownersAndMods.map((m) => ({
              kind: NotificationKind.EVENT_COMMENT_ADDED,
              recipientId: m.userId,
              actorId: author!.userId,
              entityType: NotificationEntity.EVENT,
              entityId: event.id,
              eventId: event.id,
              data: {
                commentId: rootComment.id,
                eventTitle: event.title,
                commentContent: commentContent.slice(0, 100),
              } as Prisma.InputJsonValue,
              dedupeKey: `comment_added:${m.userId}:${rootComment.id}`,
              createdAt,
            })),
            skipDuplicates: true,
          });
        }
      }

      // 40% chance of having 1-3 replies
      if (rand() > 0.6) {
        const replyCount = 1 + Math.floor(rand() * 3);
        for (let j = 0; j < replyCount; j++) {
          const replyAuthor = members[Math.floor(rand() * members.length)];
          const replyContent = pick([
            'Good question!',
            'I was wondering the same thing.',
            'Thanks for asking!',
            'See you there!',
            'Me too!',
            'Great point!',
            'I can help with that.',
            'Let me know if you need anything.',
          ]);

          const replyCreatedAt = new Date(
            rootComment.createdAt.getTime() + Math.floor(rand() * 86400000)
          ); // 0-1 day after parent

          // 3% of replies are hidden by moderator (owner or moderator)
          const isHidden = rand() > 0.97;
          let hiddenAt = null;
          let hiddenById = null;

          if (isHidden) {
            // Get moderators (owner or moderator role)
            const moderators = await prisma.eventMember.findMany({
              where: {
                eventId: event.id,
                role: { in: ['OWNER', 'MODERATOR'] },
                status: 'JOINED',
              },
              select: { userId: true },
            });

            if (moderators.length > 0) {
              const moderator = pick(moderators);
              hiddenById = moderator.userId;
              hiddenAt = new Date(
                replyCreatedAt.getTime() + Math.floor(rand() * 3600000)
              ); // Hidden within 1 hour
            }
          }

          const reply = await prisma.comment.create({
            data: {
              eventId: event.id,
              authorId: replyAuthor!.userId,
              content: replyContent,
              threadId: rootComment.id,
              parentId: rootComment.id,
              createdAt: replyCreatedAt,
              hiddenAt,
              hiddenById,
            },
          });

          comments.push(reply);

          // Notify parent comment author about reply (if not hidden and not same author)
          if (!hiddenAt && replyAuthor!.userId !== rootComment.authorId) {
            await prisma.notification.create({
              data: {
                kind: NotificationKind.COMMENT_REPLY,
                recipientId: rootComment.authorId,
                actorId: replyAuthor!.userId,
                entityType: NotificationEntity.EVENT,
                entityId: event.id,
                eventId: event.id,
                data: {
                  commentId: reply.id,
                  parentCommentId: rootComment.id,
                  eventTitle: event.title,
                  commentContent: replyContent.slice(0, 100),
                } as Prisma.InputJsonValue,
                dedupeKey: `comment_reply:${rootComment.authorId}:${reply.id}`,
                createdAt: replyCreatedAt,
              },
            });
          }
        }
      }
    }

    // Update event commentsCount (only count non-deleted and non-hidden)
    const visibleComments = comments.filter(
      (c) => c.eventId === event.id && !c.deletedAt && !c.hiddenAt
    );
    await prisma.event.update({
      where: { id: event.id },
      data: {
        commentsCount: visibleComments.length,
      },
    });
  }

  const deletedCount = comments.filter((c) => c.deletedAt).length;
  const hiddenCount = comments.filter((c) => c.hiddenAt).length;
  console.log(
    `💭 Created ${comments.length} comments (${deletedCount} deleted by authors, ${hiddenCount} hidden by moderators)`
  );
  return comments;
}

/** ---------- Seed: Reviews ---------- */
async function seedReviews(
  allEvents: Array<{ event: any; owner: User }>,
  _users: User[]
) {
  const reviews: any[] = [];

  // Add reviews only to past events
  const pastEvents = allEvents.filter(
    ({ event }) =>
      event.endAt < new Date() && !event.deletedAt && !event.canceledAt
  );

  for (const { event } of pastEvents) {
    // Get members who joined
    const members = await prisma.eventMember.findMany({
      where: {
        eventId: event.id,
        status: 'JOINED',
      },
      select: { userId: true },
    });

    if (members.length === 0) continue;

    // 50-80% of members leave reviews
    const reviewerCount = Math.floor(members.length * (0.5 + rand() * 0.3));

    for (let i = 0; i < reviewerCount; i++) {
      const reviewer = members[i];
      if (!reviewer) continue;

      // Rating distribution: mostly 4-5 stars
      const ratingRoll = rand();
      let rating: number;
      if (ratingRoll > 0.8) rating = 5;
      else if (ratingRoll > 0.5) rating = 4;
      else if (ratingRoll > 0.3) rating = 3;
      else if (ratingRoll > 0.1) rating = 2;
      else rating = 1;

      const reviewContent =
        rating >= 4
          ? pick([
              'Great event, really enjoyed it!',
              'Well organized and fun!',
              'Would definitely join again.',
              'Met some amazing people!',
              'Exceeded my expectations!',
              null, // Some reviews have no content
            ])
          : rating === 3
            ? pick([
                'It was okay, could be better.',
                'Not bad, but not great either.',
                null,
              ])
            : pick([
                'Not what I expected.',
                'Could have been better organized.',
                'Disappointed.',
              ]);

      const createdAt = new Date(
        event.endAt.getTime() + Math.floor(rand() * 3) * 86400000
      ); // 0-3 days after event

      // 4% of reviews are deleted by author
      const isDeleted = rand() > 0.96;
      const deletedAt = isDeleted
        ? new Date(createdAt.getTime() + Math.floor(rand() * 86400000))
        : null;

      // 2% of reviews are hidden by moderator
      const isHidden = rand() > 0.98 && !isDeleted;
      let hiddenAt = null;
      let hiddenById = null;

      if (isHidden) {
        // Get moderators (owner or moderator role)
        const moderators = await prisma.eventMember.findMany({
          where: {
            eventId: event.id,
            role: { in: ['OWNER', 'MODERATOR'] },
            status: 'JOINED',
          },
          select: { userId: true },
        });

        if (moderators.length > 0) {
          const moderator = pick(moderators);
          hiddenById = moderator.userId;
          hiddenAt = new Date(
            createdAt.getTime() + Math.floor(rand() * 7 * 86400000)
          ); // Hidden within 7 days
        }
      }

      const review = await prisma.review.create({
        data: {
          eventId: event.id,
          authorId: reviewer.userId,
          rating,
          content: reviewContent,
          createdAt,
          deletedAt,
          deletedById: isDeleted ? reviewer.userId : null,
          hiddenAt,
          hiddenById,
        },
      });

      reviews.push(review);

      // Notify event owners/moderators about new review (if not deleted)
      if (!isDeleted) {
        const ownersAndMods = await prisma.eventMember.findMany({
          where: {
            eventId: event.id,
            role: { in: ['OWNER', 'MODERATOR'] },
            status: 'JOINED',
            userId: { not: reviewer.userId },
          },
          select: { userId: true },
        });

        if (ownersAndMods.length > 0) {
          await prisma.notification.createMany({
            data: ownersAndMods.map((m) => ({
              kind: NotificationKind.EVENT_REVIEW_RECEIVED,
              recipientId: m.userId,
              actorId: reviewer.userId,
              entityType: NotificationEntity.REVIEW,
              entityId: review.id,
              eventId: event.id,
              data: {
                reviewId: review.id,
                eventTitle: event.title,
                rating,
                reviewContent: reviewContent?.slice(0, 100) || null,
              } as Prisma.InputJsonValue,
              dedupeKey: `review_received:${m.userId}:${review.id}`,
              createdAt,
            })),
            skipDuplicates: true,
          });
        }
      }
    }
  }

  const deletedCount = reviews.filter((r) => r.deletedAt).length;
  const hiddenCount = reviews.filter((r) => r.hiddenAt).length;
  console.log(
    `⭐ Created ${reviews.length} reviews (${deletedCount} deleted by authors, ${hiddenCount} hidden by moderators)`
  );
  return reviews;
}

/** ---------- Seed: Reports ---------- */
async function seedReports(
  allEvents: Array<{ event: any; owner: User }>,
  users: User[]
) {
  const reports: any[] = [];

  // Create 5-10 sample reports
  const reportCount = 5 + Math.floor(rand() * 6);

  for (let i = 0; i < reportCount; i++) {
    const reporter = pick(users);
    const entityType = pick([
      'EVENT',
      'COMMENT',
      'REVIEW',
      'USER',
      'MESSAGE',
      'CHAT',
    ]);

    let entityId: string | null = null;

    // Find a valid entity to report
    switch (entityType) {
      case 'EVENT': {
        const event = pick(allEvents.filter(({ event }) => !event.deletedAt));
        entityId = event?.event.id;
        break;
      }
      case 'USER': {
        const user = pick(users.filter((u) => u.id !== reporter.id));
        entityId = user?.id;
        break;
      }
      case 'CHAT': {
        // Report a DM thread or event chat
        const dmThread = await prisma.dmThread.findFirst({
          where: {
            OR: [{ aUserId: reporter.id }, { bUserId: reporter.id }],
          },
        });
        if (dmThread) {
          entityId = dmThread.id;
        } else {
          // Fallback to event chat
          const eventWithChat = pick(
            allEvents.filter(({ event }) => !event.deletedAt)
          );
          entityId = eventWithChat?.event.id;
        }
        break;
      }
      // For COMMENT, REVIEW, MESSAGE - we'd need to query them
      // Skipping for simplicity in seed
      default:
        continue;
    }

    if (!entityId) continue;

    const reason = pick([
      'Inappropriate content',
      'Spam or misleading',
      'Harassment or bullying',
      'Hate speech',
      'Violence or dangerous content',
      'False information',
      'Copyright violation',
    ]);

    const status = pick(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']);

    const report = await prisma.report.create({
      data: {
        reporterId: reporter.id,
        entity: entityType as any,
        entityId,
        reason,
        status,
        createdAt: new Date(Date.now() - Math.floor(rand() * 30) * 86400000), // 0-30 days ago
        resolvedAt:
          status === 'RESOLVED' || status === 'DISMISSED'
            ? new Date(Date.now() - Math.floor(rand() * 10) * 86400000)
            : null,
      },
    });

    reports.push(report);
  }

  console.log(`🚨 Created ${reports.length} reports`);
  return reports;
}

/** ---------- Seed: Event Chat Messages ---------- */
async function seedEventChatMessages(
  allEvents: Array<{ event: any; owner: User }>,
  _users: User[]
) {
  const messages: any[] = [];

  // Add chat messages to 70% of events
  const eventsToChat = allEvents
    .filter(() => rand() > 0.3)
    .filter(({ event }) => !event.deletedAt && !event.canceledAt)
    .slice(0, 25);

  for (const { event } of eventsToChat) {
    // Get JOINED members
    const members = await prisma.eventMember.findMany({
      where: {
        eventId: event.id,
        status: 'JOINED',
      },
      select: { userId: true },
    });

    if (members.length === 0) continue;

    // Create 5-20 messages
    const messageCount = 5 + Math.floor(rand() * 16);

    let lastMessageTime = new Date(
      event.createdAt.getTime() + Math.floor(rand() * 3600000)
    );

    for (let i = 0; i < messageCount; i++) {
      const author = members[Math.floor(rand() * members.length)];
      const messageContent = pick([
        'Hey everyone! 👋',
        'Looking forward to this!',
        'What time are we meeting?',
        'Should I bring anything?',
        'See you all there!',
        'Thanks for organizing this!',
        'Count me in!',
        'This is going to be awesome!',
        'Anyone else excited?',
        'Let me know if you need help with anything.',
        'Where exactly is the meeting point?',
        'Is there parking nearby?',
        'Can we reschedule if it rains?',
        'I might be a few minutes late.',
        'Looking forward to meeting you all!',
        'This is my first time, any tips?',
        'Thanks for the invite!',
        'See you soon!',
        'Great idea!',
        'Im in!',
      ]);

      const message = await prisma.eventChatMessage.create({
        data: {
          eventId: event.id,
          authorId: author!.userId,
          content: messageContent,
          createdAt: lastMessageTime,
        },
      });

      messages.push(message);

      // Next message 5-60 minutes later
      lastMessageTime = new Date(
        lastMessageTime.getTime() + (5 + Math.floor(rand() * 55)) * 60000
      );

      // 10% chance of a reply
      if (rand() > 0.9 && messages.length > 0) {
        const replyTo = messages[Math.floor(rand() * messages.length)];
        if (replyTo.eventId === event.id) {
          const replyAuthor = members[Math.floor(rand() * members.length)];
          const replyContent = pick([
            'Good question!',
            'I was wondering the same thing.',
            'Thanks!',
            'Sounds good!',
            'Me too!',
            'Agreed!',
            'Let me check.',
            'I can help with that.',
          ]);

          const reply = await prisma.eventChatMessage.create({
            data: {
              eventId: event.id,
              authorId: replyAuthor!.userId,
              content: replyContent,
              replyToId: replyTo.id,
              createdAt: new Date(lastMessageTime.getTime() + 60000),
            },
          });

          messages.push(reply);
        }
      }
    }

    // Update event messagesCount
    await prisma.event.update({
      where: { id: event.id },
      data: {
        messagesCount: messages.filter((m) => m.eventId === event.id).length,
      },
    });

    // Create EventChatRead for some members (50% have read)
    for (const member of members) {
      if (rand() > 0.5) {
        const lastReadAt = new Date(
          lastMessageTime.getTime() - Math.floor(rand() * 3600000)
        );
        await prisma.eventChatRead.create({
          data: {
            eventId: event.id,
            userId: member.userId,
            lastReadAt,
          },
        });
      }
    }
  }

  console.log(`💬 Created ${messages.length} event chat messages`);
  return messages;
}

/** ---------- Seed: User Blocks ---------- */
async function seedUserBlocks(users: User[]) {
  const blocks: any[] = [];

  // Create 5-10 random blocks
  const blockCount = 5 + Math.floor(rand() * 6);

  for (let i = 0; i < blockCount; i++) {
    const blocker = pick(users);
    let blocked = pick(users);

    // Ensure different users
    while (blocked.id === blocker.id) {
      blocked = pick(users);
    }

    // Check if block already exists
    const existing = blocks.find(
      (b) =>
        (b.blockerId === blocker.id && b.blockedId === blocked.id) ||
        (b.blockerId === blocked.id && b.blockedId === blocker.id)
    );

    if (existing) continue;

    const block = await prisma.userBlock.create({
      data: {
        blockerId: blocker.id,
        blockedId: blocked.id,
      },
    });

    blocks.push(block);
  }

  console.log(`🚫 Created ${blocks.length} user blocks`);
  return blocks;
}

/** ---------- Seed: Event Invite Links ---------- */
async function seedEventInviteLinks(
  allEvents: Array<{ event: any; owner: User }>
) {
  const links: any[] = [];

  // Add invite links to 30% of events
  const eventsWithLinks = allEvents
    .filter(() => rand() > 0.7)
    .filter(({ event }) => !event.deletedAt && !event.canceledAt)
    .slice(0, 10);

  for (const { event } of eventsWithLinks) {
    // Create 1-3 invite links per event
    const linkCount = 1 + Math.floor(rand() * 3);

    for (let i = 0; i < linkCount; i++) {
      const maxUses = rand() > 0.5 ? 10 + Math.floor(rand() * 40) : null;
      const expiresAt =
        rand() > 0.6
          ? new Date(Date.now() + (7 + Math.floor(rand() * 23)) * 86400000)
          : null; // 7-30 days from now

      const usedCount = maxUses ? Math.floor(rand() * Math.min(maxUses, 5)) : 0;

      const link = await prisma.eventInviteLink.create({
        data: {
          eventId: event.id,
          code: `INV${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
          maxUses,
          usedCount,
          expiresAt,
        },
      });

      links.push(link);
    }
  }

  console.log(`🔗 Created ${links.length} event invite links`);
  return links;
}

/** ---------- Seed: Event Join Questions ---------- */
async function seedEventJoinQuestions(
  allEvents: Array<{ event: any; owner: User }>
) {
  const joinQuestions: any[] = [];

  // Question templates for REQUEST events
  const QUESTION_TEMPLATES = [
    {
      type: 'TEXT',
      label: 'Dlaczego chcesz dołączyć do tego wydarzenia?',
      helpText: 'Powiedz nam w kilku zdaniach co Cię zainteresowało',
      required: true,
      maxLength: 500,
    },
    {
      type: 'TEXT',
      label: 'Jakie masz doświadczenie w tej dziedzinie?',
      helpText: 'Opisz swoje umiejętności i doświadczenie',
      required: false,
      maxLength: 300,
    },
    {
      type: 'SINGLE_CHOICE',
      label: 'Jak się o nas dowiedziałeś?',
      required: true,
      options: [
        { label: 'Przez znajomych' },
        { label: 'Media społecznościowe' },
        { label: 'Wyszukiwarka' },
        { label: 'Inne' },
      ],
    },
    {
      type: 'MULTI_CHOICE',
      label: 'Co chciałbyś zyskać z tego wydarzenia?',
      required: true,
      options: [
        { label: 'Nową wiedzę' },
        { label: 'Poznanie ludzi' },
        { label: 'Praktyczne umiejętności' },
        { label: 'Rozrywkę' },
      ],
    },
    {
      type: 'TEXT',
      label: 'Czy masz jakieś pytania do organizatora?',
      helpText: 'Możesz zadać pytanie przed dołączeniem',
      required: false,
      maxLength: 300,
    },
  ];

  for (const { event } of allEvents) {
    // Only for REQUEST mode events, ~30% chance
    if (event.joinMode !== 'REQUEST' || Math.random() > 0.3) {
      continue;
    }

    // Pick 2-4 random questions
    const numQuestions = 2 + Math.floor(Math.random() * 3); // 2-4
    const selectedTemplates = QUESTION_TEMPLATES.slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, numQuestions);

    selectedTemplates.forEach((template, index) => {
      joinQuestions.push({
        eventId: event.id,
        order: index,
        ...template,
        options: template.options || null,
      });
    });
  }

  // Bulk insert
  if (joinQuestions.length > 0) {
    await prisma.eventJoinQuestion.createMany({
      data: joinQuestions,
      skipDuplicates: true,
    });
    console.log(`❓ Created ${joinQuestions.length} join questions`);
  }
}

/** ---------- Seed: Event FAQs ---------- */
async function seedEventFaqs(allEvents: Array<{ event: any; owner: User }>) {
  const faqs: any[] = [];

  // FAQ templates by meeting kind
  const FAQ_TEMPLATES = {
    ONSITE: [
      {
        question: 'Gdzie dokładnie się spotykamy?',
        answer:
          'Spotykamy się przy głównym wejściu w podanej lokalizacji. Szczegółowy adres znajdziesz w opisie wydarzenia.',
      },
      {
        question: 'Czy jest parking w pobliżu?',
        answer:
          'Tak, w okolicy jest parking publiczny. Można również dojechać komunikacją miejską.',
      },
      {
        question: 'Co powinienem zabrać ze sobą?',
        answer:
          'Wygodne buty i wodę. Jeśli masz jakieś specjalne potrzeby, daj nam znać w komentarzach.',
      },
      {
        question: 'Co jeśli się spóźnię?',
        answer:
          'Prosimy o punktualność, ale jeśli się spóźnisz, skontaktuj się z nami przez czat wydarzenia.',
      },
    ],
    ONLINE: [
      {
        question: 'Jak dołączyć do spotkania online?',
        answer:
          'Link do spotkania otrzymasz po dołączeniu do wydarzenia. Zostanie również wysłany na email przed startem.',
      },
      {
        question: 'Czy potrzebuję kamery i mikrofonu?',
        answer:
          'Kamera nie jest wymagana, ale mikrofon będzie przydatny do aktywnego uczestnictwa.',
      },
      {
        question: 'Jakie oprogramowanie jest potrzebne?',
        answer:
          'Używamy standardowych platform do wideokonferencji. Szczegóły znajdziesz w linku do spotkania.',
      },
      {
        question: 'Co jeśli mam problemy techniczne?',
        answer:
          'Napisz na czat wydarzenia lub skontaktuj się z organizatorem przed rozpoczęciem.',
      },
    ],
    HYBRID: [
      {
        question: 'Czy mogę wybrać między uczestnictwem stacjonarnym a online?',
        answer:
          'Tak! Możesz dołączyć osobiście lub przez internet. Daj nam znać o swojej decyzji w komentarzach.',
      },
      {
        question: 'Gdzie jest link do spotkania online?',
        answer:
          'Link otrzymasz po dołączeniu do wydarzenia i zostanie wysłany na email przed startem.',
      },
      {
        question: 'Czy uczestnicy online mogą w pełni uczestniczyć?',
        answer:
          'Oczywiście! Zadbamy o to, aby wszyscy uczestnicy mogli aktywnie brać udział niezależnie od formy uczestnictwa.',
      },
    ],
  };

  const GENERAL_FAQS = [
    {
      question: 'Czy mogę zaprosić znajomego?',
      answer:
        'Sprawdź tryb dołączania do wydarzenia. Jeśli są wolne miejsca, Twój znajomy może się zapisać przez stronę wydarzenia.',
    },
    {
      question: 'Jak mogę skontaktować się z organizatorem?',
      answer:
        'Możesz napisać wiadomość przez czat wydarzenia lub zostawić komentarz pod wydarzeniem.',
    },
    {
      question: 'Czy wydarzenie jest płatne?',
      answer:
        'To wydarzenie jest bezpłatne. Organizator może poprosić o opcjonalną składkę na koszty, ale nie jest to wymagane.',
    },
    {
      question: 'Co jeśli muszę odwołać swój udział?',
      answer:
        'Możesz w każdej chwili zrezygnować z udziału przez stronę wydarzenia. Prosimy o jak najwcześniejsze poinformowanie.',
    },
  ];

  // Add FAQs to 40% of active, non-deleted events
  const eventsWithFaqs = allEvents
    .filter(() => rand() > 0.6)
    .filter(({ event }) => !event.deletedAt && !event.canceledAt)
    .slice(0, 30);

  for (const { event } of eventsWithFaqs) {
    // Select FAQ templates based on meeting kind
    const templates =
      FAQ_TEMPLATES[event.meetingKind as keyof typeof FAQ_TEMPLATES] || [];

    // Mix specific and general FAQs
    const allTemplates = [...templates, ...GENERAL_FAQS];

    // Create 2-5 FAQs per event
    const faqCount = 2 + Math.floor(rand() * 4);
    const selectedFaqs = pickMany(
      allTemplates,
      Math.min(faqCount, allTemplates.length)
    );

    for (let i = 0; i < selectedFaqs.length; i++) {
      const faqTemplate = selectedFaqs[i];
      if (!faqTemplate) continue;

      const faq = await prisma.eventFaq.create({
        data: {
          eventId: event.id,
          order: i,
          question: faqTemplate.question,
          answer: faqTemplate.answer,
        },
      });

      faqs.push(faq);
    }
  }

  console.log(
    `❓ Created ${faqs.length} FAQ items across ${eventsWithFaqs.length} events`
  );
  return faqs;
}

/** ---------- Seed: Event Agenda ---------- */
async function seedEventAgenda(allEvents: Array<{ event: any; owner: User }>) {
  const agendaItems: any[] = [];

  // Agenda templates for different types of events
  const AGENDA_TEMPLATES = {
    WORKSHOP: [
      { title: 'Rejestracja i powitanie', duration: 15 },
      {
        title: 'Wprowadzenie teoretyczne',
        duration: 30,
        description: 'Podstawy tematu i kontekst',
      },
      {
        title: 'Ćwiczenia praktyczne',
        duration: 45,
        description: 'Praktyczne zastosowanie wiedzy',
      },
      { title: 'Przerwa', duration: 15 },
      { title: 'Sesja Q&A', duration: 20 },
      { title: 'Podsumowanie i zakończenie', duration: 10 },
    ],
    CONFERENCE: [
      { title: 'Rejestracja i networking', duration: 30 },
      { title: 'Otwarcie konferencji', duration: 15 },
      {
        title: 'Keynote - Prezentacja główna',
        duration: 45,
        description: 'Wystąpienie głównego prelegenta',
      },
      { title: 'Panel dyskusyjny', duration: 30 },
      { title: 'Przerwa kawowa', duration: 20 },
      { title: 'Prezentacje równoległe', duration: 60 },
      { title: 'Lunch', duration: 45 },
      { title: 'Warsztaty praktyczne', duration: 90 },
      { title: 'Networking i zakończenie', duration: 30 },
    ],
    MEETUP: [
      { title: 'Powitanie i przedstawienie', duration: 10 },
      {
        title: 'Główny temat spotkania',
        duration: 30,
        description: 'Prezentacja lub dyskusja',
      },
      { title: 'Dyskusja otwarta', duration: 20 },
      { title: 'Networking', duration: 30 },
    ],
    SIMPLE: [
      { title: 'Rozpoczęcie', duration: 10 },
      { title: 'Główna część', duration: 60 },
      { title: 'Zakończenie', duration: 10 },
    ],
  };

  // Add agendas to 25% of active, non-deleted events with longer duration
  const eventsWithAgenda = allEvents
    .filter(() => rand() > 0.75)
    .filter(({ event }) => !event.deletedAt && !event.canceledAt)
    .filter(({ event }) => {
      // Only add agenda to events that are at least 1 hour long
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);
      const durationMs = end.getTime() - start.getTime();
      return durationMs >= 60 * 60 * 1000; // 1 hour
    })
    .slice(0, 20);

  for (const { event, owner } of eventsWithAgenda) {
    // Choose template based on event duration
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (60 * 60 * 1000);

    let templateKey: keyof typeof AGENDA_TEMPLATES;
    if (durationHours >= 6) {
      templateKey = 'CONFERENCE';
    } else if (durationHours >= 2) {
      templateKey = rand() > 0.5 ? 'WORKSHOP' : 'MEETUP';
    } else {
      templateKey = 'SIMPLE';
    }

    const template = AGENDA_TEMPLATES[templateKey];
    let currentTime = new Date(start);

    for (let i = 0; i < template.length; i++) {
      const slot = template[i]!;

      // Calculate end time
      const slotEnd = new Date(
        currentTime.getTime() + slot.duration * 60 * 1000
      );

      // Stop if we exceed event end time
      if (slotEnd > end) break;

      const item = await prisma.eventAgendaItem.create({
        data: {
          eventId: event.id,
          order: i,
          title: slot.title,
          description: 'description' in slot ? slot.description : null,
          startAt: currentTime,
          endAt: slotEnd,
        },
      });

      // Add host (owner) to 50% of slots
      if (rand() > 0.5) {
        await prisma.eventAgendaItemHost.create({
          data: {
            agendaItemId: item.id,
            order: 0,
            kind: 'USER',
            userId: owner.id,
          },
        });
      }

      // Occasionally add a manual host
      if (rand() > 0.8) {
        const guestNames = [
          'Jan Kowalski',
          'Anna Nowak',
          'Piotr Wiśniewski',
          'Maria Wójcik',
          'Tomasz Kamiński',
        ];
        await prisma.eventAgendaItemHost.create({
          data: {
            agendaItemId: item.id,
            order: 1,
            kind: 'MANUAL',
            name: pick(guestNames),
          },
        });
      }

      agendaItems.push(item);
      currentTime = slotEnd;
    }
  }

  console.log(
    `📋 Created ${agendaItems.length} agenda items across ${eventsWithAgenda.length} events`
  );
  return agendaItems;
}

/** ---------- Seed: Notification Preferences ---------- */
async function seedNotificationPreferences(users: User[]) {
  const preferences: any[] = [];

  // Create preferences for 80% of users with varied settings
  const usersWithPrefs = users.filter(() => rand() > 0.2);

  for (const user of usersWithPrefs) {
    const pref = await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        emailOnInvite: rand() > 0.3,
        emailOnJoinRequest: rand() > 0.3,
        emailOnMessage: rand() > 0.7, // Most disable email for messages
        pushOnReminder: rand() > 0.2,
        inAppOnEverything: rand() > 0.1,
      },
    });

    preferences.push(pref);
  }

  console.log(`⚙️  Created ${preferences.length} notification preferences`);
  return preferences;
}

/** ---------- Seed: Event & DM Mutes ---------- */
async function seedMutes(
  allEvents: Array<{ event: any; owner: User }>,
  users: User[]
) {
  const eventMutes: any[] = [];
  const dmMutes: any[] = [];

  // Mute 10-15 random event/user combinations
  const eventMuteCount = 10 + Math.floor(rand() * 6);

  for (let i = 0; i < eventMuteCount; i++) {
    const event = pick(allEvents.filter(({ event }) => !event.deletedAt));
    const user = pick(users);

    // Check if user is a member
    const member = await prisma.eventMember.findUnique({
      where: {
        eventId_userId: {
          eventId: event.event.id,
          userId: user.id,
        },
      },
    });

    if (!member) continue;

    // Check if mute already exists
    const existing = eventMutes.find(
      (m) => m.eventId === event.event.id && m.userId === user.id
    );

    if (existing) continue;

    const mute = await prisma.eventMute.create({
      data: {
        eventId: event.event.id,
        userId: user.id,
        muted: true,
      },
    });

    eventMutes.push(mute);
  }

  // Mute 5-10 random DM threads
  const dmThreads = await prisma.dmThread.findMany({
    take: 20,
    select: { id: true, aUserId: true, bUserId: true },
  });

  const dmMuteCount = Math.min(5 + Math.floor(rand() * 6), dmThreads.length);

  for (let i = 0; i < dmMuteCount; i++) {
    const thread = dmThreads[i];
    if (!thread) continue;

    // Randomly mute for one of the participants
    const userId = rand() > 0.5 ? thread.aUserId : thread.bUserId;

    // Check if mute already exists in local array
    const existingDmMute = dmMutes.find(
      (m) => m.threadId === thread.id && m.userId === userId
    );

    if (existingDmMute) continue;

    // Check if mute already exists in database
    const existingInDb = await prisma.dmMute.findUnique({
      where: {
        threadId_userId: {
          threadId: thread.id,
          userId,
        },
      },
    });

    if (existingInDb) {
      dmMutes.push(existingInDb);
      continue;
    }

    const mute = await prisma.dmMute.create({
      data: {
        threadId: thread.id,
        userId,
        muted: true,
      },
    });

    dmMutes.push(mute);
  }

  console.log(
    `🔕 Created ${eventMutes.length} event mutes and ${dmMutes.length} DM mutes`
  );
  return { eventMutes, dmMutes };
}

/** ---------- Seed: User Profiles ---------- */
async function seedUserProfiles(users: User[], categories: Category[]) {
  console.log(`   Creating profiles for ${users.length} users...`);

  const LANGUAGES = ['pl', 'en', 'de', 'fr', 'es'];
  const INTERESTS = [
    'Fotografia',
    'Podróże',
    'Muzyka',
    'Sport',
    'Gotowanie',
    'Czytanie',
    'Technologia',
    'Sztuka',
    'Film',
    'Taniec',
  ];
  const BIO_TEMPLATES = [
    'Passionate about sports and outdoor activities. Always looking for new adventures!',
    'Love meeting new people and trying new things. Life is an adventure!',
    'Fitness enthusiast and nature lover. Lets explore together!',
    'Avid runner and cyclist. Always up for a challenge!',
    'Sports lover and team player. Looking forward to meeting like-minded people!',
  ];

  for (const user of users) {
    // 80% of users have profiles
    if (rand() > 0.2) {
      const city = pick(CITIES);
      const coords = randomWithinCity(city);
      const hasFullBio = rand() > 0.5;

      // Generate display name (full name) from handle
      // For fixed users, use their specific names
      let displayName: string;
      if (user.id === FIXED_IDS.ADMIN) {
        displayName = 'Admin Appname';
      } else if (user.id === FIXED_IDS.MODERATOR) {
        displayName = 'Moderator One';
      } else if (user.id === FIXED_IDS.USER) {
        displayName = 'User Fixed';
      } else if (user.id === FIXED_IDS.USER_PLUS_MONTHLY) {
        displayName = 'Plus Monthly User';
      } else if (user.id === FIXED_IDS.USER_PRO_MONTHLY) {
        displayName = 'Pro Monthly User';
      } else if (user.id === FIXED_IDS.USER_PLUS_YEARLY) {
        displayName = 'Plus Yearly User';
      } else if (user.id === FIXED_IDS.USER_PRO_YEARLY) {
        displayName = 'Pro Yearly User';
      } else {
        // Generate realistic display name from handle
        // Convert handle like "john.doe23" to "John Doe"
        const nameParts = user.name.replace(/[0-9]/g, '').split(/[._]/);
        displayName = nameParts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }

      await prisma.userProfile.create({
        data: {
          userId: user.id,
          displayName, // Full name (e.g., "John Doe")
          bioShort: hasFullBio ? pick(BIO_TEMPLATES) : null,
          bioLong: hasFullBio
            ? `${pick(BIO_TEMPLATES)}\n\nI enjoy various activities and I'm always excited to meet new people. Feel free to reach out if you'd like to join me for an event!`
            : null,
          city: city.name,
          country: 'Poland',
          homeLat: coords.lat,
          homeLng: coords.lng,
          speaks: pickMany(LANGUAGES, 1 + Math.floor(rand() * 3)),
          interests: pickMany(INTERESTS, 2 + Math.floor(rand() * 4)),
          preferredMode: rand() > 0.5 ? 'GROUP' : null,
          preferredMaxDistanceKm:
            rand() > 0.6 ? 5 + Math.floor(rand() * 20) : null,
          // Cover image: In production, would be set via upload
          coverKey: null,
        },
      });

      // Privacy settings (default for most)
      await prisma.userPrivacy.create({
        data: {
          userId: user.id,
          dmPolicy: rand() > 0.7 ? 'MEMBERS' : 'ALL',
          showLastSeen: rand() > 0.8 ? 'HIDDEN' : 'ALL',
          showLocation: rand() > 0.7 ? 'CITY' : 'ALL',
          showEvents: rand() > 0.9 ? 'MEMBERS' : 'ALL',
          showReviews: rand() > 0.9 ? 'MEMBERS' : 'ALL',
          showStats: rand() > 0.8 ? 'HIDDEN' : 'ALL',
        },
      });

      // Stats (will be updated by actual activity, but seed some initial values)
      await prisma.userStats.create({
        data: {
          userId: user.id,
          eventsCreated: 0,
          eventsJoined: 0,
          reviewsCount: 0,
          hostRatingAvg: null,
          attendeeRatingAvg: null,
          lastActiveAt: user.lastSeenAt || new Date(),
        },
      });

      // Some users have social links (30%)
      if (rand() > 0.7) {
        const providers = ['INSTAGRAM', 'FACEBOOK', 'STRAVA', 'TWITTER'];
        const selectedProviders = pickMany(
          providers,
          1 + Math.floor(rand() * 2)
        );

        for (const provider of selectedProviders) {
          await prisma.userSocialLink.create({
            data: {
              userId: user.id,
              provider,
              url: `https://${provider.toLowerCase()}.com/${user.name.toLowerCase()}`,
              verified: rand() > 0.5,
            },
          });
        }
      }

      // Some users have category levels (50%)
      if (rand() > 0.5) {
        const userCategories = pickMany(categories, 1 + Math.floor(rand() * 3));
        const levels: Level[] = [
          Level.BEGINNER,
          Level.INTERMEDIATE,
          Level.ADVANCED,
        ];

        for (const cat of userCategories) {
          await prisma.userCategoryLevel.create({
            data: {
              userId: user.id,
              categoryId: cat.id,
              level: pick(levels),
              notes:
                rand() > 0.6
                  ? pick([
                      'Been doing this for years!',
                      'Just starting out, looking to improve',
                      'Love this activity!',
                      null,
                    ])
                  : null,
            },
          });
        }
      }

      // Some users have availability (40%)
      if (rand() > 0.6) {
        const weekdays = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
        const selectedDays = pickMany(weekdays, 2 + Math.floor(rand() * 3));

        for (const day of selectedDays) {
          const startHour = 9 + Math.floor(rand() * 8); // 9-16
          const endHour = startHour + 2 + Math.floor(rand() * 4); // +2 to +5 hours

          await prisma.userAvailability.create({
            data: {
              userId: user.id,
              weekday: day,
              startMin: startHour * 60,
              endMin: Math.min(endHour * 60, 1380), // max 23:00
              tzSnap: 'Europe/Warsaw',
            },
          });
        }
      }
    }
  }

  console.log(`   ✅ Created profiles for users`);
}

/** ---------- Seed: User Plans (for testing) ---------- */
async function seedUserPlans() {
  console.log('💳 Seeding user plans for testing...');

  const now = new Date();
  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  // Plus Monthly - One-off payment (29.99 PLN)
  await prisma.userPlanPeriod.create({
    data: {
      userId: FIXED_IDS.USER_PLUS_MONTHLY,
      plan: 'PLUS',
      source: 'ONE_OFF',
      billingPeriod: 'MONTHLY',
      stripeCustomerId: `cus_seed_plus_monthly_${Date.now()}`,
      stripePaymentEventId: `pi_seed_plus_monthly_${Date.now()}`,
      stripeCheckoutSessionId: `cs_seed_plus_monthly_${Date.now()}`,
      startsAt: now,
      endsAt: oneMonthFromNow,
    },
  });

  // Pro Monthly - One-off payment (83.99 PLN)
  await prisma.userPlanPeriod.create({
    data: {
      userId: FIXED_IDS.USER_PRO_MONTHLY,
      plan: 'PRO',
      source: 'ONE_OFF',
      billingPeriod: 'MONTHLY',
      stripeCustomerId: `cus_seed_pro_monthly_${Date.now()}`,
      stripePaymentEventId: `pi_seed_pro_monthly_${Date.now()}`,
      stripeCheckoutSessionId: `cs_seed_pro_monthly_${Date.now()}`,
      startsAt: now,
      endsAt: oneMonthFromNow,
    },
  });

  // Plus Yearly - One-off payment (359.99 PLN = 29.99 * 12)
  await prisma.userPlanPeriod.create({
    data: {
      userId: FIXED_IDS.USER_PLUS_YEARLY,
      plan: 'PLUS',
      source: 'ONE_OFF',
      billingPeriod: 'YEARLY',
      stripeCustomerId: `cus_seed_plus_yearly_${Date.now()}`,
      stripePaymentEventId: `pi_seed_plus_yearly_${Date.now()}`,
      stripeCheckoutSessionId: `cs_seed_plus_yearly_${Date.now()}`,
      startsAt: now,
      endsAt: oneYearFromNow,
    },
  });

  // Pro Yearly - One-off payment (839.99 PLN = 69.99 * 12)
  await prisma.userPlanPeriod.create({
    data: {
      userId: FIXED_IDS.USER_PRO_YEARLY,
      plan: 'PRO',
      source: 'ONE_OFF',
      billingPeriod: 'YEARLY',
      stripeCustomerId: `cus_seed_pro_yearly_${Date.now()}`,
      stripePaymentEventId: `pi_seed_pro_yearly_${Date.now()}`,
      stripeCheckoutSessionId: `cs_seed_pro_yearly_${Date.now()}`,
      startsAt: now,
      endsAt: oneYearFromNow,
    },
  });

  console.log('   ✅ Created 4 user plan periods with realistic Stripe data');
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

  console.log('👤 Seeding user profiles…');
  await seedUserProfiles(users, categories);

  console.log('💳 Seeding user plans…');
  await seedUserPlans();

  console.log('📝 Seeding events (500) with realistic members…');
  const eventsCreated = await seedEvents({ users, categories, tags });

  console.log('🎯 Seeding curated events for FIXED IDS…');
  const fixedPairs = await seedEventsForFixedUsers({
    users,
    categories,
    tags,
  });

  // Obie listy mają taki sam typ: { event, owner }
  const allEvents = [...eventsCreated, ...fixedPairs];

  console.log('⛔ Seeding some canceled events + notifications…');
  const canceled = await seedCanceledEvents(allEvents);

  console.log('🗑️  Seeding some deleted events (after 30 days)…');
  await seedDeletedEventsAfterCancel(canceled);

  console.log('🔔 Seeding generic notifications…');
  await seedNotificationsGeneric(allEvents, users);

  console.log('💬 Seeding DM threads and messages…');
  await seedDmThreads(users);

  console.log('💭 Seeding comments…');
  await seedComments(allEvents, users);

  console.log('⭐ Seeding reviews…');
  await seedReviews(allEvents, users);

  console.log('🚨 Seeding reports…');
  await seedReports(allEvents, users);

  console.log('💬 Seeding event chat messages…');
  await seedEventChatMessages(allEvents, users);

  console.log('🚫 Seeding user blocks…');
  await seedUserBlocks(users);

  console.log('🔗 Seeding event invite links…');
  await seedEventInviteLinks(allEvents);

  console.log('❓ Seeding event FAQs…');
  await seedEventFaqs(allEvents);

  console.log('📋 Seeding event agendas…');
  await seedEventAgenda(allEvents);

  console.log('📝 Seeding join questions…');
  await seedEventJoinQuestions(allEvents);

  console.log('⚙️  Seeding notification preferences…');
  await seedNotificationPreferences(users);

  console.log('🔕 Seeding mutes…');
  await seedMutes(allEvents, users);

  console.log(
    `✅ Done: users=${users.length}, categories=${categories.length}, tags=${tags.length}, events=${allEvents.length}`
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
