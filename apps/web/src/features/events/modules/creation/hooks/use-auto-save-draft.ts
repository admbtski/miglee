'use client';

import { CategoryOption } from '@/features/categories';
import { TagOption } from '@/features/tags';
import { useEffect, useRef, useState } from 'react';
import type { SimpleEventFormValues } from '../types/event-form';

const DRAFT_KEY = 'event-draft';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

/**
 * Hook for auto-saving event form drafts to localStorage.
 * Works with both SimpleEventFormValues (new creator) and full form values.
 */
export function useAutoSaveDraft(
  values: SimpleEventFormValues,
  isDirty: boolean,
  enabled: boolean = true,
  categories: CategoryOption[] = [],
  tags: TagOption[] = []
) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save draft to localStorage
  const saveDraft = () => {
    if (!enabled || !isDirty) return;

    try {
      setIsSaving(true);
      const draft = {
        values,
        categories,
        tags,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load draft from localStorage
  const loadDraft = (): {
    values: SimpleEventFormValues;
    categories: CategoryOption[];
    tags: TagOption[];
    savedAt: string;
  } | null => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return null;

      const draft = JSON.parse(stored);
      // Parse dates back to Date objects
      if (draft.values.startAt) {
        draft.values.startAt = new Date(draft.values.startAt);
      }
      if (draft.values.endAt) {
        draft.values.endAt = new Date(draft.values.endAt);
      }
      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      saveDraft();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, values, isDirty, categories, tags]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    lastSaved,
    isSaving,
  };
}
