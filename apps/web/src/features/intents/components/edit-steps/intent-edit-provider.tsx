'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useIntentForm } from '../use-intent-form';
import { IntentFormValues } from '../types';
import { CategoryOption } from '@/features/categories';
import { useCategorySelection } from '../category-selection-provider';
import { useTagSelection } from '../tag-selection-provider';
import { useIntentQuery } from '@/features/intents/api/intents';
import { TagOption } from '@/features/tags';

interface IntentEditContextValue {
  form: UseFormReturn<IntentFormValues>;
  intentId: string;
  categories: CategoryOption[];
  tags: TagOption[];
  setCategories: (categories: CategoryOption[], max?: number) => void;
  setTags: (tags: TagOption[], max?: number) => void;
  isLoading: boolean;
}

const IntentEditContext = createContext<IntentEditContextValue | null>(null);

interface IntentEditProviderProps {
  children: ReactNode;
  intentId: string;
}

/**
 * Provider for intent edit form state
 * Manages form data and categories/tags across all edit steps
 * Fetches intent data and initializes form
 */
export function IntentEditProvider({
  children,
  intentId,
}: IntentEditProviderProps) {
  const { data: intent, isLoading } = useIntentQuery({ id: intentId });
  const { selected: categories, set: setCategories } = useCategorySelection();
  const { selected: tags, set: setTags } = useTagSelection();

  // Initialize form with empty values first
  const form = useIntentForm();

  console.dir({ form });

  // Update form when intent data is loaded
  useEffect(() => {
    if (!intent?.intent) return;

    const i = intent.intent;

    // Convert intent data to form values
    const formValues: Partial<IntentFormValues> = {
      title: i.title || '',
      categorySlugs: i.categories?.map((c) => c.slug) || [],
      tagSlugs: i.tags?.map((t) => t.slug) || [],
      description: i.description || '',
      mode: i.mode || 'ONE_TO_ONE',
      min: i.min || 2,
      max: i.max || 2,
      startAt: i.startAt ? new Date(i.startAt) : new Date(),
      endAt: i.endAt ? new Date(i.endAt) : new Date(),
      allowJoinLate: i.allowJoinLate ?? true,
      meetingKind: i.meetingKind || 'ONSITE',
      onlineUrl: i.onlineUrl || '',
      location: {
        lat: i.lat ?? undefined,
        lng: i.lng ?? undefined,
        address: i.address || '',
        radiusKm: i.radiusKm || 1,
        placeId: i.placeId || '',
        cityName: undefined,
        cityPlaceId: undefined,
      },
      visibility: i.visibility || 'PUBLIC',
      joinMode: i.joinMode || 'OPEN',
      levels: i.levels || ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      addressVisibility: i.addressVisibility || 'PUBLIC',
      membersVisibility: i.membersVisibility || 'PUBLIC',
      notes: i.notes || '',
      joinOpensMinutesBeforeStart: i.joinOpensMinutesBeforeStart || null,
      joinCutoffMinutesBeforeStart: i.joinCutoffMinutesBeforeStart || null,
      lateJoinCutoffMinutesAfterStart:
        i.lateJoinCutoffMinutesAfterStart || null,
    };

    // Reset form with intent data - this marks form as clean
    form.reset(formValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
      keepDefaultValues: false,
    });

    // Set categories and tags
    if (i.categories) {
      setCategories(
        i.categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          label: c.names?.en || c.slug,
          name: c.names?.en || c.slug,
        })),
        3
      );
    }

    if (i.tags) {
      setTags(
        i.tags.map((t) => ({
          id: t.id,
          slug: t.slug,
          label: t.label,
          name: t.label,
        })),
        3
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent?.intent?.id]);

  const value = useMemo<IntentEditContextValue>(
    () => ({
      form,
      intentId,
      categories,
      tags,
      setCategories,
      setTags,
      isLoading,
    }),
    [form, intentId, categories, tags, setCategories, setTags, isLoading]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 rounded-full animate-spin border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <IntentEditContext.Provider value={value}>
      {children}
    </IntentEditContext.Provider>
  );
}

export function useIntentEdit() {
  const context = useContext(IntentEditContext);
  if (!context) {
    throw new Error('useIntentEdit must be used within IntentEditProvider');
  }
  return context;
}
