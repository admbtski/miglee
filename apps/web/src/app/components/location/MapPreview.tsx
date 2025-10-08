// components/location/MapPreview.tsx
'use client';

import { loadGoogleMaps } from '@/libs/map/googleMaps';
import { useEffect, useRef } from 'react';

type LatLng = google.maps.LatLngLiteral;

export function MapPreview({
  center,
  zoom = 14,
  radiusMeters,
  className,
  style,
  mapId, // opcjonalnie: własny styl z Google Cloud (vector basemap)
}: {
  center: LatLng | null;
  zoom?: number;
  radiusMeters?: number | null;
  className?: string;
  style?: React.CSSProperties;
  mapId?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null
  );
  const circleRef = useRef<google.maps.Circle | null>(null);

  // init map once
  useEffect(() => {
    let destroyed = false;

    (async () => {
      // inicjalizacja tylko jeśli mamy gdzie renderować
      if (!containerRef.current || mapRef.current) return;

      const g = await loadGoogleMaps();

      // dociągnij advanced markers (ładniejsze markery)
      const { AdvancedMarkerElement } = (await g.maps.importLibrary(
        'marker'
      )) as google.maps.MarkerLibrary;

      mapRef.current = new g.maps.Map(containerRef.current, {
        // jeśli nie ma center jeszcze — ustaw PL jako domyślne
        center: center ?? { lat: 52.2319, lng: 21.0067 }, // Warszawa
        zoom,
        mapId: mapId ?? '392ec30859537d29c98ed7b1', // jeżeli masz skonfigurowany własny styl
        // UI clean
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        clickableIcons: true,
      });

      // utwórz marker
      markerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: center ?? { lat: 52.2319, lng: 21.0067 },
      });

      // opcjonalny okrąg (radius)
      if (typeof radiusMeters === 'number' && center) {
        circleRef.current = new g.maps.Circle({
          map: mapRef.current!,
          center: center,
          radius: radiusMeters,
          strokeOpacity: 0.5,
          strokeWeight: 1,
          fillOpacity: 0.1,
        });
      }

      if (center) {
        mapRef.current.setCenter(center);
        mapRef.current.setZoom(zoom);
      }
    })();

    return () => {
      destroyed = true;
      // Google Maps sprząta sam, ale odpinamy referencje
      circleRef.current?.setMap(null);
      markerRef.current = null;
      circleRef.current = null;
      mapRef.current = null;
    };
  }, []); // init only once

  // update center / marker / circle when props change
  useEffect(() => {
    (async () => {
      if (!mapRef.current) return; // jeszcze nie gotowe

      const g = (await loadGoogleMaps()).maps;

      if (center) {
        mapRef.current.setCenter(center);

        if (markerRef.current) {
          markerRef.current.position = center;
        }

        // circle create/update
        if (typeof radiusMeters === 'number') {
          if (!circleRef.current) {
            circleRef.current = new g.Circle({
              map: mapRef.current!,
              center,
              radius: radiusMeters,
              strokeOpacity: 0.5,
              strokeWeight: 1,
              fillOpacity: 0.1,
            });
          } else {
            circleRef.current.setCenter(center);
            circleRef.current.setRadius(radiusMeters);
            circleRef.current.setMap(mapRef.current!);
          }
        } else {
          // no radius -> remove if exists
          circleRef.current?.setMap(null);
          circleRef.current = null;
        }
      } else {
        // brak center -> ukryj marker i kółko
        if (markerRef.current) markerRef.current.map = null as any;
        circleRef.current?.setMap(null);
      }
    })();
  }, [center?.lat, center?.lng, radiusMeters]);

  // update zoom when prop changes
  useEffect(() => {
    if (mapRef.current && typeof zoom === 'number') {
      mapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: 260,
        borderRadius: 16,
        overflow: 'hidden',
        ...style,
      }}
      aria-label="Location map preview"
    />
  );
}
