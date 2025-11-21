'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/feedback/modal';
import { Plus, AlertCircle, Check, Loader2 } from 'lucide-react';
import {
  useCreateTagMutation,
  useCheckTagSlugAvailableQuery,
} from '@/lib/api/tags';
import { generateSlug, isValidSlug } from '@/lib/utils/slug';

type AddTagModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AddTagModal({ open, onClose }: AddTagModalProps) {
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [label, setLabel] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateTagMutation();

  // Check slug availability
  const { data: slugAvailable, isLoading: checkingSlug } =
    useCheckTagSlugAvailableQuery(
      { slug },
      {
        enabled: !!slug && slug.length > 0 && isValidSlug(slug),
        staleTime: 5000,
      }
    );

  // Auto-generate slug from label if not manually edited
  useEffect(() => {
    if (!slugManuallyEdited && label) {
      const generated = generateSlug(label);
      setSlug(generated);
    }
  }, [label, slugManuallyEdited]);

  const handleLabelChange = (value: string) => {
    const cleaned = value.replace(/\s+/g, ' ');
    setLabel(cleaned);
    setErrors((prev) => ({ ...prev, label: '' }));
  };

  const handleSlugChange = (value: string) => {
    setSlug(value.toLowerCase().trim());
    setSlugManuallyEdited(true);
    setErrors((prev) => ({ ...prev, slug: '' }));
  };

  const handleSlugBlur = () => {
    if (slug && !isValidSlug(slug)) {
      setErrors((prev) => ({
        ...prev,
        slug: 'Nieprawidłowy format slug (tylko małe litery, cyfry i myślniki)',
      }));
    } else if (slug && slugAvailable?.checkTagSlugAvailable === false) {
      setErrors((prev) => ({ ...prev, slug: 'Slug zajęty' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Label required
    if (!label || label.trim().length < 2) {
      newErrors.label = 'Nazwa jest wymagana (min. 2 znaki)';
    } else if (label.trim().length > 50) {
      newErrors.label = 'Nazwa zbyt długa (max. 50 znaków)';
    }

    // Slug required and valid
    if (!slug || slug.trim().length === 0) {
      newErrors.slug = 'Slug jest wymagany';
    } else if (!isValidSlug(slug)) {
      newErrors.slug = 'Nieprawidłowy format slug';
    } else if (slugAvailable?.checkTagSlugAvailable === false) {
      newErrors.slug = 'Slug zajęty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        input: {
          slug: slug.trim(),
          label: label.trim(),
        },
      });

      // Reset and close
      setSlug('');
      setSlugManuallyEdited(false);
      setLabel('');
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      setErrors((prev) => ({
        ...prev,
        submit: error.message || 'Nie udało się utworzyć tagu',
      }));
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      setSlug('');
      setSlugManuallyEdited(false);
      setLabel('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      variant="centered"
      size="md"
      header={
        <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>Dodaj tag</span>
        </h3>
      }
      content={
        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nazwa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="np. Gry planszowe"
              disabled={createMutation.isPending}
              className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.label
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'
              } dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100`}
            />
            {errors.label && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.label}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              2-50 znaków
            </p>
          </div>

          {/* Slug */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={handleSlugBlur}
                placeholder="np. gry-planszowe"
                disabled={createMutation.isPending}
                className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.slug
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'
                } dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100`}
              />
              {checkingSlug && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                </div>
              )}
              {!checkingSlug && slug && isValidSlug(slug) && slugAvailable && (
                <div className="absolute right-3 top-2.5">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            {errors.slug && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.slug}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Autogenerowany z nazwy (możesz nadpisać)
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.submit}</span>
              </div>
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={createMutation.isPending}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending || checkingSlug}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {createMutation.isPending ? 'Tworzenie...' : 'Utwórz tag'}
          </button>
        </div>
      }
    />
  );
}
