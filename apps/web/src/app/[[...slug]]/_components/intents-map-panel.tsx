'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { importMarker, loadGoogleMaps } from '@/features/maps/utils/googleMaps';

type LatLng = google.maps.LatLngLiteral;

export type IntentMapItem = {
  id: string;
  title: string;
  startAt: string;
  endAt?: string | null;
  description?: string | null;
  address?: string | null;
  onlineUrl?: string | null;
  lat?: number | null;
  lng?: number | null;

  joinedCount: number;
  max: number;

  // mini-pigułki
  tags?: Array<{ label: string }>;
  categories: Array<{ names: Record<string, string> }>;

  // widoczność adresu i tryb — jeśli masz:
  addressVisibility?: 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN' | string;
  isOnsite?: boolean;
  isOnline?: boolean;
  isHybrid?: boolean;

  // poziomy (opcjonalnie)
  levels?: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>;

  // plan / premium badge (opcjonalnie)
  plan?: 'default' | 'basic' | 'plus' | 'premium';

  owner?: {
    name?: string | null;
    imageUrl?: string | null;
    verifiedAt?: string | null;
  } | null;
};

const DEBUG = false;

/* ───────────────────────────── Utils ───────────────────────────── */

function isValidLatLng(
  lat?: number | null,
  lng?: number | null
): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

function rafDebounce<T extends (...args: any[]) => void>(fn: T) {
  let raf = 0;
  return (...args: Parameters<T>) => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => fn(...args));
  };
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function formatDateRange(
  startISO: string,
  endISO?: string | null,
  lang = 'en'
) {
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : null;
  const fmt = (d: Date) =>
    `${pad2(d.getDate())} ${d.toLocaleString(lang, {
      month: 'short',
    })}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  if (!end) return fmt(start);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  return sameDay
    ? `${fmt(start)} – ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    : `${fmt(start)} – ${fmt(end)}`;
}

function humanDuration(startISO: string, endISO?: string | null) {
  if (!endISO) return '';
  const start = new Date(startISO);
  const end = new Date(endISO);
  const ms = Math.max(0, end.getTime() - start.getTime());
  const total = Math.round(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  if (m) return `${m} min`;
  return '< 1 min';
}

function normalizeAV(
  av?: string
): { label: string; hint: string; icon: string } | null {
  if (!av) return null;
  const s = String(av).toUpperCase();
  if (s.includes('PUBLIC'))
    return {
      label: 'Adres publiczny',
      hint: 'Widoczny dla wszystkich',
      icon: '🟢',
    };
  if (s.includes('AFTER_JOIN'))
    return {
      label: 'Adres po dołączeniu',
      hint: 'Widoczny po dołączeniu',
      icon: '🔒',
    };
  return { label: 'Adres ukryty', hint: 'Dokładny adres niejawny', icon: '🕶️' };
}

function levelLabel(lv: string) {
  switch (lv) {
    case 'BEGINNER':
      return 'Beginner';
    case 'INTERMEDIATE':
      return 'Intermediate';
    case 'ADVANCED':
      return 'Advanced';
    default:
      return lv;
  }
}

function planColors(plan?: IntentMapItem['plan']) {
  switch (plan) {
    case 'premium':
      return { ring: '#a855f7', fill: '#8b5cf6' };
    case 'plus':
      return { ring: '#06b6d4', fill: '#22d3ee' };
    case 'basic':
      return { ring: '#10b981', fill: '#34d399' };
    default:
      return { ring: '#64748b', fill: '#6366f1' };
  }
}

/** Elegancki, lekki marker (SVG) z obwódką planu. */
function createMarkerSVG(plan?: IntentMapItem['plan']) {
  const { ring, fill } = planColors(plan);
  const svg = `
    <svg width="42" height="58" viewBox="0 0 42 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="drop" x="-20" y="-20" width="82" height="98" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity=".25"/>
        </filter>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${fill}" />
          <stop offset="1" stop-color="#4f46e5" />
        </linearGradient>
      </defs>
      <g filter="url(#drop)">
        <path d="M21 55c7-11 19-19 19-32C40 10.85 31.15 2 21 2S2 10.85 2 23c0 13 12 21 19 32z" fill="url(#g)" stroke="${ring}" stroke-width="2" />
        <circle cx="21" cy="23" r="7.5" fill="white" />
      </g>
    </svg>
  `;
  const el = document.createElement('div');
  el.style.willChange = 'transform';
  el.style.cursor = 'pointer';
  el.innerHTML = svg;
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'translateY(-2px) scale(1.02)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translateY(0) scale(1)';
  });
  return el;
}

/** Mini „card” dla InfoWindow: z datą, capacity, pills, adresem i ownerem. */
function buildInfoContent(intent: IntentMapItem, lang: string) {
  const categoryName =
    intent.categories[0]?.names?.[lang] ??
    Object.values(intent.categories[0]?.names ?? {})[0] ??
    '';

  const dateRange = formatDateRange(intent.startAt, intent.endAt, lang);
  const duration = humanDuration(intent.startAt, intent.endAt);
  const pct = Math.min(
    100,
    Math.round((intent.joinedCount / Math.max(1, intent.max)) * 100)
  );

  const av = normalizeAV(intent.addressVisibility);
  const modeBadge = intent.isHybrid
    ? 'Hybrid'
    : intent.isOnline
      ? 'Online'
      : intent.isOnsite
        ? 'Onsite'
        : '';

  const levels =
    (intent.levels ?? [])
      .map(
        (lv) => `
      <span style="
        display:inline-flex;align-items:center;gap:6px;
        font-size:11px;font-weight:600;color:#334155;
        background:#f1f5f9;border:1px solid #e2e8f0;border-radius:999px;
        padding:2px 8px;white-space:nowrap
      ">${levelLabel(lv)}</span>`
      )
      .join(' ') || '';

  const plan =
    intent.plan && intent.plan !== 'default'
      ? `<span style="
          display:inline-flex;align-items:center;gap:6px;
          font-size:11px;font-weight:700;color:white;background:${planColors(intent.plan).fill};
          border-radius:999px;padding:2px 8px;white-space:nowrap;letter-spacing:.2px
        ">${intent.plan.toUpperCase()}</span>`
      : '';

  const tags =
    (intent.tags ?? [])
      .slice(0, 6)
      .map(
        (t) => `
        <span style="
          display:inline-flex;align-items:center;gap:6px;
          font-size:11px;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;
          padding:2px 8px;white-space:nowrap
        ">#${t.label}</span>`
      )
      .join(' ') || '';

  const categoryChip = categoryName
    ? `<span style="
        display:inline-flex;align-items:center;gap:6px;
        font-size:11px;font-weight:600;color:#4f46e5;background:#eef2ff;border:1px solid #e0e7ff;border-radius:999px;
        padding:2px 8px;white-space:nowrap
      ">${categoryName}</span>`
    : '';

  const addrRow =
    intent.isOnline && !intent.isOnsite
      ? `<div style="display:flex;align-items:center;gap:8px;color:#52525b;font-size:13px">
           <span>📡</span><span>Online</span>
         </div>`
      : intent.address
        ? `<div style="display:flex;align-items:center;gap:8px;color:#52525b;font-size:13px">
           <span>📍</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${intent.address}</span>
         </div>`
        : av
          ? `<div style="display:flex;align-items:center;gap:8px;color:#52525b;font-size:13px">
           <span>${av.icon}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${modeBadge ? modeBadge + ' • ' : ''}${av.label}</span>
         </div>`
          : '';

  const owner =
    intent.owner?.name || intent.owner?.imageUrl
      ? `<div style="display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid #e5e7eb">
           ${
             intent.owner?.imageUrl
               ? `<img src="${intent.owner.imageUrl}" alt="${intent.owner?.name ?? 'owner'}"
                     style="width:24px;height:24px;border-radius:999px;object-fit:cover" />`
               : ''
           }
           <span style="font-size:12px;color:#6b7280">by ${intent.owner?.name ?? 'Organizer'}</span>
         </div>`
      : '';

  return `
    <div style="
      max-width:320px;padding:12px 12px 10px 12px;border-radius:14px;
      background: white;border:1px solid #e5e7eb;box-shadow:0 8px 24px rgba(0,0,0,.08);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif;
    ">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="font-size:15px;font-weight:700;color:#111827;line-height:1.25;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${intent.title}</div>
        ${plan}
      </div>

      <div style="display:flex;align-items:center;gap:10px;color:#52525b;font-size:13px;margin:6px 0 2px">
        <span>📅</span>
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${dateRange}</span>
      </div>

      ${
        duration
          ? `<div style="display:flex;align-items:center;gap:10px;color:#6b7280;font-size:12px;margin:0 0 6px">
               <span>⏱️</span><span>${duration}</span>
             </div>`
          : ''
      }

      ${addrRow}

      <div style="margin:8px 0 6px">
        <div style="height:6px;border-radius:999px;background:#f1f5f9;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:#6366f1;transition:width .3s ease"></div>
        </div>
        <div style="display:flex;justify-content:space-between;color:#64748b;font-size:11px;margin-top:4px">
          <span>Uczestnicy</span><span>${intent.joinedCount}/${intent.max}</span>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">
        ${levels}
        ${categoryChip}
        ${tags}
      </div>

      ${owner}
    </div>
  `;
}

/* ───────────────────────────── Component ───────────────────────────── */

export function IntentsMapPanel({
  intents,
  fullHeight = false,
  defaultCenter = { lat: 52.2319, lng: 21.0067 },
  defaultZoom = 12,
  lang = 'en',
}: {
  intents: IntentMapItem[];
  fullHeight?: boolean;
  defaultCenter?: LatLng;
  defaultZoom?: number;
  lang?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<
    Map<
      string,
      {
        marker: google.maps.marker.AdvancedMarkerElement;
        listeners: google.maps.MapsEventListener[];
        lat: number;
        lng: number;
      }
    >
  >(new Map());
  const [mapReady, setMapReady] = useState(false);

  const validIntents = useMemo(
    () =>
      intents
        .filter((i) => isValidLatLng(i.lat, i.lng))
        .slice()
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    [intents]
  );

  const positionsSignature = useMemo(
    () => validIntents.map((i) => `${i.id}:${i.lat},${i.lng}`).join('|'),
    [validIntents]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current || mapRef.current) return;

      // (gdybyś chciał wymusić re-init mapy, zakomentuj warunek wyżej)
    })();

    (async () => {
      if (mapRef.current || !containerRef.current) return;
      const g = await loadGoogleMaps();
      if (cancelled) return;

      const map = new g.maps.Map(containerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        mapId: 'intents-map-id',
        minZoom: 4,
        maxZoom: 18,
      });

      infoWindowRef.current = new g.maps.InfoWindow({ disableAutoPan: false });
      mapRef.current = map;

      const onceIdle = g.maps.event.addListenerOnce(map, 'idle', () => {
        if (!cancelled) setMapReady(true);
      });

      return () => {
        g.maps.event.removeListener(onceIdle);
      };
    })();

    return () => {
      cancelled = true;

      markersRef.current.forEach(({ marker, listeners }) => {
        listeners.forEach((l) => l.remove());
        marker.map = null;
      });
      markersRef.current.clear();

      infoWindowRef.current?.close();
      infoWindowRef.current = null;

      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fitBoundsDebounced = useMemo(
    () =>
      rafDebounce(
        (g: typeof google, map: google.maps.Map, items: IntentMapItem[]) => {
          if (items.length <= 1) return;
          const b = new g.maps.LatLngBounds();
          for (const it of items) {
            if (isValidLatLng(it.lat, it.lng)) {
              b.extend({ lat: it.lat!, lng: it.lng! });
            }
          }
          map.fitBounds(b, { top: 50, right: 50, bottom: 50, left: 50 });
        }
      ),
    []
  );

  const onMarkerClick = useCallback(
    (
      intent: IntentMapItem,
      marker: google.maps.marker.AdvancedMarkerElement
    ) => {
      const map = mapRef.current;
      const info = infoWindowRef.current;
      if (!map || !info) return;

      info.setContent(buildInfoContent(intent, lang));
      info.open({ map, anchor: marker });
    },
    [lang]
  );

  const createMarkerEl = useCallback((intent: IntentMapItem) => {
    // elegancki SVG z kolorem wg planu
    return createMarkerSVG(intent.plan);
  }, []);

  useEffect(() => {
    (async () => {
      if (!mapReady || !mapRef.current) return;
      const g = await loadGoogleMaps();
      const { AdvancedMarkerElement } = await importMarker();
      const map = mapRef.current!;
      const known = markersRef.current;

      // remove
      for (const [id, entry] of known) {
        if (!validIntents.find((i) => i.id === id)) {
          entry.listeners.forEach((l) => l.remove());
          entry.marker.map = null;
          known.delete(id);
          if (DEBUG) console.log('[map] remove', id);
        }
      }

      // add / update
      for (const intent of validIntents) {
        if (!isValidLatLng(intent.lat, intent.lng)) continue;
        const lat = intent.lat!;
        const lng = intent.lng!;
        const existing = known.get(intent.id);

        if (!existing) {
          const content = createMarkerEl(intent);
          const marker = new AdvancedMarkerElement({
            map,
            position: { lat, lng },
            content,
            gmpDraggable: false,
          });
          const listeners: google.maps.MapsEventListener[] = [];
          listeners.push(
            marker.addListener('click', () => onMarkerClick(intent, marker))
          );
          known.set(intent.id, { marker, listeners, lat, lng });
          if (DEBUG) console.log('[map] add', intent.id);
          continue;
        }

        if (existing.lat !== lat || existing.lng !== lng) {
          existing.marker.position = { lat, lng };
          existing.lat = lat;
          existing.lng = lng;
          if (DEBUG) console.log('[map] update', intent.id);
        }
      }

      // bounds / center
      if (validIntents.length > 1) {
        fitBoundsDebounced(g, map, validIntents);
      } else if (validIntents.length === 1) {
        const i0 = validIntents[0]!;
        map.setCenter({ lat: i0.lat!, lng: i0.lng! });
        map.setZoom(14);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, positionsSignature, lang, onMarkerClick, createMarkerEl]);

  // autoresize
  useEffect(() => {
    if (!mapRef.current || !containerRef.current) return;
    const map = mapRef.current;
    const ro = new ResizeObserver(() => {
      google.maps.event.trigger(map, 'resize');
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mapReady]);

  if (validIntents.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border bg-zinc-50 dark:bg-zinc-900 ${
          fullHeight ? 'h-full' : 'h-[420px]'
        }`}
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No locations to display
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className={`rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden ${
          fullHeight ? 'h-full' : 'h-[420px]'
        }`}
        aria-label="Intents map"
      />
      <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-zinc-200 dark:border-zinc-700">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          📍 {validIntents.length} location
          {validIntents.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
