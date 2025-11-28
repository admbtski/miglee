'use client';

import { useTheme } from '@/features/theme/provider/theme-provider';
import clsx from 'clsx';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';

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
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));">
          <!-- Pin shadow -->
          <ellipse cx="24" cy="44" rx="8" ry="3" fill="rgba(0, 0, 0, 0.2)" />
          
          <!-- Pin body -->
          <path d="M24 4C16.268 4 10 10.268 10 18C10 28.5 24 44 24 44C24 44 38 28.5 38 18C38 10.268 31.732 4 24 4Z" 
                fill="#EF4444" 
                stroke="#DC2626" 
                stroke-width="2"/>
          
          <!-- Inner circle -->
          <circle cx="24" cy="18" r="6" fill="white" opacity="0.9"/>
          
          <!-- Center dot -->
          <circle cx="24" cy="18" r="3" fill="#DC2626"/>
        </svg>
      `;

      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes marker-bounce {
          0%, 100% { 
            translate: 0 0;
          }
          50% { 
            translate: 0 -10px;
          }
        }
        .custom-marker {
          cursor: pointer;
          width: 48px;
          height: 48px;
          display: block;
          animation: marker-bounce 2s ease-in-out infinite;
        }
        .custom-marker:hover {
          animation: marker-bounce 0.5s ease-in-out infinite;
        }
        .custom-marker svg {
          display: block;
          width: 100%;
          height: 100%;
        }
      `;
      document.head.appendChild(style);

      // Add marker to map
      const marker = new maplibregl.Marker({
        element: markerEl,
        anchor: 'bottom',
      })
        .setLngLat([lng, lat])
        .addTo(map);

      markerRef.current = marker;

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
      // Marker persists through style changes automatically
      // Just ensure it's still visible
      if (markerRef.current) {
        markerRef.current.addTo(map);
      }
    };

    if (map.isStyleLoaded()) rewire();
    else map.once('load', rewire);
  }, [currentStyleUrl]);

  // Update marker position when coordinates change
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    // Update marker position
    marker.setLngLat([lng, lat]);

    // Fly to new location
    map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      duration: 1000,
      essential: true,
    });
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
