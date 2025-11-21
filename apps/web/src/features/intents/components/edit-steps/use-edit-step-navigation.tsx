'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export type EditStep =
  | 'basics'
  | 'capacity'
  | 'when'
  | 'where'
  | 'settings';

const STEP_ORDER: EditStep[] = [
  'basics',
  'capacity',
  'when',
  'where',
  'settings',
];

interface UseEditStepNavigationProps {
  intentId: string;
  baseUrl?: string; // e.g., '/intent/[id]/manage/edit' or '/intent/creator'
}

/**
 * Hook for navigating between edit steps
 * Provides next/back navigation and step validation
 */
export function useEditStepNavigation({
  intentId,
  baseUrl = `/intent/${intentId}/manage/edit`,
}: UseEditStepNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentStep = useCallback((): EditStep => {
    const lastSegment = pathname?.split('/').pop();
    if (STEP_ORDER.includes(lastSegment as EditStep)) {
      return lastSegment as EditStep;
    }
    return 'basics';
  }, [pathname]);

  const getStepIndex = useCallback((step: EditStep): number => {
    return STEP_ORDER.indexOf(step);
  }, []);

  const goToStep = useCallback(
    (step: EditStep) => {
      router.push(`${baseUrl}/${step}`);
    },
    [router, baseUrl]
  );

  const goToNext = useCallback(() => {
    const currentStep = getCurrentStep();
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      goToStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [getCurrentStep, getStepIndex, goToStep]);

  const goToPrevious = useCallback(() => {
    const currentStep = getCurrentStep();
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex > 0) {
      goToStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [getCurrentStep, getStepIndex, goToStep]);

  const isFirstStep = useCallback(() => {
    const currentStep = getCurrentStep();
    return getStepIndex(currentStep) === 0;
  }, [getCurrentStep, getStepIndex]);

  const isLastStep = useCallback(() => {
    const currentStep = getCurrentStep();
    return getStepIndex(currentStep) === STEP_ORDER.length - 1;
  }, [getCurrentStep, getStepIndex]);

  return {
    currentStep: getCurrentStep(),
    currentStepIndex: getStepIndex(getCurrentStep()),
    totalSteps: STEP_ORDER.length,
    goToStep,
    goToNext,
    goToPrevious,
    isFirstStep: isFirstStep(),
    isLastStep: isLastStep(),
    steps: STEP_ORDER,
  };
}
