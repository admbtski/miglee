'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useIntentQuery, useUpdateIntentMutation } from '@/lib/api/intents';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/utils';

// Types for intent data
interface IntentData {
  id: string;
  title: string;
  description: string | null;
  categories: Array<{
    id: string;
    slug: string;
    names: Record<string, string>;
  }>;
  tags: Array<{ id: string; slug: string; label: string }>;
  startAt: string;
  endAt: string;
  meetingKind: 'ONSITE' | 'ONLINE' | 'HYBRID';
  onlineUrl: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  placeId: string | null;
  radiusKm: number | null;
  cityName: string | null;
  mode: 'ONE_TO_ONE' | 'GROUP' | 'CUSTOM';
  min: number | null;
  max: number | null;
  visibility: 'PUBLIC' | 'HIDDEN';
  joinMode: 'OPEN' | 'REQUEST' | 'INVITE_ONLY';
  addressVisibility: 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN';
  membersVisibility: 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN';
  levels: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>;
  notes: string | null;
  allowJoinLate: boolean;
  joinOpensMinutesBeforeStart: number | null;
  joinCutoffMinutesBeforeStart: number | null;
  lateJoinCutoffMinutesAfterStart: number | null;
  coverKey: string | null;
  coverBlurhash: string | null;
}

interface EditContextValue {
  intentId: string;
  intent: IntentData | null;
  isLoading: boolean;
  isSaving: boolean;
  saveSection: <T extends Record<string, unknown>>(
    section: string,
    data: T
  ) => Promise<boolean>;
  refetch: () => void;
}

const EditContext = createContext<EditContextValue | null>(null);

interface EditProviderProps {
  children: ReactNode;
  intentId: string;
}

/**
 * Provider for edit section
 * Each section saves independently via saveSection()
 */
export function EditProvider({ children, intentId }: EditProviderProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useIntentQuery({ id: intentId });
  const { mutateAsync: updateIntent, isPending: isSaving } =
    useUpdateIntentMutation();

  const intent = useMemo<IntentData | null>(() => {
    if (!data?.intent) return null;
    const i = data.intent;
    return {
      id: i.id,
      title: i.title || '',
      description: i.description || null,
      categories: i.categories || [],
      tags: i.tags || [],
      startAt: i.startAt,
      endAt: i.endAt,
      meetingKind: i.meetingKind || 'ONSITE',
      onlineUrl: i.onlineUrl || null,
      lat: i.lat ?? null,
      lng: i.lng ?? null,
      address: i.address || null,
      placeId: i.placeId || null,
      radiusKm: i.radiusKm ?? null,
      cityName: (i as any).cityName || null,
      mode: i.mode || 'ONE_TO_ONE',
      min: i.min ?? null,
      max: i.max ?? null,
      visibility: i.visibility || 'PUBLIC',
      joinMode: i.joinMode || 'OPEN',
      addressVisibility: i.addressVisibility || 'PUBLIC',
      membersVisibility: i.membersVisibility || 'PUBLIC',
      levels: i.levels || [],
      notes: i.notes || null,
      allowJoinLate: i.allowJoinLate ?? true,
      joinOpensMinutesBeforeStart: i.joinOpensMinutesBeforeStart ?? null,
      joinCutoffMinutesBeforeStart: i.joinCutoffMinutesBeforeStart ?? null,
      lateJoinCutoffMinutesAfterStart:
        i.lateJoinCutoffMinutesAfterStart ?? null,
      coverKey: i.coverKey || null,
      coverBlurhash: i.coverBlurhash || null,
    };
  }, [data?.intent]);

  const saveSection = useCallback(
    async <T extends Record<string, unknown>>(
      section: string,
      sectionData: T
    ): Promise<boolean> => {
      try {
        await updateIntent({
          id: intentId,
          input: sectionData,
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['GetIntent', intentId] });
        queryClient.invalidateQueries({ queryKey: ['GetIntents'] });

        toast.success(`${section} saved successfully`);
        return true;
      } catch (error: any) {
        const errorMessage =
          error?.response?.errors?.[0]?.message ||
          error?.message ||
          'Failed to save changes';

        toast.error(`Failed to save ${section}`, {
          description: errorMessage,
        });
        return false;
      }
    },
    [intentId, updateIntent, queryClient]
  );

  const value = useMemo<EditContextValue>(
    () => ({
      intentId,
      intent,
      isLoading,
      isSaving,
      saveSection,
      refetch,
    }),
    [intentId, intent, isLoading, isSaving, saveSection, refetch]
  );

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

export function useEdit() {
  const context = useContext(EditContext);
  if (!context) {
    throw new Error('useEdit must be used within EditProvider');
  }
  return context;
}
