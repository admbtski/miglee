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
import { Modal } from '@/components/feedback/modal';
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
import { PrivacyStep } from './privacy-step';

const STEP_META = [
  { key: 'basics', label: 'What & Who', Icon: SquarePenIcon },
  { key: 'when-where', label: 'When & Where', Icon: CalendarClockIcon },
  { key: 'settings', label: 'Settings', Icon: HatGlassesIcon },
  { key: 'review', label: 'Review', Icon: BadgePlusIcon },
];

const EDIT_STEP_META = [
  { key: 'basics', label: 'What & Who', Icon: SquarePenIcon },
  { key: 'when-where', label: 'When & Where', Icon: CalendarClockIcon },
  { key: 'settings', label: 'Settings', Icon: HatGlassesIcon },
  { key: 'review', label: 'Review', Icon: BadgePlusIcon },
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
        case 0: // What & Who (basics + capacity)
          return await trigger([
            'title',
            'categorySlugs',
            'mode',
            'min',
            'max',
          ]);
        case 1: // When & Where (time + place)
          return await trigger([
            'startAt',
            'endAt',
            'allowJoinLate',
            'location.lat',
            'location.lng',
            'location.address',
            'location.placeId',
            'location.radiusKm',
            'notes',
            'meetingKind',
            'onlineUrl',
          ]);
        case 2: // Settings (privacy)
          return await trigger([
            'visibility',
            'joinMode',
            'levels',
            'addressVisibility',
            'membersVisibility',
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
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <StepIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {isEdit ? 'Edit Event' : 'Create Event'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Step {step + 1} of {steps.length}: {stepLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                Reset
              </button>

              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Stepper */}
          {/* <Stepper
            steps={STEP_META}
            currentIndex={step}
            layout="stacked"
            size="sm"
            dotMode="icon"
          /> */}
        </div>
      }
      content={
        // ← remount całej sekcji pól po „Clear" i przy otwarciu
        <div key={formKey} className="space-y-6">
          {/* Step 0: What & Who (Basics + Capacity) */}
          {step === 0 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Event details
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  Tell us what your event is about and who can join
                </p>
                <BasicsStep form={form} />
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Capacity
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  Set the size of your event
                </p>
                <CapacityStep form={form} />
              </div>
            </div>
          )}

          {/* Step 1: When & Where (Time + Place) */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  When
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  Choose date, time, and duration
                </p>
                <TimeStep
                  form={form}
                  userTzLabel={
                    userTzLabel ??
                    Intl.DateTimeFormat().resolvedOptions().timeZone
                  }
                />
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Where
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  Set the location or online link
                </p>
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
              </div>
            </div>
          )}

          {/* Step 2: Settings (Privacy) */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                Privacy & Access
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Control who can see and join your event
              </p>
              <PrivacyStep form={form} />
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                Review & Create
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Check everything looks good before creating
              </p>
              <ReviewStep
                values={form.getValues()} // po „next" już spłukane
                showMapPreview
              />
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={!(step > 0 && !isSubmitting)}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50
                       dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <span>←</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            {step < steps.length - 1 && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {steps.length - step - 1} step
                {steps.length - step - 1 !== 1 ? 's' : ''} left
              </span>
            )}

            <button
              type="button"
              onClick={step < steps.length - 1 ? next : submit}
              disabled={
                isSubmitting ||
                (step === steps.length - 1 &&
                  (!isValid || (isEdit && !isDirty)))
              }
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                         bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-md hover:shadow-lg"
            >
              {isSubmitting && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              <span>
                {step < steps.length - 1 && 'Continue'}
                {!isEdit &&
                  step === steps.length - 1 &&
                  (isSubmitting ? 'Creating...' : 'Create Event')}
                {isEdit &&
                  step === steps.length - 1 &&
                  (isSubmitting ? 'Saving...' : 'Save Changes')}
              </span>
              {step < steps.length - 1 && <span>→</span>}
            </button>
          </div>
        </div>
      }
    />
  );
}
