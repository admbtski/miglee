'use client';

import { CapacityBadge } from '@/components/ui/capacity-badge';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Plan, planTheme } from '@/components/ui/plan-theme';
import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { computeJoinState, StatusBadge } from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { useThrottled } from '@/hooks/use-throttled';
import { Level as GqlLevel } from '@/lib/api/__generated__/react-query-update';
import {
  useGetClustersQuery,
  useGetRegionIntentsQuery,
} from '@/lib/api/map-clusters';
import clsx from 'clsx';
import { Calendar, MapPinIcon } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';

/* ───────────────────────────── Types ───────────────────────────── */

export interface ServerClusteredMapProps {
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  fullHeight?: boolean;
  lang?: string;
  styleUrlLight?: string;
  styleUrlDark?: string;
  filters?: {
    categorySlugs?: string[];
    levels?: ('BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')[];
    verifiedOnly?: boolean;
  };
  onIntentClick?: (intentId: string) => void;
  hoveredIntentId?: string | null;
  hoveredLat?: number | null;
  hoveredLng?: number | null;
}

type ClusterPoint = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  region: string;
};

type PopupIntent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  address?: string | null;
  joinedCount?: number | null;
  min?: number | null;
  max?: number | null;
  owner?: {
    name?: string | null;
    imageUrl?: string | null;
    verifiedAt?: string | null;
  } | null;
  lat?: number | null;
  lng?: number | null;
  isCanceled: boolean;
  isDeleted: boolean;
  isFull: boolean;
  isOngoing: boolean;
  hasStarted: boolean;
  withinLock: boolean;
  canJoin?: boolean | null;
  levels?: GqlLevel[] | null;
  plan?: Plan | null;
  meetingKind?: 'ONSITE' | 'ONLINE' | 'HYBRID' | null;
  categorySlugs?: string[] | null;
};

/* ───────────────────────────── Utils ───────────────────────────── */

const MONTHS_PL_SHORT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'gru',
] as const;
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

function formatDateRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const fmt = (d: Date) =>
    `${pad2(d.getDate())} ${MONTHS_PL_SHORT[d.getMonth()]}, ${pad2(
      d.getHours()
    )}:${pad2(d.getMinutes())}`;

  return sameDay
    ? `${fmt(start)} – ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    : `${fmt(start)} – ${fmt(end)}`;
}

const ROUND4 = (n: number) => Math.round(n * 1e4) / 1e4;
const BOUNDS_EPS = 0.0008; // ~80m
const ZOOM_EPS = 0.01;
const THROTTLE_MS = 300;

function changedEnough(prev: number, next: number, eps: number) {
  return Math.abs(prev - next) > eps;
}

/** Tailwind dark mode detection */
function useTailwindDarkMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (html.classList.contains('dark')) return true;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const html = document.documentElement;
    const mm = window.matchMedia?.('(prefers-color-scheme: dark)');
    const update = () =>
      setIsDark(html.classList.contains('dark') || !!mm?.matches);

    const obs = new MutationObserver(update);
    obs.observe(html, { attributes: true, attributeFilter: ['class'] });
    const onChange = () => update();
    mm?.addEventListener?.('change', onChange);
    update();

    return () => {
      obs.disconnect();
      mm?.removeEventListener?.('change', onChange);
    };
  }, []);

  return isDark;
}

function Avatar({
  url,
  alt,
  size = 24,
}: {
  url?: string | null;
  alt: string;
  size?: number;
}) {
  const s = `${size}px`;
  return (
    <img
      src={url || '/avatar-fallback.png'}
      alt={alt}
      className="object-cover rounded-full border border-neutral-200 dark:border-neutral-700"
      style={{ width: s, height: s }}
      loading="lazy"
      decoding="async"
    />
  );
}

/* ───────────────────────────── CSS Animations ───────────────────────────── */

const PULSE_KEYFRAMES = `
@keyframes marker-pulse {
  0%, 100% {
    box-shadow: 
      0 6px 14px rgba(0,0,0,0.18), 
      0 0 0 0 rgba(99, 102, 241, 0.7),
      inset 0 0 0 0 rgba(255, 255, 255, 0);
    opacity: 1;
  }
  50% {
    box-shadow: 
      0 8px 20px rgba(0,0,0,0.3), 
      0 0 0 10px rgba(99, 102, 241, 0),
      inset 0 0 15px 2px rgba(255, 255, 255, 0.4);
    opacity: 0.95;
  }
}
`;

// Inject keyframes to document once
if (typeof document !== 'undefined') {
  const styleId = 'marker-pulse-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = PULSE_KEYFRAMES;
    document.head.appendChild(style);
  }
}

/* ───────────────────────────── Kategorie → kolory ───────────────────────────── */

const CATEGORY_THEME: Record<
  string,
  { light: string; dark: string; from: string; to: string }
> = {
  running: {
    light: '#e0f2fe',
    dark: '#0b2536',
    from: '#38bdf8',
    to: '#0ea5e9',
  },
  yoga: { light: '#ecfccb', dark: '#0a2514', from: '#84cc16', to: '#16a34a' },
  games: { light: '#efe6ff', dark: '#1a1030', from: '#a78bfa', to: '#8b5cf6' },
  study: { light: '#fee2e2', dark: '#2b1111', from: '#f87171', to: '#ef4444' },
  cooking: {
    light: '#fef3c7',
    dark: '#2b1f0a',
    from: '#f59e0b',
    to: '#d97706',
  },
};

type ClusterMeta = {
  meetingKind: 'ONSITE' | 'ONLINE' | 'HYBRID' | 'UNKNOWN';
  colorFrom: string;
  colorTo: string;
  ringClass: string;
};

function defaultClusterMeta(): ClusterMeta {
  return {
    meetingKind: 'UNKNOWN',
    colorFrom: '#6366f1',
    colorTo: '#8b5cf6',
    ringClass: 'ring-indigo-300 dark:ring-indigo-700/60',
  };
}

function createFancyClusterEl(
  count: number,
  meta: ClusterMeta
): HTMLDivElement {
  const el = document.createElement('div');
  const size = Math.min(28 + count * 2, 52);

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '9999px';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.color = 'white';
  el.style.fontWeight = '800';
  el.style.fontVariantNumeric = 'tabular-nums';
  el.style.boxShadow = '0 6px 14px rgba(0,0,0,0.18)';
  el.style.backgroundImage = `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`;
  el.style.position = 'relative';
  el.style.pointerEvents = 'auto';
  el.style.cursor = 'pointer';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `Klastrowane intenty: ${count}`);

  const ring = document.createElement('div');
  ring.className = `absolute inset-0 rounded-full ring-2 ${meta.ringClass}`;
  el.appendChild(ring);

  const label = document.createElement('span');
  label.textContent = String(count);
  label.style.fontSize = '12px';
  el.appendChild(label);

  el.addEventListener(
    'focus',
    () => (ring.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.45)')
  );
  el.addEventListener('blur', () => (ring.style.boxShadow = 'none'));

  return el;
}

/** Leniwy restyle (bez zdejmowania/wstawiania ikon) */
function restyleFancyClusterEl(
  el: HTMLDivElement,
  count: number,
  meta: ClusterMeta
) {
  const bg = `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`;
  if (el.style.backgroundImage !== bg) {
    el.style.backgroundImage = bg;
  }

  const ring = el.querySelector(
    'div.absolute.inset-0.rounded-full'
  ) as HTMLDivElement | null;
  if (ring) {
    const want = `absolute inset-0 rounded-full ring-2 ${meta.ringClass}`;
    if (ring.className !== want) ring.className = want;
  }

  const label = el.querySelector('span');
  if (label && label.textContent !== String(count)) {
    label.textContent = String(count);
  }
}

/* ───────────────────────────── Dominant meta ───────────────────────────── */

function computeDominantMeta(intents: PopupIntent[]): ClusterMeta {
  if (!intents.length) return defaultClusterMeta();

  const kindCount: Record<string, number> = {};
  for (const it of intents) {
    const k = it.meetingKind ?? 'UNKNOWN';
    kindCount[k] = (kindCount[k] ?? 0) + 1;
  }
  const meetingKind =
    (Object.entries(kindCount).sort((a, b) => b[1] - a[1])[0]?.[0] as
      | 'ONSITE'
      | 'ONLINE'
      | 'HYBRID'
      | 'UNKNOWN') ?? 'UNKNOWN';

  const catCount: Record<string, number> = {};
  for (const it of intents) {
    const slug = it.categorySlugs?.[0];
    if (slug) catCount[slug] = (catCount[slug] ?? 0) + 1;
  }
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  const planRank: Record<Plan | 'default', number> = {
    default: 0,
    basic: 1,
    plus: 2,
    pro: 3,
  } as any;
  let bestPlan: Plan | 'default' = 'default';
  for (const it of intents) {
    const p = (it.plan ?? 'default') as Plan | 'default';
    if (planRank[p] > planRank[bestPlan]) bestPlan = p;
  }
  const theme = planTheme(bestPlan as Plan);

  const t = (topCat && CATEGORY_THEME[topCat]) || {
    light: '#e0e7ff',
    dark: '#0f172a',
    from: '#6366f1',
    to: '#8b5cf6',
  };

  return {
    meetingKind,
    colorFrom: t.from,
    colorTo: t.to,
    ringClass: theme.ring,
  };
}

/* ───────────────────────────── Popup UI (React) ───────────────────────────── */

function PopupItem({
  intent,
  onClick,
}: {
  intent: PopupIntent;
  onClick?: (id: string) => void;
}) {
  const {
    startAt,
    endAt,
    isCanceled,
    isDeleted,
    isFull,
    isOngoing,
    hasStarted,
    joinedCount,
    max,
    withinLock,
    canJoin,
  } = intent;

  const fill = useMemo(
    () =>
      Math.min(
        100,
        Math.round(((joinedCount ?? 0) / Math.max(1, max ?? 1)) * 100)
      ),
    [joinedCount, max]
  );

  const levelsSorted = useMemo(
    () => sortLevels((intent.levels ?? []) as GqlLevel[]),
    [intent.levels]
  );

  const { status } = useMemo(
    () =>
      computeJoinState({
        startAt: new Date(startAt),
        isCanceled,
        isDeleted,
        isFull,
        isOngoing,
        hasStarted,
        withinLock,
      }),
    [startAt, hasStarted, isCanceled, isDeleted, isFull, isOngoing, withinLock]
  );

  return (
    <button
      onClick={() => onClick?.(intent.id)}
      className={clsx(
        'cursor-pointer group w-full text-left rounded-xl ring-1 px-3 py-2 transition-all',
        'bg-white dark:bg-zinc-900',
        'ring-zinc-200 dark:ring-zinc-800',
        'hover:shadow-sm hover:-translate-y-[1px]',
        'focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:focus:ring-indigo-500/50'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="m-0 text-[15px] font-semibold leading-5 text-zinc-900 dark:text-zinc-100 truncate">
              {intent.title}
            </h4>
            {intent.plan && intent.plan !== 'default' && (
              <PlanBadge plan={intent.plan as Plan} size="xs" variant="icon" />
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{formatDateRange(startAt, endAt)}</span>
          </div>

          {intent.address ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{intent.address}</span>
            </div>
          ) : null}
        </div>
      </div>

      {intent.owner?.name ? (
        <div className="mt-2 flex items-center gap-2 min-w-0">
          <Avatar url={intent.owner?.imageUrl} alt="Organizer" size={22} />
          <p className="text-[12px] truncate text-neutral-900 dark:text-neutral-100">
            <span className="inline-flex items-center gap-1.5 max-w-full">
              <span className="truncate">{intent.owner?.name}</span>
              {intent.owner?.verifiedAt && (
                <VerifiedBadge
                  size="sm"
                  variant="icon"
                  verifiedAt={intent.owner.verifiedAt}
                />
              )}
            </span>
          </p>
        </div>
      ) : null}

      <div className="mt-1.5">
        <SimpleProgressBar value={fill} active />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <CapacityBadge
          size="sm"
          statusReason={status.reason}
          joinedCount={intent.joinedCount ?? 0}
          min={intent.min ?? 0}
          max={intent.max ?? 0}
          isFull={isFull}
          canJoin={!!canJoin}
        />
        {status.reason !== 'FULL' && (
          <StatusBadge
            size="sm"
            tone={status.tone}
            reason={status.reason}
            label={status.label}
          />
        )}
        {levelsSorted.map((lv) => (
          <LevelBadge key={lv} level={lv} size="sm" variant="iconText" />
        ))}
      </div>
    </button>
  );
}

function RegionPopup({
  intents,
  onIntentClick,
}: {
  intents: PopupIntent[];
  onIntentClick?: (id: string) => void;
}) {
  return (
    <div
      className={clsx(
        'max-w-[280px] max-h-[420px] overflow-y-auto font-sans relative',
        'bg-white dark:bg-zinc-900',
        'rounded-2xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800'
      )}
    >
      <div className="p-2 grid gap-2">
        {intents.map((it, index) => (
          <PopupItem
            key={it.id}
            intent={{
              ...it,
              plan: (function planForIndex(i: number): Plan {
                if (i % 7 === 0) return 'premium';
                if (i % 5 === 0) return 'plus';
                if (i % 3 === 0) return 'basic';
                return 'default';
              })(index),
            }}
            onClick={onIntentClick}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────── Map Component ───────────────────────────── */

export function ServerClusteredMap({
  defaultCenter = { lat: 52.2319, lng: 21.0067 },
  defaultZoom = 10,
  fullHeight = false,
  styleUrlLight = 'https://tiles.openfreemap.org/styles/liberty',
  styleUrlDark = 'https://tiles.openfreemap.org/styles/dark',
  filters,
  onIntentClick,
  hoveredIntentId,
  hoveredLat,
  hoveredLng,
}: ServerClusteredMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // React root dla popupu – tworzymy JEDEN raz
  const popupRootRef = useRef<Root | null>(null);
  const popupContainerRef = useRef<HTMLDivElement | null>(null);

  // pooling markerów
  const markerPoolRef = useRef<
    Map<
      string,
      { marker: maplibregl.Marker; el: HTMLDivElement; count: number }
    >
  >(new Map());

  // cache metadanych klastrów
  const metaCacheRef = useRef<Map<string, ClusterMeta>>(new Map());

  // bounds & zoom
  const [mapBounds, setMapBounds] = useState<{
    swLat: number;
    swLon: number;
    neLat: number;
    neLon: number;
  } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(defaultZoom);

  // selected region
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Tailwind theme
  const isDark = useTailwindDarkMode();
  const currentStyleUrl = isDark ? styleUrlDark : styleUrlLight;
  const prevStyleUrlRef = useRef<string | null>(null);

  // Throttler do bounds/zoom
  const throttledBoundsUpdate = useThrottled(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const next = {
      swLat: ROUND4(b.getSouth()),
      swLon: ROUND4(b.getWest()),
      neLat: ROUND4(b.getNorth()),
      neLon: ROUND4(b.getEast()),
    };

    setMapZoom((prev) => {
      const z = map.getZoom();
      return changedEnough(prev, z, ZOOM_EPS) ? z : prev;
    });

    setMapBounds((prev) => {
      if (
        !prev ||
        changedEnough(prev.swLat, next.swLat, BOUNDS_EPS) ||
        changedEnough(prev.swLon, next.swLon, BOUNDS_EPS) ||
        changedEnough(prev.neLat, next.neLat, BOUNDS_EPS) ||
        changedEnough(prev.neLon, next.neLon, BOUNDS_EPS)
      ) {
        return next;
      }
      return prev;
    });
  }, THROTTLE_MS);

  // Queries (mniej refetchy)
  const { data: clustersData, isLoading: clustersLoading } =
    useGetClustersQuery(
      {
        bbox: mapBounds || {
          swLat: defaultCenter.lat - 0.1,
          swLon: defaultCenter.lng - 0.1,
          neLat: defaultCenter.lat + 0.1,
          neLon: defaultCenter.lng + 0.1,
        },
        zoom: Math.round(mapZoom),
        filters: filters
          ? {
              categorySlugs: filters.categorySlugs,
              levels: filters.levels as any,
              verifiedOnly: filters.verifiedOnly,
            }
          : undefined,
      },
      {
        enabled: !!mapBounds,
        staleTime: 10_000,
        gcTime: 60_000,
      }
    );

  const { data: regionIntentsData } = useGetRegionIntentsQuery(
    {
      region: selectedRegion || '',
      page: 1,
      perPage: 50,
      filters: filters
        ? {
            categorySlugs: filters.categorySlugs,
            levels: filters.levels as any,
            verifiedOnly: filters.verifiedOnly,
          }
        : undefined,
    },
    {
      enabled: !!selectedRegion,
      staleTime: 15_000,
      gcTime: 60_000,
    }
  );

  // Inicjalizacja mapy
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: currentStyleUrl,
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: defaultZoom,
      attributionControl: {
        compact: true,
      },
      fadeDuration: 0,
      crossSourceCollisions: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );
    map.addControl(
      new maplibregl.ScaleControl({ unit: 'metric' }),
      'bottom-left'
    );

    mapRef.current = map;
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '460px',
    });

    const onLoad = () => {
      throttledBoundsUpdate(); // inicjalny
      //  map.on('move', throttledBoundsUpdate);
      map.on('moveend', throttledBoundsUpdate);

      // podczas ruchu chowamy popup (płynność)
      // map.on('movestart', () => {
      //   popupRef.current?.remove();
      //   setSelectedRegion(null);
      // });
    };

    if (map.isStyleLoaded()) onLoad();
    else map.on('load', onLoad);

    // Przygotuj jeden kontener + root dla popupu na przyszłość
    popupContainerRef.current = document.createElement('div');
    popupRootRef.current = createRoot(popupContainerRef.current);

    return () => {
      // zamknij i wyczyść popup React
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
      popupContainerRef.current = null;

      popupRef.current?.remove();
      popupRef.current = null;

      for (const { marker } of markerPoolRef.current.values()) marker.remove();
      markerPoolRef.current.clear();
      metaCacheRef.current.clear();

      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zmiana stylu (dark/light)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (prevStyleUrlRef.current === currentStyleUrl) return;
    prevStyleUrlRef.current = currentStyleUrl;

    // zdejmij poprzednie listenery zanim podmienisz style
    // map.off('move', throttledBoundsUpdate);
    map.off('moveend', throttledBoundsUpdate);

    map.setStyle(currentStyleUrl);

    const rewire = () => {
      throttledBoundsUpdate();
      // map.on('move', throttledBoundsUpdate);
      map.on('moveend', throttledBoundsUpdate);
      // map.on('movestart', () => {
      //   popupRef.current?.remove();
      //   setSelectedRegion(null);
      // });
    };
    if (map.isStyleLoaded()) rewire();
    else map.once('load', rewire);
  }, [currentStyleUrl, throttledBoundsUpdate]);

  /* ───────── Stabilny render klastrów (pooled + throttled) ───────── */

  const applyClusters = useThrottled((clusters: ClusterPoint[]) => {
    const map = mapRef.current;
    if (!map) return;
    const pool = markerPoolRef.current;
    const cache = metaCacheRef.current;
    const nextKeys = new Set<string>();

    for (const c of clusters) {
      const key = c.region;
      nextKeys.add(key);

      const meta = cache.get(key) ?? defaultClusterMeta();
      const existing = pool.get(key);

      if (existing) {
        // Aktualizuj pozycję i count
        existing.marker.setLngLat([c.longitude, c.latitude]);
        if (existing.count !== c.count) {
          existing.count = c.count;
          restyleFancyClusterEl(existing.el, c.count, meta);
        }
      } else {
        const el = createFancyClusterEl(c.count, meta);
        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([c.longitude, c.latitude])
          .addTo(map);

        const open = (ev?: Event) => {
          ev?.stopPropagation?.();
          setSelectedRegion(c.region);
        };
        el.addEventListener('click', open);
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') open(e);
        });

        pool.set(key, { marker, el, count: c.count });
      }
    }

    for (const [key, entry] of pool.entries()) {
      if (!nextKeys.has(key)) {
        entry.marker.remove();
        pool.delete(key);
      }
    }
  }, THROTTLE_MS);

  useEffect(() => {
    if (!mapRef.current) return;
    const clusters: ClusterPoint[] = clustersData?.clusters ?? [];
    applyClusters(clusters);
  }, [clustersData, applyClusters]);

  /* ───────── Popup + aktualizacja meta markera ───────── */

  useEffect(() => {
    if (!selectedRegion || !regionIntentsData?.regionIntents) return;
    const map = mapRef.current,
      popup = popupRef.current;
    if (!map || !popup) return;

    const rawIntents = regionIntentsData.regionIntents.data || [];
    const intents: PopupIntent[] = rawIntents.map((intent: any) => ({
      id: intent.id,
      title: intent.title ?? '',
      startAt: intent.startAt,
      endAt: intent.endAt,
      address: intent.address,
      joinedCount: intent.joinedCount,
      min: intent.min,
      max: intent.max,
      owner: intent.owner,
      lat: intent.lat,
      lng: intent.lng,
      isCanceled: intent.isCanceled ?? false,
      isDeleted: intent.isDeleted ?? false,
      isFull: intent.isFull ?? false,
      isOngoing: intent.isOngoing ?? false,
      hasStarted: intent.hasStarted ?? false,
      withinLock: intent.withinLock ?? false,
      canJoin: intent.canJoin ?? false,
      levels: (intent.levels as GqlLevel[]) ?? null,
      plan: (intent.plan as Plan) ?? null,
      meetingKind:
        (intent.meetingKind as 'ONSITE' | 'ONLINE' | 'HYBRID') ?? null,
      categorySlugs: intent.categories?.map((c: any) => c.slug) ?? null,
    }));
    if (!intents.length) {
      setSelectedRegion(null);
      return;
    }

    const valid = intents.filter((i) => i.lat != null && i.lng != null);
    if (!valid.length) {
      setSelectedRegion(null);
      return;
    }

    const meta = computeDominantMeta(intents);
    metaCacheRef.current.set(selectedRegion, meta);
    const pooled = markerPoolRef.current.get(selectedRegion);
    if (pooled) restyleFancyClusterEl(pooled.el, pooled.count, meta);

    const avgLat = valid.reduce((s, i) => s + (i.lat || 0), 0) / valid.length;
    const avgLng = valid.reduce((s, i) => s + (i.lng || 0), 0) / valid.length;

    // render React popup do wcześniej przygotowanego root
    if (popupRootRef.current && popupContainerRef.current) {
      popupRootRef.current.render(
        <RegionPopup
          intents={intents}
          onIntentClick={(id) => {
            onIntentClick?.(id);
            popup.remove();
            setSelectedRegion(null);
          }}
        />
      );
      // odczekaj 1 klatkę
      requestAnimationFrame(() => {
        popup
          .setLngLat([avgLng, avgLat])
          .setDOMContent(popupContainerRef.current!)
          .addTo(map);
        const onClose = () => setSelectedRegion(null);
        popup.once('close', onClose);
      });
    }
  }, [selectedRegion, regionIntentsData, onIntentClick]);

  /* ───────── Hover Effect: Find and pulse marker ───────── */

  useEffect(() => {
    if (!hoveredIntentId || hoveredLat == null || hoveredLng == null) {
      // Remove pulse from all markers
      for (const { el } of markerPoolRef.current.values()) {
        el.style.animation = '';
      }
      return;
    }

    // Find the cluster that contains this intent's coordinates
    const clusters: ClusterPoint[] = clustersData?.clusters ?? [];
    let closestCluster: ClusterPoint | null = null;
    let minDistance = Infinity;

    // Find closest cluster to the hovered intent coordinates
    for (const cluster of clusters) {
      const distance = Math.sqrt(
        Math.pow(cluster.latitude - hoveredLat, 2) +
          Math.pow(cluster.longitude - hoveredLng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestCluster = cluster;
      }
    }

    // Dynamiczny threshold w zależności od zoomu
    // Im mniejszy zoom, tym większy threshold (klastry są bardziej "zgrupowane")
    const zoomLevel = mapRef.current?.getZoom() ?? defaultZoom;
    const dynamicThreshold = Math.max(0.05, 5 / Math.pow(2, zoomLevel - 5));

    // Apply pulse animation to the closest cluster
    if (closestCluster && minDistance < dynamicThreshold) {
      const pooled = markerPoolRef.current.get(closestCluster.region);

      if (pooled) {
        // Remove animation from all others first
        for (const { el } of markerPoolRef.current.values()) {
          el.style.animation = '';
        }
        // Apply pulse to matched cluster - NO TRANSFORM!
        pooled.el.style.animation = 'marker-pulse 1.5s ease-in-out infinite';
      }
    }
  }, [hoveredIntentId, hoveredLat, hoveredLng, clustersData]);

  /* ───────── Render ───────── */

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className={clsx(
          'rounded-2xl overflow-hidden',
          fullHeight ? 'h-full' : 'h-[520px]',
          'bg-white dark:bg-zinc-900'
        )}
        aria-label="Server-clustered intents map"
        style={{ backfaceVisibility: 'hidden' }}
      />

      {clustersLoading && (
        <div className="absolute top-4 right-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            🔄 Ładowanie…
          </p>
        </div>
      )}
    </div>
  );
}
