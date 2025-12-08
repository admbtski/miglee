'use client';

import { Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCategorySelection } from '@/features/intents/components/category-selection-provider';
import { SimpleIntentFormValues } from '@/features/intents/components/types';
import {
  defaultSimpleIntentValues,
  useSimpleIntentForm,
} from '@/features/intents/components/use-intent-form';
import { CategoryOption } from '@/features/categories';
import { useAutoSaveDraft } from '@/features/intents/hooks/use-auto-save-draft';
import { toast } from '@/lib/utils';
import { uploadIntentCover } from '@/lib/media/upload-intent-cover';
import { useQueryClient } from '@tanstack/react-query';
import { DraftRestoreModal } from '@/components/ui/draft-restore-modal';

// Step components
import { SimpleBasicsStep } from './steps/simple-basics-step';
import { SimpleScheduleStep } from './steps/simple-schedule-step';
import { SimpleLocationStep } from './steps/simple-location-step';
import { SimpleCapacityStep } from './steps/simple-capacity-step';
import { SimplePrivacyStep } from './steps/simple-privacy-step';
import { SimpleCoverStep } from './steps/simple-cover-step';
import { SimpleReviewStep } from './steps/simple-review-step';

type StepMeta = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

type SimpleCreatorFormProps = {
  onSubmit: (
    values: SimpleIntentFormValues,
    coverImageFile?: File | null
  ) => Promise<string | undefined> | string | undefined;
  steps: StepMeta[];
};

/**
 * SimpleCreatorForm - Lightweight multi-step form for quick event creation
 *
 * Features:
 * - 7 simple steps with max 4 decisions each
 * - Auto-save draft
 * - Quick presets for common choices
 * - Keyboard navigation (Enter/Shift+Enter)
 */
// Fresh defaults (so dates are "now + 5 min", not from module import)
const makeFreshDefaults = (): SimpleIntentFormValues => {
  const now = Date.now();
  const start = new Date(now + 5 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    ...defaultSimpleIntentValues,
    startAt: start,
    endAt: end,
  };
};

export function SimpleCreatorForm({ onSubmit, steps }: SimpleCreatorFormProps) {
  const isInitialMount = useRef(true);

  // Initialize form with fresh dates (not stale module-level defaults)
  const form = useSimpleIntentForm(makeFreshDefaults());
  const { set: setCategories, selected: currentCategories } =
    useCategorySelection();

  const [step, setStep] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftData, setDraftData] = useState<{
    savedAt: Date;
    values: SimpleIntentFormValues;
    categories?: CategoryOption[];
  } | null>(null);

  const {
    handleSubmit,
    trigger,
    reset,
    watch,
    formState: { isValid, isSubmitting, isDirty },
  } = form;

  const queryClient = useQueryClient();

  // Auto-save draft (simplified - no tags in new creator)
  const { lastSaved, isSaving, loadDraft, clearDraft } = useAutoSaveDraft(
    watch(),
    isDirty,
    true, // Always enabled for create mode
    currentCategories,
    [] // No tags in simplified creator
  );

  // Initialize form with values on mount only
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    // Check for draft
    const draft = loadDraft();
    if (draft) {
      // Show draft restore modal
      setDraftData({
        savedAt: new Date(draft.savedAt),
        values: draft.values as SimpleIntentFormValues,
        categories: draft.categories,
      });
      setShowDraftModal(true);
      return;
    }

    // Initialize with fresh defaults
    const initialFormValues = makeFreshDefaults();

    reset(initialFormValues, {
      keepDirty: false,
      keepErrors: false,
      keepTouched: false,
      keepIsSubmitted: false,
      keepSubmitCount: false,
    });
    setCategories([], 3);
    setStep(0);
    setFormKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+Enter -> next/submit
      if (e.key === 'Enter' && isCmdOrCtrl && !e.shiftKey) {
        e.preventDefault();
        if (step < steps.length - 1) {
          void next();
        } else {
          submit();
        }
        return;
      }

      // Cmd/Ctrl+Shift+Enter -> back
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
        case 0: // Basics
          return await trigger(['title', 'categorySlugs']);
        case 1: // Schedule
          return await trigger(['startAt', 'endAt']);
        case 2: // Location
          return await trigger([
            'meetingKind',
            'location.address',
            'onlineUrl',
          ]);
        case 3: // Capacity
          return await trigger(['mode', 'min', 'max']);
        case 4: // Privacy
          return await trigger(['visibility', 'joinMode']);
        case 5: // Cover (optional, always valid)
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
    await handleSubmit(() => Promise.resolve())();
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }, [step, validateStep, handleSubmit, steps.length]);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  // Cover image handlers
  const handleCoverImageSelected = (file: File) => {
    setCoverImageFile(file);
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

    if (draftData.categories && draftData.categories.length > 0) {
      setCategories(draftData.categories, 3);
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

    const initialFormValues = makeFreshDefaults();

    reset(initialFormValues, {
      keepDirty: false,
      keepErrors: false,
      keepTouched: false,
      keepIsSubmitted: false,
      keepSubmitCount: false,
    });
    setCategories([], 3);
    setStep(0);
    setFormKey((k) => k + 1);
  };

  const submit = handleSubmit(
    useCallback(
      async (values) => {
        try {
          const resultIntentId = await onSubmit(
            values as SimpleIntentFormValues,
            coverImageFile
          );

          // If we have a cover image, upload it
          if (resultIntentId && coverImageFile) {
            try {
              await uploadIntentCover(resultIntentId, coverImageFile, {
                onStart: () => setIsCoverUploading(true),
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: ['GetIntent', resultIntentId],
                  });
                  queryClient.invalidateQueries({ queryKey: ['GetIntents'] });
                  setCoverImageFile(null);
                  setCoverImagePreview(null);
                  toast.success('Okładka została dodana');
                },
                onError: (error) => {
                  console.error('[Submit] Cover upload failed:', error);
                  toast.error(
                    'Wydarzenie utworzone, ale nie udało się dodać okładki',
                    {
                      description:
                        'Możesz dodać okładkę później w panelu wydarzenia',
                    }
                  );
                },
                onFinally: () => setIsCoverUploading(false),
              });
            } catch (uploadErr) {
              console.error('[Submit] Cover upload error:', uploadErr);
            }
          }

          // Clear draft after successful submit
          clearDraft();
        } catch (error) {
          console.error('[Submit] Failed to create intent:', error);
        }
      },
      [onSubmit, clearDraft, coverImageFile, queryClient]
    )
  );

  const { label: stepLabel, Icon: StepIcon } = steps[step] ?? {
    label: 'Stwórz wydarzenie',
    Icon: Sparkles,
  };

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="relative w-full h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full transition-all duration-500 ease-out shadow-sm bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {stepLabel}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Krok {step + 1} z {steps.length}
              </p>
            </div>
          </div>

          {lastSaved && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              ✓ Zapisano {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isSaving && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Zapisywanie...
            </span>
          )}
        </div>
      </div>

      {/* Form content */}
      <div
        key={formKey}
        className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm dark:bg-zinc-900/50 dark:border-zinc-800"
      >
        {/* Step 0: Basics */}
        {step === 0 && <SimpleBasicsStep form={form} />}

        {/* Step 1: Schedule */}
        {step === 1 && <SimpleScheduleStep form={form} />}

        {/* Step 2: Location */}
        {step === 2 && <SimpleLocationStep form={form} />}

        {/* Step 3: Capacity */}
        {step === 3 && <SimpleCapacityStep form={form} />}

        {/* Step 4: Privacy */}
        {step === 4 && <SimplePrivacyStep form={form} />}

        {/* Step 5: Cover */}
        {step === 5 && (
          <SimpleCoverStep
            coverPreview={coverImagePreview}
            isUploading={isCoverUploading}
            onImageSelected={handleCoverImageSelected}
            onImageRemove={handleCoverImageRemove}
          />
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <SimpleReviewStep
            values={form.getValues()}
            coverPreview={coverImagePreview}
            onEditStep={(stepIndex: number) => setStep(stepIndex)}
          />
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={back}
          disabled={!(step > 0 && !isSubmitting)}
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all bg-white border shadow-sm rounded-xl disabled:cursor-not-allowed disabled:opacity-40 border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:border-zinc-600 hover:shadow"
        >
          <span>←</span>
          <span>Wstecz</span>
        </button>

        <div className="flex items-center gap-4">
          {step < steps.length - 1 && (
            <div className="text-center hidden sm:block">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {steps.length - step - 1} krok
                {steps.length - step - 1 !== 1 ? 'i' : ''} pozostało
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={step < steps.length - 1 ? next : submit}
            disabled={isSubmitting || (step === steps.length - 1 && !isValid)}
            className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50
                       bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-500 hover:to-purple-500
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                       transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting && (
              <svg
                className="w-4 h-4 animate-spin"
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
              {step < steps.length - 1 && 'Dalej'}
              {step === steps.length - 1 &&
                (isSubmitting ? 'Tworzenie...' : 'Utwórz wydarzenie')}
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
