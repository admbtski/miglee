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
  const radiusLayerIdRef = useRef<string | null>(null);

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
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#6366f1'; // Indigo-600
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.style.cursor = draggableMarker ? 'grab' : 'pointer';
    el.style.transition = 'background-color 0.2s ease';

    // Add hover effect
    el.addEventListener('mouseenter', () => {
      el.style.backgroundColor = '#4f46e5'; // Indigo-700
    });

    el.addEventListener('mouseleave', () => {
      // Check if currently being dragged by checking cursor
      if (el.style.cursor !== 'grabbing') {
        el.style.backgroundColor = '#6366f1'; // Indigo-600
      }
    });

    return el;
  }, [draggableMarker]);

  // Helper function to add/update radius circle
  const updateRadiusCircle = useCallback(
    (map: maplibregl.Map, position: LatLng) => {
      // Check if map style is loaded
      if (!map.isStyleLoaded()) {
        // Wait for style to load
        map.once('load', () => {
          updateRadiusCircle(map, position);
        });
        return;
      }

      if (!radiusMeters || radiusMeters <= 0) {
        // Remove radius layer if it exists
        if (radiusLayerIdRef.current) {
          if (map.getLayer('radius-circle-fill'))
            map.removeLayer('radius-circle-fill');
          if (map.getLayer('radius-circle-border'))
            map.removeLayer('radius-circle-border');
          if (map.getSource('radius-circle')) map.removeSource('radius-circle');
          radiusLayerIdRef.current = null;
        }
        return;
      }

      // Create GeoJSON for circle
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
        // Close the polygon by adding the first point again
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
        radiusMeters
      );

      // Add or update source
      if (map.getSource('radius-circle')) {
        (map.getSource('radius-circle') as maplibregl.GeoJSONSource).setData(
          circleGeoJSON
        );
      } else {
        map.addSource('radius-circle', {
          type: 'geojson',
          data: circleGeoJSON,
        });

        // Add fill layer
        map.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle',
          paint: {
            'fill-color': '#6366f1',
            'fill-opacity': 0.12,
          },
        });

        // Add border layer
        map.addLayer({
          id: 'radius-circle-border',
          type: 'line',
          source: 'radius-circle',
          paint: {
            'line-color': '#6366f1',
            'line-width': 2,
            'line-opacity': 0.6,
          },
        });

        radiusLayerIdRef.current = 'radius-circle';
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
        el.style.backgroundColor = '#7c3aed'; // Violet-600
      });

      marker.on('drag', () => {
        const lngLat = marker.getLngLat();
        const newPos = { lat: lngLat.lat, lng: lngLat.lng };
        setMarkerPosition(newPos);
        if (map.isStyleLoaded()) {
          updateRadiusCircle(map, newPos);
        }
      });

      marker.on('dragend', () => {
        setIsDragging(false);
        const lngLat = marker.getLngLat();
        const finalPos = { lat: lngLat.lat, lng: lngLat.lng };

        const el = marker.getElement();
        el.style.cursor = 'grab';
        el.style.backgroundColor = '#6366f1'; // Indigo-600

        setMarkerPosition(finalPos);
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
        // Create new marker
        const marker = new maplibregl.Marker({
          element: createMarkerElement(),
          draggable: draggableMarker,
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
          updateRadiusCircle(map, newPos);
          onUserSetPosition?.(newPos);
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
    radiusMeters,
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
      map.setCenter([center!.lng, center!.lat]);
      setMarkerPosition(center!);

      // Create or update marker
      createOrUpdateMarker(map, center!, !markerRef.current);

      // Only update radius circle if map is loaded
      if (map.isStyleLoaded()) {
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

  // Update radius circle when radiusMeters changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markerPosition) return;

    // Only update if map is loaded
    if (map.isStyleLoaded()) {
      updateRadiusCircle(map, markerPosition);
    }
  }, [radiusMeters, markerPosition]);

  return (
    <>
      <style jsx global>{`
        /* Custom marker styling */
        .custom-marker {
          display: flex;
          align-items: center;
          justify-content: center;
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
