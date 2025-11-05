'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  useGetClustersQuery,
  useGetRegionIntentsQuery,
} from '@/lib/api/map-clusters';
import { createRoot, Root } from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';

/* ───────────────────────────── Types ───────────────────────────── */

export interface ServerClusteredMapProps {
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  fullHeight?: boolean;
  lang?: string;
  styleUrl?: string;
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
  region: string; // stabilny klucz kafelka
};

type PopupIntent = {
  id: string;
  title: string;
  startAt: string;
  address?: string | null;
  joinedCount?: number | null;
  max?: number | null;
  owner?: { name?: string | null } | null;
  lat?: number | null;
  lng?: number | null;
};

/* ───────────────────────────── Popup UI (React) ───────────────────────────── */

function RegionPopup({
  intents,
  lang = 'pl',
  onIntentClick,
  onClose,
}: {
  intents: PopupIntent[];
  lang?: string;
  onIntentClick?: (id: string) => void;
  onClose?: () => void;
}) {
  const countLabel = useMemo(() => {
    const n = intents.length;
    if (n === 1) return '1 intent w tym obszarze';
    if (n >= 2 && n <= 4) return `${n} intenty w tym obszarze`;
    return `${n} intentów w tym obszarze`;
  }, [intents.length]);

  return (
    <div className="max-w-[360px] max-h-[420px] overflow-y-auto font-sans">
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-[15px] font-bold text-zinc-900 dark:text-zinc-100">
            {countLabel}
          </h3>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
          >
            Zamknij
          </button>
        </div>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {intents.map((intent) => {
          const dateStr = new Date(intent.startAt).toLocaleString(lang, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          } as any);
          return (
            <button
              key={intent.id}
              onClick={() => onIntentClick?.(intent.id)}
              className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            >
              <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                {intent.title}
              </div>
              <div className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                📅 {dateStr}
              </div>
              {intent.address ? (
                <div className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                  📍 {intent.address}
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(intent.joinedCount != null || intent.max != null) && (
                  <span className="inline-flex text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-full px-2 py-[2px]">
                    {intent.joinedCount ?? 0}/{intent.max ?? '—'} osób
                  </span>
                )}
                {intent.owner?.name && (
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    👤 {intent.owner.name}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────── Helpers ───────────────────────────── */

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
  let last = 0;
  let timeout: any = null;
  let lastArgs: any[] | null = null;
  const run = () => {
    last = Date.now();
    timeout = null;
    if (lastArgs) {
      // @ts-ignore
      fn(...lastArgs);
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

function createClusterElement(count: number): HTMLDivElement {
  const el = document.createElement('div');
  el.className =
    'rounded-full text-white font-bold shadow-lg ring-2 ring-white ' +
    'bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-pink-500 ' +
    'flex items-center justify-center select-none';
  const size = Math.min(24 + count * 2, 48);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.pointerEvents = 'auto';
  el.style.willChange = 'transform';
  const label = document.createElement('span');
  label.textContent = String(count);
  label.style.fontSize = '12px';
  label.style.lineHeight = '1';
  el.appendChild(label);
  return el;
}

/* ───────────────────────────── Component ───────────────────────────── */

export function ServerClusteredMap({
  defaultCenter = { lat: 52.2319, lng: 21.0067 },
  defaultZoom = 10,
  fullHeight = false,
  lang = 'pl',
  styleUrl = 'https://tiles.openfreemap.org/styles/liberty',
  filters,
  onIntentClick,
}: ServerClusteredMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // popup React root (utrzymywany, nie tworzymy w kółko)
  const popupRootRef = useRef<Root | null>(null);
  const popupContainerRef = useRef<HTMLDivElement | null>(null);

  // pooling markerów: region -> { marker, el, count }
  const markerPoolRef = useRef<
    Map<
      string,
      { marker: maplibregl.Marker; el: HTMLDivElement; count: number }
    >
  >(new Map());

  // stan mapy
  const [mapBounds, setMapBounds] = useState<{
    swLat: number;
    swLon: number;
    neLat: number;
    neLon: number;
  } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(defaultZoom);

  // region selected
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

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
      style: styleUrl,
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
      maxWidth: '400px',
    });

    map.on('load', () => {
      const updateBounds = () => {
        const bounds = map.getBounds();
        setMapBounds({
          swLat: bounds.getSouth(),
          swLon: bounds.getWest(),
          neLat: bounds.getNorth(),
          neLon: bounds.getEast(),
        });
        setMapZoom(map.getZoom());
      };
      updateBounds();
      map.on('moveend', updateBounds);
    });

    return () => {
      // popup cleanup
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
      popupRef.current?.remove();
      popupRef.current = null;
      popupContainerRef.current = null;

      // marker pool cleanup
      for (const { marker } of markerPoolRef.current.values()) {
        marker.remove();
      }
      markerPoolRef.current.clear();

      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [defaultCenter.lat, defaultCenter.lng, defaultZoom, styleUrl]);

  /* ───────────────────────────── Render clusters (pooled, throttled) ───────────────────────────── */

  const clustersHash = useMemo(() => {
    const arr: ClusterPoint[] = clustersData?.clusters ?? [];
    return hashClusters(arr);
  }, [clustersData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const clusters: ClusterPoint[] = clustersData?.clusters ?? [];

    const apply = () => {
      const pool = markerPoolRef.current;
      const nextKeys = new Set<string>();

      // update / create
      for (const c of clusters) {
        const key = c.region; // stabilny dla kafelka
        nextKeys.add(key);
        const existing = pool.get(key);
        if (existing) {
          // update tylko jeśli zmieniły się coords lub count
          if (existing.count !== c.count) {
            existing.count = c.count;
            existing.el.innerHTML = '';
            const elNew = createClusterElement(c.count);
            existing.el.className = elNew.className;
            existing.el.style.cssText = elNew.style.cssText;
            existing.el.appendChild(elNew.firstChild as Node);
          }
          existing.marker.setLngLat([c.longitude, c.latitude]);
        } else {
          const el = createClusterElement(c.count);
          const marker = new maplibregl.Marker({
            element: el,
            anchor: 'center',
          })
            .setLngLat([c.longitude, c.latitude])
            .addTo(map);

          el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            setSelectedRegion(c.region);
          });

          pool.set(key, { marker, el, count: c.count });
        }
      }

      // remove stale
      for (const [key, entry] of pool.entries()) {
        if (!nextKeys.has(key)) {
          entry.marker.remove();
          pool.delete(key);
        }
      }
    };

    const throttled = throttle(apply, 250);
    throttled();
  }, [clustersHash]);

  /* ───────────────────────────── React popup ───────────────────────────── */

  useEffect(() => {
    if (!selectedRegion || !regionIntentsData?.regionIntents) return;
    const map = mapRef.current;
    const popup = popupRef.current;
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

    const avgLat = valid.reduce((s, i) => s + (i.lat || 0), 0) / valid.length;
    const avgLng = valid.reduce((s, i) => s + (i.lng || 0), 0) / valid.length;

    if (!popupContainerRef.current)
      popupContainerRef.current = document.createElement('div');

    if (!popupRootRef.current) {
      popupRootRef.current = createRoot(popupContainerRef.current);
    }

    const handleClose = () => {
      popup.remove();
      setSelectedRegion(null);
    };

    popupRootRef.current.render(
      <RegionPopup
        intents={intents}
        lang={lang}
        onIntentClick={(id) => {
          onIntentClick?.(id);
          handleClose();
        }}
        onClose={handleClose}
      />
    );

    popup
      .setLngLat([avgLng, avgLat])
      .setDOMContent(popupContainerRef.current!)
      .addTo(map);

    const onPopupClose = () => handleClose();
    popup.once('close', onPopupClose);

    return () => {
      popup.off('close', onPopupClose);
    };
  }, [selectedRegion, regionIntentsData, lang, onIntentClick]);

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className={`rounded-2xl border overflow-hidden ${
          fullHeight ? 'h-full' : 'h-[520px]'
        } bg-white dark:bg-zinc-900`}
        aria-label="Server-clustered intents map"
      />

      {clustersLoading && (
        <div className="absolute top-4 right-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            🔄 Ładowanie...
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
            {clustersData.clusters.reduce(
              (sum: number, c: ClusterPoint) => sum + c.count,
              0
            ) === 1
              ? 'intent'
              : 'intenty'}
          </p>
        </div>
      )}

      <div className="absolute bottom-2 left-2 z-10 text-[10px] text-zinc-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 rounded">
        © OpenStreetMap • MapLibre GL
      </div>
    </div>
  );
}
