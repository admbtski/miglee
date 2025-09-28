'use client';

import { useGetEventsQuery } from '@/hooks/useEvents';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { EventCard } from './_internal/components/event-card';
import { FilterModal } from './_internal/components/filter-modal';
import { Footer } from './_internal/components/footer';
import { MapImagePanel } from './_internal/components/map-image-panel';
import { Navbar } from './_internal/components/navbar';
import { SortControl, SortKey } from './_internal/components/sort-control';
import { useCommittedMapVisible } from './_internal/hooks/useComittedMapVision';
import { useCommittedFilters } from './_internal/hooks/useCommittedFilters';
import { useCommittedSort } from './_internal/hooks/useCommittedSort';

/* ===== DEMO DATA (jak wcześniej) ===== */
const CITIES = [
  { name: 'Kraków', lat: 50.0647, lon: 19.945 },
  { name: 'Warszawa', lat: 52.2297, lon: 21.0122 },
  { name: 'Gdańsk', lat: 54.352, lon: 18.6466 },
  { name: 'Wrocław', lat: 51.1079, lon: 17.0385 },
  { name: 'Poznań', lat: 52.4064, lon: 16.9252 },
] as const;

type CityName = (typeof CITIES)[number]['name'];
const CITY_BY_NAME: Record<
  string,
  { name: CityName; lat: number; lon: number }
> = Object.fromEntries(CITIES.map((c) => [c.name, c])) as any;

const base = {
  avatarUrl: 'https://i.pravatar.cc/150?img=12',
  organizerName: 'Jan Kowalski',
  description: 'Spotkanie biegowe – tempo rekreacyjne, 5–7 km.',
  location: 'Park Skaryszewski, Warszawa',
  min: 5,
  max: 12,
  tags: ['bieganie', 'outdoor', 'sport'],
};

const now = new Date();
const MOCK_ITEMS = Array.from({ length: 20 }).map((_, i) => {
  const cats = ['Sport', 'Nauka', 'Networking', 'Kultura', 'Inne'] as const;
  const cat = cats[i % cats.length];
  const city = CITIES[i % CITIES.length]!;
  const start = new Date();
  start.setDate(start.getDate() + (i % 7));
  start.setHours(10 + (i % 6), (i * 7) % 60, 0, 0);
  const end = new Date(start.getTime() + (60 + (i % 4) * 30) * 60 * 1000);

  const sd = new Date(now.getTime() + (-22 + i * 3600000));
  const ed = new Date(sd.getTime() + 60 * 60 * 1000);

  return {
    ...base,
    id: i + 1,
    title: `${cat} – wydarzenie #${i + 1}`,
    city: city.name,
    lat: city.lat + (Math.random() - 0.5) * 0.2,
    lon: city.lon + (Math.random() - 0.5) * 0.2,
    category: cat,
    capacity: [8, 10, 12, 16][i % 4],
    taken: Math.floor(4 + Math.random() * 8),
    rating: Number((3 + Math.random() * 2).toFixed(1)),
    start,
    end,
    startISO: sd.toISOString(),
    endISO: ed.toISOString(),
    joined: 10,
    tags: ['outdoor', 'sport', i % 2 ? 'free' : 'paid'].slice(0, (i % 3) + 1),
    private: i % 5 === 0,
    salaryPLN: [8000, 12000, 16000, 20000][i % 4],
  };
});

/* ===== Utils / hooks ===== */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type FilterDraft = { q: string; city: string | null; distanceKm: number };
function matchesFilters(item: any, draft: FilterDraft): boolean {
  const { q, city, distanceKm } = draft;
  if (q) {
    const hay =
      `${item.title} ${item.city} ${item.category} ${(item.tags || []).join(' ')}`.toLowerCase();
    if (!hay.includes(q.toLowerCase())) return false;
  }
  if (city && item.city !== city) return false;
  if (city) {
    const base = CITY_BY_NAME[city];
    if (base) {
      const d = haversineKm(base.lat, base.lon, item.lat, item.lon);
      if (d > distanceKm) return false;
    }
  }
  return true;
}

function sortItems(items: any[], sort: SortKey): any[] {
  if (sort === 'latest')
    return [...items].sort(
      (a, b) => +new Date(b.startISO) - +new Date(a.startISO)
    );
  if (sort === 'salary_desc')
    return [...items].sort(
      (a, b) => (b.salaryPLN ?? b.salary ?? 0) - (a.salaryPLN ?? a.salary ?? 0)
    );
  if (sort === 'salary_asc')
    return [...items].sort(
      (a, b) =>
        (a.salaryPLN ?? a.salary ?? Infinity) -
        (b.salaryPLN ?? b.salary ?? Infinity)
    );
  return items;
}

/* ===== Page ===== */
export function WelcomePage() {
  const { data: _unused } = useGetEventsQuery();
  const items = MOCK_ITEMS;

  const { q, city, distanceKm, apply, reset } = useCommittedFilters();
  const { sort, setSort } = useCommittedSort();
  const { mapVisible, toggle: toggleMap } = useCommittedMapVisible();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = useMemo(
    () => (q ? 1 : 0) + (city ? 1 : 0) + (city && distanceKm !== 30 ? 1 : 0),
    [q, city, distanceKm]
  );

  const filtered = useMemo(
    () => items.filter((it) => matchesFilters(it, { q, city, distanceKm })),
    [items, q, city, distanceKm]
  );
  const sorted = useMemo(() => sortItems(filtered, sort), [filtered, sort]);

  // realny offset sticky (wysokość navbaru)
  const NAV_H = 86; // dopasuj do swojego navbaru

  return (
    <div
      className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
      style={{ ['--nav-h' as any]: `${NAV_H}px` }}
    >
      <Navbar
        q={q}
        city={city}
        distanceKm={distanceKm}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilters={activeFilters}
      />

      {/* FULL-WIDTH GRID */}
      <main
        className={`mx-auto grid w-full none gap-6 px-4 py-4 ${
          mapVisible
            ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(360px,36vw,640px)]'
            : 'grid-cols-1'
        }`}
      >
        {/* LEWA: sticky sort + lista */}
        <motion.section layout="position" className="min-w-0">
          {/* sticky sort (przyklejony pod navbar) */}
          <div className="sticky z-30 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex items-center justify-between py-2 text-sm">
              <div className="opacity-70">
                All events in {city || 'Global'} — <b>{sorted.length}</b> event
                {sorted.length === 1 ? '' : 's'}
              </div>
              <SortControl
                value={sort}
                onChange={setSort}
                withMapToggle
                mapEnabled={mapVisible}
                onToggleMap={toggleMap}
              />
            </div>
          </div>

          {/* siatka kart: 1 (mobile) / 2 (>=sm) / 3 (>=xl) */}
          <motion.div
            layout="position"
            className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {sorted.map((item) => (
              <EventCard key={item.id} {...item} />
            ))}
          </motion.div>
        </motion.section>

        <AnimatePresence>
          {/* PRAWA: mapa (sticky, pełna wys. viewportu minus navbar) */}
          {mapVisible && (
            <motion.aside
              className="hidden lg:block"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
            >
              <div className="sticky top-[var(--nav-h)] h-[calc(100vh-var(--nav-h))] -mt-4">
                <MapImagePanel label={city || 'Polska'} fullHeight />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        {/* STOPKA */}
        <div className="col-span-full">
          <Footer />
        </div>
      </main>

      {/* MODAL FILTRÓW */}
      {filtersOpen && (
        <FilterModal
          initialQ={q}
          initialCity={city}
          initialDistanceKm={distanceKm}
          onApply={(next) => {
            apply(next);
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      )}
    </div>
  );
}
