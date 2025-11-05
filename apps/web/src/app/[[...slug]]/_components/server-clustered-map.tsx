'use client';

import { CapacityBadge } from '@/components/ui/capacity-badge';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Plan, planTheme } from '@/components/ui/plan-theme';
import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { computeJoinState, StatusBadge } from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
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
  plan?: Plan | null; // 'default' | 'basic' | 'plus' | 'pro'
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

function hashClusters(arr: ClusterPoint[]): string {
  return arr
    .map(
      (c) =>
        `${c.region}:${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}:${c.count}`
    )
    .sort()
    .join('|');
}

function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let last = 0,
    timeout: any = null,
    lastArgs: any[] | null = null;
  const run = () => {
    last = Date.now();
    timeout = null;
    if (lastArgs) {
      /* @ts-ignore */ fn(...lastArgs);
      lastArgs = null;
    }
  };
  // @ts-ignore
  return function (...args: any[]) {
    const now = Date.now();
    const remain = ms - (now - last);
    if (remain <= 0) {
      last = now;
      fn(...args);
    } else {
      lastArgs = args;
      if (!timeout) timeout = setTimeout(run, remain);
    }
  } as T;
}

/** Tailwind dark mode detection (class `dark` or prefers-color-scheme) */
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

/* ───────────────────────────── Markery klastrów ───────────────────────────── */

function mkIcon(kind: 'ONSITE' | 'ONLINE' | 'HYBRID' | 'UNKNOWN') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'white');
  svg.setAttribute('stroke-width', '2');

  const path = document.createElementNS(svg.namespaceURI, 'path');
  switch (kind) {
    case 'ONSITE':
      path.setAttribute(
        'd',
        'M12 21s-6-5.7-6-10a6 6 0 1 1 12 0c0 4.3-6 10-6 10z'
      );
      break;
    case 'ONLINE':
      path.setAttribute(
        'd',
        'M2 8a10 10 0 0 1 20 0M4 12a8 8 0 0 1 16 0M7 16a5 5 0 0 1 10 0'
      );
      break;
    case 'HYBRID':
      path.setAttribute('d', 'M3 10h8v8H3zM13 6h8v12h-8z');
      break;
    default:
      path.setAttribute('d', 'M12 2v20M2 12h20');
  }
  svg.appendChild(path);
  return svg;
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
  el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)';
  el.style.backgroundImage = `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`;
  el.style.position = 'relative';
  el.style.pointerEvents = 'auto';
  el.style.willChange = 'transform';
  el.style.cursor = 'pointer';
  el.tabIndex = 0; // a11y
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `Klastrowane intenty: ${count}`);

  const ring = document.createElement('div');
  ring.className = `absolute inset-0 rounded-full ring-2 ${meta.ringClass}`;
  el.appendChild(ring);

  const iconWrap = document.createElement('div');
  iconWrap.setAttribute('role', 'mk');
  Object.assign(iconWrap.style, {
    position: 'absolute',
    top: '-6px',
    left: '-6px',
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    background: 'rgba(0,0,0,0.28)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  } as CSSStyleDeclaration);
  iconWrap.appendChild(mkIcon(meta.meetingKind));
  el.appendChild(iconWrap);

  const label = document.createElement('span');
  label.textContent = String(count);
  label.style.fontSize = '12px';
  el.appendChild(label);

  // focus ring
  el.addEventListener(
    'focus',
    () => (ring.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.45)')
  );
  el.addEventListener('blur', () => (ring.style.boxShadow = 'none'));

  return el;
}

function restyleFancyClusterEl(
  el: HTMLDivElement,
  count: number,
  meta: ClusterMeta
) {
  const size = Math.min(28 + count * 2, 52);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.backgroundImage = `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`;

  const ring = el.querySelector(
    'div.absolute.inset-0.rounded-full'
  ) as HTMLDivElement | null;
  if (ring)
    ring.className = `absolute inset-0 rounded-full ring-2 ${meta.ringClass}`;

  const iconWrap = el.querySelector('div[role="mk"]') as HTMLDivElement | null;
  if (iconWrap) iconWrap.remove();
  const wrap = document.createElement('div');
  wrap.setAttribute('role', 'mk');
  Object.assign(wrap.style, {
    position: 'absolute',
    top: '-6px',
    left: '-6px',
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    background: 'rgba(0,0,0,0.28)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  } as CSSStyleDeclaration);
  wrap.appendChild(mkIcon(meta.meetingKind));
  el.appendChild(wrap);

  const label = el.querySelector('span');
  if (label) label.textContent = String(count);
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
    () => Math.min(100, Math.round((joinedCount / Math.max(1, max)) * 100)),
    [joinedCount, max]
  );

  const levelsSorted = useMemo(
    () => sortLevels((intent.levels ?? []) as GqlLevel[]),
    [intent.levels]
  );
  const theme = useMemo(
    () => planTheme((intent.plan ?? 'default') as Plan),
    [intent.plan]
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
        'group w-full text-left rounded-xl ring-1 px-3.5 py-3 transition-all',
        'bg-white dark:bg-zinc-900',
        'ring-zinc-200 dark:ring-zinc-800',
        'hover:shadow-sm hover:-translate-y-[1px]',
        'focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:focus:ring-indigo-500/50'
      )}
    >
      {/* header: title + plan accent */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="m-0 text-[15px] font-semibold leading-5 text-zinc-900 dark:text-zinc-100 truncate">
              {intent.title}
            </h4>
            {intent.plan && intent.plan !== 'default' && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={clsx(
                    'inline-flex w-2.5 h-2.5 rounded-full ring-2',
                    theme.ring
                  )}
                />
                <PlanBadge
                  plan={intent.plan as Plan}
                  size="xs"
                  variant="icon"
                />
              </div>
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

      {/* organizer row */}
      {intent.owner?.name ? (
        <div className="mt-2 flex items-center gap-2 min-w-0">
          <Avatar url={intent.owner?.imageUrl} alt="Organizer" size={22} />
          <p className="text-[12px] truncate text-neutral-900 dark:text-neutral-100">
            <span className="inline-flex items-center gap-1.5 max-w-full">
              <span className="truncate">{intent.owner?.name}</span>
              {/* pokaż tylko gdy rzeczywiście zweryfikowany */}
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
      {/* Progress */}
      <div className="mt-1.5">
        <SimpleProgressBar value={fill} active />
      </div>
      {/* capacity row */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
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

      {/* thin plan underline accent */}
      {intent.plan && intent.plan !== 'default' ? (
        <div className={clsx('mt-3 h-[2px] rounded-full', theme.ring)} />
      ) : null}
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
  // scroll shadow – wizualny hint przewijania
  return (
    <div
      className={clsx(
        'max-w-[280px] max-h-[520px] overflow-y-auto font-sans relative',
        'bg-white dark:bg-zinc-900',
        'rounded-2xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800'
      )}
    >
      <div className="p-2 grid gap-2">
        {intents.map((it) => (
          <PopupItem key={it.id} intent={it} onClick={onIntentClick} />
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
  lang = 'pl',
  styleUrlLight = 'https://tiles.openfreemap.org/styles/liberty',
  styleUrlDark = 'https://tiles.openfreemap.org/styles/dark',
  filters,
  onIntentClick,
}: ServerClusteredMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // React root dla popupu
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

  // data
  const { data: clustersData, isLoading: clustersLoading } =
    useGetClustersQuery(
      {
        bbox: mapBounds || {
          swLat: defaultCenter.lat - 0.1,
          swLon: defaultCenter.lng - 0.1,
          neLat: defaultCenter.lat + 0.1,
          neLon: defaultCenter.lng + 0.1,
        },
        zoom: mapZoom,
        filters: filters || undefined,
      },
      { enabled: !!mapBounds }
    );

  const { data: regionIntentsData } = useGetRegionIntentsQuery(
    {
      region: selectedRegion || '',
      page: 1,
      perPage: 50,
      filters: filters || undefined,
    },
    { enabled: !!selectedRegion }
  );

  // init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: currentStyleUrl,
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: defaultZoom,
      attributionControl: true,
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

    map.on('load', () => {
      const updateBounds = () => {
        const b = map.getBounds();
        setMapBounds({
          swLat: b.getSouth(),
          swLon: b.getWest(),
          neLat: b.getNorth(),
          neLon: b.getEast(),
        });
        setMapZoom(map.getZoom());
      };
      updateBounds();
      map.on('moveend', updateBounds);
    });

    return () => {
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
      popupRef.current?.remove();
      popupRef.current = null;
      popupContainerRef.current = null;
      for (const { marker } of markerPoolRef.current.values()) marker.remove();
      markerPoolRef.current.clear();
      metaCacheRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // motyw → setStyle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (prevStyleUrlRef.current === currentStyleUrl) return;
    prevStyleUrlRef.current = currentStyleUrl;
    map.setStyle(currentStyleUrl);
  }, [currentStyleUrl]);

  /* ───────── Render klastrów (pooled + themed) ───────── */

  const clustersHash = useMemo(
    () => hashClusters(clustersData?.clusters ?? []),
    [clustersData]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const clusters: ClusterPoint[] = clustersData?.clusters ?? [];
    const apply = () => {
      const pool = markerPoolRef.current;
      const cache = metaCacheRef.current;
      const nextKeys = new Set<string>();

      for (const c of clusters) {
        const key = c.region;
        nextKeys.add(key);

        const meta = cache.get(key) ?? defaultClusterMeta();
        const existing = pool.get(key);

        if (existing) {
          if (existing.count !== c.count) {
            existing.count = c.count;
            restyleFancyClusterEl(existing.el, c.count, meta);
          }
          existing.marker.setLngLat([c.longitude, c.latitude]);
        } else {
          const el = createFancyClusterEl(c.count, meta);
          const marker = new maplibregl.Marker({
            element: el,
            anchor: 'center',
          })
            .setLngLat([c.longitude, c.latitude])
            .addTo(map);

          // click + klawiatura
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
    };

    throttle(apply, 100)();
  }, [clustersHash]);

  /* ───────── Popup + aktualizacja meta markera ───────── */

  useEffect(() => {
    if (!selectedRegion || !regionIntentsData?.regionIntents) return;
    const map = mapRef.current,
      popup = popupRef.current;
    if (!map || !popup) return;

    const intents = (regionIntentsData.regionIntents.data ||
      []) as PopupIntent[];
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

    if (!popupContainerRef.current)
      popupContainerRef.current = document.createElement('div');
    if (!popupRootRef.current)
      popupRootRef.current = createRoot(popupContainerRef.current);

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

    popup
      .setLngLat([avgLng, avgLat])
      .setDOMContent(popupContainerRef.current!)
      .addTo(map);
    const onClose = () => setSelectedRegion(null);
    popup.once('close', onClose);
    return () => {
      popup.off('close', onClose);
    };
  }, [selectedRegion, regionIntentsData, onIntentClick]);

  /* ───────── Render ───────── */

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className={clsx(
          'rounded-2xl border overflow-hidden',
          fullHeight ? 'h-full' : 'h-[520px]',
          'bg-white dark:bg-zinc-900'
        )}
        aria-label="Server-clustered intents map"
      />

      {clustersLoading && (
        <div className="absolute top-4 right-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            🔄 Ładowanie…
          </p>
        </div>
      )}

      {clustersData?.clusters && (
        <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            🗺️{' '}
            {clustersData.clusters.reduce(
              (sum: number, c: ClusterPoint) => sum + c.count,
              0
            )}{' '}
            {(() => {
              const n = clustersData.clusters.reduce(
                (s: number, c: ClusterPoint) => s + c.count,
                0
              );
              return n === 1 ? 'intent' : n <= 4 ? 'intenty' : 'intentów';
            })()}
          </p>
        </div>
      )}

      <div className="absolute bottom-2 left-2 z-10 text-[10px] text-zinc-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 rounded">
        © OpenStreetMap • MapLibre GL
      </div>
    </div>
  );
}
