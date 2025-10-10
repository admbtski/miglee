'use client';

import { importMarker, loadGoogleMaps } from '@/libs/map/googleMaps';
import { useEffect, useRef } from 'react';

type LatLng = google.maps.LatLngLiteral;

function isValidLatLng(v: LatLng | null | undefined): v is LatLng {
  return (
    !!v &&
    Number.isFinite(v.lat) &&
    Number.isFinite(v.lng) &&
    !(v.lat === 0 && v.lng === 0)
  );
}

/**
 * Minimal, interactive map preview with AdvancedMarker:
 * - Marker drags/click-to-place emit position via onUserSetPosition
 * - Radius circle optional
 * - Ignores {0,0} as an "unset" center; uses defaultCenter instead
 */
export function MapPreview({
  center,
  zoom = 14,
  radiusMeters,
  className,
  style,
  mapId,
  draggableMarker = true,
  clickToPlace = true,
  onUserSetPosition,
  defaultCenter = { lat: 52.2319, lng: 21.0067 }, // Warsaw fallback
  defaultZoomNoCenter = 6,
}: {
  center: LatLng | null;
  zoom?: number;
  /** allow undefined for exactOptionalPropertyTypes projects */
  radiusMeters?: number | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  mapId?: string; // recommended when using AdvancedMarker
  draggableMarker?: boolean;
  clickToPlace?: boolean;
  onUserSetPosition?: (pos: LatLng) => void;
  /** used when center is null/invalid (e.g. {0,0}) */
  defaultCenter?: LatLng;
  /** zoom to use when there's no valid center */
  defaultZoomNoCenter?: number;
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
      const { AdvancedMarkerElement } = await importMarker();

      const hasCenter = isValidLatLng(center);
      const initCenter = hasCenter ? center! : defaultCenter;

      mapRef.current = new g.maps.Map(containerRef.current, {
        center: initCenter,
        zoom: hasCenter ? zoom : defaultZoomNoCenter,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        mapId: mapId ?? '392ec30859537d29c98ed7b1',
      });

      // custom marker content
      const markerDiv = document.createElement('div');
      markerDiv.innerHTML = `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid white;
          font-size: 16px;
          line-height: 1;
        ">
          📍
        </div>
      `;

      markerRef.current = new AdvancedMarkerElement({
        map: hasCenter ? mapRef.current : null, // attach only if valid
        content: markerDiv,
        position: initCenter,
        gmpDraggable: draggableMarker,
      });

      // Drag → notify
      markerRef.current.gmpDraggable = !!draggableMarker;
      if (draggableMarker) {
        unsubMarker = markerRef.current.addListener(
          'dragend',
          (e: google.maps.MapMouseEvent) => {
            const ll = e?.latLng;
            if (!ll) return;
            const pos = { lat: ll.lat(), lng: ll.lng() };
            circleRef.current?.setCenter(pos);
            onUserSetPosition?.(pos);
          }
        );
      }

      // Click → move marker + notify
      if (clickToPlace) {
        unsubMapClick = mapRef.current.addListener(
          'click',
          (e: google.maps.MapMouseEvent) => {
            const ll = e?.latLng;
            if (!ll) return;
            const pos: LatLng = { lat: ll.lat(), lng: ll.lng() };
            if (markerRef.current) {
              markerRef.current.position = pos;
              if (!markerRef.current.map)
                markerRef.current.map = mapRef.current;
            }
            circleRef.current?.setCenter(pos);
            onUserSetPosition?.(pos);
          }
        );
      }

      // Optional radius
      if (typeof radiusMeters === 'number' && hasCenter) {
        circleRef.current = new g.maps.Circle({
          map: mapRef.current,
          center: center!,
          radius: radiusMeters,
          strokeColor: '#6366f1',
          strokeOpacity: 0.6,
          strokeWeight: 1.5,
          fillColor: '#6366f1',
          fillOpacity: 0.12,
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

  // respond to center / radius changes
  useEffect(() => {
    (async () => {
      if (!mapRef.current) return;
      const g = (await loadGoogleMaps()).maps;

      const hasCenter = isValidLatLng(center);

      if (hasCenter) {
        mapRef.current.setCenter(center!);

        if (markerRef.current) {
          markerRef.current.position = center!;
          if (!markerRef.current.map) markerRef.current.map = mapRef.current;
        }

        if (typeof radiusMeters === 'number') {
          if (!circleRef.current) {
            circleRef.current = new g.Circle({
              map: mapRef.current!,
              center: center!,
              radius: radiusMeters,
              strokeColor: '#6366f1',
              strokeOpacity: 0.6,
              strokeWeight: 1.5,
              fillColor: '#6366f1',
              fillOpacity: 0.12,
            });
          } else {
            circleRef.current.setCenter(center!);
            circleRef.current.setRadius(radiusMeters);
            circleRef.current.setMap(mapRef.current!);
          }
        } else {
          circleRef.current?.setMap(null);
          circleRef.current = null;
        }
      } else {
        // no valid center → fallback view and hide marker/circle
        mapRef.current.setCenter(defaultCenter);
        mapRef.current.setZoom(defaultZoomNoCenter);
        if (markerRef.current) markerRef.current.map = null as any;
        circleRef.current?.setMap(null);
      }
    })();
  }, [
    center?.lat,
    center?.lng,
    radiusMeters,
    defaultCenter.lat,
    defaultCenter.lng,
    defaultZoomNoCenter,
  ]);

  // respond to zoom changes
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
