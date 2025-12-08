'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/feedback/modal';
import { Edit, AlertCircle, Check, Loader2, Lock } from 'lucide-react';
import {
  useUpdateTagMutation,
  useCheckTagSlugAvailableQuery,
  useGetTagUsageCountQuery,
} from '@/features/tags/api/tags';
import { isValidSlug } from '@/lib/utils/slug';

type EditTagModalProps = {
  open: boolean;
  onClose: () => void;
  tag: {
    id: string;
    slug: string;
    label: string;
  };
};

export function EditTagModal({ open, onClose, tag }: EditTagModalProps) {
  const [slug, setSlug] = useState(tag.slug);
  const [slugEdited, setSlugEdited] = useState(false);
  const [label, setLabel] = useState(tag.label);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useUpdateTagMutation();

  // Check usage count
  const { data: usageData } = useGetTagUsageCountQuery({
    slug: tag.slug,
  });
  const usageCount = usageData?.getTagUsageCount ?? 0;
  const isUsed = usageCount > 0;

  // Check slug availability
  const { data: slugAvailable, isLoading: checkingSlug } =
    useCheckTagSlugAvailableQuery(
      { slug },
      {
        enabled:
          slugEdited &&
          slug !== tag.slug &&
          !!slug &&
          slug.length > 0 &&
          isValidSlug(slug),
        staleTime: 5000,
      }
    );

  useEffect(() => {
    setSlug(tag.slug);
    setLabel(tag.label);
    setSlugEdited(false);
    setErrors({});
  }, [tag]);

  const handleLabelChange = (value: string) => {
    const cleaned = value.replace(/\s+/g, ' ');
    setLabel(cleaned);
    setErrors((prev) => ({ ...prev, label: '' }));
  };

  const handleSlugChange = (value: string) => {
    setSlug(value.toLowerCase().trim());
    setSlugEdited(true);
    setErrors((prev) => ({ ...prev, slug: '' }));
  };

  const handleSlugBlur = () => {
    if (slug && slug !== tag.slug && !isValidSlug(slug)) {
      setErrors((prev) => ({
        ...prev,
        slug: 'Nieprawidłowy format slug',
      }));
    } else if (
      slug &&
      slug !== tag.slug &&
      slugAvailable?.checkTagSlugAvailable === false
    ) {
      setErrors((prev) => ({ ...prev, slug: 'Slug zajęty' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!label || label.trim().length < 2) {
      newErrors.label = 'Nazwa jest wymagana (min. 2 znaki)';
    } else if (label.trim().length > 50) {
      newErrors.label = 'Nazwa zbyt długa (max. 50 znaków)';
    }

    if (slugEdited && slug !== tag.slug) {
      if (!slug || slug.trim().length === 0) {
        newErrors.slug = 'Slug jest wymagany';
      } else if (!isValidSlug(slug)) {
        newErrors.slug = 'Nieprawidłowy format slug';
      } else if (slugAvailable?.checkTagSlugAvailable === false) {
        newErrors.slug = 'Slug zajęty';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const input: any = {
        label: label.trim(),
      };

      if (slugEdited && slug !== tag.slug && !isUsed) {
        input.slug = slug.trim();
      }

      await updateMutation.mutateAsync({
        id: tag.id,
        input,
      });

      onClose();
    } catch (error: any) {
      console.error('Failed to update tag:', error);
      setErrors((prev) => ({
        ...prev,
        submit: error.message || 'Nie udało się zaktualizować tagu',
      }));
    }
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      setSlug(tag.slug);
      setLabel(tag.label);
      setSlugEdited(false);
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
          <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>Edytuj tag</span>
        </h3>
      }
      content={
        <div className="space-y-4">
          {isUsed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    Tag jest używany przez {usageCount} wydarzeń
                  </p>
                  <p className="mt-1 text-xs">
                    Slug jest zablokowany. Możesz edytować tylko nazwę.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nazwa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              disabled={updateMutation.isPending}
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
          </div>

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
                disabled={isUsed || updateMutation.isPending}
                className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.slug
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'
                } disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:disabled:bg-zinc-900`}
              />
              {isUsed && (
                <div className="absolute right-3 top-2.5">
                  <Lock className="h-4 w-4 text-zinc-400" />
                </div>
              )}
              {!isUsed && checkingSlug && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                </div>
              )}
              {!isUsed &&
                !checkingSlug &&
                slugEdited &&
                slug !== tag.slug &&
                isValidSlug(slug) &&
                slugAvailable && (
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
            {isUsed && (
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Slug zablokowany (tag używany)
              </p>
            )}
          </div>

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
            disabled={updateMutation.isPending}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending || checkingSlug}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {updateMutation.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      }
    />
  );
}
