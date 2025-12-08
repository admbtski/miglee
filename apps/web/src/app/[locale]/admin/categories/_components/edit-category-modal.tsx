'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/feedback/modal';
import { Edit, AlertCircle, Check, Loader2, Lock } from 'lucide-react';
import {
  useUpdateCategoryMutation,
  useCheckCategorySlugAvailableQuery,
  useGetCategoryUsageCountQuery,
} from '@/features/categories/api/categories';
import { isValidSlug } from '@/lib/utils/slug';

type EditCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  category: {
    id: string;
    slug: string;
    names: Record<string, string>;
  };
};

type LanguageTab = 'pl' | 'en' | 'de';

export function EditCategoryModal({
  open,
  onClose,
  category,
}: EditCategoryModalProps) {
  const [activeTab, setActiveTab] = useState<LanguageTab>('pl');
  const [slug, setSlug] = useState(category.slug);
  const [slugEdited, setSlugEdited] = useState(false);
  const [names, setNames] = useState<Record<string, string>>(
    category.names || {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useUpdateCategoryMutation();

  // Check usage count
  const { data: usageData } = useGetCategoryUsageCountQuery({
    slug: category.slug,
  });
  const usageCount = usageData?.getCategoryUsageCount ?? 0;
  const isUsed = usageCount > 0;

  // Check slug availability (only if slug was edited and different from original)
  const { data: slugAvailable, isLoading: checkingSlug } =
    useCheckCategorySlugAvailableQuery(
      { slug },
      {
        enabled:
          slugEdited &&
          slug !== category.slug &&
          !!slug &&
          slug.length > 0 &&
          isValidSlug(slug),
        staleTime: 5000,
      }
    );

  // Reset form when category changes
  useEffect(() => {
    setSlug(category.slug);
    setNames(category.names || {});
    setSlugEdited(false);
    setErrors({});
    setActiveTab('pl');
  }, [category]);

  const handleNameChange = (lang: string, value: string) => {
    const cleaned = value.replace(/\s+/g, ' ');
    setNames((prev) => ({ ...prev, [lang]: cleaned }));
    setErrors((prev) => ({ ...prev, [lang]: '' }));
  };

  const handleSlugChange = (value: string) => {
    setSlug(value.toLowerCase().trim());
    setSlugEdited(true);
    setErrors((prev) => ({ ...prev, slug: '' }));
  };

  const handleSlugBlur = () => {
    if (slug && slug !== category.slug && !isValidSlug(slug)) {
      setErrors((prev) => ({
        ...prev,
        slug: 'Nieprawidłowy format slug',
      }));
    } else if (
      slug &&
      slug !== category.slug &&
      slugAvailable?.checkCategorySlugAvailable === false
    ) {
      setErrors((prev) => ({ ...prev, slug: 'Slug zajęty' }));
    }
  };

  const copyFromPl = () => {
    if (names.pl) {
      setNames((prev) => ({
        ...prev,
        en: prev.en || prev.pl || '',
        de: prev.de || prev.pl || '',
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // PL name required
    if (!names.pl || names.pl.trim().length < 2) {
      newErrors.pl = 'Nazwa polska jest wymagana (min. 2 znaki)';
    } else if (names.pl.trim().length > 50) {
      newErrors.pl = 'Nazwa polska zbyt długa (max. 50 znaków)';
    }

    // Optional EN/DE validation
    if (names.en && names.en.trim().length > 50) {
      newErrors.en = 'Nazwa angielska zbyt długa (max. 50 znaków)';
    }
    if (names.de && names.de.trim().length > 50) {
      newErrors.de = 'Nazwa niemiecka zbyt długa (max. 50 znaków)';
    }

    // Slug validation (only if changed)
    if (slugEdited && slug !== category.slug) {
      if (!slug || slug.trim().length === 0) {
        newErrors.slug = 'Slug jest wymagany';
      } else if (!isValidSlug(slug)) {
        newErrors.slug = 'Nieprawidłowy format slug';
      } else if (slugAvailable?.checkCategorySlugAvailable === false) {
        newErrors.slug = 'Slug zajęty';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      // Build names object (only include non-empty values)
      const namesPayload: Record<string, string> = {};
      if (names.pl?.trim()) namesPayload.pl = names.pl.trim();
      if (names.en?.trim()) namesPayload.en = names.en.trim();
      if (names.de?.trim()) namesPayload.de = names.de.trim();

      const input: any = {
        names: namesPayload,
      };

      // Only include slug if it was changed and category is not used
      if (slugEdited && slug !== category.slug && !isUsed) {
        input.slug = slug.trim();
      }

      await updateMutation.mutateAsync({
        id: category.id,
        input,
      });

      onClose();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      setErrors((prev) => ({
        ...prev,
        submit: error.message || 'Nie udało się zaktualizować kategorii',
      }));
    }
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      setSlug(category.slug);
      setNames(category.names || {});
      setSlugEdited(false);
      setErrors({});
      setActiveTab('pl');
      onClose();
    }
  };

  const translationCount = [names.pl, names.en, names.de].filter(
    (n) => n && n.trim().length > 0
  ).length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      variant="centered"
      size="lg"
      header={
        <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>Edytuj kategorię</span>
        </h3>
      }
      content={
        <div className="space-y-6">
          {/* Usage Warning */}
          {isUsed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    Kategoria jest używana przez {usageCount} wydarzeń
                  </p>
                  <p className="mt-1 text-xs">
                    Slug jest zablokowany. Możesz edytować tylko nazwy.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                placeholder="np. sport-i-rekreacja"
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
                slug !== category.slug &&
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
                Slug zablokowany (kategoria używana)
              </p>
            )}
          </div>

          {/* Language Tabs */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nazwy (wielojęzyczne)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {translationCount}/3 tłumaczeń
                </span>
                <button
                  type="button"
                  onClick={copyFromPl}
                  disabled={!names.pl || updateMutation.isPending}
                  className="text-xs text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400"
                >
                  Uzupełnij z PL
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-3 flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
              {(['pl', 'en', 'de'] as LanguageTab[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveTab(lang)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === lang
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {lang.toUpperCase()}
                  {lang === 'pl' && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                  {names[lang] && (
                    <span className="ml-1 text-green-500">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Active Tab Content */}
            <div>
              <input
                type="text"
                value={names[activeTab] || ''}
                onChange={(e) => handleNameChange(activeTab, e.target.value)}
                placeholder={`Nazwa w języku ${
                  activeTab === 'pl'
                    ? 'polskim'
                    : activeTab === 'en'
                      ? 'angielskim'
                      : 'niemieckim'
                }`}
                disabled={updateMutation.isPending}
                className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors[activeTab]
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500'
                } dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100`}
              />
              {errors[activeTab] && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors[activeTab]}
                </p>
              )}
              {activeTab === 'pl' && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Wymagane (2-50 znaków)
                </p>
              )}
              {activeTab !== 'pl' && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Opcjonalne (max. 50 znaków)
                </p>
              )}
            </div>
          </div>

          {/* JSON Preview */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Podgląd JSON (readonly)
            </label>
            <pre className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {JSON.stringify(
                Object.fromEntries(
                  Object.entries(names).filter(([_, v]) => v && v.trim())
                ),
                null,
                2
              )}
            </pre>
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
