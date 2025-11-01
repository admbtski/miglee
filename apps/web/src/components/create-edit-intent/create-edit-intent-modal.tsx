'use client';

import {
  BadgePlusIcon,
  CalendarClockIcon,
  HatGlassesIcon,
  MapPinnedIcon,
  SquarePenIcon,
  UsersIcon,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { Modal } from '../modal/modal';
import { BasicsStep } from './basics-step';
import { CapacityStep } from './capacity-step';
import { useCategorySelection } from './category-selection-provider';
import { PlaceStep } from './place-step';
import { ReviewStep } from './review-step';
import { Stepper } from './stepper';
import { useTagSelection } from './tag-selection-provider';
import { TimeStep } from './time-step';
import { IntentFormValues } from './types';
import { defaultIntentValues, useIntentForm } from './use-intent-form';
import { CategoryOption, TagOption } from '@/types/types';

const STEP_META = [
  { key: 'basics', label: 'Basics', Icon: SquarePenIcon },
  { key: 'capacity', label: 'Capacity', Icon: UsersIcon },
  { key: 'time', label: 'Time', Icon: CalendarClockIcon },
  { key: 'place', label: 'Place', Icon: MapPinnedIcon },
  { key: 'review', label: 'Review', Icon: HatGlassesIcon },
];

const EDIT_STEP_META = [
  { key: 'basics', label: 'Edit basics', Icon: SquarePenIcon },
  { key: 'capacity', label: 'Edit capacity', Icon: UsersIcon },
  { key: 'time', label: 'Edit time', Icon: CalendarClockIcon },
  { key: 'place', label: 'Edit place', Icon: MapPinnedIcon },
  { key: 'review', label: 'Edit review', Icon: HatGlassesIcon },
];

type CreateEditIntentModalProps = {
  open: boolean;
  /** 'create' | 'edit' */
  mode: 'create' | 'edit';
  /** Optional initial values to seed the form (used for "edit") */
  initialValues?: Partial<IntentFormValues>;

  initialCategories?: CategoryOption[];
  initialTags?: TagOption[];
  onClose: () => void;
  /** Unified submit handler. Will be called for both create and edit. */
  onSubmit: (values: IntentFormValues) => Promise<void> | void;
  /** Button label override */
  submitLabel?: string;
  /** Title override */
  titleOverride?: string;
  /** Optional user TZ label to show in TimeStep */
  userTzLabel?: string; // e.g. "Europe/Warsaw (UTC+02:00)"
};

export function CreateEditIntentModal({
  open,
  initialValues,
  initialCategories = [],
  initialTags = [],
  onClose,
  onSubmit,
  mode,
  userTzLabel,
}: CreateEditIntentModalProps) {
  const isEdit = mode === 'edit';
  const steps = isEdit ? EDIT_STEP_META : STEP_META;

  const form = useIntentForm(initialValues);
  const { clear: clearCategories, set: setCategories } = useCategorySelection();
  const { clear: clearTags, set: setTags } = useTagSelection();

  const [step, setStep] = useState(0);
  const [formKey, setFormKey] = useState(0); // ← remount klucz
  const titleId = useId();

  const {
    handleSubmit,
    trigger,
    reset,
    formState: { isValid, isSubmitting, isDirty },
  } = form;

  // Świeże defaulty (żeby daty były „teraz + 5 min”, a nie z importu modułu)
  const makeFreshDefaults = useCallback((): IntentFormValues => {
    const now = Date.now();
    const start = new Date(now + 5 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      ...defaultIntentValues,
      // wszystko jak w defaultIntentValues, ale z nowymi datami
      startAt: start,
      endAt: end,
    };
  }, []);

  // Po otwarciu/zmianie initialValues – zasil form wartościami startowymi
  useEffect(() => {
    if (!open) return;
    reset(
      { ...makeFreshDefaults(), ...(initialValues ?? {}) },
      {
        keepDirty: false,
        keepErrors: false,
        keepTouched: false,
        keepIsSubmitted: false,
        keepSubmitCount: false,
      }
    );
    setCategories(initialCategories);
    setTags(initialCategories);
    setStep(0);
    setFormKey((k) => k + 1); // wymuś remount drzewa pól
  }, [
    open,
    initialValues,
    reset,
    makeFreshDefaults,
    initialCategories,
    initialTags,
  ]);

  // Na zamknięcie – wyczyść providery i stan
  useEffect(() => {
    if (!open) {
      clearTags();
      clearCategories();
      reset();
      setStep(0);
    }
  }, [open, reset, clearTags, clearCategories]);

  // Enter -> next/submit, Shift+Enter -> back (z pominięciem textarea)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'textarea') return;

      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (step < steps.length - 1) {
          void next();
        } else {
          submit();
        }
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        if (step > 0) back();
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, steps.length]);

  const validateStep = useCallback(
    async (index: number) => {
      switch (index) {
        case 0:
          return await trigger(['title', 'categorySlugs']);
        case 1:
          return await trigger(['mode', 'min', 'max']);
        case 2:
          return await trigger(['startAt', 'endAt', 'allowJoinLate']);
        case 3:
          return await trigger([
            'location.lat',
            'location.lng',
            'location.address',
            'location.placeId',
            'location.radiusKm',
            'visibility',
            'notes',
            'meetingKind',
            'onlineUrl',
          ]);
        default:
          return true;
      }
    },
    [trigger]
  );

  const next = useCallback(async () => {
    const ok = await validateStep(step);
    if (!ok) return;
    // flush zmian z ostatniego inputa
    await handleSubmit(() => Promise.resolve())();
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }, [step, validateStep, handleSubmit, steps.length]);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const submit = handleSubmit(
    useCallback(
      async (values) => {
        await onSubmit(values as IntentFormValues);
        onClose();
      },
      [onClose, onSubmit]
    )
  );

  if (!open) return null;

  const { label: stepLabel, Icon: StepIcon } = steps[step] ?? {
    title: 'Create intent',
    Icon: BadgePlusIcon,
  };

  return (
    <Modal
      open={open}
      size="sm"
      onClose={onClose}
      header={
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setStep(0);
                clearCategories();
                clearTags();
                reset(
                  { ...makeFreshDefaults(), ...(initialValues ?? {}) },
                  {
                    keepDirty: false,
                    keepErrors: false,
                    keepTouched: false,
                    keepIsSubmitted: false,
                    keepSubmitCount: false,
                  }
                );
                setCategories(initialCategories);
                setTags(initialTags);
                setFormKey((k) => k + 1); // ← hard reset UI
              }}
              className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-500/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20"
            >
              Clear
            </button>

            <div
              id={titleId}
              className="flex items-center gap-3 text-xl font-medium"
            >
              <StepIcon className="h-5 w-5" />
              {stepLabel}
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 ring-1 ring-transparent hover:bg-zinc-100 focus:outline-none focus:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3">
            <Stepper
              steps={STEP_META}
              currentIndex={step}
              layout="stacked"
              size="md"
              dotMode="icon"
            />
          </div>
        </div>
      }
      content={
        // ← remount całej sekcji pól po „Clear” i przy otwarciu
        <div key={formKey} className="space-y-6">
          {step === 0 && <BasicsStep form={form} />}

          {step === 1 && <CapacityStep form={form} />}

          {step === 2 && (
            <TimeStep
              form={form}
              userTzLabel={
                userTzLabel ?? Intl.DateTimeFormat().resolvedOptions().timeZone
              }
            />
          )}

          {step === 3 && (
            <PlaceStep
              form={form}
              onUseMyLocation={async () => {
                return new Promise<{ lat: number; lng: number } | null>(
                  (resolve) => {
                    if (!navigator.geolocation) return resolve(null);
                    navigator.geolocation.getCurrentPosition(
                      (pos) =>
                        resolve({
                          lat: pos.coords.latitude,
                          lng: pos.coords.longitude,
                        }),
                      () => resolve(null),
                      { enableHighAccuracy: true, timeout: 8000 }
                    );
                  }
                );
              }}
            />
          )}

          {step === 4 && (
            <ReviewStep
              values={form.getValues()} // po „next” już spłukane
              showMapPreview
            />
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            disabled={!(step > 0 && !isSubmitting)}
            className="rounded-2xl border px-4 py-2 text-sm disabled:opacity-50
                       border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Back
          </button>
          <button
            type="button"
            onClick={step < steps.length - 1 ? next : submit}
            disabled={
              isSubmitting ||
              (step === steps.length - 1 && (!isValid || (isEdit && !isDirty)))
            }
            className="rounded-2xl px-4 py-2 text-sm font-medium disabled:opacity-50
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                       bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {step < steps.length - 1 && 'Next'}
            {!isEdit && step === steps.length - 1 && 'Create'}
            {isEdit && step === steps.length - 1 && 'Save changes'}
          </button>
        </div>
      }
    />
  );
}
