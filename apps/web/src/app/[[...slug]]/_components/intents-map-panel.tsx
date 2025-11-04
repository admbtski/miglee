'use client';

import { useEffect, useMemo, useRef } from 'react';
import maplibregl, { Map, Popup, LngLatLike } from 'maplibre-gl';

/* ───────────────────────────── Types ───────────────────────────── */

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

  tags?: Array<{ label: string }>;
  categories: Array<{ names: Record<string, string> }>;

  addressVisibility?: 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN' | string;
  isOnsite?: boolean;
  isOnline?: boolean;
  isHybrid?: boolean;

  levels?: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>;

  /** wpływa na iconę pina */
  plan?: 'default' | 'basic' | 'plus' | 'premium';

  owner?: { name?: string | null; imageUrl?: string | null } | null;
};

const isNum = (x?: number | null) =>
  typeof x === 'number' && Number.isFinite(x);

/* ───────────────────────────── Mini utils ───────────────────────────── */

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
function formatDateRange(
  startISO: string,
  endISO?: string | null,
  lang = 'pl'
) {
  const s = new Date(startISO);
  const e = endISO ? new Date(endISO) : null;
  const fmt = (d: Date) =>
    `${pad2(d.getDate())} ${d.toLocaleString(lang, { month: 'short' })}, ${pad2(
      d.getHours()
    )}:${pad2(d.getMinutes())}`;
  if (!e) return fmt(s);
  const same =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  return same
    ? `${fmt(s)} – ${pad2(e.getHours())}:${pad2(e.getMinutes())}`
    : `${fmt(s)} – ${fmt(e)}`;
}
function humanDuration(startISO: string, endISO?: string | null) {
  if (!endISO) return '';
  const s = new Date(startISO);
  const e = new Date(endISO);
  const mins = Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  if (m) return `${m} min`;
  return '< 1 min';
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
/** SVG pina -> data URL */
function pinDataUrl(plan?: IntentMapItem['plan']) {
  const { ring, fill } = planColors(plan);
  const svg = `
  <svg width="42" height="58" viewBox="0 0 42 58" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${fill}" />
        <stop offset="1" stop-color="#4f46e5" />
      </linearGradient>
    </defs>
    <path d="M21 55c7-11 19-19 19-32C40 10.85 31.15 2 21 2S2 10.85 2 23c0 13 12 21 19 32z" fill="url(#g)" stroke="${ring}" stroke-width="2" />
    <circle cx="21" cy="23" r="7.5" fill="white" />
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function infoHTML(i: IntentMapItem, lang: string) {
  const pct = Math.min(
    100,
    Math.round((i.joinedCount / Math.max(1, i.max)) * 100)
  );
  const range = formatDateRange(i.startAt, i.endAt, lang);
  const dur = humanDuration(i.startAt, i.endAt);
  const cat = i.categories?.[0]
    ? (i.categories[0].names?.[lang] ??
      Object.values(i.categories[0].names ?? {})[0] ??
      '')
    : '';

  const planChip =
    i.plan && i.plan !== 'default'
      ? `<span style="display:inline-flex;align-items:center;font-size:11px;font-weight:700;color:white;background:${planColors(i.plan).fill};
         border-radius:999px;padding:2px 8px;white-space:nowrap;letter-spacing:.2px">${i.plan.toUpperCase()}</span>`
      : '';

  const tags =
    (i.tags ?? [])
      .slice(0, 6)
      .map(
        (t) =>
          `<span style="display:inline-flex;align-items:center;font-size:11px;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;padding:2px 8px;white-space:nowrap;margin-right:6px">#${t.label}</span>`
      )
      .join('') || '';

  const levels =
    (i.levels ?? [])
      .map(
        (lv) =>
          `<span style="display:inline-flex;align-items:center;font-size:11px;font-weight:600;color:#334155;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:999px;padding:2px 8px;white-space:nowrap;margin-right:6px">${lv}</span>`
      )
      .join('') || '';

  const addressRow =
    i.isOnline && !i.isOnsite
      ? `<div style="display:flex;align-items:center;gap:8px;color:#52525b;font-size:13px"><span>📡</span><span>Online</span></div>`
      : i.address
        ? `<div style="display:flex;align-items:center;gap:8px;color:#52525b;font-size:13px"><span>📍</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i.address}</span></div>`
        : '';

  const owner =
    i.owner?.name || i.owner?.imageUrl
      ? `<div style="display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid #e5e7eb">
           ${i.owner?.imageUrl ? `<img src="${i.owner.imageUrl}" style="width:24px;height:24px;border-radius:999px;object-fit:cover" />` : ''}
           <span style="font-size:12px;color:#6b7280">by ${i.owner?.name ?? 'Organizer'}</span>
         </div>`
      : '';

  return `
  <div style="max-width:320px;padding:12px 12px 10px;border-radius:14px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 8px 24px rgba(0,0,0,.08);
    font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div style="font-size:15px;font-weight:700;color:#111827;line-height:1.25;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.title}</div>
      ${planChip}
    </div>

    <div style="display:flex;align-items:center;gap:10px;color:#52525b;font-size:13px;margin:6px 0 2px">
      <span>📅</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${range}</span>
    </div>
    ${dur ? `<div style="display:flex;align-items:center;gap:10px;color:#6b7280;font-size:12px;margin:0 0 6px"><span>⏱️</span><span>${dur}</span></div>` : ''}

    ${addressRow}

    <div style="margin:8px 0 6px">
      <div style="height:6px;border-radius:999px;background:#f1f5f9;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:#6366f1;transition:width .3s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;color:#64748b;font-size:11px;margin-top:4px">
        <span>Uczestnicy</span><span>${i.joinedCount}/${i.max}</span>
      </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">
      ${levels}${cat ? `<span style="display:inline-flex;align-items:center;font-size:11px;font-weight:600;color:#4f46e5;background:#eef2ff;border:1px solid #e0e7ff;border-radius:999px;padding:2px 8px;white-space:nowrap">${cat}</span>` : ''}${tags}
    </div>

    ${owner}
  </div>`;
}

/* ───────────────────────────── GeoJSON + clusters ───────────────────────────── */

function toFeatureCollection(items: IntentMapItem[], lang: string) {
  return {
    type: 'FeatureCollection',
    features: items
      .filter((i) => isNum(i.lat) && isNum(i.lng))
      .map((i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [i.lng!, i.lat!] },
        properties: {
          id: i.id,
          title: i.title,
          startAt: i.startAt,
          endAt: i.endAt ?? null,
          description: i.description ?? null,
          address: i.address ?? null,
          onlineUrl: i.onlineUrl ?? null,
          joinedCount: i.joinedCount,
          max: i.max,
          tags: i.tags ?? [],
          categories: i.categories ?? [],
          addressVisibility: i.addressVisibility ?? null,
          isOnsite: !!i.isOnsite,
          isOnline: !!i.isOnline,
          isHybrid: !!i.isHybrid,
          levels: i.levels ?? [],
          plan: i.plan ?? 'default',
          owner: i.owner ?? null,
          lang,
        },
      })),
  } as const;
}

/* ───────────────────────────── Component ───────────────────────────── */

export function IntentsMapPanel({
  intents,
  fullHeight = false,
  defaultCenter = { lat: 52.2319, lng: 21.0067 },
  defaultZoom = 12,
  lang = 'pl',
  styleUrl = 'https://demotiles.maplibre.org/style.json',
}: {
  intents: IntentMapItem[];
  fullHeight?: boolean;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  lang?: string;
  /** podmień na swój styl (MapLibre/MapTiler/self-hosted) */
  styleUrl?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);

  const fc = useMemo(() => toFeatureCollection(intents, lang), [intents, lang]);

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
      closeOnMove: true,
      maxWidth: '360px',
    });

    map.on('load', async () => {
      // zarejestruj obrazy pinów (1x per plan)
      const plans: Array<NonNullable<IntentMapItem['plan']>> = [
        'default',
        'basic',
        'plus',
        'premium',
      ];
      for (const p of plans) {
        const img = new Image();
        img.src = pinDataUrl(p);
        await img.decode().catch(() => {});
        if (!map.hasImage(`pin-${p}`)) {
          map.addImage(`pin-${p}`, img, { pixelRatio: 2 });
        }
      }

      map.addSource('intents', {
        type: 'geojson',
        data: fc as any,
        cluster: true,
        clusterRadius: 60,
        clusterMaxZoom: 14,
      });

      // klastry
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'intents',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#a5b4fc',
            10,
            '#60a5fa',
            25,
            '#34d399',
            50,
            '#22d3ee',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16,
            10,
            20,
            25,
            24,
            50,
            28,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'intents',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
        },
        paint: { 'text-color': '#0f172a' },
      });

      // pojedyncze punkty – symbol z obrazkiem zależnym od planu
      map.addLayer({
        id: 'unclustered',
        type: 'symbol',
        source: 'intents',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': [
            'match',
            ['get', 'plan'],
            'premium',
            'pin-premium',
            'plus',
            'pin-plus',
            'basic',
            'pin-basic',
            /* default */ 'pin-default',
          ],
          'icon-size': 0.65,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });

      // interakcje
      map.on('click', 'clusters', (e) => {
        const f = map.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        })[0];
        const clusterId = f?.properties?.cluster_id;
        const src = map.getSource('intents') as any;
        src.getClusterExpansionZoom(clusterId, (_err: any, z: number) => {
          map.easeTo({
            center: (f.geometry as any).coordinates as LngLatLike,
            zoom: z,
          });
        });
      });

      map.on('click', 'unclustered', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties!;
        // uwaga: właściwości tablicowe były serializowane — tu je odzyskujemy:
        const parseJSON = (v: any) => {
          try {
            return typeof v === 'string' ? JSON.parse(v) : v;
          } catch {
            return [];
          }
        };
        const data: IntentMapItem = {
          id: p.id,
          title: p.title,
          startAt: p.startAt,
          endAt: p.endAt !== 'null' ? p.endAt : null,
          description: p.description !== 'null' ? p.description : null,
          address: p.address !== 'null' ? p.address : null,
          onlineUrl: p.onlineUrl !== 'null' ? p.onlineUrl : null,
          joinedCount: Number(p.joinedCount),
          max: Number(p.max),
          tags: parseJSON(p.tags),
          categories: parseJSON(p.categories),
          addressVisibility:
            p.addressVisibility !== 'null' ? p.addressVisibility : null,
          isOnsite: p.isOnsite === 'true',
          isOnline: p.isOnline === 'true',
          isHybrid: p.isHybrid === 'true',
          levels: parseJSON(p.levels),
          plan: (p.plan as any) || 'default',
          owner: parseJSON(p.owner),
        };
        const html = infoHTML(data, p.lang || lang);
        const coords = (f.geometry as any).coordinates as [number, number];

        popupRef.current!.setLngLat(coords).setHTML(html).addTo(map);
      });

      const setCursor = (on: boolean) =>
        (map.getCanvas().style.cursor = on ? 'pointer' : '');
      map.on('mouseenter', 'clusters', () => setCursor(true));
      map.on('mouseleave', 'clusters', () => setCursor(false));
      map.on('mouseenter', 'unclustered', () => setCursor(true));
      map.on('mouseleave', 'unclustered', () => setCursor(false));
    });

    return () => {
      popupRef.current?.remove();
      mapRef.current?.remove();
      popupRef.current = null;
      mapRef.current = null;
    };
  }, [defaultCenter.lat, defaultCenter.lng, defaultZoom, styleUrl]);

  // aktualizacja danych bez rekreacji mapy
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('intents') as any;
    if (!src) return;
    src.setData(fc);
  }, [fc]);

  // fit bounds na zmianę danych
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const coords = (fc.features as any[]).map((f) => f.geometry.coordinates);
    if (!coords.length) return;
    const b = coords.reduce(
      (acc: [number, number, number, number], [lng, lat]: [number, number]) => [
        Math.min(acc[0], lng),
        Math.min(acc[1], lat),
        Math.max(acc[2], lng),
        Math.max(acc[3], lat),
      ],
      [coords[0][0], coords[0][1], coords[0][0], coords[0][1]]
    );
    map.fitBounds(b as any, { padding: 60, duration: 0 });
  }, [fc]);

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className={`rounded-2xl border overflow-hidden ${fullHeight ? 'h-full' : 'h-[420px]'} bg-white dark:bg-zinc-900`}
        aria-label="Intents map"
      />
      <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-zinc-200 dark:border-zinc-700">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          📍 {(fc.features as any[]).length} location
          {(fc.features as any[]).length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
