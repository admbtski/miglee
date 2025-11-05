'use client';

import { CapacityBadge } from '@/components/ui/capacity-badge';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Plan } from '@/components/ui/plan-theme';
import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { computeJoinState, StatusBadge } from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { useThrottled } from '@/hooks/use-throttled';
import { Level as GqlLevel } from '@/lib/api/__generated__/react-query-update';
import {
  useGetClustersQuery,
  useGetRegionIntentsQuery,
} from '@/lib/api/map-clusters';
import { MapboxOverlay } from '@deck.gl/mapbox';
import clsx from 'clsx';
import { ScatterplotLayer, TextLayer } from 'deck.gl';
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

/* ───────────────────────────── deck.gl Layer Builder ───────────────────────────── */

function buildLayers(
  clusters: ClusterPoint[],
  opts: {
    hovered?: { lat?: number | null; lng?: number | null };
    pulse?: number; // 0..1 — faza animacji
  } = {}
) {
  const { hovered, pulse = 0 } = opts;

  // Znajdź najbliższy klaster do hovered
  let highlighted: ClusterPoint | null = null;
  if (hovered?.lat != null && hovered?.lng != null && clusters.length) {
    let min = Infinity;
    for (const c of clusters) {
      const dx = c.latitude - hovered.lat!;
      const dy = c.longitude - hovered.lng!;
      const d2 = dx * dx + dy * dy;
      if (d2 < min) {
        min = d2;
        highlighted = c;
      }
    }
  }
  const highlightedRegion = highlighted?.region ?? null;

  // Skala pulsu (od 1.0 do ~1.35)
  const pulseScale = 1 + 0.35 * (0.5 + 0.5 * Math.sin(pulse * Math.PI * 2));

  const basePoints = new ScatterplotLayer<ClusterPoint>({
    id: 'clusters-scatter',
    data: clusters,
    pickable: true,
    radiusUnits: 'pixels',
    parameters: { depthTest: false, depthMask: false },
    getPosition: (d) => [d.longitude, d.latitude],
    getRadius: (d) => {
      const base = Math.min(14 + d.count * 1.6, 28);
      // podbij delikatnie radius dla highlight (bez pulsowania — to robi ring)
      return d.region === highlightedRegion ? base + 3 : base;
    },
    getFillColor: (d) =>
      d.region === highlightedRegion
        ? [120, 130, 255, 240]
        : [99, 102, 241, 220],
    getLineColor: [0, 0, 0, 80],
    getLineWidth: 1.5,
    transitions: {
      // brak animacji pozycji — zmniejsza mikromrugnięcia
      getRadius: 120,
      getFillColor: 120,
    },
    updateTriggers: {
      getRadius:
        clusters.map((c) => c.count).join(',') + '|' + highlightedRegion,
      getFillColor: highlightedRegion,
    },
  });

  // Warstwa pulsującego pierścienia nad podświetlonym klastrem
  const pulseRing =
    highlightedRegion != null
      ? new ScatterplotLayer<ClusterPoint>({
          id: 'clusters-pulse',
          data: clusters.filter((c) => c.region === highlightedRegion),
          pickable: false,
          radiusUnits: 'pixels',
          billboard: true,
          parameters: { depthTest: false, depthMask: false },
          stroked: true,
          filled: false,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: (d) => {
            const base = Math.min(14 + d.count * 1.6, 28);
            return base * pulseScale * 1.3; // większy, oddech
          },
          getLineColor: [
            99,
            102,
            241,
            Math.round(
              150 + 80 * (1 - Math.abs(Math.sin(pulse * Math.PI * 2)))
            ),
          ],
          getLineWidth: 2.5,
          // kluczowe — aktualizuj na zmianę fazy
          updateTriggers: {
            getRadius: pulse,
            getLineColor: pulse,
          },
        })
      : null;

  const labels = new TextLayer<ClusterPoint>({
    id: 'clusters-labels',
    data: clusters,
    parameters: { depthTest: false, depthMask: false },
    getPosition: (d) => [d.longitude, d.latitude],
    getText: (d) => String(d.count),
    getSize: 12,
    sizeUnits: 'pixels',
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    getColor: [255, 255, 255, 255],
    background: true,
    getBackgroundColor: [0, 0, 0, 60],
    backgroundPadding: [2, 2],
  });

  return pulseRing ? [basePoints, pulseRing, labels] : [basePoints, labels];
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
  hoveredLat,
  hoveredLng,
}: ServerClusteredMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // React root dla popupu – tworzymy JEDEN raz
  const popupRootRef = useRef<Root | null>(null);
  const popupContainerRef = useRef<HTMLDivElement | null>(null);

  // deck.gl overlay (oddzielny canvas — brak z-fightingu)
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const lastLayersRef = useRef<any[]>([]);

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

  // Poprzednie dane klastrów (zatrzymaj podczas ładowania)
  const prevClustersRef = useRef<ClusterPoint[]>([]);

  // Płaskie dane do warstw (stabilny input do memo)
  const clusters: ClusterPoint[] = useMemo(() => {
    const newClusters = (clustersData?.clusters ?? []) as ClusterPoint[];

    // Podczas ładowania zachowaj poprzednie dane - NO FLICKER!
    if (clustersLoading && prevClustersRef.current.length > 0) {
      return prevClustersRef.current;
    }

    // Zapisz nowe dane jako poprzednie
    if (newClusters.length > 0) {
      prevClustersRef.current = newClusters;
    }

    return newClusters;
  }, [clustersData?.clusters, clustersLoading]);

  /* ───────── Pulse animation state (0..1) ───────── */
  const [pulseTick, setPulseTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const PULSE_PERIOD_MS = 1200; // okres „oddechu”

  useEffect(() => {
    const wantsPulse = hoveredLat != null && hoveredLng != null;
    if (!wantsPulse) {
      // zatrzymaj i zresetuj
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      setPulseTick(0);
      return;
    }

    const loop = (t: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      const elapsed = t - lastTimeRef.current;
      // przelicz na 0..1
      const phase = (elapsed % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;
      setPulseTick(phase);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [hoveredLat, hoveredLng]);

  // Warstwy — memo (zależne także od pulseTick)
  const layers = useMemo(() => {
    return buildLayers(clusters, {
      hovered: { lat: hoveredLat ?? null, lng: hoveredLng ?? null },
      pulse: pulseTick,
    });
  }, [clusters, hoveredLat, hoveredLng, pulseTick]);

  // Inicjalizacja mapy
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: currentStyleUrl,
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: defaultZoom,
      attributionControl: { compact: true },
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
      throttledBoundsUpdate();
      map.on('moveend', throttledBoundsUpdate);

      // deck.gl overlay – osobny canvas (no flicker)
      const overlay = new MapboxOverlay({ interleaved: false });
      map.addControl(overlay as any);
      deckOverlayRef.current = overlay;

      if (layers?.length) {
        lastLayersRef.current = layers;
        overlay.setProps({ layers });
      }
    };

    if (map.isStyleLoaded()) onLoad();
    else map.on('load', onLoad);

    // kontener + root dla popupu
    popupContainerRef.current = document.createElement('div');
    popupRootRef.current = createRoot(popupContainerRef.current);

    return () => {
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
      popupContainerRef.current = null;

      popupRef.current?.remove();
      popupRef.current = null;

      if (deckOverlayRef.current) {
        deckOverlayRef.current.finalize();
        deckOverlayRef.current = null;
      }

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

    map.off('moveend', throttledBoundsUpdate);
    map.setStyle(currentStyleUrl);

    const rewire = () => {
      throttledBoundsUpdate();
      map.on('moveend', throttledBoundsUpdate);
      if (deckOverlayRef.current && lastLayersRef.current.length) {
        deckOverlayRef.current.setProps({ layers: lastLayersRef.current });
      }
    };
    if (map.isStyleLoaded()) rewire();
    else map.once('load', rewire);
  }, [currentStyleUrl, throttledBoundsUpdate]);

  // Render/mount warstw tylko gdy layers się realnie zmieniają
  useEffect(() => {
    if (!deckOverlayRef.current || !layers?.length) return;
    lastLayersRef.current = layers;
    deckOverlayRef.current.setProps({
      layers,
      onClick: (info: any) => {
        const obj = info.object as ClusterPoint | null;
        if (!obj) return;
        setSelectedRegion(obj.region);
      },
      onHover: (info: any) => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = info.object
            ? 'pointer'
            : '';
        }
      },
    });
  }, [layers]);

  /* ───────── Popup React ───────── */

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

    const avgLat = valid.reduce((s, i) => s + (i.lat || 0), 0) / valid.length;
    const avgLng = valid.reduce((s, i) => s + (i.lng || 0), 0) / valid.length;

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
