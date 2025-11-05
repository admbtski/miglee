'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map, Popup } from 'maplibre-gl';
import {
  useGetClustersQuery,
  useGetRegionIntentsQuery,
} from '@/lib/api/map-clusters';
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

/* ───────────────────────────── Component ───────────────────────────── */

export function ServerClusteredMap({
  defaultCenter = { lat: 52.2319, lng: 21.0067 },
  defaultZoom = 12,
  fullHeight = false,
  lang = 'pl',
  styleUrl = 'https://demotiles.maplibre.org/style.json',
  filters,
  onIntentClick,
}: ServerClusteredMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);

  // Track map bounds and zoom for server-side clustering
  const [mapBounds, setMapBounds] = useState<{
    swLat: number;
    swLon: number;
    neLat: number;
    neLon: number;
  } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(defaultZoom);

  // Selected cluster region for showing intents
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Fetch clusters for current viewport
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
      {
        enabled: !!mapBounds,
      }
    );

  // Fetch intents for selected cluster region
  const { data: regionIntentsData } = useGetRegionIntentsQuery(
    {
      region: selectedRegion || '',
      page: 1,
      perPage: 50,
      filters: filters || undefined,
    },
    {
      enabled: !!selectedRegion,
    }
  );

  // Initialize map
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
      // Update bounds on map move
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

      // Initial bounds update
      updateBounds();

      // Update on moveend (after pan/zoom)
      map.on('moveend', updateBounds);

      // Add empty source for clusters
      map.addSource('server-clusters', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Cluster circles
      map.addLayer({
        id: 'server-clusters-circles',
        type: 'circle',
        source: 'server-clusters',
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
            18,
            10,
            24,
            25,
            30,
            50,
            36,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Cluster count labels
      map.addLayer({
        id: 'server-clusters-count',
        type: 'symbol',
        source: 'server-clusters',
        layout: {
          'text-field': ['get', 'point_count'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 13,
        },
        paint: { 'text-color': '#0f172a' },
      });

      // Click handler for clusters
      map.on('click', 'server-clusters-circles', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['server-clusters-circles'],
        });
        const feature = features[0];
        if (!feature || !feature.properties) return;

        const region = feature.properties.region;
        setSelectedRegion(region);
      });

      // Cursor pointer on hover
      map.on('mouseenter', 'server-clusters-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'server-clusters-circles', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      popupRef.current?.remove();
      mapRef.current?.remove();
      popupRef.current = null;
      mapRef.current = null;
    };
  }, [defaultCenter.lat, defaultCenter.lng, defaultZoom, styleUrl]);

  // Update clusters when data arrives
  useEffect(() => {
    if (!clustersData?.clusters) return;
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const clusters = clustersData.clusters || [];

    // Convert server clusters to GeoJSON
    const clusterFeatures = clusters.map((cluster) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [cluster.longitude, cluster.latitude],
      },
      properties: {
        cluster: true,
        cluster_id: cluster.id,
        point_count: cluster.count,
        region: cluster.region,
      },
    }));

    const clusterGeoJson = {
      type: 'FeatureCollection' as const,
      features: clusterFeatures,
    };

    // Update source
    const source = map.getSource('server-clusters') as any;
    if (source) {
      source.setData(clusterGeoJson);
    }
  }, [clustersData]);

  // Show popup with intents when region is selected
  useEffect(() => {
    if (!selectedRegion || !regionIntentsData?.regionIntents) return;
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!map || !popup) return;

    const intents = regionIntentsData.regionIntents.data || [];
    if (intents.length === 0) {
      setSelectedRegion(null);
      return;
    }

    // Calculate center of intents for popup position
    const validIntents = intents.filter((i) => i.lat != null && i.lng != null);
    if (validIntents.length === 0) return;

    const avgLat =
      validIntents.reduce((sum, i) => sum + (i.lat || 0), 0) /
      validIntents.length;
    const avgLng =
      validIntents.reduce((sum, i) => sum + (i.lng || 0), 0) /
      validIntents.length;

    // Build HTML for popup
    const html = `
      <div style="max-width:360px;max-height:400px;overflow-y:auto;font-family:system-ui,-apple-system,sans-serif">
        <div style="padding:12px;border-bottom:1px solid #e5e7eb;position:sticky;top:0;background:white;z-index:1">
          <h3 style="margin:0;font-size:15px;font-weight:700;color:#111827">
            ${intents.length} ${intents.length === 1 ? 'Intent' : 'Intenty'} w tym obszarze
          </h3>
        </div>
        ${intents
          .map(
            (intent) => `
          <div style="padding:12px;border-bottom:1px solid #f3f4f6;cursor:pointer;transition:background 0.2s"
               onmouseover="this.style.background='#f9fafb'"
               onmouseout="this.style.background='white'"
               onclick="window.dispatchEvent(new CustomEvent('intentClick', { detail: '${intent.id}' }))">
            <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px">${intent.title}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px">
              📅 ${new Date(intent.startAt).toLocaleDateString(lang, {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            ${
              intent.address
                ? `<div style="font-size:12px;color:#6b7280">📍 ${intent.address}</div>`
                : ''
            }
            <div style="margin-top:6px;display:flex;align-items:center;gap:6px">
              <div style="display:inline-flex;font-size:11px;color:#4f46e5;background:#eef2ff;border-radius:999px;padding:2px 8px">
                ${intent.joinedCount}/${intent.max} osób
              </div>
              ${
                intent.owner?.name
                  ? `<div style="font-size:11px;color:#6b7280">👤 ${intent.owner.name}</div>`
                  : ''
              }
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    popup.setLngLat([avgLng, avgLat]).setHTML(html).addTo(map);

    // Listen for intent clicks from popup
    const handleIntentClick = (e: CustomEvent<string>) => {
      if (onIntentClick) {
        onIntentClick(e.detail);
      }
      popup.remove();
      setSelectedRegion(null);
    };

    window.addEventListener('intentClick', handleIntentClick as any);

    return () => {
      window.removeEventListener('intentClick', handleIntentClick as any);
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

      {/* Loading indicator */}
      {clustersLoading && (
        <div className="absolute top-4 right-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            🔄 Ładowanie...
          </p>
        </div>
      )}

      {/* Cluster count badge */}
      {clustersData?.clusters && (
        <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            🗺️ {clustersData.clusters.reduce((sum, c) => sum + c.count, 0)}{' '}
            {clustersData.clusters.reduce((sum, c) => sum + c.count, 0) === 1
              ? 'intent'
              : 'intenty'}
          </p>
        </div>
      )}

      {/* Attribution */}
      <div className="absolute bottom-2 left-2 z-10 text-[10px] text-zinc-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 rounded">
        © OpenStreetMap • MapLibre GL
      </div>
    </div>
  );
}
