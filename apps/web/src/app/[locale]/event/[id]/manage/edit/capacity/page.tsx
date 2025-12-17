'use client';

/**
 * Capacity Section
 * Features: 1:1, Group, Custom modes with PRO gating
 * Uses event's sponsorshipPlan to determine PRO access
 */

// TODO: Add i18n for all hardcoded strings (labels, descriptions, errors, PRO feature texts)

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Info, Sparkles, UserPlus, Users } from 'lucide-react';

import { SegmentedControl } from '@/components/ui/segment-control';
import { RangeSlider } from '@/features/events';
import { useLocalePath } from '@/hooks/use-locale-path';

import { useEdit } from '../_components/edit-provider';
import { EditSection, FormField, InfoBox } from '../_components/edit-section';

type Mode = 'ONE_TO_ONE' | 'GROUP' | 'CUSTOM';

const GROUP_MIN = 1;
const GROUP_MAX = 50;

export default function CapacityPage() {
  const { event, isLoading, saveSection } = useEdit();
  const router = useRouter();
  const { localePath } = useLocalePath();

  // Use event's sponsorshipPlan for PRO feature access
  const sponsorshipPlan = event?.sponsorshipPlan || 'FREE';
  const isPro = sponsorshipPlan === 'PRO';

  const [mode, setMode] = useState<Mode>('GROUP');
  const [min, setMin] = useState(2);
  const [max, setMax] = useState(10);
  const [noMin, setNoMin] = useState(false);
  const [noMax, setNoMax] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize from event data
  useEffect(() => {
    if (!event) return;

    setMode(event.mode || 'GROUP');
    setMin(event.min ?? 2);
    setMax(event.max ?? 10);
    setNoMin(event.min === null);
    setNoMax(event.max === null);
    setIsDirty(false);
  }, [event]);

  // Get effective limits based on mode and plan
  const getEffectiveLimits = useCallback(() => {
    if (mode === 'ONE_TO_ONE') {
      return { min: 2, max: 2 };
    }
    if (mode === 'GROUP') {
      return { min: Math.max(GROUP_MIN, min), max: Math.min(max, GROUP_MAX) };
    }
    // CUSTOM - only for PRO
    if (!isPro) {
      return { min: 2, max: GROUP_MAX };
    }
    return {
      min: noMin ? null : min,
      max: noMax ? null : max,
    };
  }, [mode, min, max, noMin, noMax, isPro]);

  // Validation
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const limits = getEffectiveLimits();

    if (mode === 'CUSTOM' && !isPro) {
      newErrors.mode = 'Custom capacity requires PRO plan';
    }

    if (limits.min !== null && limits.max !== null && limits.min > limits.max) {
      newErrors.min = 'Minimum cannot exceed maximum';
    }

    // Custom mode validation - max 99999
    if (mode === 'CUSTOM' && isPro) {
      if (!noMin && (min < 1 || min > 99999)) {
        newErrors.min = 'Minimum must be between 1 and 99,999';
      }
      if (!noMax && (max < 1 || max > 99999)) {
        newErrors.max = 'Maximum must be between 1 and 99,999';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [mode, getEffectiveLimits, isPro, min, max, noMin, noMax]);

  // Save handler
  const handleSave = async () => {
    if (!validate()) return false;

    const limits = getEffectiveLimits();
    return saveSection('Capacity', {
      mode,
      min: limits.min,
      max: limits.max,
    });
  };

  // Handle mode change
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setIsDirty(true);

    // Apply mode-specific defaults
    if (newMode === 'ONE_TO_ONE') {
      setMin(2);
      setMax(2);
    } else if (newMode === 'GROUP') {
      setMin(2);
      setMax(10);
      setNoMin(false);
      setNoMax(false);
    }
  };

  // Navigate to plans page
  const handleUpgradeToPro = () => {
    if (event?.id) {
      router.push(localePath(`/event/${event.id}/manage/plans`));
    }
  };

  // Handle range slider change
  const handleRangeChange = (values: [number, number]) => {
    setMin(values[0]);
    setMax(values[1]);
    setIsDirty(true);
  };

  // Disable save for CUSTOM mode without PRO
  const canSave = !(mode === 'CUSTOM' && !isPro);

  return (
    <EditSection
      title="Capacity"
      description="Set participant limits for your event"
      onSave={handleSave}
      isDirty={isDirty && canSave}
      isLoading={isLoading}
    >
      {/* Mode Selection */}
      <FormField
        label="Capacity mode"
        description="Choose how many people can join"
        required
        error={errors.mode}
      >
        <SegmentedControl<Mode>
          value={mode}
          onChange={handleModeChange}
          size="md"
          fullWidth
          withPill
          animated
          options={[
            { value: 'ONE_TO_ONE', label: '1:1', Icon: UserPlus },
            { value: 'GROUP', label: 'Group', Icon: Users },
            {
              value: 'CUSTOM',
              label: isPro ? (
                'Custom'
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Custom
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white leading-none">
                    PRO
                  </span>
                </span>
              ),
              Icon: isPro ? Sparkles : Crown,
            },
          ]}
        />
      </FormField>

      {/* 1:1 Mode Info */}
      {mode === 'ONE_TO_ONE' && (
        <InfoBox>
          <div className="flex items-start gap-3">
            <UserPlus className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium">Pair activity</p>
              <p className="mt-1 text-sm opacity-80">
                Perfect for 1-on-1 sessions like tutoring, mentoring, or
                language exchange. Exactly 2 participants.
              </p>
            </div>
          </div>
        </InfoBox>
      )}

      {/* Group Mode */}
      {mode === 'GROUP' && (
        <>
          <FormField
            label="Participant range"
            description={`Set minimum and maximum participants (${GROUP_MIN}-${GROUP_MAX})`}
          >
            <div className="space-y-6">
              {/* Range Slider */}
              <RangeSlider
                value={[min, max]}
                min={GROUP_MIN}
                max={GROUP_MAX}
                step={1}
                onChange={handleRangeChange}
                tooltips
                format={{
                  to: (v) => `${Math.round(v)}`,
                  from: (s) => Number(s),
                }}
              />

              {/* Current values display */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {min}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                    min
                  </p>
                </div>
                <span className="text-zinc-400 dark:text-zinc-500 text-lg">
                  —
                </span>
                <div className="text-center px-6 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {max}
                  </span>
                  <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-0.5 font-medium">
                    max
                  </p>
                </div>
              </div>
            </div>
          </FormField>

          <InfoBox>
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <p>
                Event automatically closes when max capacity is reached. Need
                more than 50 participants?{' '}
                <button
                  type="button"
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  onClick={handleUpgradeToPro}
                >
                  Upgrade to PRO
                </button>
              </p>
            </div>
          </InfoBox>
        </>
      )}

      {/* Custom Mode */}
      {mode === 'CUSTOM' && (
        <>
          {/* PRO Upgrade Banner - shown for non-PRO users */}
          {!isPro && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-amber-900/30 border border-amber-200 dark:border-amber-700/50 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">
                    Custom Capacity is a PRO Feature
                  </h3>
                  <p className="mt-1.5 text-sm text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
                    Unlock unlimited participants and custom min/max limits for
                    large-scale events, workshops, and conferences.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleUpgradeToPro}
                      className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Upgrade to PRO
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Min/Max Inputs - disabled for non-PRO */}
          <div
            className={[
              'grid grid-cols-2 gap-6 transition-opacity',
              !isPro && 'opacity-50 pointer-events-none',
            ].join(' ')}
          >
            {/* Minimum */}
            <div className="space-y-3">
              <FormField
                label="Minimum"
                description="Minimum participants needed"
                error={errors.min}
              >
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={noMin ? '' : min}
                  disabled={noMin || !isPro}
                  readOnly={!isPro}
                  onChange={(e) => {
                    if (!isPro) return;
                    const value = parseInt(e.target.value) || 1;
                    // Clamp value between 1 and 99999
                    setMin(Math.min(99999, Math.max(1, value)));
                    setIsDirty(true);
                    if (errors.min) setErrors((er) => ({ ...er, min: '' }));
                  }}
                  placeholder="No minimum"
                  className={[
                    'w-full rounded-xl border px-4 py-3 text-sm transition-all',
                    'bg-white dark:bg-zinc-900/60',
                    'text-zinc-900 dark:text-zinc-100',
                    'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
                    'border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/40',
                    'focus:outline-none focus:ring-2',
                    (noMin || !isPro) &&
                      'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-800/50',
                  ].join(' ')}
                />
              </FormField>

              {/* No minimum toggle */}
              <button
                type="button"
                disabled={!isPro}
                onClick={() => {
                  if (!isPro) return;
                  setNoMin(!noMin);
                  setIsDirty(true);
                }}
                className={[
                  'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all',
                  noMin
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600',
                  !isPro && 'cursor-not-allowed',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-sm font-medium',
                    noMin
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-zinc-700 dark:text-zinc-300',
                  ].join(' ')}
                >
                  No minimum
                </span>
                <div
                  className={[
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                    noMin
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-zinc-300 dark:border-zinc-600',
                  ].join(' ')}
                >
                  {noMin && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {/* Maximum */}
            <div className="space-y-3">
              <FormField
                label="Maximum"
                description="Maximum participants allowed"
                error={errors.max}
              >
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={noMax ? '' : max}
                  disabled={noMax || !isPro}
                  readOnly={!isPro}
                  onChange={(e) => {
                    if (!isPro) return;
                    const value = parseInt(e.target.value) || 1;
                    // Clamp value between 1 and 99999
                    setMax(Math.min(99999, Math.max(1, value)));
                    setIsDirty(true);
                    if (errors.max) setErrors((er) => ({ ...er, max: '' }));
                  }}
                  placeholder="No limit"
                  className={[
                    'w-full rounded-xl border px-4 py-3 text-sm transition-all',
                    'bg-white dark:bg-zinc-900/60',
                    'text-zinc-900 dark:text-zinc-100',
                    'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
                    'border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/40',
                    'focus:outline-none focus:ring-2',
                    (noMax || !isPro) &&
                      'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-800/50',
                  ].join(' ')}
                />
              </FormField>

              {/* No limit toggle */}
              <button
                type="button"
                disabled={!isPro}
                onClick={() => {
                  if (!isPro) return;
                  setNoMax(!noMax);
                  setIsDirty(true);
                }}
                className={[
                  'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all',
                  noMax
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600',
                  !isPro && 'cursor-not-allowed',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-sm font-medium',
                    noMax
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-zinc-700 dark:text-zinc-300',
                  ].join(' ')}
                >
                  No limit
                </span>
                <div
                  className={[
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                    noMax
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-zinc-300 dark:border-zinc-600',
                  ].join(' ')}
                >
                  {noMax && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* PRO feature info - only shown for PRO users */}
          {isPro && (
            <InfoBox variant="success">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p>
                  <strong className="font-medium">PRO feature:</strong> Set
                  custom limits up to 99,999 or unlimited participants.
                </p>
              </div>
            </InfoBox>
          )}
        </>
      )}
    </EditSection>
  );
}
