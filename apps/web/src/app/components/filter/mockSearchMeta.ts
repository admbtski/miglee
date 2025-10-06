// lib/mockSearchMeta.ts

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const TAGS = [
  'Networking',
  'Workshops',
  'Sports',
  'Gaming',
  'Culture',
  'Education',
  'Volunteering',
  'Outdoor',
  'AI',
  'JavaScript',
  'React',
  'UX',
  'Design',
  'Open source',
];

const KEYWORDS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node',
  'UX/UI',
  'AI',
  'Data',
  'Marketing',
  'Fitness',
  'Photography',
  'Startup',
  'NoSQL',
  'SQL',
];

const CATEGORIES = [
  'Tech',
  'Art',
  'Business',
  'Health',
  'Travel',
  'Music',
  'Food',
  'Community',
  'Science',
  'Sports',
];

function filterLimit(list: string[], query: string, limit: number) {
  const q = query.trim().toLowerCase();
  const filtered = q ? list.filter((x) => x.toLowerCase().includes(q)) : list;
  return filtered.slice(0, limit);
}

/** Simulated API with 300–700ms delay */
export async function fetchSearchMeta(query: string): Promise<{
  tags: string[];
  keywords: string[];
  categories: string[];
}> {
  await sleep(300 + Math.random() * 400);
  return {
    tags: filterLimit(TAGS, query, 7),
    keywords: filterLimit(KEYWORDS, query, 6),
    categories: filterLimit(CATEGORIES, query, 5),
  };
}
