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
  NotificationKind,
  // modele – TYPY rekordów w DB:
  User,
  Category,
  Tag,
  Intent,
} from '@prisma/client';

const prisma = new PrismaClient();

/** --- STAŁE ID dla 3 użytkowników --- */
const FIXED_IDS = {
  ADMIN: 'u_admin_00000000000000000001',
  MODERATOR: 'u_moderator_00000000000000000001',
  USER: 'u_user_00000000000000000001',
} as const;

/** Small helper to wait N ms (only for prettier logs / determinism if needed) */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Deterministic pseudo-random (seeded) to keep results reproducible across runs */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);

/** Pick a random item from array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}
/** Pick K distinct items from array */
function pickMany<T>(arr: T[], k: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < k && pool.length; i++) {
    const idx = Math.floor(rnd() * pool.length);
    out.push(pool[idx]!);
    pool.splice(idx, 1);
  }
  return out;
}

/** Build names JSON helper */
const namesJson = (
  pl: string,
  de: string,
  en: string
): Prisma.InputJsonObject => ({
  pl,
  de,
  en,
});

/** Cities to optionally place intents around (approx coordinates) */
const CITIES = [
  { name: 'Warszawa', lat: 52.2297, lng: 21.0122 },
  { name: 'Kraków', lat: 50.0647, lng: 19.945 },
  { name: 'Gdańsk', lat: 54.352, lng: 18.6466 },
  { name: 'Wrocław', lat: 51.1079, lng: 17.0385 },
  { name: 'Poznań', lat: 52.4064, lng: 16.9252 },
];

/** Sports events (legacy Event model) */
const SPORTS_EVENTS = [
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

async function clearDb() {
  // Order matters because of FKs
  await prisma.notification.deleteMany();
  await prisma.intent.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
  await prisma.event.deleteMany();
}

async function seedUsers(): Promise<User[]> {
  // 1 admin, 3 moderators, 1 zwykły user ze stałym ID, plus ~20 dodatkowych userów
  const users: Array<Prisma.UserCreateInput> = [];

  // --- Admin (stałe ID) ---
  users.push({
    id: FIXED_IDS.ADMIN,
    email: 'admin@example.com',
    name: 'Admin One',
    role: Role.ADMIN,
    imageUrl: `https://picsum.photos/id/10/200/300`,
  });

  // --- Moderatorzy (pierwszy ze stałym ID) ---
  const MODS = [
    {
      id: FIXED_IDS.MODERATOR,
      email: 'mod1@example.com',
      name: 'Moderator One',
      imgId: 11,
    },
    { email: 'mod2@example.com', name: 'Moderator Two', imgId: 12 },
    { email: 'mod3@example.com', name: 'Moderator Three', imgId: 13 },
  ];
  MODS.forEach((m) =>
    users.push({
      id: (m as any).id, // drugi i trzeci będą miały auto-cuid
      email: m.email,
      name: m.name,
      role: Role.MODERATOR,
      imageUrl: `https://picsum.photos/id/${m.imgId}/200/300`,
    })
  );

  // --- Zwykły user (stałe ID) ---
  users.push({
    id: FIXED_IDS.USER,
    email: 'user-fixed@example.com',
    name: 'User Fixed',
    role: Role.USER,
    imageUrl: `https://picsum.photos/id/19/200/300`,
  });

  // --- ~20 dodatkowych userów (auto-id) ---
  for (let i = 0; i < 20; i++) {
    const id = 20 + i; // different picsum ids
    users.push({
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`,
      role: Role.USER,
      imageUrl: `https://picsum.photos/id/${id}/200/300`,
    });
  }

  const created: User[] = [];
  for (const u of users) {
    const row = await prisma.user.create({ data: u });
    created.push(row);
  }
  return created;
}

async function seedCategories(): Promise<Category[]> {
  // 10 categories with pl/de/en
  const items: Array<{
    slug: string;
    names: Prisma.InputJsonObject;
    icon?: string;
    color?: string;
  }> = [
    {
      slug: 'running',
      names: namesJson('Bieganie', 'Laufen', 'Running'),
      icon: '🏃',
      color: '#ef4444',
    },
    {
      slug: 'cycling',
      names: namesJson('Kolarstwo', 'Radfahren', 'Cycling'),
      icon: '🚴',
      color: '#f59e0b',
    },
    {
      slug: 'reading',
      names: namesJson('Czytanie', 'Lesen', 'Reading'),
      icon: '📚',
      color: '#10b981',
    },
    {
      slug: 'coding',
      names: namesJson('Programowanie', 'Programmieren', 'Coding'),
      icon: '💻',
      color: '#3b82f6',
    },
    {
      slug: 'boardgames',
      names: namesJson('Planszówki', 'Brettspiele', 'Board games'),
      icon: '🎲',
      color: '#8b5cf6',
    },
    {
      slug: 'hiking',
      names: namesJson('Wędrówki', 'Wandern', 'Hiking'),
      icon: '🥾',
      color: '#22c55e',
    },
    {
      slug: 'language-exchange',
      names: namesJson(
        'Wymiana językowa',
        'Sprachaustausch',
        'Language exchange'
      ),
      icon: '🗣️',
      color: '#06b6d4',
    },
    {
      slug: 'photography',
      names: namesJson('Fotografia', 'Fotografie', 'Photography'),
      icon: '📷',
      color: '#f97316',
    },
    {
      slug: 'yoga',
      names: namesJson('Joga', 'Yoga', 'Yoga'),
      icon: '🧘',
      color: '#a855f7',
    },
    {
      slug: 'cooking',
      names: namesJson('Gotowanie', 'Kochen', 'Cooking'),
      icon: '🍳',
      color: '#84cc16',
    },
  ];

  const created: Category[] = [];
  for (const item of items) {
    const row = await prisma.category.create({
      data: {
        slug: item.slug,
        names: item.names,
        icon: item.icon ?? null,
        color: item.color ?? null,
      },
    });
    created.push(row);
  }
  return created;
}

async function seedTags(): Promise<Tag[]> {
  // 15 tags (simple labels)
  const raw = [
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

  const created: Tag[] = [];
  for (const label of raw) {
    const row = await prisma.tag.create({
      data: {
        label,
        slug: label.toLowerCase().replace(/\s+/g, '-'),
      },
    });
    created.push(row);
  }
  return created;
}

function randomWithinCity(base: { lat: number; lng: number }) {
  // jitter ~±0.1 deg
  const j = () => (rnd() - 0.5) * 0.2;
  return { lat: base.lat + j(), lng: base.lng + j() };
}

function randomTimeWindow(i: number) {
  // Start distributed next 0..20 days, at various hours, 60–180min duration
  const start = new Date();
  start.setDate(start.getDate() + Math.floor(rnd() * 21));
  start.setHours(9 + Math.floor(rnd() * 10), Math.floor(rnd() * 60), 0, 0);

  const durMin = 60 + Math.floor(rnd() * 121); // 60–180
  const end = new Date(start.getTime() + durMin * 60_000);

  // Slight deterministic skew by index
  if (i % 7 === 0) start.setDate(start.getDate() + 1);

  return { startAt: start, endAt: end };
}

function titleFor(categorySlug: string) {
  const map: Record<string, string[]> = {
    running: ['Easy 5k run', 'Interval training', 'Long run Sunday'],
    cycling: ['City ride', 'Gravel adventure', 'Evening sprint'],
    reading: ['Book club', 'Read & discuss', 'Quiet reading time'],
    coding: ['Hack night', 'Pair programming', 'Open source hour'],
    boardgames: ['Board game night', 'Strategy evening', 'Party games'],
    hiking: ['Trail walk', 'Forest hike', 'Sunrise hike'],
    'language-exchange': [
      'EN-PL exchange',
      'Deutsch Stammtisch',
      'Casual language chat',
    ],
    photography: ['Photo walk', 'Light & composition', 'Portraits meetup'],
    yoga: ['Morning yoga', 'Sunset yoga', 'Vinyasa flow'],
    cooking: ['Pasta workshop', 'Spices 101', 'Street food night'],
  };
  const list = map[categorySlug] ?? ['Meetup'];
  return pick(list);
}

async function seedIntents(opts: {
  users: User[];
  categories: Category[];
  tags: Tag[];
}): Promise<Array<{ intent: Intent; author: User }>> {
  const { users, categories, tags } = opts;

  const intentsCreated: Array<{ intent: Intent; author: User }> = [];

  for (let i = 0; i < 30; i++) {
    const author = pick(users);
    const firstCategory = pick(categories);
    const title = titleFor(firstCategory.slug);

    const { startAt, endAt } = randomTimeWindow(i);
    const city: (typeof CITIES)[number] = pick(CITIES);
    const { lat, lng } = randomWithinCity(city);

    const meetingKind = pick<MeetingKind>([
      MeetingKind.ONSITE,
      MeetingKind.ONLINE,
      MeetingKind.HYBRID,
    ]);
    const visibility = pick<Visibility>([Visibility.PUBLIC, Visibility.HIDDEN]);
    const mode = pick<Mode>([Mode.GROUP, Mode.ONE_TO_ONE]);
    const allowJoinLate = rnd() > 0.25;

    const min = mode === Mode.ONE_TO_ONE ? 2 : 2 + Math.floor(rnd() * 4) * 2; // 2 (1:1) or group 2/4/6/8..
    const max =
      mode === Mode.ONE_TO_ONE
        ? 2
        : Math.max(min, min + [2, 4, 6, 8][Math.floor(rnd() * 4)]!);

    const selectedCategories = [
      firstCategory,
      ...pickMany(
        categories.filter((c) => c.id !== firstCategory.id),
        2
      ),
    ];
    const selectedTags = pickMany(tags, 1 + Math.floor(rnd() * 4)); // 1..4 tags
    const levelsPool: Level[] = [
      Level.BEGINNER,
      Level.INTERMEDIATE,
      Level.ADVANCED,
    ];
    const levels = pickMany(levelsPool, 1 + Math.floor(rnd() * 3)); // 1..3 levels

    const address =
      meetingKind !== MeetingKind.ONLINE ? `${city.name} center` : null;
    const radiusKm =
      meetingKind !== MeetingKind.ONLINE
        ? rnd() > 0.6
          ? Number((rnd() * 5).toFixed(1))
          : 0
        : null;
    const onlineUrl =
      meetingKind !== MeetingKind.ONSITE
        ? pick([
            'https://meet.google.com/abc-defg-hij',
            'https://zoom.us/j/123456789',
            'https://discord.gg/xyz',
          ])
        : null;

    const description =
      meetingKind === MeetingKind.ONSITE
        ? `Casual ${firstCategory.slug} meetup in ${city.name}.`
        : meetingKind === MeetingKind.ONLINE
          ? `Online ${firstCategory.slug} session.`
          : `Hybrid ${firstCategory.slug} event in ${city.name} + online link.`;

    const notes =
      rnd() > 0.5
        ? pick([
            'Bring water.',
            'Camera optional.',
            'Meet at entrance A.',
            'Slow pace.',
          ])
        : null;

    const created = await prisma.intent.create({
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
        lat: meetingKind !== MeetingKind.ONLINE ? lat : null,
        lng: meetingKind !== MeetingKind.ONLINE ? lng : null,
        address: address ?? null,
        radiusKm: radiusKm ?? null,
        levels, // enum[] column
        author: { connect: { id: author.id } },
        categories: { connect: selectedCategories.map((c) => ({ id: c.id })) },
        tags: { connect: selectedTags.map((t) => ({ id: t.id })) },
      },
    });

    intentsCreated.push({ intent: created, author });
  }

  return intentsCreated;
}

async function seedNotifications(
  intentsCreated: Array<{ intent: Intent; author: User }>,
  users: User[]
) {
  // For each intent, notify 2–4 random users (not the author)
  for (const { intent, author } of intentsCreated) {
    const audience = users.filter((u) => u.id !== author.id);
    const recipients = pickMany(audience, 2 + Math.floor(rnd() * 3)); // 2..4

    for (const r of recipients) {
      await prisma.notification.create({
        data: {
          kind: NotificationKind.INTENT_CREATED,
          recipientId: r.id,
          intentId: intent.id,
          message: `New intent "${intent.title}" by ${author.name ?? author.email}`,
          payload: {
            intentId: intent.id,
            authorId: author.id,
          } as Prisma.InputJsonValue,
          // readAt: (rnd() > 0.8 ? new Date() : null) // optionally mark some as read
        },
      });
    }
  }
}

async function seedEvents() {
  // Keep your legacy sports events, similar to your original seeder.
  const anchorDate = new Date(Date.UTC(2025, 0, 15)); // Jan 15, 2025

  for (let i = 0; i < SPORTS_EVENTS.length; i++) {
    const title = SPORTS_EVENTS[i]!;
    const createdAt = new Date(anchorDate.getTime() - i * 24 * 60 * 60 * 1000);
    await prisma.event.create({ data: { title, createdAt } });
  }
}

async function main() {
  console.log('🧹 Clearing DB…');
  await clearDb();

  console.log('👤 Seeding users…');
  const users = await seedUsers();

  console.log('🏷️  Seeding tags…');
  const tags = await seedTags();

  console.log('🗂️  Seeding categories…');
  const categories = await seedCategories();

  console.log('📝 Seeding intents (30)…');
  const intentsCreated = await seedIntents({ users, categories, tags });

  console.log('🔔 Seeding notifications for created intents…');
  await seedNotifications(intentsCreated, users);

  console.log('🏟️  Seeding legacy events…');
  await seedEvents();

  console.log(
    `✅ Done: users=${users.length}, categories=${categories.length}, tags=${tags.length}, intents=${intentsCreated.length}, events=${SPORTS_EVENTS.length}`
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
