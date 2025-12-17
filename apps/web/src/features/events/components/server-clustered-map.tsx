'use client';

import { useTheme } from '@/features/theme/provider/theme-provider';
import { useThrottled } from '@/hooks/use-throttled';
import { Level as GqlLevel } from '@/lib/api/__generated__/react-query-update';
import {
  useGetClustersQuery,
  useGetRegionEventsInfiniteQuery,
} from '@/features/maps';
import { getUpcomingAfterDefault } from '@/lib/constants/events';
import { MapboxOverlay } from '@deck.gl/mapbox';
import clsx from 'clsx';
import { ScatterplotLayer, TextLayer } from 'deck.gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegionPopup, PopupEvent } from './map-popup';

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/* ───────────────────────────── Types ───────────────────────────── */

export interface ServerClusteredMapProps {
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  fullHeight?: boolean;
  lang?: string;
  locale?: string;
  styleUrlLight?: string;
  styleUrlDark?: string;
  filters?: {
    q?: string;
    categorySlugs?: string[];
    tagSlugs?: string[];
    levels?: ('BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')[];
    kinds?: ('ONSITE' | 'ONLINE' | 'HYBRID')[];
    joinModes?: ('OPEN' | 'REQUEST' | 'INVITE_ONLY')[];
    verifiedOnly?: boolean;
    status?: 'ANY' | 'UPCOMING' | 'ONGOING' | 'PAST';
    startISO?: string;
    endISO?: string;
    city?: string;
    cityLat?: number;
    cityLng?: number;
    distanceKm?: number;
  };
  onEventClick?: (eventId: string) => void;
  hoveredEventId?: string | null;
  hoveredLat?: number | null;
  hoveredLng?: number | null;
  // NEW: Center map on specific location (e.g., from filters or user profile)
  centerOn?: { lat: number; lng: number } | null;
  // NEW: Location mode to determine map behavior
  locationMode?: 'EXPLICIT' | 'PROFILE_DEFAULT' | 'NONE';
}

type ClusterPoint = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  region: string;
};

/* ───────────────────────────── Utils ───────────────────────────── */

const ROUND4 = (n: number) => Math.round(n * 1e4) / 1e4;
const BOUNDS_EPS = 0.0008; // ~80m
const ZOOM_EPS = 0.01;
const THROTTLE_MS = 300;

function changedEnough(prev: number, next: number, eps: number) {
  return Math.abs(prev - next) > eps;
}

/* ───────────────────────────── deck.gl Layer Builder ───────────────────────────── */

function buildLayers(
  clusters: ClusterPoint[],
  opts: {
    hovered?: { lat?: number | null; lng?: number | null };
    pulse?: number; // 0..1 — faza animacji
    zoom?: number; // zoom level dla kalkulacji offset
    hoveredRegion?: string | null; // region po którym najechano myszką
  } = {}
) {
  const { hovered, pulse = 0, zoom = 10, hoveredRegion = null } = opts;

  // Znajdź najbliższy klaster do hovered (dla card hover)
  let highlighted: ClusterPoint | null = null;
  if (hovered?.lat != null && hovered?.lng != null && clusters.length) {
    let min = Infinity;
    for (const c of clusters) {
      const dx = c.latitude - hovered.lat!;
      const dy = c.longitude - hovered.lng!;
      const d2 = dx * dx + dy * dy;
      if (d2 < min) {
        min = d2;
        highlighted = c;
      }
    }
  }
  const highlightedRegion = highlighted?.region ?? null;

  // Animacja skoku: skok do góry i powrót
  // pulse: 0->1 w czasie 1200ms
  // 0-0.4: skok do góry (~1cm ekranowy)
  // 0.4-0.8: powrót na miejsce
  // 0.8-1.0: pauza
  const getJumpOffsetLatDegrees = (
    phase: number,
    zoomLevel: number
  ): number => {
    const pixelsToJump = 1035;
    const baseDegreesPerPixel = 0.0000054;
    const degreesPerPixel = baseDegreesPerPixel / Math.pow(2, zoomLevel - 10);
    const maxJumpDegrees = pixelsToJump * degreesPerPixel;

    if (phase < 0.4) {
      // Skok w górę - ease-out
      const t = phase / 0.4;
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      return eased * maxJumpDegrees;
    } else if (phase < 0.8) {
      // Powrót - ease-in
      const t = (phase - 0.4) / 0.4;
      const eased = Math.pow(t, 2); // ease-in quad (szybszy powrót)
      return (1 - eased) * maxJumpDegrees;
    }
    return 0; // pauza
  };

  const jumpOffsetLat = getJumpOffsetLatDegrees(pulse, zoom);
  const getBaseRadius = (d: ClusterPoint) => clamp(18, 18 + d.count * 0.08, 28);

  // Wszystkie normalne markery (bez highlighted i bez mouse-hovered)
  const normalPoints = new ScatterplotLayer<ClusterPoint>({
    id: 'clusters-normal',
    data: clusters.filter(
      (c) => c.region !== highlightedRegion && c.region !== hoveredRegion
    ),
    pickable: true,
    radiusUnits: 'pixels',
    lineWidthUnits: 'pixels',
    getPosition: (d) => [d.longitude, d.latitude, 0],
    getRadius: getBaseRadius,
    getFillColor: [99, 102, 241, 255], // Indigo-600 - pełna nieprzezroczystość
    getLineColor: [255, 255, 255, 255], // Biały border dla kontrastu
    getLineWidth: 3,
    stroked: true,
    filled: true,
  });

  // Marker po którym najechano myszką (nie skacze, ale ma większy border)
  const mouseHoveredPoint =
    hoveredRegion && hoveredRegion !== highlightedRegion
      ? new ScatterplotLayer<ClusterPoint>({
          id: 'clusters-mouse-hovered',
          data: clusters.filter((c) => c.region === hoveredRegion),
          pickable: true,
          radiusUnits: 'pixels',
          lineWidthUnits: 'pixels',
          getPosition: (d) => [d.longitude, d.latitude, 0],
          getRadius: (d) => getBaseRadius(d) * 1.15,
          getFillColor: [79, 70, 229, 255], // Indigo-700 - ciemniejszy przy hover
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 4,
          stroked: true,
          filled: true,
        })
      : null;

  // Skaczący marker (highlighted) - przesunięty w górę na osi Y (latitude)
  const jumpingPoint = highlightedRegion
    ? new ScatterplotLayer<ClusterPoint>({
        id: 'clusters-jumping',
        data: clusters.filter((c) => c.region === highlightedRegion),
        pickable: true,
        radiusUnits: 'pixels',
        lineWidthUnits: 'pixels',
        getPosition: (d) => [d.longitude, d.latitude + jumpOffsetLat, 0],
        getRadius: (d) => getBaseRadius(d) * 1.2,
        getFillColor: [124, 58, 237, 255], // Violet-600 - wyróżniony kolor
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 4,
        stroked: true,
        filled: true,
        updateTriggers: {
          getPosition: pulse,
        },
      })
    : null;

  // Pulsujący ring - podąża za skokiem
  const pulseRing = highlightedRegion
    ? new ScatterplotLayer<ClusterPoint>({
        id: 'clusters-pulse',
        data: clusters.filter((c) => c.region === highlightedRegion),
        pickable: false,
        radiusUnits: 'pixels',
        lineWidthUnits: 'pixels',
        billboard: true,
        stroked: true,
        filled: false,
        getPosition: (d) => [d.longitude, d.latitude + jumpOffsetLat, 0],
        getRadius: (d) => {
          const bRadius = getBaseRadius(d);
          const pulseScale = 1 + 0.3 * Math.sin(pulse * Math.PI * 2);
          return (bRadius * 1.2 + 6) * pulseScale;
        },
        getLineColor: [
          167,
          139,
          250,
          Math.round(200 - 150 * Math.abs(Math.sin(pulse * Math.PI * 2))),
        ],
        getLineWidth: 2.5,
        updateTriggers: {
          getPosition: pulse,
          getRadius: pulse,
          getLineColor: pulse,
        },
      })
    : null;

  // Labels dla normalnych (bez highlighted i bez mouse-hovered)
  const normalLabels = new TextLayer<ClusterPoint>({
    id: 'clusters-labels-normal',
    data: clusters.filter(
      (c) => c.region !== highlightedRegion && c.region !== hoveredRegion
    ),
    getPosition: (d) => [d.longitude, d.latitude, 0],
    getText: (d) => String(d.count),
    getSize: 13,
    sizeUnits: 'pixels',
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    getColor: [255, 255, 255, 255],
    fontWeight: 600,
    background: false,
    getBackgroundColor: [0, 0, 0, 0],
    backgroundPadding: [0, 0],
  });

  // Label dla mouse-hovered markera
  const mouseHoveredLabel =
    hoveredRegion && hoveredRegion !== highlightedRegion
      ? new TextLayer<ClusterPoint>({
          id: 'clusters-labels-mouse-hovered',
          data: clusters.filter((c) => c.region === hoveredRegion),
          getPosition: (d) => [d.longitude, d.latitude, 0],
          getText: (d) => String(d.count),
          getSize: 14,
          sizeUnits: 'pixels',
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'center',
          getColor: [255, 255, 255, 255],
          fontWeight: 700,
          background: false,
          getBackgroundColor: [0, 0, 0, 0],
          backgroundPadding: [0, 0],
        })
      : null;

  // Label dla skaczącego - podąża za skokiem
  const jumpingLabel = highlightedRegion
    ? new TextLayer<ClusterPoint>({
        id: 'clusters-labels-jumping',
        data: clusters.filter((c) => c.region === highlightedRegion),
        getPosition: (d) => [d.longitude, d.latitude + jumpOffsetLat, 0],
        getText: (d) => String(d.count),
        getSize: 15,
        sizeUnits: 'pixels',
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        getColor: [255, 255, 255, 255],
        fontWeight: 700,
        background: false,
        getBackgroundColor: [0, 0, 0, 0],
        backgroundPadding: [0, 0],
        updateTriggers: {
          getPosition: pulse,
        },
      })
    : null;

  const layers = [normalPoints, normalLabels];
  if (mouseHoveredPoint) layers.push(mouseHoveredPoint);
  if (mouseHoveredLabel) layers.push(mouseHoveredLabel);
  if (jumpingPoint) layers.push(jumpingPoint);
  if (pulseRing) layers.push(pulseRing);
  if (jumpingLabel) layers.push(jumpingLabel);

  return layers;
}

/* ───────────────────────────── Map Component ───────────────────────────── */

function ServerClusteredMapComponent({
  defaultCenter = { lat: 52.2319, lng: 21.0067 },
  defaultZoom = 10,
  fullHeight = false,
  styleUrlLight = 'https://tiles.openfreemap.org/styles/liberty',
  styleUrlDark = 'https://tiles.openfreemap.org/styles/dark',
  filters,
  onEventClick,
  hoveredLat,
  hoveredLng,
  centerOn,
  locationMode = 'NONE',
  locale = 'en',
}: ServerClusteredMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Get QueryClient instance to pass to popup
  const queryClient = useQueryClient();

  // React root dla popupu – tworzymy JEDEN raz
  const popupRootRef = useRef<Root | null>(null);
  const popupContainerRef = useRef<HTMLDivElement | null>(null);

  // deck.gl overlay (oddzielny canvas — brak z-fightingu)
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const lastLayersRef = useRef<any[]>([]);

  // bounds & zoom
  const [mapBounds, setMapBounds] = useState<{
    swLat: number;
    swLon: number;
    neLat: number;
    neLon: number;
  } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(defaultZoom);

  // selected region
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // hovered region (mouse hover na markerze)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Tailwind theme
  const { resolvedTheme } = useTheme();
  const currentStyleUrl =
    resolvedTheme === 'dark' ? styleUrlDark : styleUrlLight;

  // Debug theme changes
  // Throttler do bounds/zoom
  const throttledBoundsUpdate = useThrottled(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const next = {
      swLat: ROUND4(b.getSouth()),
      swLon: ROUND4(b.getWest()),
      neLat: ROUND4(b.getNorth()),
      neLon: ROUND4(b.getEast()),
    };

    setMapZoom((prev) => {
      const z = map.getZoom();
      return changedEnough(prev, z, ZOOM_EPS) ? z : prev;
    });

    setMapBounds((prev) => {
      if (
        !prev ||
        changedEnough(prev.swLat, next.swLat, BOUNDS_EPS) ||
        changedEnough(prev.swLon, next.swLon, BOUNDS_EPS) ||
        changedEnough(prev.neLat, next.neLat, BOUNDS_EPS) ||
        changedEnough(prev.neLon, next.neLon, BOUNDS_EPS)
      ) {
        return next;
      }
      return prev;
    });
  }, THROTTLE_MS);

  // Store default startISO in ref to prevent infinite loop
  // getUpcomingAfterDefault() creates new Date each time, so we need stable reference
  const defaultStartISORef = useRef<string>(getUpcomingAfterDefault());

  // When status is not ANY, backend handles time filtering based on status
  // Only use startISO/endISO when status is ANY or not set
  const shouldUseTimeFilters = !filters?.status || filters?.status === 'ANY';

  // Stringify filters for stable dependency comparison (arrays cause re-renders)
  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        q: filters?.q,
        categorySlugs: filters?.categorySlugs,
        tagSlugs: filters?.tagSlugs,
        levels: filters?.levels,
        kinds: filters?.kinds,
        joinModes: filters?.joinModes,
        verifiedOnly: filters?.verifiedOnly,
        status: filters?.status,
        startISO: filters?.startISO,
        endISO: filters?.endISO,
        city: filters?.city,
        cityLat: filters?.cityLat,
        cityLng: filters?.cityLng,
        distanceKm: filters?.distanceKm,
        shouldUseTimeFilters,
      }),
    [
      filters?.q,
      filters?.categorySlugs,
      filters?.tagSlugs,
      filters?.levels,
      filters?.kinds,
      filters?.joinModes,
      filters?.verifiedOnly,
      filters?.status,
      filters?.startISO,
      filters?.endISO,
      filters?.city,
      filters?.cityLat,
      filters?.cityLng,
      filters?.distanceKm,
      shouldUseTimeFilters,
    ]
  );

  // Memoize filters object to prevent infinite loop
  const memoizedFilters = useMemo(
    () => ({
      q: filters?.q,
      categorySlugs: filters?.categorySlugs,
      tagSlugs: filters?.tagSlugs,
      levels: filters?.levels as any,
      kinds: filters?.kinds as any,
      joinModes: filters?.joinModes as any,
      verifiedOnly: filters?.verifiedOnly,
      status: filters?.status as any,
      // Only pass time filters when status is ANY or not set
      // When status is UPCOMING/ONGOING/PAST, backend handles time logic
      startISO: shouldUseTimeFilters
        ? (filters?.startISO ?? defaultStartISORef.current)
        : undefined,
      endISO: shouldUseTimeFilters ? filters?.endISO : undefined,
      city: filters?.city,
      cityLat: filters?.cityLat,
      cityLng: filters?.cityLng,
      distanceKm: filters?.distanceKm,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey]
  );

  // Queries (mniej refetchy)
  const { data: clustersData, isLoading: clustersLoading } =
    useGetClustersQuery(
      {
        bbox: mapBounds || {
          swLat: defaultCenter.lat - 0.1,
          swLon: defaultCenter.lng - 0.1,
          neLat: defaultCenter.lat + 0.1,
          neLon: defaultCenter.lng + 0.1,
        },
        zoom: Math.round(mapZoom),
        filters: memoizedFilters,
      },
      {
        enabled: !!mapBounds,
        staleTime: 10_000,
        gcTime: 60_000,
      }
    );

  const {
    data: regionEventsData,
    isLoading: regionEventsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetRegionEventsInfiniteQuery(
    {
      region: selectedRegion || '',
      perPage: 20,
      filters: memoizedFilters,
    },
    {
      enabled: !!selectedRegion,
      staleTime: 15_000,
      gcTime: 60_000,
    }
  );

  // Poprzednie dane klastrów (zatrzymaj podczas ładowania)
  const prevClustersRef = useRef<ClusterPoint[]>([]);

  // Płaskie dane do warstw (stabilny input do memo)
  const clusters: ClusterPoint[] = useMemo(() => {
    const newClusters = (clustersData?.clusters ?? []) as ClusterPoint[];

    // Podczas ładowania zachowaj poprzednie dane - NO FLICKER!
    if (clustersLoading && prevClustersRef.current.length > 0) {
      return prevClustersRef.current;
    }

    // Zapisz nowe dane jako poprzednie
    if (newClusters.length > 0) {
      prevClustersRef.current = newClusters;
    }

    return newClusters;
  }, [clustersData?.clusters, clustersLoading]);

  /* ───────── Pulse animation state (0..1) ───────── */
  const [pulseTick, setPulseTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const PULSE_PERIOD_MS = 1200; // okres „oddechu"

  // Zoom tracking dla jump animation
  const [currentZoom, setCurrentZoom] = useState(10);

  useEffect(() => {
    const wantsPulse = hoveredLat != null && hoveredLng != null;
    if (!wantsPulse) {
      // zatrzymaj i zresetuj
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      setPulseTick(0);
      return;
    }

    const loop = (t: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      const elapsed = t - lastTimeRef.current;
      // przelicz na 0..1
      const phase = (elapsed % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;
      setPulseTick(phase);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [hoveredLat, hoveredLng]);

  // Warstwy — memo (zależne także od pulseTick, zoom i hoveredRegion)
  const layers = useMemo(() => {
    return buildLayers(clusters, {
      hovered: { lat: hoveredLat ?? null, lng: hoveredLng ?? null },
      pulse: pulseTick,
      zoom: currentZoom,
      hoveredRegion,
    });
  }, [clusters, hoveredLat, hoveredLng, pulseTick, currentZoom, hoveredRegion]);

  // Inicjalizacja mapy
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Use centerOn if provided, otherwise use defaultCenter
    const initialCenter = centerOn || defaultCenter;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: currentStyleUrl,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: centerOn ? 8 : defaultZoom, // Zoom in more when centering on a specific location
      attributionControl: { compact: true },
      fadeDuration: 0,
      crossSourceCollisions: false,
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
      maxWidth: '460px',
      className: 'map-popup-high-z',
    });

    const onLoad = () => {
      throttledBoundsUpdate();
      map.on('moveend', throttledBoundsUpdate);

      // Update zoom state dla jump animation
      const updateZoom = () => {
        setCurrentZoom(map.getZoom());
      };
      updateZoom(); // initial
      map.on('zoom', updateZoom);

      // deck.gl overlay – osobny canvas (no flicker)
      const overlay = new MapboxOverlay({ interleaved: false });
      map.addControl(overlay as any);
      deckOverlayRef.current = overlay;

      if (layers?.length) {
        lastLayersRef.current = layers;
        overlay.setProps({ layers });
      }
    };

    if (map.isStyleLoaded()) onLoad();
    else map.on('load', onLoad);

    // kontener + root dla popupu
    popupContainerRef.current = document.createElement('div');
    popupRootRef.current = createRoot(popupContainerRef.current);

    return () => {
      // Defer unmount to avoid React 18 race condition warning
      // React cannot finish unmounting during render, so we queue it
      if (popupRootRef.current) {
        const rootToUnmount = popupRootRef.current;
        queueMicrotask(() => {
          rootToUnmount.unmount();
        });
        popupRootRef.current = null;
      }
      popupContainerRef.current = null;

      popupRef.current?.remove();
      popupRef.current = null;

      if (deckOverlayRef.current) {
        deckOverlayRef.current.finalize();
        deckOverlayRef.current = null;
      }

      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zmiana stylu (dark/light)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.off('moveend', throttledBoundsUpdate);
    map.setStyle(currentStyleUrl);

    const rewire = () => {
      throttledBoundsUpdate();
      map.on('moveend', throttledBoundsUpdate);
      if (deckOverlayRef.current && lastLayersRef.current.length) {
        deckOverlayRef.current.setProps({ layers: lastLayersRef.current });
      }
    };
    if (map.isStyleLoaded()) rewire();
    else map.once('load', rewire);
  }, [currentStyleUrl, throttledBoundsUpdate]);

  // Render/mount warstw tylko gdy layers się realnie zmieniają
  useEffect(() => {
    if (!deckOverlayRef.current || !layers?.length) return;
    lastLayersRef.current = layers;
    deckOverlayRef.current.setProps({
      layers,
      onClick: (info: any) => {
        const obj = info.object as ClusterPoint | null;
        if (!obj) return;
        setSelectedRegion(obj.region);
      },
      onHover: (info: any) => {
        const obj = info.object as ClusterPoint | null;

        // Ustaw hoveredRegion
        if (obj) {
          setHoveredRegion(obj.region);
        } else {
          setHoveredRegion(null);
        }

        // Zmień kursor
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = obj ? 'pointer' : '';
        }
      },
    });
  }, [layers]);

  /* ───────── Center map on location change ───────── */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !centerOn) return;

    // Fly to the new location with smooth animation
    map.flyTo({
      center: [centerOn.lng, centerOn.lat],
      zoom: 12,
      duration: 1500, // 1.5s animation
      essential: true, // This animation is considered essential with respect to prefers-reduced-motion
    });
  }, [centerOn]);

  /* ───────── Popup React ───────── */

  useEffect(() => {
    if (!selectedRegion) {
      // Zamknij popup gdy region nie jest wybrany
      if (popupRef.current) {
        popupRef.current.remove();
      }
      return;
    }

    const map = mapRef.current,
      popup = popupRef.current;
    if (!map || !popup) return;

    // Jeśli ładujemy pierwszą stronę, pokaż skeleton
    if (regionEventsLoading && !(regionEventsData as any)?.pages?.length) {
      // Znajdź klaster dla wybranego regionu, żeby pokazać popup w dobrym miejscu
      const cluster = clusters.find((c) => c.region === selectedRegion);
      if (cluster && popupRootRef.current && popupContainerRef.current) {
        popupRootRef.current.render(
          <QueryClientProvider client={queryClient}>
            <RegionPopup
              events={[]}
              onEventClick={() => {}}
              isLoading={true}
              locale={locale}
            />
          </QueryClientProvider>
        );

        // Tylko otwórz popup jeśli nie jest już otwarty
        if (!popup.isOpen()) {
          requestAnimationFrame(() => {
            popup
              .setLngLat([cluster.longitude, cluster.latitude])
              .setDOMContent(popupContainerRef.current!)
              .addTo(map);

            // Dodaj listener zamknięcia
            popup.once('close', () => setSelectedRegion(null));
          });
        }
      }
      return;
    }

    // Dane załadowane - flatten all pages
    const pages = (regionEventsData as any)?.pages;
    if (!pages) return;

    const allEvents = pages.flatMap(
      (page: any) => page.regionEvents?.data || []
    );

    const events: PopupEvent[] = allEvents.map((event: any) => ({
      id: event.id,
      title: event.title ?? '',
      startAt: event.startAt,
      endAt: event.endAt,
      address: event.address,
      radiusKm: event.radiusKm,
      joinedCount: event.joinedCount,
      min: event.min,
      max: event.max,
      owner: event.owner,
      lat: event.lat,
      lng: event.lng,
      isCanceled: event.isCanceled ?? false,
      isDeleted: event.isDeleted ?? false,
      isFull: event.isFull ?? false,
      isOngoing: event.isOngoing ?? false,
      hasStarted: event.hasStarted ?? false,
      withinLock: event.withinLock ?? false,
      lockReason: event.lockReason,
      canJoin: event.canJoin ?? false,
      joinOpensMinutesBeforeStart: event.joinOpensMinutesBeforeStart,
      joinCutoffMinutesBeforeStart: event.joinCutoffMinutesBeforeStart,
      allowJoinLate: event.allowJoinLate ?? false,
      lateJoinCutoffMinutesAfterStart: event.lateJoinCutoffMinutesAfterStart,
      joinManuallyClosed: event.joinManuallyClosed ?? false,
      levels: (event.levels as GqlLevel[]) ?? null,
      plan: null, // Will be determined by boostedAt
      boostedAt: event.boostedAt,
      // Extract card appearance from EventAppearance.config
      appearance: event.appearance?.config
        ? {
            card: (event.appearance.config as any)?.card ?? null,
          }
        : null,
      meetingKind: event.meetingKind,
      isHybrid:
        event.meetingKind === 'HYBRID' ||
        (event.meetingKind &&
          (event.meetingKind as string[]).includes('HYBRID')),
      isOnline:
        event.meetingKind === 'ONLINE' ||
        (event.meetingKind &&
          (event.meetingKind as string[]).includes('ONLINE')),
      isOnsite:
        event.meetingKind === 'ONSITE' ||
        (event.meetingKind &&
          (event.meetingKind as string[]).includes('ONSITE')),
      addressVisibility: event.addressVisibility,
      categorySlugs:
        event.categories?.map((cat: any) => cat.slug).slice(0, 3) ?? [],
      coverKey: event.coverKey,
      coverBlurhash: event.coverBlurhash,
    }));

    // Don't close popup if no data - might be a network error
    if (!events.length) {
      return;
    }

    const valid = events.filter((i) => i.lat != null && i.lng != null);
    if (!valid.length) {
      return;
    }

    const avgLat = valid.reduce((s, i) => s + (i.lat || 0), 0) / valid.length;
    const avgLng = valid.reduce((s, i) => s + (i.lng || 0), 0) / valid.length;

    if (popupRootRef.current && popupContainerRef.current) {
      popupRootRef.current.render(
        <QueryClientProvider client={queryClient}>
          <RegionPopup
            events={events}
            isLoading={false}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => {
              // Only fetch next page if we still have a selected region
              if (selectedRegion) {
                fetchNextPage();
              }
            }}
            onEventClick={(id) => {
              onEventClick?.(id);
              popup.remove();
              setSelectedRegion(null);
            }}
            locale={locale}
          />
        </QueryClientProvider>
      );

      // Tylko dodaj popup jeśli nie jest już otwarty
      if (!popup.isOpen()) {
        requestAnimationFrame(() => {
          popup
            .setLngLat([avgLng, avgLat])
            .setDOMContent(popupContainerRef.current!)
            .addTo(map);

          // Dodaj listener zamknięcia
          popup.once('close', () => setSelectedRegion(null));
        });
      }
    }
  }, [
    selectedRegion,
    regionEventsData,
    regionEventsLoading,
    onEventClick,
    clusters,
  ]);

  /* ───────── Render ───────── */

  return (
    <div className="relative h-full">
      <style jsx global>{`
        /* Popup z-index fix - musi być wyżej niż deck.gl canvas */
        .maplibregl-popup.map-popup-high-z {
          z-index: 1000 !important;
        }

        /* Deck.gl canvas - niższy z-index */
        .deck-canvas {
          z-index: 1 !important;
        }

        /* MapLibre canvas - bazowy poziom */
        .maplibregl-canvas {
          z-index: 0 !important;
        }
      `}</style>

      <div
        ref={containerRef}
        className={clsx(
          'rounded-2xl overflow-hidden',
          fullHeight ? 'h-full' : 'h-[520px]',
          'bg-white dark:bg-zinc-900'
        )}
        aria-label="Server-clustered events map"
        style={{ backfaceVisibility: 'hidden' }}
      />

      {/* Location mode indicator for PROFILE_DEFAULT */}
      {locationMode === 'PROFILE_DEFAULT' && (
        <div className="absolute top-4 left-4 z-10 bg-blue-50/95 dark:bg-blue-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-blue-200 dark:border-blue-700">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
            📍 Pokazuję mapę wokół Twojej lokalizacji
          </p>
        </div>
      )}

      {clustersLoading && (
        <div className="absolute top-4 right-4 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            🔄 Ładowanie…
          </p>
        </div>
      )}
    </div>
  );
}

// Export as default for lazy loading
export default ServerClusteredMapComponent;

// Named export for backward compatibility
export { ServerClusteredMapComponent as ServerClusteredMap };
