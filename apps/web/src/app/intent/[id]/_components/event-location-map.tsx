'use client';

import { useTheme } from '@/features/theme/provider/theme-provider';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from 'deck.gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';

/* ───────────────────────────── Types ───────────────────────────── */

export interface EventLocationMapProps {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
  className?: string;
  height?: string;
  zoom?: number;
  styleUrlLight?: string;
  styleUrlDark?: string;
}

/* ───────────────────────────── Map Component ───────────────────────────── */

export function EventLocationMap({
  lat,
  lng,
  title,
  address,
  className,
  height = 'h-[400px]',
  zoom = 14,
  styleUrlLight = 'https://tiles.openfreemap.org/styles/liberty',
  styleUrlDark = 'https://tiles.openfreemap.org/styles/dark',
}: EventLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);

  const { resolvedTheme } = useTheme();
  const currentStyleUrl =
    resolvedTheme === 'dark' ? styleUrlDark : styleUrlLight;

  // Inicjalizacja mapy
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: currentStyleUrl,
      center: [lng, lat],
      zoom: zoom,
      attributionControl: { compact: true },
      fadeDuration: 0,
      crossSourceCollisions: false,
      interactive: true, // Allow zooming and panning
    });

    // Add navigation controls
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    // Add scale control
    map.addControl(
      new maplibregl.ScaleControl({ unit: 'metric' }),
      'bottom-left'
    );

    mapRef.current = map;

    const onLoad = () => {
      // Add deck.gl overlay for animated marker
      const overlay = new MapboxOverlay({ interleaved: false });
      map.addControl(overlay as any);
      deckOverlayRef.current = overlay;

      // Create pulsing marker layer
      const markerLayer = new ScatterplotLayer({
        id: 'event-marker',
        data: [{ position: [lng, lat] }],
        pickable: false,
        radiusUnits: 'pixels',
        lineWidthUnits: 'pixels',
        getPosition: (d: any) => d.position,
        getRadius: 20,
        getFillColor: [239, 68, 68, 220], // red-500
        getLineColor: [220, 38, 38, 255], // red-600
        getLineWidth: 3,
        stroked: true,
        filled: true,
      });

      // Pulsing ring
      const pulseLayer = new ScatterplotLayer({
        id: 'event-marker-pulse',
        data: [{ position: [lng, lat] }],
        pickable: false,
        radiusUnits: 'pixels',
        lineWidthUnits: 'pixels',
        stroked: true,
        filled: false,
        getPosition: (d: any) => d.position,
        getRadius: 24,
        getLineColor: [239, 68, 68, 180],
        getLineWidth: 2,
      });

      overlay.setProps({ layers: [pulseLayer, markerLayer] });

      // Add popup with event info if title or address provided
      if (title || address) {
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 25,
        });

        const popupContent = `
          <div class="p-2">
            ${title ? `<div class="font-semibold text-sm mb-1">${title}</div>` : ''}
            ${address ? `<div class="text-xs text-zinc-600 dark:text-zinc-400">${address}</div>` : ''}
          </div>
        `;

        popup.setLngLat([lng, lat]).setHTML(popupContent).addTo(map);
      }
    };

    if (map.isStyleLoaded()) onLoad();
    else map.on('load', onLoad);

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      if (deckOverlayRef.current) {
        deckOverlayRef.current.finalize();
        deckOverlayRef.current = null;
      }

      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(currentStyleUrl);

    const rewire = () => {
      // Recreate deck.gl layers after style change
      if (deckOverlayRef.current) {
        const markerLayer = new ScatterplotLayer({
          id: 'event-marker',
          data: [{ position: [lng, lat] }],
          pickable: false,
          radiusUnits: 'pixels',
          lineWidthUnits: 'pixels',
          getPosition: (d: any) => d.position,
          getRadius: 20,
          getFillColor: [239, 68, 68, 220],
          getLineColor: [220, 38, 38, 255],
          getLineWidth: 3,
          stroked: true,
          filled: true,
        });

        const pulseLayer = new ScatterplotLayer({
          id: 'event-marker-pulse',
          data: [{ position: [lng, lat] }],
          pickable: false,
          radiusUnits: 'pixels',
          lineWidthUnits: 'pixels',
          stroked: true,
          filled: false,
          getPosition: (d: any) => d.position,
          getRadius: 24,
          getLineColor: [239, 68, 68, 180],
          getLineWidth: 2,
        });

        deckOverlayRef.current.setProps({ layers: [pulseLayer, markerLayer] });
      }
    };

    if (map.isStyleLoaded()) rewire();
    else map.once('load', rewire);
  }, [currentStyleUrl, lat, lng]);

  // Update marker position when coordinates change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Fly to new location
    map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      duration: 1000,
      essential: true,
    });

    // Update deck.gl layers
    if (deckOverlayRef.current) {
      const markerLayer = new ScatterplotLayer({
        id: 'event-marker',
        data: [{ position: [lng, lat] }],
        pickable: false,
        radiusUnits: 'pixels',
        lineWidthUnits: 'pixels',
        getPosition: (d: any) => d.position,
        getRadius: 20,
        getFillColor: [239, 68, 68, 220],
        getLineColor: [220, 38, 38, 255],
        getLineWidth: 3,
        stroked: true,
        filled: true,
      });

      const pulseLayer = new ScatterplotLayer({
        id: 'event-marker-pulse',
        data: [{ position: [lng, lat] }],
        pickable: false,
        radiusUnits: 'pixels',
        lineWidthUnits: 'pixels',
        stroked: true,
        filled: false,
        getPosition: (d: any) => d.position,
        getRadius: 24,
        getLineColor: [239, 68, 68, 180],
        getLineWidth: 2,
      });

      deckOverlayRef.current.setProps({ layers: [pulseLayer, markerLayer] });
    }
  }, [lat, lng, zoom]);

  return (
    <div className={clsx('relative', className)}>
      <div
        ref={containerRef}
        className={clsx(
          'rounded-xl overflow-hidden',
          height,
          'bg-white dark:bg-zinc-900',
          'border border-zinc-200 dark:border-zinc-800'
        )}
        aria-label={`Mapa lokalizacji: ${address || 'Lokalizacja wydarzenia'}`}
      />
    </div>
  );
}
