/* eslint-disable no-console */
// prisma/seed.ts
import {
  AddressVisibility,
  Category,
  Intent,
  IntentMemberRole,
  IntentMemberStatus,
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
} from '@prisma/client';
import {
  CATEGORY_DEFS,
  CITIES,
  FIRST_NAMES,
  FIXED_IDS,
  FIXED_INTENTS_TARGET,
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

const AVATAR_ID_POOL = Array.from({ length: 50 }, (_, i) => 100 + i); // picsum 100..149

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
  await prisma.notification.deleteMany();
  await prisma.intentMember.deleteMany();
  await prisma.intent.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();

  // Clear user profile related tables
  await prisma.userBadge.deleteMany();
  await prisma.userAvailability.deleteMany();
  await prisma.userDiscipline.deleteMany();
  await prisma.userSocialLink.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.userPrivacy.deleteMany();
  await prisma.userProfile.deleteMany();

  await prisma.user.deleteMany();
}

/** ---------- Seed: Users ---------- */
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
        name: 'admin.miglee',
        role: Role.ADMIN,
        imageUrl: `https://picsum.photos/id/10/200/200`,
        verifiedAt: new Date(),
      },
    })
  );

  const mod1 = await prisma.user.create({
    data: {
      id: FIXED_IDS.MODERATOR,
      email: 'moderator.one@example.com',
      name: 'moderator.one',
      role: Role.MODERATOR,
      imageUrl: `https://picsum.photos/id/11/200/200`,
      verifiedAt: new Date(),
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
          imageUrl: `https://picsum.photos/id/${11 + m}/200/200`,
          ...(rand() > 0.6 ? { verifiedAt: new Date() } : {}),
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
        imageUrl: `https://picsum.photos/id/19/200/200`,
        ...(rand() > 0.6 ? { verifiedAt: new Date() } : {}),
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
          imageUrl: `https://picsum.photos/id/${pick(AVATAR_ID_POOL)}/200/200`,
          ...(rand() > 0.6 ? { verifiedAt: new Date() } : {}),
          lastSeenAt:
            rand() > 0.5
              ? new Date(Date.now() - Math.floor(rand() * 7) * 86400000)
              : null,
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
  const mode = pick<Mode>([Mode.GROUP, Mode.ONE_TO_ONE]);
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

  // 5% of intents are manually closed by owner/moderator
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

  // ONE_TO_ONE = 2/2, GROUP = 2..(6/8/10/12)
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

  // Transaction: create Intent + memberships
  return prisma.$transaction(async (tx) => {
    const intent = await tx.intent.create({
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

    // Participants: fill some JOINED, respect capacity strictly
    const alreadyJoined = await tx.intentMember.count({
      where: { intentId: intent.id, status: IntentMemberStatus.JOINED },
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

    // Some PENDING/INVITED/REJECTED/BANNED (bez łamania capacity)
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
              ? 'Banned during moderation (seed).'
              : st === IntentMemberStatus.REJECTED
                ? 'Rejected due to capacity or profile mismatch (seed).'
                : null,
        },
      });
    }

    // Update intent joinedCount with actual count
    const finalJoinedCount = await tx.intentMember.count({
      where: { intentId: intent.id, status: IntentMemberStatus.JOINED },
    });
    await tx.intent.update({
      where: { id: intent.id },
      data: { joinedCount: finalJoinedCount },
    });

    return {
      intent,
      owner: author,
      participants: finalJoinedCount,
    };
  });
}

/** ---------- Seed: Intents (random realistic) ---------- */
async function seedIntents(opts: {
  users: User[];
  categories: Category[];
  tags: Tag[];
}): Promise<Array<{ intent: Intent; owner: User }>> {
  const { users, categories, tags } = opts;
  const out: Array<{ intent: Intent; owner: User }> = [];

  const authorPool = users.filter((u) => u.role !== Role.USER);
  const userPool = users;

  // Zwiększona liczba intentów: 500 dla lepszego testowania map clustering
  const INTENTS_COUNT = 500;

  console.log(`   Creating ${INTENTS_COUNT} intents...`);

  for (let i = 0; i < INTENTS_COUNT; i++) {
    const author = rand() > 0.65 ? pick(authorPool) : pick(userPool);
    const { intent, owner } = await createIntentWithMembers({
      author,
      categories,
      tags,
    });
    out.push({ intent, owner });

    // Progress indicator co 50 intentów
    if ((i + 1) % 50 === 0) {
      console.log(`   Progress: ${i + 1}/${INTENTS_COUNT} intents created`);
    }
  }

  return out;
}

/** ---------- EXTRA: Curated, diverse intents for FIXED IDS ---------- */

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
  const modes = [Mode.GROUP, Mode.ONE_TO_ONE] as const;
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

    // pojemności – 1:1 → 2/2, GROUP → 2..12
    const min = mode === Mode.ONE_TO_ONE ? 2 : rand() > 0.5 ? 4 : 2;
    const max = mode === Mode.ONE_TO_ONE ? 2 : pick([6, 8, 10, 12]);

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

const SCENARIOS: Scenario[] = buildScenarios(FIXED_INTENTS_TARGET);

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

async function createPresetIntent(
  tx: Prisma.TransactionClient,
  author: User,
  categories: Category[],
  tags: Tag[],
  s: Scenario
): Promise<{ intent: Intent; owner: User }> {
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

  const min = s.min ?? (s.mode === Mode.ONE_TO_ONE ? 2 : 2);
  const max = s.max ?? (s.mode === Mode.ONE_TO_ONE ? 2 : pick([6, 8, 10, 12]));

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

  // Join window settings (similar to createIntentWithMembers)
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

  const intent = await tx.intent.create({
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
    },
  });

  // OWNER
  await tx.intentMember.create({
    data: {
      intentId: intent.id,
      userId: author.id,
      role: IntentMemberRole.OWNER,
      status: IntentMemberStatus.JOINED,
      joinedAt: new Date(),
    },
  });

  // Wypełnij część miejsc
  const alreadyJoined = await tx.intentMember.count({
    where: { intentId: intent.id, status: IntentMemberStatus.JOINED },
  });
  const freeSlots = Math.max(0, intent.max - alreadyJoined);
  const howMany =
    intent.mode === Mode.ONE_TO_ONE
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

  // Update intent joinedCount with actual count
  const finalJoinedCount = await tx.intentMember.count({
    where: { intentId: intent.id, status: IntentMemberStatus.JOINED },
  });
  await tx.intent.update({
    where: { id: intent.id },
    data: { joinedCount: finalJoinedCount },
  });

  return { intent, owner: author };
}

async function seedIntentsForFixedUsers(opts: {
  users: User[];
  categories: Category[];
  tags: Tag[];
}): Promise<Array<{ intent: Intent; owner: User }>> {
  const { users, categories, tags } = opts;
  const byId = new Map(users.map((u) => [u.id, u]));
  const admin = byId.get(FIXED_IDS.ADMIN);
  const mod = byId.get(FIXED_IDS.MODERATOR);
  const user = byId.get(FIXED_IDS.USER);

  const authors: User[] = [admin, mod, user].filter(Boolean) as User[];
  if (!authors.length) return [];

  const pairs: Array<{ intent: Intent; owner: User }> = [];

  await prisma.$transaction(async (tx) => {
    // round-robin autorów
    for (let i = 0; i < SCENARIOS.length; i++) {
      const author = authors[i % authors.length]!;
      const s = SCENARIOS[i]!;
      const pair = await createPresetIntent(tx, author, categories, tags, s);
      pairs.push(pair);
    }

    // Opcjonalnie anuluj 1–2 z nich + notyfikacje
    const cancelSome = pickMany(pairs, Math.min(2, pairs.length));
    for (const { intent, owner } of cancelSome) {
      const updated = await tx.intent.update({
        where: { id: intent.id },
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

      const recips = await tx.intentMember.findMany({
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

      if (recips.length) {
        await tx.notification.createMany({
          data: recips.map((m) => ({
            kind: NotificationKind.INTENT_CANCELED,
            recipientId: m.userId,
            actorId: owner.id,
            entityType: NotificationEntity.INTENT,
            entityId: updated.id,
            intentId: updated.id,
            title: 'Meeting canceled',
            body: 'Organizer posted a cancellation notice.',
            dedupeKey: `intent_canceled:${m.userId}:${updated.id}`,
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  return pairs;
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
        skipDuplicates: true,
      });
    }
  }
  return toCancel;
}

/** ---------- NEW: Seed some soft-deleted (after 30 days) ---------- */
async function seedDeletedIntentsAfterCancel(
  canceled: Array<{ intent: Intent; owner: User }>
) {
  const sample = canceled.filter(() => rand() > 0.6);
  const THIRTY_FIVE_DAYS_MS = 35 * 24 * 60 * 60 * 1000;
  for (const { intent, owner } of sample) {
    const canceledAtPast = new Date(Date.now() - THIRTY_FIVE_DAYS_MS);
    await prisma.intent.update({
      where: { id: intent.id },
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
  intentsCreated: Array<{ intent: Intent; owner: User }>,
  users: User[]
) {
  for (const { intent, owner } of intentsCreated) {
    const audience = users.filter((u) => u.id !== owner.id);
    const recipients = pickMany(audience, 2 + Math.floor(rand() * 3)); // 2..4

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
    const amount = (Math.floor(rand() * 5000) + 500) / 100; // 5.00–55.00
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
  allIntents: Array<{ intent: any; owner: User }>,
  users: User[]
) {
  const comments: any[] = [];

  // Add comments to 60% of intents
  const intentsToComment = allIntents.filter(() => rand() > 0.4).slice(0, 20);

  for (const { intent } of intentsToComment) {
    // Skip deleted or canceled intents
    if (intent.deletedAt || intent.canceledAt) continue;

    // Get members of this intent
    const members = await prisma.intentMember.findMany({
      where: {
        intentId: intent.id,
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

      const rootComment = await prisma.comment.create({
        data: {
          intentId: intent.id,
          authorId: author!.userId,
          content: commentContent,
          threadId: intent.id, // Root comments use intent ID as threadId
          createdAt: new Date(Date.now() - Math.floor(rand() * 5) * 86400000), // 0-5 days ago
        },
      });

      comments.push(rootComment);

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

          const reply = await prisma.comment.create({
            data: {
              intentId: intent.id,
              authorId: replyAuthor!.userId,
              content: replyContent,
              threadId: rootComment.id,
              parentId: rootComment.id,
              createdAt: new Date(
                rootComment.createdAt.getTime() + Math.floor(rand() * 86400000)
              ), // 0-1 day after parent
            },
          });

          comments.push(reply);
        }
      }
    }

    // Update intent commentsCount
    await prisma.intent.update({
      where: { id: intent.id },
      data: {
        commentsCount: comments.filter((c) => c.intentId === intent.id).length,
      },
    });
  }

  console.log(`💭 Created ${comments.length} comments`);
  return comments;
}

/** ---------- Seed: Reviews ---------- */
async function seedReviews(
  allIntents: Array<{ intent: any; owner: User }>,
  users: User[]
) {
  const reviews: any[] = [];

  // Add reviews only to past intents
  const pastIntents = allIntents.filter(
    ({ intent }) =>
      intent.endAt < new Date() && !intent.deletedAt && !intent.canceledAt
  );

  for (const { intent } of pastIntents) {
    // Get members who joined
    const members = await prisma.intentMember.findMany({
      where: {
        intentId: intent.id,
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

      const review = await prisma.review.create({
        data: {
          intentId: intent.id,
          authorId: reviewer.userId,
          rating,
          content: reviewContent,
          createdAt: new Date(
            intent.endAt.getTime() + Math.floor(rand() * 3) * 86400000
          ), // 0-3 days after event
        },
      });

      reviews.push(review);
    }
  }

  console.log(`⭐ Created ${reviews.length} reviews`);
  return reviews;
}

/** ---------- Seed: Reports ---------- */
async function seedReports(
  allIntents: Array<{ intent: any; owner: User }>,
  users: User[]
) {
  const reports: any[] = [];

  // Create 5-10 sample reports
  const reportCount = 5 + Math.floor(rand() * 6);

  for (let i = 0; i < reportCount; i++) {
    const reporter = pick(users);
    const entityType = pick(['INTENT', 'COMMENT', 'REVIEW', 'USER', 'MESSAGE']);

    let entityId: string | null = null;

    // Find a valid entity to report
    switch (entityType) {
      case 'INTENT': {
        const intent = pick(
          allIntents.filter(({ intent }) => !intent.deletedAt)
        );
        entityId = intent?.intent.id;
        break;
      }
      case 'USER': {
        const user = pick(users.filter((u) => u.id !== reporter.id));
        entityId = user?.id;
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
  allIntents: Array<{ intent: any; owner: User }>,
  users: User[]
) {
  const messages: any[] = [];

  // Add chat messages to 70% of intents
  const intentsToChat = allIntents
    .filter(() => rand() > 0.3)
    .filter(({ intent }) => !intent.deletedAt && !intent.canceledAt)
    .slice(0, 25);

  for (const { intent } of intentsToChat) {
    // Get JOINED members
    const members = await prisma.intentMember.findMany({
      where: {
        intentId: intent.id,
        status: 'JOINED',
      },
      select: { userId: true },
    });

    if (members.length === 0) continue;

    // Create 5-20 messages
    const messageCount = 5 + Math.floor(rand() * 16);

    let lastMessageTime = new Date(
      intent.createdAt.getTime() + Math.floor(rand() * 3600000)
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

      const message = await prisma.intentChatMessage.create({
        data: {
          intentId: intent.id,
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
        if (replyTo.intentId === intent.id) {
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

          const reply = await prisma.intentChatMessage.create({
            data: {
              intentId: intent.id,
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

    // Update intent messagesCount
    await prisma.intent.update({
      where: { id: intent.id },
      data: {
        messagesCount: messages.filter((m) => m.intentId === intent.id).length,
      },
    });

    // Create IntentChatRead for some members (50% have read)
    for (const member of members) {
      if (rand() > 0.5) {
        const lastReadAt = new Date(
          lastMessageTime.getTime() - Math.floor(rand() * 3600000)
        );
        await prisma.intentChatRead.create({
          data: {
            intentId: intent.id,
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

/** ---------- Seed: Intent Invite Links ---------- */
async function seedIntentInviteLinks(
  allIntents: Array<{ intent: any; owner: User }>
) {
  const links: any[] = [];

  // Add invite links to 30% of intents
  const intentsWithLinks = allIntents
    .filter(() => rand() > 0.7)
    .filter(({ intent }) => !intent.deletedAt && !intent.canceledAt)
    .slice(0, 10);

  for (const { intent } of intentsWithLinks) {
    // Create 1-3 invite links per intent
    const linkCount = 1 + Math.floor(rand() * 3);

    for (let i = 0; i < linkCount; i++) {
      const maxUses = rand() > 0.5 ? 10 + Math.floor(rand() * 40) : null;
      const expiresAt =
        rand() > 0.6
          ? new Date(Date.now() + (7 + Math.floor(rand() * 23)) * 86400000)
          : null; // 7-30 days from now

      const usedCount = maxUses ? Math.floor(rand() * Math.min(maxUses, 5)) : 0;

      const link = await prisma.intentInviteLink.create({
        data: {
          intentId: intent.id,
          code: `INV${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
          maxUses,
          usedCount,
          expiresAt,
        },
      });

      links.push(link);
    }
  }

  console.log(`🔗 Created ${links.length} intent invite links`);
  return links;
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

/** ---------- Seed: Intent & DM Mutes ---------- */
async function seedMutes(
  allIntents: Array<{ intent: any; owner: User }>,
  users: User[]
) {
  const intentMutes: any[] = [];
  const dmMutes: any[] = [];

  // Mute 10-15 random intent/user combinations
  const intentMuteCount = 10 + Math.floor(rand() * 6);

  for (let i = 0; i < intentMuteCount; i++) {
    const intent = pick(allIntents.filter(({ intent }) => !intent.deletedAt));
    const user = pick(users);

    // Check if user is a member
    const member = await prisma.intentMember.findUnique({
      where: {
        intentId_userId: {
          intentId: intent.intent.id,
          userId: user.id,
        },
      },
    });

    if (!member) continue;

    // Check if mute already exists
    const existing = intentMutes.find(
      (m) => m.intentId === intent.intent.id && m.userId === user.id
    );

    if (existing) continue;

    const mute = await prisma.intentMute.create({
      data: {
        intentId: intent.intent.id,
        userId: user.id,
        muted: true,
      },
    });

    intentMutes.push(mute);
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
    `🔕 Created ${intentMutes.length} intent mutes and ${dmMutes.length} DM mutes`
  );
  return { intentMutes, dmMutes };
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
        displayName = 'Admin Miglee';
      } else if (user.id === FIXED_IDS.MODERATOR) {
        displayName = 'Moderator One';
      } else if (user.id === FIXED_IDS.USER) {
        displayName = 'User Fixed';
      } else {
        // Generate realistic display name from handle
        // Convert handle like "john.doe23" to "John Doe"
        const nameParts = user.name.replace(/[0-9]/g, '').split(/[._]/);
        displayName = nameParts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }

      // 60% of users have cover photos
      const hasCover = rand() > 0.4;

      // Generate unique seed for consistent images per user
      const userSeed = user.id.slice(0, 8);

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
          // Cover image: 1920x400 for 16:9 aspect ratio
          coverUrl: hasCover
            ? `https://picsum.photos/seed/${userSeed}-cover/1920/400`
            : null,
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

      // Some users have disciplines (50%)
      if (rand() > 0.5) {
        const userCategories = pickMany(categories, 1 + Math.floor(rand() * 3));
        const levels: Level[] = [
          Level.BEGINNER,
          Level.INTERMEDIATE,
          Level.ADVANCED,
        ];

        for (const cat of userCategories) {
          await prisma.userDiscipline.create({
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

  console.log('📝 Seeding intents (500) with realistic members…');
  const intentsCreated = await seedIntents({ users, categories, tags });

  console.log('🎯 Seeding curated intents for FIXED IDS…');
  const fixedPairs = await seedIntentsForFixedUsers({
    users,
    categories,
    tags,
  });

  // Obie listy mają taki sam typ: { intent, owner }
  const allIntents = [...intentsCreated, ...fixedPairs];

  console.log('⛔ Seeding some canceled intents + notifications…');
  const canceled = await seedCanceledIntents(allIntents);

  console.log('🗑️  Seeding some deleted intents (after 30 days)…');
  await seedDeletedIntentsAfterCancel(canceled);

  console.log('🔔 Seeding generic notifications…');
  await seedNotificationsGeneric(allIntents, users);

  console.log('💬 Seeding DM threads and messages…');
  await seedDmThreads(users);

  console.log('💭 Seeding comments…');
  await seedComments(allIntents, users);

  console.log('⭐ Seeding reviews…');
  await seedReviews(allIntents, users);

  console.log('🚨 Seeding reports…');
  await seedReports(allIntents, users);

  console.log('💬 Seeding event chat messages…');
  await seedEventChatMessages(allIntents, users);

  console.log('🚫 Seeding user blocks…');
  await seedUserBlocks(users);

  console.log('🔗 Seeding intent invite links…');
  await seedIntentInviteLinks(allIntents);

  console.log('⚙️  Seeding notification preferences…');
  await seedNotificationPreferences(users);

  console.log('🔕 Seeding mutes…');
  await seedMutes(allIntents, users);

  console.log(
    `✅ Done: users=${users.length}, categories=${categories.length}, tags=${tags.length}, intents=${allIntents.length}`
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
