'use client';

import { BadgePlusIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BasicsStep } from '@/features/intents/components/basics-step';
import { CapacityStep } from '@/features/intents/components/capacity-step';
import { useCategorySelection } from '@/features/intents/components/category-selection-provider';
import { PlaceStep } from '@/features/intents/components/place-step';
import { ReviewStep } from '@/features/intents/components/review-step';
import { useTagSelection } from '@/features/intents/components/tag-selection-provider';
import { TimeStep } from '@/features/intents/components/time-step';
import { IntentFormValues } from '@/features/intents/components/types';
import {
  defaultIntentValues,
  useIntentForm,
} from '@/features/intents/components/use-intent-form';
import { CategoryOption, TagOption } from '@/types/types';
import { PrivacyStep } from '@/features/intents/components/privacy-step';
import { useAutoSaveDraft } from '@/features/intents/hooks/use-auto-save-draft';
import { JoinFormQuestion } from '@/features/intents/components/join-form-step';
import { toast } from '@/lib/utils';
import { CoverStep } from '@/features/intents/components/cover-step';
import { uploadIntentCover } from '@/lib/media/upload-intent-cover';
import { useQueryClient } from '@tanstack/react-query';
import { DraftRestoreModal } from '@/components/ui/draft-restore-modal';

type StepMeta = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

type IntentCreatorFormProps = {
  initialValues?: Partial<IntentFormValues>;
  initialCategories?: CategoryOption[];
  initialTags?: TagOption[];
  mode: 'create' | 'edit';
  onSubmit: (
    values: IntentFormValues,
    joinFormQuestions?: JoinFormQuestion[],
    coverImageFile?: File | null
  ) => Promise<string | undefined> | string | undefined;
  steps: StepMeta[];
  userTzLabel?: string;
};

/**
 * IntentCreatorForm - Multi-step form for creating/editing intents
 *
 * This is the form component extracted from CreateEditIntentModal
 * but adapted for use in a full-page layout instead of a modal
 */
export function IntentCreatorForm({
  initialValues,
  initialCategories = [],
  initialTags = [],
  onSubmit,
  mode,
  steps,
  userTzLabel,
}: IntentCreatorFormProps) {
  const isEdit = mode === 'edit';
  const isInitialMount = useRef(true);

  const form = useIntentForm(initialValues);
  const { set: setCategories } = useCategorySelection();
  const { set: setTags } = useTagSelection();

  const [step, setStep] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [joinFormQuestions, setJoinFormQuestions] = useState<
    JoinFormQuestion[]
  >([]);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftData, setDraftData] = useState<{
    savedAt: Date;
    values: IntentFormValues;
    categories?: CategoryOption[];
    tags?: TagOption[];
  } | null>(null);

  const {
    handleSubmit,
    trigger,
    reset,
    watch,
    formState: { isValid, isSubmitting, isDirty },
  } = form;

  // Get current categories and tags for auto-save
  const { selected: currentCategories } = useCategorySelection();
  const { selected: currentTags } = useTagSelection();

  // Auto-save draft (only for create mode)
  const { lastSaved, isSaving, loadDraft, clearDraft } = useAutoSaveDraft(
    watch(),
    isDirty,
    !isEdit,
    currentCategories,
    currentTags
  );

  // Fresh defaults (so dates are "now + 5 min", not from module import)
  const makeFreshDefaults = useCallback((): IntentFormValues => {
    const now = Date.now();
    const start = new Date(now + 5 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      ...defaultIntentValues,
      startAt: start,
      endAt: end,
    };
  }, []);

  // Initialize form with values on mount only
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    // Check for draft (only in create mode)
    if (!isEdit) {
      const draft = loadDraft();
      if (draft) {
        // Show draft restore modal
        setDraftData({
          savedAt: new Date(draft.savedAt),
          values: draft.values,
          categories: draft.categories,
          tags: draft.tags,
        });
        setShowDraftModal(true);
        return;
      }
    }

    // Initialize with provided values or fresh defaults
    const initialFormValues = initialValues
      ? { ...makeFreshDefaults(), ...initialValues }
      : makeFreshDefaults();

    reset(initialFormValues, {
      keepDirty: false,
      keepErrors: false,
      keepTouched: false,
      keepIsSubmitted: false,
      keepSubmitCount: false,
    });
    setCategories(initialCategories);
    setTags(initialTags);
    setStep(0);
    setFormKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts:
  // - Enter: next/submit (skip in textarea)
  // - Shift+Enter: back
  // - Cmd/Ctrl+Enter: next/submit (works everywhere)
  // - Cmd/Ctrl+Shift+Enter: back (works everywhere)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+Enter -> next/submit (works everywhere, including textarea)
      if (e.key === 'Enter' && isCmdOrCtrl && !e.shiftKey) {
        e.preventDefault();
        if (step < steps.length - 1) {
          void next();
        } else {
          submit();
        }
        return;
      }

      // Cmd/Ctrl+Shift+Enter -> back (works everywhere)
      if (e.key === 'Enter' && isCmdOrCtrl && e.shiftKey) {
        e.preventDefault();
        if (step > 0) back();
        return;
      }

      // Regular Enter (skip in textarea)
      if (tag === 'textarea') return;

      if (e.key === 'Enter' && !e.shiftKey && !isCmdOrCtrl) {
        e.preventDefault();
        if (step < steps.length - 1) {
          void next();
        } else {
          submit();
        }
      } else if (e.key === 'Enter' && e.shiftKey && !isCmdOrCtrl) {
        e.preventDefault();
        if (step > 0) back();
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [step, steps.length]);

  const validateStep = useCallback(
    async (index: number) => {
      switch (index) {
        case 0: // Event Details (basics)
          return await trigger(['title', 'categorySlugs', 'mode']);
        case 1: // Capacity
          return await trigger(['min', 'max']);
        case 2: // When (time)
          return await trigger(['startAt', 'endAt', 'allowJoinLate']);
        case 3: // Where (place)
          return await trigger([
            'location.lat',
            'location.lng',
            'location.address',
            'location.placeId',
            'location.radiusKm',
            'notes',
            'meetingKind',
            'onlineUrl',
          ]);
        case 4: // Settings (privacy + join form)
          return await trigger([
            'visibility',
            'joinMode',
            'levels',
            'addressVisibility',
            'membersVisibility',
          ]);
        case 5: // Cover Image (optional, always valid)
          return true;
        default:
          return true;
      }
    },
    [trigger]
  );

  const next = useCallback(async () => {
    const ok = await validateStep(step);
    if (!ok) return;
    // flush changes from last input
    await handleSubmit(() => Promise.resolve())();
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }, [step, validateStep, handleSubmit, steps.length]);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const queryClient = useQueryClient();

  // Cover image handlers
  const handleCoverImageSelected = (file: File) => {
    setCoverImageFile(file);
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverImageRemove = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
  };

  // Draft modal handlers
  const handleRestoreDraft = () => {
    if (!draftData) return;

    reset(draftData.values, {
      keepDirty: true,
      keepErrors: false,
      keepTouched: false,
      keepIsSubmitted: false,
      keepSubmitCount: false,
    });

    // Restore categories and tags from draft
    if (draftData.categories && draftData.categories.length > 0) {
      setCategories(draftData.categories, 3);
    }
    if (draftData.tags && draftData.tags.length > 0) {
      setTags(draftData.tags, 3);
    }

    setStep(0);
    setFormKey((k) => k + 1);
    setShowDraftModal(false);
    setDraftData(null);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftModal(false);
    setDraftData(null);

    // Initialize with fresh defaults
    const initialFormValues = initialValues
      ? { ...makeFreshDefaults(), ...initialValues }
      : makeFreshDefaults();

    reset(initialFormValues, {
      keepDirty: false,
      keepErrors: false,
      keepTouched: false,
      keepIsSubmitted: false,
      keepSubmitCount: false,
    });
    setCategories(initialCategories);
    setTags(initialTags);
    setStep(0);
    setFormKey((k) => k + 1);
  };

  const submit = handleSubmit(
    useCallback(
      async (values) => {
        try {
          const resultIntentId = await onSubmit(
            values as IntentFormValues,
            isEdit ? undefined : joinFormQuestions,
            coverImageFile
          );

          // If we have a cover image, upload it
          if (resultIntentId && coverImageFile) {
            console.log('[Submit] Intent created:', resultIntentId);
            console.log('[Submit] Uploading cover image...');

            try {
              await uploadIntentCover(resultIntentId, coverImageFile, {
                onStart: () => setIsCoverUploading(true),
                onSuccess: () => {
                  console.log('[Submit] Cover upload completed successfully!');
                  // Invalidate queries to refresh Intent data
                  queryClient.invalidateQueries({
                    queryKey: ['GetIntent', resultIntentId],
                  });
                  queryClient.invalidateQueries({ queryKey: ['GetIntents'] });
                  // Reset cover state
                  setCoverImageFile(null);
                  setCoverImagePreview(null);
                  toast.success('Cover został dodany pomyślnie');
                },
                onError: (error) => {
                  console.error('[Submit] Cover upload failed:', error);
                  toast.error(
                    'Event utworzony, ale nie udało się dodać covera',
                    {
                      description:
                        'Możesz spróbować dodać cover później z ustawień eventu',
                    }
                  );
                },
                onFinally: () => setIsCoverUploading(false),
              });
            } catch (uploadErr) {
              // Error already handled in callbacks
              console.error('[Submit] Cover upload error:', uploadErr);
            }
          }

          // Clear draft after successful submit
          if (!isEdit) {
            clearDraft();
          }
        } catch (error) {
          console.error('[Submit] Failed to create intent:', error);
          // Error is already handled by onSubmit
        }
      },
      [
        onSubmit,
        isEdit,
        clearDraft,
        joinFormQuestions,
        coverImageFile,
        queryClient,
      ]
    )
  );

  const { label: stepLabel, Icon: StepIcon } = steps[step] ?? {
    label: 'Create intent',
    Icon: BadgePlusIcon,
  };

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <StepIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {stepLabel}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Step {step + 1} of {steps.length}
              </p>
            </div>
          </div>

          {!isEdit && lastSaved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Draft saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {!isEdit && isSaving && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Saving...
            </span>
          )}
        </div>
      </div>

      {/* Form content */}
      <div key={formKey} className="space-y-6">
        {/* Step 0: Event Details (Basics) */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Event Details
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Tell us what your event is about
              </p>
            </div>
            <BasicsStep form={form} />
          </div>
        )}

        {/* Step 1: Capacity */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Capacity
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Set the size of your event
              </p>
            </div>
            <CapacityStep form={form} />
          </div>
        )}

        {/* Step 2: When (Time) */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                When
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Choose date, time, and duration
              </p>
            </div>
            <TimeStep
              form={form}
              userTzLabel={
                userTzLabel ?? Intl.DateTimeFormat().resolvedOptions().timeZone
              }
            />
          </div>
        )}

        {/* Step 3: Where (Place) */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Where
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Set the location or online link
              </p>
            </div>
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
        )}

        {/* Step 4: Settings (Privacy + Join Form) */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Privacy & Access
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Control who can see and join your event
              </p>
            </div>
            <PrivacyStep
              form={form}
              joinFormQuestions={!isEdit ? joinFormQuestions : undefined}
              onJoinFormQuestionsChange={
                !isEdit ? setJoinFormQuestions : undefined
              }
            />
          </div>
        )}

        {/* Step 5: Cover Image */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Cover Image
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Add a cover image for your event (optional but recommended)
              </p>
            </div>
            <CoverStep
              coverPreview={coverImagePreview}
              isUploading={isCoverUploading}
              onImageSelected={handleCoverImageSelected}
              onImageRemove={handleCoverImageRemove}
            />
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Review & {isEdit ? 'Save' : 'Create'}
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Check everything looks good before{' '}
                {isEdit ? 'saving' : 'creating'}
              </p>
            </div>
            <ReviewStep
              values={form.getValues()}
              showMapPreview
              errors={form.formState.errors}
              onEditStep={(stepIndex) => setStep(stepIndex)}
              joinFormQuestions={isEdit ? undefined : joinFormQuestions}
            />
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={back}
          disabled={!(step > 0 && !isSubmitting)}
          className="flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40
                     border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400
                     dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:border-zinc-600
                     shadow-sm hover:shadow"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        <div className="flex items-center gap-4">
          {step < steps.length - 1 && (
            <div className="text-center">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {steps.length - step - 1} step
                {steps.length - step - 1 !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={step < steps.length - 1 ? next : submit}
            disabled={
              isSubmitting ||
              (step === steps.length - 1 && (!isValid || (isEdit && !isDirty)))
            }
            className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50
                       bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-500 hover:to-violet-500
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                       transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting && (
              <svg
                className="h-4 w-4 animate-spin"
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

      {/* Draft Restore Modal */}
      {draftData && (
        <DraftRestoreModal
          open={showDraftModal}
          onClose={() => setShowDraftModal(false)}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
          draftDate={draftData.savedAt}
          draftPreview={{
            title: draftData.values.title,
            description: draftData.values.description,
          }}
        />
      )}
    </div>
  );
}
