export const FIXED_INTENTS_TARGET = 30;

export const FIXED_IDS = {
  ADMIN: 'u_admin_00000000000000000001',
  MODERATOR: 'u_moderator_00000000000000000001',
  USER: 'u_user_00000000000000000001',
} as const;

/** ---------- Realistic-ish data pools ---------- */
export const FIRST_NAMES = [
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
export const LAST_NAMES = [
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

/** Cities with rough coords and sample places (for address realism) */
export const CITIES = [
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

export const CATEGORY_DEFS = [
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

export const TAGS = [
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

export const TITLE_BY_CATEGORY: Record<string, string[]> = {
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
