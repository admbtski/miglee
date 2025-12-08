'use client';

import { Info } from 'lucide-react';
import { useId } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { useCategorySelection } from '@/features/events/components/category-selection-provider';
import { SimpleEventFormValues } from '@/features/events/components/types';
import { getUseCategoriesLimitData } from '@/features/events/hooks/use-categories';
import { CategoryMultiCombo } from '@/components/forms/category-combobox';
import { CategoryOption } from '@/features/categories';

/**
 * SimpleBasicsStep - Simplified basics step
 *
 * Fields:
 * - Title (required, max 60 chars)
 * - Categories (1-3, required)
 * - Description (optional, max 500 chars)
 */
export function SimpleBasicsStep({
  form,
}: {
  form: UseFormReturn<SimpleEventFormValues>;
}) {
  const {
    trigger,
    control,
    formState: { errors },
  } = form;

  const titleId = useId();
  const descId = useId();

  const { selected: selectedCategories, set: setCategories } =
    useCategorySelection();

  const titleMax = 60;
  const descMax = 500;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Podstawowe informacje
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Nadaj swojemu wydarzeniu nazwę i wybierz kategorię.
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label
          htmlFor={titleId}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nazwa wydarzenia <span className="text-red-500">*</span>
        </label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <input
                {...field}
                id={titleId}
                maxLength={titleMax}
                placeholder="Np. Poranny bieg w parku"
                aria-invalid={!!errors.title}
                autoComplete="off"
                spellCheck={false}
                className={[
                  'w-full rounded-xl border px-4 pr-14 py-3 text-base transition-all focus:outline-none focus:ring-2',
                  errors.title
                    ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
                    : 'border-zinc-300 focus:border-indigo-400 focus:ring-indigo-500/40',
                  'bg-white text-zinc-900 placeholder:text-zinc-400',
                  'dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-700 dark:focus:border-indigo-600',
                ].join(' ')}
              />
              <span
                className={[
                  'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs font-medium tabular-nums',
                  titleMax - (field.value?.length || 0) === 0
                    ? 'text-red-500 dark:text-red-400'
                    : titleMax - (field.value?.length || 0) <= 12
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-400 dark:text-zinc-500',
                ].join(' ')}
                aria-hidden="true"
              >
                {Math.max(0, titleMax - (field.value?.length || 0))}
              </span>
            </div>
          )}
        />
        {errors.title && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.title.message as string}
          </p>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Kategorie <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Wybierz 1-3 kategorie, aby pomóc innym znaleźć Twoje wydarzenie.
        </p>
        <Controller
          name="categorySlugs"
          control={control}
          render={({ field }) => {
            const handleChange = (vals: CategoryOption[]) => {
              const slugs = vals.map((v) => v.slug);
              field.onChange(slugs);
              setCategories(vals, getUseCategoriesLimitData());
              void trigger('categorySlugs');
            };
            return (
              <CategoryMultiCombo
                placeholder="Szukaj kategorii…"
                maxCount={3}
                size="md"
                onChange={handleChange}
                values={selectedCategories}
              />
            );
          }}
        />
        {errors.categorySlugs && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.categorySlugs.message as string}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor={descId}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Opis <span className="text-zinc-400">(opcjonalnie)</span>
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <textarea
                {...field}
                value={field.value || ''}
                id={descId}
                rows={3}
                maxLength={descMax}
                placeholder="Dodaj szczegóły takie jak tempo, trudność czy wymagany sprzęt..."
                spellCheck={true}
                className={[
                  'w-full rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2 resize-none',
                  errors.description
                    ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
                    : 'border-zinc-300 focus:border-indigo-400 focus:ring-indigo-500/40',
                  'bg-white text-zinc-900 placeholder:text-zinc-400',
                  'dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-700 dark:focus:border-indigo-600',
                ].join(' ')}
              />
              <span
                className={[
                  'pointer-events-none absolute bottom-2.5 right-3 select-none text-xs font-medium tabular-nums',
                  descMax - (field.value?.length || 0) === 0
                    ? 'text-red-500 dark:text-red-400'
                    : descMax - (field.value?.length || 0) <= 100
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-400 dark:text-zinc-500',
                ].join(' ')}
                aria-hidden="true"
              >
                {Math.max(0, descMax - (field.value?.length || 0))}
              </span>
            </div>
          )}
        />
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 dark:text-indigo-100">
          To tylko podstawy. Dodatkowe ustawienia jak tagi, poziom zaawansowania
          czy notatki skonfigurujesz po utworzeniu wydarzenia.
        </p>
      </div>
    </div>
  );
}
