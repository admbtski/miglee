/**
 * Hook for filter validation logic
 * Validates date ranges and checks if filters have changed (dirty state)
 */

'use client';

import { useMemo } from 'react';

export interface UseFilterValidationProps {
  startISO: string | null;
  endISO: string | null;
  initialQ: string;
  initialCity: string | null;
  initialDistanceKm: number;
  initialStartISO?: string | null;
  initialEndISO?: string | null;
  initialStatus: string;
  initialKinds: string[];
  initialLevels: string[];
  initialVerifiedOnly: boolean;
  initialTags: string[];
  initialKeywords: string[];
  initialCategories: string[];
  initialJoinModes?: string[];
  currentQ: string;
  currentCity: string | null;
  currentDistanceKm: number;
  currentStartISO: string | null;
  currentEndISO: string | null;
  currentStatus: string;
  currentKinds: string[];
  currentLevels: string[];
  currentVerifiedOnly: boolean;
  currentTags: Array<{ slug: string }>;
  currentKeywords: string[];
  currentCategories: Array<{ slug: string }>;
  currentJoinModes: string[];
}

const arraysEq = <T,>(a?: readonly T[], b?: readonly T[]) => {
  if (a === b) return true;
  const aa = a ?? [];
  const bb = b ?? [];
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
  return true;
};

/**
 * Validates filter state and checks for changes
 *
 * @param props - Initial and current filter values for comparison
 * @returns Object with:
 * - dateError: Error message if date range is invalid
 * - isDirty: True if any filter has changed from initial values
 * - isValid: True if all validations pass
 *
 * @example
 * ```tsx
 * const { dateError, isDirty, isValid } = useFilterValidation({
 *   startISO, endISO, initialQ, currentQ, ...
 * });
 * ```
 */
export function useFilterValidation(props: UseFilterValidationProps) {
  const { startISO, endISO } = props;

  // Date range validation
  const dateError = useMemo(() => {
    if (!startISO || !endISO) return null;
    const s = new Date(startISO).getTime();
    const e = new Date(endISO).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return 'Nieprawidłowy format daty.';
    if (e < s)
      return 'Data zakończenia nie może być wcześniejsza niż rozpoczęcia.';
    return null;
  }, [startISO, endISO]);

  // Dirty check - has anything changed?
  const isDirty = useMemo(() => {
    const DEFAULT_DISTANCE = 30;
    const sameQ = props.currentQ === (props.initialQ ?? '');
    const sameCity = props.currentCity === (props.initialCity ?? null);
    const sameDist =
      props.currentDistanceKm === (props.initialDistanceKm ?? DEFAULT_DISTANCE);
    const sameStart =
      (props.currentStartISO ?? null) === (props.initialStartISO ?? null);
    const sameEnd =
      (props.currentEndISO ?? null) === (props.initialEndISO ?? null);
    const sameStatus = props.currentStatus === props.initialStatus;
    const sameKinds = arraysEq(props.currentKinds, props.initialKinds ?? []);
    const sameLevels = arraysEq(props.currentLevels, props.initialLevels ?? []);
    const sameVerified =
      props.currentVerifiedOnly === (props.initialVerifiedOnly ?? false);
    const sameTags = arraysEq(
      props.currentTags.map((t) => t.slug),
      props.initialTags ?? []
    );
    const sameKeywords = arraysEq(
      props.currentKeywords,
      props.initialKeywords ?? []
    );
    const sameCategories = arraysEq(
      props.currentCategories.map((c) => c.slug),
      props.initialCategories ?? []
    );
    const sameJoinModes = arraysEq(
      props.currentJoinModes,
      props.initialJoinModes ?? []
    );

    return !(
      sameQ &&
      sameCity &&
      sameDist &&
      sameStart &&
      sameEnd &&
      sameStatus &&
      sameKinds &&
      sameLevels &&
      sameVerified &&
      sameTags &&
      sameKeywords &&
      sameCategories &&
      sameJoinModes
    );
  }, [props]);

  return {
    dateError,
    isDirty,
    isValid: !dateError,
  };
}
