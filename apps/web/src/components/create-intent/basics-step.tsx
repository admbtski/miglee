'use client';

import { useCategoriesLimit } from '@/hooks/use-categories';
import { useEffect, useId } from 'react';
import {
  Controller,
  UseFormReturn,
  useController,
  useWatch,
} from 'react-hook-form';
import { useCategorySelection } from './category-selection-provider';
import { CategoryOption, IntentFormValues } from './types';
import { CategoryMultiCombo } from '../combobox/category-combobox';

export function BasicsStep({
  form,
}: {
  form: UseFormReturn<IntentFormValues>;
}) {
  const {
    register,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = form;

  const titleId = useId();
  const titleErrId = useId();
  const catErrId = useId();
  const descId = useId();
  const descErrId = useId();

  const { field: modeField } = useController({ name: 'mode', control });

  const { selected: selectedCategories, set: setCategories } =
    useCategorySelection();

  const title = useWatch({ control, name: 'title' }) ?? '';
  const description = useWatch({ control, name: 'description' }) ?? '';
  const titleMax = 60;
  const descMax = 500;

  useEffect(() => {
    if (modeField.value === 'ONE_TO_ONE') {
      setValue('min', 2, { shouldDirty: true, shouldValidate: true });
      setValue('max', 2, { shouldDirty: true, shouldValidate: true });
    } else if (modeField.value === 'GROUP') {
      setValue('min', 2, { shouldDirty: true, shouldValidate: true });
      setValue('max', 50, { shouldDirty: true, shouldValidate: true });
    }
    void trigger(['min', 'max']);
  }, [modeField.value, setValue, trigger]);

  return (
    <div className="space-y-8">
      {/* Name */}
      <div className="group">
        <label
          htmlFor={titleId}
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Max 60 characters. Keep it clear and specific.
        </p>

        <div className="relative">
          <input
            {...register('title')}
            id={titleId}
            maxLength={titleMax}
            placeholder="Short, catchy title"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? titleErrId : undefined}
            autoComplete="off"
            spellCheck={false}
            className={[
              'w-full rounded-2xl border px-4 pr-14 py-3.5 text-base shadow-inner focus:outline-none focus:ring-2',
              errors.title
                ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
                : 'border-zinc-300 focus:border-zinc-400 focus:ring-indigo-500/40',
              'bg-white text-zinc-900 placeholder:text-zinc-400',
              'dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:border-zinc-800 dark:focus:border-zinc-700',
            ].join(' ')}
          />
          <span
            className={[
              'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs',
              titleMax - title.length === 0
                ? 'text-red-500'
                : titleMax - title.length <= 12
                  ? 'text-amber-500'
                  : 'text-zinc-500 dark:text-zinc-400',
            ].join(' ')}
            aria-hidden="true"
          >
            {Math.max(0, titleMax - title.length)} left
          </span>
        </div>

        <div
          className="mt-1 text-xs text-red-500"
          id={titleErrId}
          role="alert"
          aria-live="polite"
        >
          {errors.title?.message as string}
        </div>
      </div>

      {/* Categories (multi 1–3) */}
      <Controller
        name="categorySlugs"
        control={control}
        render={({ field }) => {
          const handleChange = (vals: CategoryOption[]) => {
            const slugs = vals.map((v) => v.slug);
            field.onChange(slugs);
            setCategories(vals, useCategoriesLimit);
            void trigger('categorySlugs');
          };
          return (
            <div className="group">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Categories
              </label>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                Choose 1–3 categories to help others find your intent.
              </p>

              {/* Uncontrolled via Provider */}
              <CategoryMultiCombo
                placeholder="Search category…"
                maxCount={3}
                size="md"
                onChange={handleChange}
                values={selectedCategories}
              />

              <div
                id={catErrId}
                role="alert"
                aria-live="polite"
                className="mt-1 text-xs text-red-500"
              >
                {errors.categorySlugs?.message as string}
              </div>
            </div>
          );
        }}
      />

      {/* Description */}
      <div className="group">
        <label
          htmlFor={descId}
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Description (optional)
        </label>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Add details like pace, difficulty, or required gear.
        </p>

        <div className="relative">
          <textarea
            {...register('description')}
            id={descId}
            rows={4}
            maxLength={descMax}
            placeholder="Example: Easy 5k run around the park. Pace 6:00/km."
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? descErrId : undefined}
            spellCheck={true}
            className={[
              'w-full rounded-2xl border px-4 pr-14 py-3.5 text-zinc-900 shadow-inner focus:outline-none focus:ring-2',
              errors.description
                ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
                : 'border-zinc-300 focus:border-zinc-400 focus:ring-indigo-500/40',
              'bg-white placeholder:text-zinc-400',
              'dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-400',
            ].join(' ')}
          />
          <span
            className={[
              'pointer-events-none absolute bottom-2.5 right-3 select-none text-xs',
              descMax - description.length === 0
                ? 'text-red-500'
                : descMax - description.length <= 100
                  ? 'text-amber-500'
                  : 'text-zinc-500 dark:text-zinc-400',
            ].join(' ')}
            aria-hidden="true"
          >
            {Math.max(0, descMax - description.length)} left
          </span>
        </div>

        <div
          className="mt-1 text-xs text-red-500"
          id={descErrId}
          role="alert"
          aria-live="polite"
        >
          {errors.description?.message as string}
        </div>
      </div>

      {/* Info note */}
      <div
        role="note"
        className="flex items-center gap-2 rounded-2xl border border-blue-300/50 bg-blue-50 p-3
               text-blue-700 dark:border-blue-400/30 dark:bg-blue-900/20 dark:text-blue-200"
      >
        <span
          aria-hidden="true"
          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full
                 bg-blue-100/70 text-blue-700 ring-1 ring-blue-300/60
                 dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/30"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="currentColor"
            aria-hidden
          >
            <path d="M11 9h2v2h-2V9zm0 4h2v6h-2v-6z"></path>
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
            10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8
            s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            ></path>
          </svg>
        </span>
        <p className="text-sm leading-[1.25]">
          Clear names, short descriptions and relevant categories improve
          discoverability.
        </p>
      </div>
    </div>
  );
}
