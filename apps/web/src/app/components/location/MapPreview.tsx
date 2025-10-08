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
  mapId,
  draggableMarker = true,
  clickToPlace = true,
  onUserSetPosition, // <- nowość
}: {
  center: LatLng | null;
  zoom?: number;
  radiusMeters?: number | null;
  className?: string;
  style?: React.CSSProperties;
  mapId?: string;
  draggableMarker?: boolean;
  clickToPlace?: boolean;
  onUserSetPosition?: (pos: LatLng) => void; // wywoływane po dragend/kliknięciu
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null
  );
  const circleRef = useRef<google.maps.Circle | null>(null);

  // init once
  useEffect(() => {
    let unsubMarker: google.maps.MapsEventListener | null = null;
    let unsubMapClick: google.maps.MapsEventListener | null = null;

    (async () => {
      if (!containerRef.current || mapRef.current) return;

      const g = await loadGoogleMaps();
      const { AdvancedMarkerElement } = (await g.maps.importLibrary(
        'marker'
      )) as google.maps.MarkerLibrary;

      mapRef.current = new g.maps.Map(containerRef.current, {
        center: center ?? { lat: 52.2319, lng: 21.0067 },
        zoom: center ? zoom : 6,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        mapId: mapId ?? '392ec30859537d29c98ed7b1', // jeżeli masz
      });

      markerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: center ?? { lat: 52.2319, lng: 21.0067 },
      });

      // drag
      markerRef.current.gmpDraggable = !!draggableMarker;
      if (draggableMarker) {
        unsubMarker = markerRef.current.addListener('dragend', (e: any) => {
          const pos =
            e?.latLng?.toJSON?.() ??
            (markerRef.current?.position as unknown as LatLng);
          if (pos && onUserSetPosition) onUserSetPosition(pos);
        });
      }

      // click on map to move marker
      if (clickToPlace) {
        unsubMapClick = mapRef.current.addListener('click', (e: any) => {
          const pos: LatLng | null = e?.latLng?.toJSON?.() ?? null;
          if (!pos) return;
          if (markerRef.current) markerRef.current.position = pos;
          circleRef.current?.setCenter(pos);
          if (onUserSetPosition) onUserSetPosition(pos);
        });
      }

      if (typeof radiusMeters === 'number' && center) {
        circleRef.current = new g.maps.Circle({
          map: mapRef.current,
          center,
          radius: radiusMeters,
          strokeOpacity: 0.5,
          strokeWeight: 1,
          fillOpacity: 0.1,
        });
      }
    })();

    return () => {
      unsubMarker?.remove();
      unsubMapClick?.remove();
      circleRef.current?.setMap(null);
      markerRef.current = null;
      circleRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // updates
  useEffect(() => {
    (async () => {
      if (!mapRef.current) return;
      const g = (await loadGoogleMaps()).maps;

      if (center) {
        mapRef.current.setCenter(center);
        if (markerRef.current) markerRef.current.position = center;

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
          circleRef.current?.setMap(null);
          circleRef.current = null;
        }
      } else {
        if (markerRef.current) markerRef.current.map = null as any;
        circleRef.current?.setMap(null);
      }
    })();
  }, [center?.lat, center?.lng, radiusMeters]);

  useEffect(() => {
    if (mapRef.current && typeof zoom === 'number') {
      mapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: 260, borderRadius: 16, overflow: 'hidden', ...style }}
      aria-label="Location map preview"
    />
  );
}
