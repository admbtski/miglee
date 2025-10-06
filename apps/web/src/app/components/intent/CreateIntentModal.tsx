'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useId, useMemo, useState } from 'react';
import { BasicsStep } from './BasicsStep';
import { PlaceStep } from './PlaceStep';
import { ReviewStep } from './ReviewStep';
import { StepFooter } from './StepFooter';
import { StepHeader } from './StepHeader';
import { Stepper } from './Stepper';
import { TimeStep } from './TimeStep';
import { CreateIntentInput, IntentSuggestion } from './types';
import { IntentFormValues, useIntentForm } from './useIntentForm';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', duration: 0.5, bounce: 0.28 },
  },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.2 } },
} as const;

const panelVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', duration: 0.45, bounce: 0.25 },
  },
  exit: { opacity: 0, x: -12, transition: { duration: 0.18 } },
} as const;

const STEPS = ['Basics', 'Time', 'Place', 'Review'] as const;

export function CreateIntentModal({
  open,
  onClose,
  onCreate,
  interests,
  fetchSuggestions, // async: (values) => Promise<IntentSuggestion[]>
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateIntentInput) => Promise<void> | void;
  interests: Array<{ id: string; name: string }>;
  fetchSuggestions?: (v: IntentFormValues) => Promise<IntentSuggestion[]>;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [step, setStep] = useState(0);
  const titleId = useId();
  const descId = useId();

  // RHF form for all steps
  const form = useIntentForm();
  const {
    handleSubmit,
    trigger,
    getValues,
    formState: { isValid, isSubmitting },
  } = form;

  // Suggestions state for anti-duplication
  const [suggestions, setSuggestions] = useState<IntentSuggestion[]>([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    string | null
  >(null);

  // Mount/unmount for smooth exit
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Scroll lock with compensation (no layout jump if scrollbar present)
  useEffect(() => {
    const { overflow, paddingRight } = document.body.style;
    if (mounted) {
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [mounted]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Enter -> Next/Publish ; Shift+Enter -> Back
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (step < STEPS.length - 1) next();
        else submit();
      }
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        if (step > 0) back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step transitions with per-step validation
  const validateStep = async (index: number) => {
    switch (index) {
      case 0: // Basics
        return await trigger(['title', 'interestId', 'mode', 'min', 'max']);
      case 1: // Time
        return await trigger(['startAt', 'endAt', 'allowJoinLate']);
      case 2: // Place
        return await trigger([
          'location.lat',
          'location.lng',
          'visibility',
          'notes',
          'location.address',
          'location.radiusKm',
        ]);
      default:
        return true;
    }
  };

  const next = async () => {
    const ok = await validateStep(step);
    if (!ok) return;
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    setStep(nextStep);

    // On entering Review step, fetch suggestions for anti-duplication
    if (nextStep === 3 && fetchSuggestions) {
      const values = getValues();
      const list = await fetchSuggestions(values);
      setSuggestions(list);
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = handleSubmit(async (values) => {
    // If a suggestion is selected, here you could branch to "join" flow instead of creating
    // For now, we still allow create; hook your logic as needed.
    const input: CreateIntentInput = {
      title: values.title,
      interestId: values.interestId,
      description: values.description || undefined,
      startAt: values.startAt.toISOString(),
      endAt: values.endAt.toISOString(),
      allowJoinLate: values.allowJoinLate,
      min: values.min,
      max: values.max,
      mode: values.mode,
      location: {
        lat: values.location.lat,
        lng: values.location.lng,
        address: values.location.address || undefined,
        radiusKm: values.location.radiusKm || 0,
      },
      visibility: values.visibility,
      notes: values.notes || undefined,
    };
    await onCreate(input);
    onClose();
    const confetti = (await import('canvas-confetti')).default;
    confetti({
      particleCount: 140,
      spread: 70,
      startVelocity: 45,
      scalar: 0.9,
      origin: { y: 0.65 },
    });
    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 60,
        startVelocity: 35,
        scalar: 0.8,
        origin: { x: 0.2, y: 0.7 },
      });
      confetti({
        particleCount: 90,
        spread: 60,
        startVelocity: 35,
        scalar: 0.8,
        origin: { x: 0.8, y: 0.7 },
      });
    }, 180);
  });

  // Header/title by step
  const stepTitle = useMemo(() => {
    switch (step) {
      case 0:
        return 'Basics';
      case 1:
        return 'Time';
      case 2:
        return 'Place';
      case 3:
        return 'Review & publish';
      default:
        return 'Create intent';
    }
  }, [step]);

  if (!mounted && !open) return null;

  return (
    <AnimatePresence
      initial={false}
      mode="wait"
      onExitComplete={() => setMounted(false)}
    >
      {open && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={prefersReducedMotion ? { duration: 0 } : {}}
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) onClose();
          }}
        >
          <motion.div
            key="card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={prefersReducedMotion ? { duration: 0 } : {}}
            className="w-[96vw] max-w-3xl rounded-3xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10"
          >
            <div className="px-6 py-5">
              <StepHeader
                title={stepTitle}
                step={step + 1}
                total={STEPS.length}
                onClose={onClose}
              />
            </div>

            {/* Divider */}
            <div className="px-6">
              <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <div className="px-6 py-5">
              <Stepper
                steps={[
                  { key: 'basics', label: 'Basics' },
                  { key: 'time', label: 'Time' },
                  { key: 'place', label: 'Place' },
                  { key: 'review', label: 'Review' },
                ]}
                currentIndex={step}
              />
            </div>

            <div className="px-6">
              <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={step}
                  variants={panelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  {step === 0 && (
                    <BasicsStep form={form} interests={interests} />
                  )}
                  {step === 1 && (
                    <TimeStep
                      form={form}
                      userTzLabel={
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                      }
                    />
                  )}
                  {step === 2 && (
                    <PlaceStep
                      form={form}
                      onUseMyLocation={async () => {
                        // Simple geolocation helper (permission-gated)
                        return new Promise((resolve) => {
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
                        });
                      }}
                    />
                  )}
                  {step === 3 && (
                    <ReviewStep
                      values={form.getValues()}
                      suggestions={suggestions}
                      selectedId={selectedSuggestionId}
                      onSelect={setSelectedSuggestionId}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <StepFooter
              canBack={step > 0 && !isSubmitting}
              canNext={
                !isSubmitting && (step < STEPS.length - 1 ? true : isValid)
              }
              onBack={back}
              onNext={step < STEPS.length - 1 ? next : submit}
              nextLabel={
                step < STEPS.length - 1
                  ? 'Next'
                  : selectedSuggestionId
                    ? 'Join selected'
                    : 'Create'
              }
              primary
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
