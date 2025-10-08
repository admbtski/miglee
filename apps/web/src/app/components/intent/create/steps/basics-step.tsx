'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Controller, UseFormReturn } from 'react-hook-form';
import { useEffect, useId } from 'react';
import { User, Users } from 'lucide-react';
import { IntentFormValues } from '../../types';
import { CategoryCombo } from '../components/category-combobox';
import { RangeSlider } from '../components/range-slider';

export function BasicsStep({
  form,
  interests,
}: {
  form: UseFormReturn<IntentFormValues>;
  interests: Array<{ id: string; name: string }>;
}) {
  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const prefersReducedMotion = useReducedMotion();

  const titleId = useId();
  const titleErrId = useId();
  const catId = useId();
  const catErrId = useId();
  const descId = useId();
  const descErrId = useId();
  const capErrId = useId();

  const mode = watch('mode');
  const title = watch('title') ?? '';
  const description = watch('description') ?? '';
  const minVal = watch('min');
  const maxVal = watch('max');

  useEffect(() => {
    if (mode === 'ONE_TO_ONE') {
      setValue('min', 2, { shouldDirty: true });
      setValue('max', 2, { shouldDirty: true });
    } else if (mode === 'GROUP') {
      setValue('min', 2, { shouldDirty: true });
      setValue('max', 50, { shouldDirty: true });
    }
    void trigger(['min', 'max']);
  }, [mode, setValue, trigger]);

  const errorVariants = {
    initial: { opacity: 0, height: 0, y: -4 },
    animate: {
      opacity: 1,
      height: 'auto',
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.18 },
    },
    exit: {
      opacity: 0,
      height: 0,
      y: -4,
      transition: { duration: prefersReducedMotion ? 0 : 0.15 },
    },
  };
  console.log(mode);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
      className="space-y-4"
    >
      {/* Title */}
      <div className="group">
        <label
          htmlFor={titleId}
          className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <input
          {...register('title')}
          id={titleId}
          maxLength={60}
          placeholder="Short, catchy title"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? titleErrId : undefined}
          className={[
            'w-full rounded-2xl border px-4 py-3.5 text-base shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/40',
            'bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-300 focus:border-zinc-400',
            'dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-800 dark:focus:border-zinc-700',
          ].join(' ')}
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <AnimatePresence initial={false} mode="wait">
            {errors.title && (
              <motion.span
                id={titleErrId}
                role="alert"
                aria-live="polite"
                className="text-red-500"
                variants={errorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {errors.title.message as string}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-zinc-500 dark:text-zinc-400">
            {title.length}/60
          </span>
        </div>
      </div>

      {/* Category */}
      <Controller
        name="interestId"
        control={form.control}
        render={({ field }) => {
          const selectedId = field.value ?? null;
          const selectedLabel =
            interests.find((i) => i.id === selectedId)?.name ?? null;

          return (
            <div className="group">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Category
              </label>

              <CategoryCombo
                value={selectedId}
                onChange={(id) => field.onChange(id)}
                initialOptions={interests}
                selectedLabelOverride={selectedLabel}
                placeholder="Search category…"
              />

              <AnimatePresence initial={false} mode="wait">
                {errors.interestId && (
                  <motion.div
                    id={catErrId}
                    role="alert"
                    aria-live="polite"
                    className="mt-1 text-xs text-red-500"
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                  >
                    {errors.interestId.message as string}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }}
      />

      {/* Description */}
      <div className="group">
        <label
          htmlFor={descId}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Description (optional)
        </label>
        <textarea
          {...register('description')}
          id={descId}
          rows={4}
          maxLength={500}
          placeholder="Example: Easy 5k run around the park. Pace 6:00/km."
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? descErrId : undefined}
          className="w-full rounded-2xl border px-4 py-3.5 border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <AnimatePresence initial={false} mode="wait">
            {errors.description && (
              <motion.span
                id={descErrId}
                role="alert"
                aria-live="polite"
                className="text-red-500"
                variants={errorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {errors.description.message as string}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-zinc-500 dark:text-zinc-400">
            {description.length}/500
          </span>
        </div>
      </div>

      {/* Mode (segmented) */}
      <Controller
        name="mode"
        control={form.control}
        render={({ field }) => {
          const value = field.value;
          const is1to1 = value === 'ONE_TO_ONE';
          const isGroup = value === 'GROUP';

          return (
            <div role="radiogroup" aria-label="Mode">
              <div
                className="
            relative grid grid-cols-2 items-center gap-1 p-1
            rounded-2xl border bg-white/60 shadow-sm
            border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40
          "
              >
                {/* animowana pigułka tła */}
                <motion.div
                  layoutId="modePill"
                  className="
              absolute top-1 bottom-1 w-[calc(50%-4px)]
              rounded-xl
              bg-gradient-to-br from-indigo-500 to-indigo-600
              dark:from-indigo-400 dark:to-indigo-500
              shadow-[0_8px_24px_rgba(79,70,229,0.25)]
            "
                  style={{
                    left: is1to1 ? 4 : undefined,
                    right: isGroup ? 4 : undefined,
                  }}
                  initial={false}
                  transition={
                    useReducedMotion()
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                          mass: 0.5,
                        }
                  }
                />

                {/* ONE_TO_ONE */}
                <div className="relative z-10">
                  <input
                    id="mode-one"
                    className="sr-only peer"
                    type="radio"
                    name={field.name}
                    value="ONE_TO_ONE"
                    checked={is1to1}
                    onChange={() => field.onChange('ONE_TO_ONE')}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                  <motion.label
                    htmlFor="mode-one"
                    whileTap={!useReducedMotion() ? { scale: 0.98 } : {}}
                    onClick={() => field.onChange('ONE_TO_ONE')}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500/40"
                  >
                    <motion.span
                      animate={
                        is1to1 ? { scale: 1, y: 0 } : { scale: 0.96, y: 1 }
                      }
                      transition={{ duration: useReducedMotion() ? 0 : 0.18 }}
                      className={[
                        'grid h-8 w-8 place-items-center rounded-full ring-1 ring-inset',
                        is1to1
                          ? 'bg-white/95 text-indigo-700 ring-white/40 dark:bg-zinc-950/90 dark:text-indigo-100 dark:ring-zinc-700'
                          : 'bg-indigo-600/10 text-indigo-600 ring-zinc-200 dark:ring-zinc-700',
                      ].join(' ')}
                      aria-hidden
                    >
                      <User className="h-4 w-4" />
                    </motion.span>
                    <span
                      className={
                        is1to1
                          ? 'font-medium text-white'
                          : 'font-medium text-zinc-800 dark:text-zinc-100'
                      }
                    >
                      1:1
                    </span>
                  </motion.label>
                </div>

                {/* GROUP */}
                <div className="relative z-10">
                  <input
                    id="mode-group"
                    className="sr-only peer"
                    type="radio"
                    name={field.name}
                    value="GROUP"
                    checked={isGroup}
                    onChange={() => field.onChange('GROUP')}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                  <motion.label
                    htmlFor="mode-group"
                    whileTap={!useReducedMotion() ? { scale: 0.98 } : {}}
                    onClick={() => field.onChange('GROUP')}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500/40"
                  >
                    <motion.span
                      animate={
                        isGroup ? { scale: 1, y: 0 } : { scale: 0.96, y: 1 }
                      }
                      transition={{ duration: useReducedMotion() ? 0 : 0.18 }}
                      className={[
                        'grid h-8 w-8 place-items-center rounded-full ring-1 ring-inset',
                        isGroup
                          ? 'bg-white/95 text-indigo-700 ring-white/40 dark:bg-zinc-950/90 dark:text-indigo-100 dark:ring-zinc-700'
                          : 'bg-indigo-600/10 text-indigo-600 ring-zinc-200 dark:ring-zinc-700',
                      ].join(' ')}
                      aria-hidden
                    >
                      <Users className="h-4 w-4" />
                    </motion.span>
                    <span
                      className={
                        isGroup
                          ? 'font-medium text-white'
                          : 'font-medium text-zinc-800 dark:text-zinc-100'
                      }
                    >
                      Group
                    </span>
                  </motion.label>
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Capacity (hidden for 1:1) */}
      <AnimatePresence initial={false} mode="wait">
        {mode === 'GROUP' && (
          <motion.div
            key="cap-range"
            className="group"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          >
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Capacity
            </label>

            <RangeSlider
              value={[minVal ?? 2, maxVal ?? 50]}
              min={2}
              max={50}
              step={1}
              onChange={([a, b]) => {
                setValue('min', a, { shouldDirty: true, shouldValidate: true });
                setValue('max', b, { shouldDirty: true, shouldValidate: true });
              }}
              aria-invalid={!!(errors.min || errors.max)}
              aria-describedby={errors.min || errors.max ? capErrId : undefined}
              className="mt-1"
            />

            <div className="mt-2 flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300">
              <span>
                {minVal} – {maxVal}
              </span>
            </div>

            <AnimatePresence initial={false} mode="wait">
              {(errors.min || errors.max) && (
                <motion.div
                  id={capErrId}
                  role="alert"
                  aria-live="polite"
                  className="mt-1 text-xs text-red-500"
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                >
                  {String(
                    (errors.min?.message as string) ??
                      (errors.max?.message as string)
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
