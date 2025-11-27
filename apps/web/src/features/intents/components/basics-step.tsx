'use client';

import { useEffect, useId } from 'react';
import { Controller, UseFormReturn, useController } from 'react-hook-form';
import { useCategorySelection } from './category-selection-provider';
import { IntentFormValues } from './types';
import { getUseCategoriesLimitData } from '@/features/intents/hooks/use-categories';
import { CategoryMultiCombo } from '@/components/forms/category-combobox';
import { CategoryOption, TagOption } from '@/types/types';
import { useTagSelection } from './tag-selection-provider';
import { TagMultiCombo } from '@/components/forms/tag-multicombo';
import { getUseTagsLimitData } from '@/features/intents/hooks/use-tags';
import { Info } from 'lucide-react';

function FormSection({
  title,
  description,
  children,
  error,
  hint,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </label>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {children}
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <span className="text-base">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

export function BasicsStep({
  form,
}: {
  form: UseFormReturn<IntentFormValues>;
}) {
  const {
    trigger,
    control,
    formState: { errors },
  } = form;

  const titleId = useId();
  const titleErrId = useId();
  const descId = useId();
  const descErrId = useId();

  // NOTE: capacity sync now handled solely in CapacityStep to avoid double side-effects
  const { field: modeField } = useController({ name: 'mode', control });

  const { selected: selectedCategories, set: setCategories } =
    useCategorySelection();
  const { selected: selectedTags, set: setTags } = useTagSelection();

  const titleMax = 60;
  const descMax = 500;

  // Ensure RHF sees initial mode for validation (but do not mutate min/max here)
  useEffect(() => {
    void trigger(['mode']);
  }, [modeField.value, trigger]);

  return (
    <div className="space-y-8">
      {/* Name */}
      <FormSection
        title="Nazwa wydarzenia"
        description="Maksymalnie 60 znaków. Bądź zwięzły i konkretny."
        error={errors.title?.message as string}
      >
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
                aria-describedby={errors.title ? titleErrId : undefined}
                autoComplete="off"
                spellCheck={false}
                className={[
                  'w-full rounded-2xl border px-4 pr-14 py-3.5 text-base shadow-sm transition-all focus:outline-none focus:ring-2',
                  errors.title
                    ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
                    : 'border-zinc-300 focus:border-indigo-400 focus:ring-indigo-500/40',
                  'bg-white text-zinc-900 placeholder:text-zinc-400',
                  'dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-800 dark:focus:border-indigo-700',
                ].join(' ')}
              />
              <span
                className={[
                  'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs font-medium tabular-nums',
                  titleMax - (field.value?.length || 0) === 0
                    ? 'text-red-500 dark:text-red-400'
                    : titleMax - (field.value?.length || 0) <= 12
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-500 dark:text-zinc-400',
                ].join(' ')}
                aria-hidden="true"
              >
                {Math.max(0, titleMax - (field.value?.length || 0))}
              </span>
            </div>
          )}
        />
      </FormSection>

      {/* Categories (multi 1–3) */}
      <FormSection
        title="Kategorie"
        description="Wybierz 1–3 kategorie, aby pomóc innym znaleźć Twoje wydarzenie."
        error={errors.categorySlugs?.message as string}
      >
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
      </FormSection>

      {/* Description */}
      <FormSection
        title="Opis (opcjonalnie)"
        description="Dodaj szczegóły takie jak tempo, trudność czy wymagany sprzęt."
        error={errors.description?.message as string}
      >
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <textarea
                {...field}
                value={field.value || ''}
                id={descId}
                rows={4}
                maxLength={descMax}
                placeholder="Np. Lekki bieg 5km wokół parku. Tempo 6:00/km."
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? descErrId : undefined}
                spellCheck={true}
                className={[
                  'w-full rounded-2xl border px-4 pr-14 py-3.5 text-zinc-900 shadow-sm transition-all focus:outline-none focus:ring-2 resize-none',
                  errors.description
                    ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
                    : 'border-zinc-300 focus:border-indigo-400 focus:ring-indigo-500/40',
                  'bg-white placeholder:text-zinc-400',
                  'dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500',
                ].join(' ')}
              />
              <span
                className={[
                  'pointer-events-none absolute bottom-2.5 right-3 select-none text-xs font-medium tabular-nums',
                  descMax - (field.value?.length || 0) === 0
                    ? 'text-red-500 dark:text-red-400'
                    : descMax - (field.value?.length || 0) <= 100
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-500 dark:text-zinc-400',
                ].join(' ')}
                aria-hidden="true"
              >
                {Math.max(0, descMax - (field.value?.length || 0))}
              </span>
            </div>
          )}
        />
      </FormSection>

      {/* Tags (multi 0–3) */}
      <FormSection
        title="Tagi (opcjonalnie)"
        description="Wybierz 1–3 tagi, aby pomóc innym znaleźć Twoje wydarzenie."
      >
        <Controller
          name="tagSlugs"
          control={control}
          render={({ field }) => {
            const handleChange = (vals: TagOption[]) => {
              const slugs = vals.map((v) => v.slug);
              field.onChange(slugs);
              setTags(vals, getUseTagsLimitData());
              void trigger('tagSlugs');
            };
            return (
              <TagMultiCombo
                placeholder="Szukaj tagów…"
                maxCount={3}
                size="md"
                onChange={handleChange}
                values={selectedTags}
              />
            );
          }}
        />
      </FormSection>

      {/* Info note */}
      <div
        role="note"
        className="flex items-start gap-3 p-4 border rounded-2xl border-blue-300/50 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-900/20"
      >
        <div className="flex-shrink-0 mt-0.5">
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100/70 text-blue-700 ring-1 ring-blue-300/60 dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/30">
            <Info className="w-4 h-4" />
          </div>
        </div>
        <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
          <strong className="font-semibold">Wskazówka:</strong> Jasne nazwy,
          zwięzłe opisy i odpowiednie kategorie zwiększają widoczność Twojego
          wydarzenia.
        </p>
      </div>
    </div>
  );
}
