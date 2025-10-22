'use client';

import {
  MeetingKind,
  Mode,
  Visibility,
} from '@/libs/graphql/__generated__/react-query-update';
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
import { CreateIntentInput } from './types';
import { useIntentForm } from './use-intent-form';

const STEP_META = [
  { key: 'basics', label: 'Basics', Icon: SquarePenIcon },
  { key: 'capacity', label: 'Capacity', Icon: UsersIcon },
  { key: 'time', label: 'Time', Icon: CalendarClockIcon },
  { key: 'place', label: 'Place', Icon: MapPinnedIcon },
  { key: 'review', label: 'Review', Icon: HatGlassesIcon },
] as const;

const STEPS = STEP_META.map(({ label }) => label);

export function CreateIntentModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateIntentInput) => Promise<void> | void;
}) {
  const form = useIntentForm();
  const { selected: selectedCategories, clear: clearCategories } =
    useCategorySelection();
  const { selected: selectedTags, clear: clearTags } = useTagSelection();

  const [step, setStep] = useState(0);
  const titleId = useId();

  const {
    handleSubmit,
    trigger,
    reset,
    formState: { isValid, isSubmitting },
  } = form;

  // Reset on close
  useEffect(() => {
    if (!open) {
      clearTags();
      clearCategories();
      reset();
      setStep(0);
    }
  }, [open, reset, clearTags, clearCategories]);

  // Keyboard shortcuts: Enter -> next/submit, Shift+Enter -> back
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (step < STEPS.length - 1) {
          void next();
        } else {
          submit();
        }
      }
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        if (step > 0) back();
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step]); // step intentionally included

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
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, validateStep]);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  if (!open) return null;

  // Submit handler with strong trimming + stable mapping
  const submit = handleSubmit(
    useCallback(
      async (values) => {
        const input: CreateIntentInput = {
          title: values.title,
          categorySlugs: selectedCategories.map((c) => c.slug),
          tagSlugs: selectedTags.map((t) => t.slug),
          startAt: values.startAt.toISOString(),
          endAt: values.endAt.toISOString(),
          allowJoinLate: values.allowJoinLate,
          min: values.min,
          max: values.max,
          mode: values.mode as Mode,
          meetingKind: values.meetingKind as MeetingKind,
          location: {},
          visibility: values.visibility as Visibility,
          description: values.description,
          notes: values.notes,
          onlineUrl: values.onlineUrl,
        };

        if (values.description?.trim())
          input.description = values.description.trim();
        if (values.onlineUrl?.trim()) input.onlineUrl = values.onlineUrl.trim();
        if (values.notes?.trim()) input.notes = values.notes.trim();

        if (values.location.lat != null)
          input.location.lat = values.location.lat;
        if (values.location.lng != null)
          input.location.lng = values.location.lng;
        if (values.location.address?.trim())
          input.location.address = values.location.address.trim();
        if (values.location.radiusKm != null)
          input.location.radiusKm = values.location.radiusKm;
        if (values.location.placeId?.trim())
          input.location.placeId = values.location.placeId.trim();

        await onCreate(input);
        // SUCCESS UX moved to SuccessIntentModal; just close the form here
        onClose();
      },
      [onClose, onCreate, selectedCategories, selectedTags]
    )
  );

  const { label: stepLabel, Icon: StepIcon } = STEP_META[step] ?? {
    title: 'Create intent',
    Icon: BadgePlusIcon,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setStep(0);
                reset();
                clearCategories();
                clearTags();
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
              steps={STEP_META as any}
              currentIndex={step}
              layout="stacked"
              size="md"
              dotMode="icon"
            />
          </div>
        </div>
      }
      content={
        <div className="space-y-6">
          {step === 0 && <BasicsStep form={form} />}

          {step === 1 && <CapacityStep form={form} />}

          {step === 2 && (
            <TimeStep
              form={form}
              userTzLabel={Intl.DateTimeFormat().resolvedOptions().timeZone}
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
            <ReviewStep values={form.getValues()} showMapPreview />
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
            onClick={step < STEPS.length - 1 ? next : submit}
            disabled={isSubmitting || (step === STEPS.length - 1 && !isValid)}
            className="rounded-2xl px-4 py-2 text-sm font-medium disabled:opacity-50
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                       bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {step < STEPS.length - 1 ? 'Next' : 'Create'}
          </button>
        </div>
      }
    />
  );
}
