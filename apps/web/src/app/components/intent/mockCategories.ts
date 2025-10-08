import { CategoryOption } from './types';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const CATEGORIES: CategoryOption[] = [
  { id: 'tech', name: 'Tech' },
  { id: 'art', name: 'Art' },
  { id: 'business', name: 'Business' },
  { id: 'health', name: 'Health' },
  { id: 'travel', name: 'Travel' },
  { id: 'music', name: 'Music' },
  { id: 'food', name: 'Food' },
  { id: 'community', name: 'Community' },
  { id: 'science', name: 'Science' },
  { id: 'sports', name: 'Sports' },
  { id: 'education', name: 'Education' },
  { id: 'outdoor', name: 'Outdoor' },
];

function filterLimit(query: string, list: CategoryOption[], limit = 12) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? list.filter((o) => o.name.toLowerCase().includes(q))
    : list;
  return filtered.slice(0, limit);
}

export async function fetchCategories(
  query: string
): Promise<CategoryOption[]> {
  await sleep(250 + Math.random() * 450);
  return filterLimit(query, CATEGORIES, 12);
}
