// components/location/MapPreview.tsx
'use client';

import { useTheme } from '@/features/theme/provider/theme-provider';
import clsx from 'clsx';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';

type LatLng = { lat: number; lng: number };

function isValidLatLng(v: LatLng | null | undefined): v is LatLng {
  return (
    !!v &&
    Number.isFinite(v.lat) &&
    Number.isFinite(v.lng) &&
    !(v.lat === 0 && v.lng === 0)
  );
}

/**
 * Modern map preview with MapLibre GL:
 * - Light/Dark theme support
 * - Interactive marker (draggable/clickable)
 * - Optional radius circle
 * - Smooth animations
 * - No Google Maps dependency
 */
export function MapPreview({
  center,
  zoom = 14,
  radiusMeters,
  className,
  style,
  draggableMarker = true,
  clickToPlace = true,
  onUserSetPosition,
  defaultCenter = { lat: 52.2319, lng: 21.0067 }, // Warsaw fallback
  defaultZoomNoCenter = 6,
  styleUrlLight = 'https://tiles.openfreemap.org/styles/liberty',
  styleUrlDark = 'https://tiles.openfreemap.org/styles/dark',
}: {
  center: LatLng | null;
  zoom?: number;
  radiusMeters?: number | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  draggableMarker?: boolean;
  clickToPlace?: boolean;
  onUserSetPosition?: (pos: LatLng) => void;
  defaultCenter?: LatLng;
  defaultZoomNoCenter?: number;
  styleUrlLight?: string;
  styleUrlDark?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Theme support
  const { resolvedTheme } = useTheme();
  const currentStyleUrl =
    resolvedTheme === 'dark' ? styleUrlDark : styleUrlLight;

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(
    center && isValidLatLng(center) ? center : null
  );

  // Helper function to create a custom marker element
  const createMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.position = 'relative';
    el.style.width = '32px';
    el.style.height = '44px';
    el.style.cursor = draggableMarker ? 'grab' : 'pointer';

    // Create the pin shape using CSS
    el.innerHTML = `
      <svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));">
        <defs>
          <linearGradient id="pinGradient" x1="16" y1="0" x2="16" y2="32">
            <stop offset="0%" stop-color="#F97316" />
            <stop offset="100%" stop-color="#EA580C" />
          </linearGradient>
          <linearGradient id="pinGradientHover" x1="16" y1="0" x2="16" y2="32">
            <stop offset="0%" stop-color="#FB923C" />
            <stop offset="100%" stop-color="#F97316" />
          </linearGradient>
          <linearGradient id="pinGradientDrag" x1="16" y1="0" x2="16" y2="32">
            <stop offset="0%" stop-color="#EA580C" />
            <stop offset="100%" stop-color="#C2410C" />
          </linearGradient>
        </defs>
        
        <!-- Pin shadow -->
        <ellipse cx="16" cy="42" rx="4" ry="2" fill="black" opacity="0.2" class="pin-shadow"/>
        
        <!-- Main pin body -->
        <path d="M16 0C10.477 0 6 4.477 6 10c0 2.5 1 4.5 2.5 6.5L16 30l7.5-13.5C25 14.5 26 12.5 26 10c0-5.523-4.477-10-10-10z" 
              fill="url(#pinGradient)" 
              class="pin-fill"
              stroke="white"
              stroke-width="1.5"
              stroke-opacity="0.3"/>
        
        <!-- Glossy highlight -->
        <ellipse cx="16" cy="8" rx="6" ry="5" fill="white" opacity="0.25" class="pin-highlight"/>
        
        <!-- Inner circle (white dot) -->
        <circle cx="16" cy="10" r="4" fill="white" opacity="0.95"/>
        
        <!-- Inner circle border -->
        <circle cx="16" cy="10" r="4" fill="none" stroke="white" stroke-width="0.5" opacity="0.5"/>
        
        <!-- Tiny center dot -->
        <circle cx="16" cy="10" r="1.5" fill="url(#pinGradient)" opacity="0.8"/>
      </svg>
    `;

    const svg = el.querySelector('svg');
    const pinFill = el.querySelector('.pin-fill');

    if (svg && pinFill) {
      // Add hover effect
      el.addEventListener('mouseenter', () => {
        pinFill.setAttribute('fill', 'url(#pinGradientHover)');
        if (svg) {
          svg.style.transform = 'scale(1.08) translateY(-2px)';
          svg.style.transition =
            'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
      });

      el.addEventListener('mouseleave', () => {
        // Check if currently being dragged
        if (el.style.cursor !== 'grabbing') {
          pinFill.setAttribute('fill', 'url(#pinGradient)');
          if (svg) {
            svg.style.transform = 'scale(1) translateY(0)';
          }
        }
      });
    }

    return el;
  }, [draggableMarker]);

  // Helper function to update radius circle
  const updateRadiusCircle = useCallback(
    (map: maplibregl.Map, position: LatLng) => {
      if (!map.isStyleLoaded()) return;

      const sourceId = 'radius-circle';
      const fillLayerId = 'radius-circle-fill';
      const borderLayerId = 'radius-circle-border';

      // Remove existing layers and source
      try {
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (e) {
        // Ignore errors
      }

      // If no radius, we're done

      // Create circle GeoJSON
      const createCircle = (
        center: [number, number],
        radiusInMeters: number,
        points = 64
      ): GeoJSON.Feature<GeoJSON.Polygon> => {
        const coords = {
          latitude: center[1],
          longitude: center[0],
        };

        const km = radiusInMeters / 1000;
        const ret: Array<[number, number]> = [];
        const distanceX =
          km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
        const distanceY = km / 110.574;

        for (let i = 0; i < points; i++) {
          const theta = (i / points) * (2 * Math.PI);
          const x = distanceX * Math.cos(theta);
          const y = distanceY * Math.sin(theta);
          ret.push([coords.longitude + x, coords.latitude + y]);
        }
        // Close the polygon
        const firstPoint = ret[0];
        if (firstPoint) {
          ret.push(firstPoint);
        }

        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [ret],
          },
          properties: {},
        };
      };

      const circleGeoJSON = createCircle(
        [position.lng, position.lat],
        radiusMeters ?? 10
      );

      // Add new source and layers
      try {
        map.addSource(sourceId, {
          type: 'geojson',
          data: circleGeoJSON,
        });

        map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#6366f1',
            'fill-opacity': 0.12,
          },
        });

        map.addLayer({
          id: borderLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#6366f1',
            'line-width': 2,
            'line-opacity': 0.6,
          },
        });
      } catch (e) {
        console.error('Failed to add radius circle:', e);
      }
    },
    [radiusMeters]
  );

  // Helper function to set up drag handlers on a marker
  const setupMarkerDragHandlers = useCallback(
    (marker: maplibregl.Marker, map: maplibregl.Map) => {
      if (!draggableMarker) return;

      marker.on('dragstart', () => {
        setIsDragging(true);
        const el = marker.getElement();
        el.style.cursor = 'grabbing';

        const pinFill = el.querySelector('.pin-fill');
        if (pinFill) {
          pinFill.setAttribute('fill', 'url(#pinGradientDrag)');
        }

        const svg = el.querySelector('svg');
        if (svg) {
          svg.style.transform = 'scale(1.12) translateY(-3px)';
          svg.style.transition = 'transform 0.15s ease-out';
        }
      });

      marker.on('drag', () => {
        const lngLat = marker.getLngLat();
        const newPos = { lat: lngLat.lat, lng: lngLat.lng };
        setMarkerPosition(newPos);
        updateRadiusCircle(map, newPos);
      });

      marker.on('dragend', () => {
        setIsDragging(false);
        const lngLat = marker.getLngLat();
        const finalPos = { lat: lngLat.lat, lng: lngLat.lng };

        const el = marker.getElement();
        el.style.cursor = 'grab';

        const pinFill = el.querySelector('.pin-fill');
        if (pinFill) {
          pinFill.setAttribute('fill', 'url(#pinGradient)');
        }

        const svg = el.querySelector('svg');
        if (svg) {
          svg.style.transform = 'scale(1) translateY(0)';
          svg.style.transition =
            'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }

        setMarkerPosition(finalPos);
        updateRadiusCircle(map, finalPos);
        onUserSetPosition?.(finalPos);
      });
    },
    [draggableMarker, updateRadiusCircle, onUserSetPosition]
  );

  // Helper function to create or update marker
  const createOrUpdateMarker = useCallback(
    (
      map: maplibregl.Map,
      position: LatLng,
      shouldSetupHandlers: boolean = true
    ) => {
      if (markerRef.current) {
        // Just update position if marker exists
        markerRef.current.setLngLat([position.lng, position.lat]);
      } else {
        // Create new marker with anchor at the bottom point of the pin
        const marker = new maplibregl.Marker({
          element: createMarkerElement(),
          draggable: draggableMarker,
          anchor: 'bottom', // Pin point is at the bottom
        })
          .setLngLat([position.lng, position.lat])
          .addTo(map);

        markerRef.current = marker;

        if (shouldSetupHandlers) {
          setupMarkerDragHandlers(marker, map);
        }
      }
    },
    [draggableMarker, createMarkerElement, setupMarkerDragHandlers]
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasCenter = isValidLatLng(center);
    const initialCenter = hasCenter ? center! : defaultCenter;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: currentStyleUrl,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: hasCenter ? zoom : defaultZoomNoCenter,
      attributionControl: { compact: true },
      fadeDuration: 0,
      crossSourceCollisions: false,
    });

    // Add navigation controls
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    mapRef.current = map;

    const onLoad = () => {
      // Create marker if position exists
      if (markerPosition && isValidLatLng(markerPosition)) {
        createOrUpdateMarker(map, markerPosition, true);
        // Add radius circle
        updateRadiusCircle(map, markerPosition);
      }

      // Handle click to place marker
      if (clickToPlace) {
        map.on('click', (e) => {
          const newPos = { lat: e.lngLat.lat, lng: e.lngLat.lng };
          // Create or update marker
          createOrUpdateMarker(map, newPos, !markerRef.current);

          setMarkerPosition(newPos);
          onUserSetPosition?.(newPos);
          updateRadiusCircle(map, newPos);
        });
      }
    };

    if (map.isStyleLoaded()) onLoad();
    else map.on('load', onLoad);

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      map.remove();
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
      // Re-add marker and radius circle after style change
      if (markerPosition && isValidLatLng(markerPosition)) {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }

        createOrUpdateMarker(map, markerPosition, true);
        updateRadiusCircle(map, markerPosition);
      }
    };

    if (map.isStyleLoaded()) rewire();
    else map.once('load', rewire);
  }, [
    currentStyleUrl,
    markerPosition,
    draggableMarker,
    createOrUpdateMarker,
    updateRadiusCircle,
  ]);

  // Update map center when center prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasCenter = isValidLatLng(center);

    if (hasCenter) {
      // Only update if position actually changed
      const currentPos = markerRef.current?.getLngLat();
      const positionChanged =
        !currentPos ||
        Math.abs(currentPos.lat - center!.lat) > 0.000001 ||
        Math.abs(currentPos.lng - center!.lng) > 0.000001;

      if (positionChanged) {
        map.setCenter([center!.lng, center!.lat]);
        setMarkerPosition(center!);

        // Create or update marker
        createOrUpdateMarker(map, center!, !markerRef.current);

        // Update radius circle
        updateRadiusCircle(map, center!);
      }
    } else {
      map.setCenter([defaultCenter.lng, defaultCenter.lat]);
      map.setZoom(defaultZoomNoCenter);
      setMarkerPosition(null);

      // Remove marker
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      // Remove radius
      updateRadiusCircle(map, { lat: 0, lng: 0 });
    }
  }, [
    center?.lat,
    center?.lng,
    defaultCenter,
    defaultZoomNoCenter,
    draggableMarker,
    createOrUpdateMarker,
    updateRadiusCircle,
  ]);

  // Update zoom when zoom prop changes
  useEffect(() => {
    if (mapRef.current && typeof zoom === 'number') {
      mapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  // Update radius circle when radiusMeters or markerPosition changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markerPosition) return;

    updateRadiusCircle(map, markerPosition);
  }, [radiusMeters, markerPosition, updateRadiusCircle]);
  return (
    <>
      <style jsx global>{`
        /* Custom marker styling */
        .custom-marker {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-marker svg {
          transition: transform 0.2s ease;
        }

        /* Hide MapLibre attribution in preview */
        .maplibregl-ctrl-attrib {
          opacity: 0.6;
          font-size: 10px;
        }

        .maplibregl-ctrl-attrib:hover {
          opacity: 1;
        }
      `}</style>

      <div
        ref={containerRef}
        className={clsx(className, 'relative')}
        style={style}
        aria-label="Interactive map preview"
      />

      {/* Dragging indicator */}
      {isDragging && (
        <div className="absolute z-10 px-3 py-2 -translate-x-1/2 border border-indigo-500 rounded-lg shadow-lg top-4 left-1/2 bg-indigo-600/95 backdrop-blur-sm">
          <p className="flex items-center gap-2 text-xs font-medium text-white">
            <span className="animate-pulse">📍</span>
            Przeciągnij aby ustawić lokalizację
          </p>
        </div>
      )}

      {/* Click hint (when no marker and clickToPlace enabled) */}
      {clickToPlace && !markerPosition && !isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-3 border shadow-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-xl border-zinc-200 dark:border-zinc-700">
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <span>🗺️</span>
              Kliknij na mapie aby ustawić lokalizację
            </p>
            <p className="mt-1 text-xs text-center text-zinc-500 dark:text-zinc-400">
              (możesz przesuwać mapę normalnie)
            </p>
          </div>
        </div>
      )}

      {/* Hint when marker exists and is draggable */}
      {draggableMarker && markerPosition && !isDragging && (
        <div className="absolute z-10 px-3 py-2 -translate-x-1/2 border rounded-lg shadow-lg pointer-events-none top-4 left-1/2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-zinc-300 dark:border-zinc-700">
          <p className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span>💡</span>
            Przeciągnij pin aby zmienić lokalizację
          </p>
        </div>
      )}
    </>
  );
}
