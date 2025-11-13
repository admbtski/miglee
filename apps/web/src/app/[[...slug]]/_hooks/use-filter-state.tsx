/**
 * Custom hook for managing filter modal state
 */

import { useState, useCallback } from 'react';
import {
  IntentStatus,
  Level,
  MeetingKind,
} from '@/lib/api/__generated__/react-query-update';
import { INTENTS_CONFIG } from '@/lib/constants/intents';
import type { SearchMeta } from './use-search-meta';

const DEFAULT_DISTANCE = INTENTS_CONFIG.DEFAULT_DISTANCE_KM;

export interface FilterState {
  q: string;
  city: string | null;
  cityLat: number | null;
  cityLng: number | null;
  cityPlaceId: string | null;
  distanceKm: number;
  startISO: string | null;
  endISO: string | null;
  status: IntentStatus;
  kinds: MeetingKind[];
  levels: Level[];
  verifiedOnly: boolean;
  keywords: string[];
  categories: SearchMeta['categories'];
  tags: SearchMeta['tags'];
}

export interface UseFilterStateProps {
  initialQ: string;
  initialCity: string | null;
  initialCityLat?: number | null;
  initialCityLng?: number | null;
  initialCityPlaceId?: string | null;
  initialDistanceKm: number;
  initialStartISO?: string | null;
  initialEndISO?: string | null;
  initialStatus?: IntentStatus;
  initialKinds?: MeetingKind[];
  initialLevels?: Level[];
  initialVerifiedOnly?: boolean;
  initialTags?: string[];
  initialKeywords?: string[];
  initialCategories?: string[];
}

export function useFilterState(props: UseFilterStateProps) {
  const {
    initialQ,
    initialCity,
    initialCityLat = null,
    initialCityLng = null,
    initialCityPlaceId = null,
    initialDistanceKm,
    initialStartISO = null,
    initialEndISO = null,
    initialStatus = IntentStatus.Any,
    initialKinds = [],
    initialLevels = [],
    initialVerifiedOnly = false,
    initialKeywords = [],
  } = props;

  // State
  const [q, setQ] = useState<string>(initialQ ?? '');
  const [city, setCity] = useState<string | null>(initialCity ?? null);
  const [cityLat, setCityLat] = useState<number | null>(initialCityLat);
  const [cityLng, setCityLng] = useState<number | null>(initialCityLng);
  const [cityPlaceId, setCityPlaceId] = useState<string | null>(
    initialCityPlaceId
  );
  const [distanceKm, setDistanceKm] = useState<number>(
    initialDistanceKm ?? DEFAULT_DISTANCE
  );
  const [startISO, setStartISO] = useState<string | null>(initialStartISO);
  const [endISO, setEndISO] = useState<string | null>(initialEndISO);
  const [status, setStatus] = useState<IntentStatus>(initialStatus);
  const [kinds, setKinds] = useState<MeetingKind[]>(initialKinds);
  const [levels, setLevels] = useState<Level[]>(initialLevels);
  const [verifiedOnly, setVerifiedOnly] =
    useState<boolean>(initialVerifiedOnly);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [categories, setCategories] = useState<SearchMeta['categories']>([]);
  const [tags, setTags] = useState<SearchMeta['tags']>([]);

  // Clear all filters
  const clearAll = useCallback(() => {
    setQ('');
    setCity(null);
    setCityLat(null);
    setCityLng(null);
    setCityPlaceId(null);
    setDistanceKm(DEFAULT_DISTANCE);
    setStartISO(null);
    setEndISO(null);
    setStatus(IntentStatus.Any);
    setKinds([]);
    setLevels([]);
    setVerifiedOnly(false);
    setTags([]);
    setKeywords([]);
    setCategories([]);
  }, []);

  // Get current state
  const getCurrentState = useCallback((): FilterState => {
    return {
      q,
      city,
      cityLat,
      cityLng,
      cityPlaceId,
      distanceKm,
      startISO,
      endISO,
      status,
      kinds,
      levels,
      verifiedOnly,
      keywords,
      categories,
      tags,
    };
  }, [
    q,
    city,
    cityLat,
    cityLng,
    cityPlaceId,
    distanceKm,
    startISO,
    endISO,
    status,
    kinds,
    levels,
    verifiedOnly,
    keywords,
    categories,
    tags,
  ]);

  return {
    // State
    q,
    city,
    cityLat,
    cityLng,
    cityPlaceId,
    distanceKm,
    startISO,
    endISO,
    status,
    kinds,
    levels,
    verifiedOnly,
    keywords,
    categories,
    tags,
    // Setters
    setQ,
    setCity,
    setCityLat,
    setCityLng,
    setCityPlaceId,
    setDistanceKm,
    setStartISO,
    setEndISO,
    setStatus,
    setKinds,
    setLevels,
    setVerifiedOnly,
    setKeywords,
    setCategories,
    setTags,
    // Actions
    clearAll,
    getCurrentState,
  };
}
