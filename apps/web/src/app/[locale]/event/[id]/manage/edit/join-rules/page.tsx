'use client';

import { useState, useEffect } from 'react';
import { useEdit } from '../_components/edit-provider';
import { EditSection, FormField, InfoBox } from '../_components/edit-section';
import {
  Coffee,
  Calendar,
  Wrench,
  Zap,
  Clock,
  DoorOpen,
  DoorClosed,
  Info,
} from 'lucide-react';

// Presets for join rules
const JOIN_PRESETS = [
  {
    key: 'casual',
    label: 'Casual meetup',
    description: 'Flexible, late join allowed',
    Icon: Coffee,
    values: {
      joinOpensMinutesBeforeStart: null,
      joinCutoffMinutesBeforeStart: null,
      allowJoinLate: true,
      lateJoinCutoffMinutesAfterStart: 60,
    },
  },
  {
    key: 'structured',
    label: 'Structured event',
    description: 'Closes 1h before start',
    Icon: Calendar,
    values: {
      joinOpensMinutesBeforeStart: null,
      joinCutoffMinutesBeforeStart: 60,
      allowJoinLate: false,
      lateJoinCutoffMinutesAfterStart: null,
    },
  },
  {
    key: 'workshop',
    label: 'Workshop',
    description: 'Opens 7 days before, closes 24h before',
    Icon: Wrench,
    values: {
      joinOpensMinutesBeforeStart: 10080, // 7 days
      joinCutoffMinutesBeforeStart: 1440, // 24 hours
      allowJoinLate: false,
      lateJoinCutoffMinutesAfterStart: null,
    },
  },
  {
    key: 'dropin',
    label: 'Drop-in session',
    description: 'Join anytime during event',
    Icon: Zap,
    values: {
      joinOpensMinutesBeforeStart: null,
      joinCutoffMinutesBeforeStart: null,
      allowJoinLate: true,
      lateJoinCutoffMinutesAfterStart: null, // No cutoff
    },
  },
];

// Quick time options (in minutes)
const OPEN_TIMES = [
  { label: 'Always', value: null },
  { label: '24h before', value: 1440 },
  { label: '7 days before', value: 10080 },
  { label: '14 days before', value: 20160 },
  { label: '30 days before', value: 43200 },
];

const CLOSE_TIMES = [
  { label: 'At start', value: 0 },
  { label: '15m before', value: 15 },
  { label: '30m before', value: 30 },
  { label: '1h before', value: 60 },
  { label: '24h before', value: 1440 },
  { label: 'Never', value: null },
];

const LATE_JOIN_TIMES = [
  { label: '15m after', value: 15 },
  { label: '30m after', value: 30 },
  { label: '1h after', value: 60 },
  { label: 'Anytime', value: null },
];

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return 'Never';
  if (minutes === 0) return 'At start';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)} days`;
}

/**
 * Join Rules Section
 * Features: Presets, open/close windows, late join settings
 */
export default function JoinRulesPage() {
  const { event, isLoading, saveSection } = useEdit();

  const [joinOpensMinutesBeforeStart, setJoinOpensMinutesBeforeStart] =
    useState<number | null>(null);
  const [joinCutoffMinutesBeforeStart, setJoinCutoffMinutesBeforeStart] =
    useState<number | null>(null);
  const [allowJoinLate, setAllowJoinLate] = useState(true);
  const [lateJoinCutoffMinutesAfterStart, setLateJoinCutoffMinutesAfterStart] =
    useState<number | null>(60);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize from eventIdata
  useEffect(() => {
    if (!event return;

    setJoinOpensMinutesBeforeStart(eventjoinOpensMinutesBeforeStart);
    setJoinCutoffMinutesBeforeStart(eventjoinCutoffMinutesBeforeStart);
    setAllowJoinLate(eventallowJoinLate ?? true);
    setLateJoinCutoffMinutesAfterStart(eventlateJoinCutoffMinutesAfterStart);
    setIsDirty(false);

    // Detect active preset
    const matchingPreset = JOIN_PRESETS.find(
      (p) =>
        p.values.joinOpensMinutesBeforeStart ===
          eventjoinOpensMinutesBeforeStart &&
        p.values.joinCutoffMinutesBeforeStart ===
          eventjoinCutoffMinutesBeforeStart &&
        p.values.allowJoinLate === eventallowJoinLate &&
        p.values.lateJoinCutoffMinutesAfterStart ===
          eventlateJoinCutoffMinutesAfterStart
    );
    setActivePreset(matchingPreset?.key || null);
  }, [event);

  // Save handler
  const handleSave = async () => {
    return saveSection('Join Rules', {
      joinOpensMinutesBeforeStart,
      joinCutoffMinutesBeforeStart,
      allowJoinLate,
      lateJoinCutoffMinutesAfterStart: allowJoinLate
        ? lateJoinCutoffMinutesAfterStart
        : null,
    });
  };

  // Apply preset
  const applyPreset = (preset: (typeof JOIN_PRESETS)[0]) => {
    setJoinOpensMinutesBeforeStart(preset.values.joinOpensMinutesBeforeStart);
    setJoinCutoffMinutesBeforeStart(preset.values.joinCutoffMinutesBeforeStart);
    setAllowJoinLate(preset.values.allowJoinLate);
    setLateJoinCutoffMinutesAfterStart(
      preset.values.lateJoinCutoffMinutesAfterStart
    );
    setActivePreset(preset.key);
    setIsDirty(true);
  };

  // Handle manual change (clears preset)
  const handleManualChange = (setter: () => void) => {
    setter();
    setActivePreset(null);
    setIsDirty(true);
  };

  return (
    <EditSection
      title="Join Rules"
      description="Control when and how people can join your event"
      onSave={handleSave}
      isDirty={isDirty}
      isLoading={isLoading}
    >
      {/* Presets */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Quick presets
        </label>
        <div className="grid grid-cols-2 gap-3">
          {JOIN_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset)}
              className={[
                'flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                activePreset === preset.key
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800',
              ].join(' ')}
            >
              <div
                className={[
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                  activePreset === preset.key
                    ? 'bg-indigo-100 dark:bg-indigo-800/40'
                    : 'bg-zinc-100 dark:bg-zinc-700',
                ].join(' ')}
              >
                <preset.Icon
                  className={[
                    'w-5 h-5',
                    activePreset === preset.key
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-500',
                  ].join(' ')}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {preset.label}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {preset.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Settings */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-6">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Or customize manually:
        </p>

        {/* Join Opens */}
        <FormField
          label="Registration opens"
          description="When can people start joining?"
        >
          <div className="flex flex-wrap gap-2">
            {OPEN_TIMES.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  handleManualChange(() =>
                    setJoinOpensMinutesBeforeStart(value)
                  )
                }
                className={[
                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                  joinOpensMinutesBeforeStart === value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                ].join(' ')}
              >
                <DoorOpen className="w-3.5 h-3.5 inline mr-1.5" />
                {label}
              </button>
            ))}
          </div>
        </FormField>

        {/* Join Closes */}
        <FormField
          label="Registration closes"
          description="When does registration close?"
        >
          <div className="flex flex-wrap gap-2">
            {CLOSE_TIMES.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  handleManualChange(() =>
                    setJoinCutoffMinutesBeforeStart(value)
                  )
                }
                className={[
                  'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                  joinCutoffMinutesBeforeStart === value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                ].join(' ')}
              >
                <DoorClosed className="w-3.5 h-3.5 inline mr-1.5" />
                {label}
              </button>
            ))}
          </div>
        </FormField>

        {/* Allow Late Join */}
        <FormField
          label="Late joining"
          description="Can people join after the event starts?"
        >
          <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <input
              type="checkbox"
              checked={allowJoinLate}
              onChange={(e) =>
                handleManualChange(() => setAllowJoinLate(e.target.checked))
              }
              className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Allow joining after event starts
                </span>
              </div>
            </div>
          </label>
        </FormField>

        {/* Late Join Cutoff */}
        {allowJoinLate && (
          <FormField
            label="Late join window"
            description="How long after start can people still join?"
          >
            <div className="flex flex-wrap gap-2">
              {LATE_JOIN_TIMES.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    handleManualChange(() =>
                      setLateJoinCutoffMinutesAfterStart(value)
                    )
                  }
                  className={[
                    'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                    lateJoinCutoffMinutesAfterStart === value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </FormField>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Current settings:
        </h4>
        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            • Opens:{' '}
            {joinOpensMinutesBeforeStart === null
              ? 'Always open'
              : `${formatMinutes(joinOpensMinutesBeforeStart)} before start`}
          </li>
          <li>
            • Closes:{' '}
            {joinCutoffMinutesBeforeStart === null
              ? 'Never'
              : `${formatMinutes(joinCutoffMinutesBeforeStart)} before start`}
          </li>
          <li>• Late join: {allowJoinLate ? 'Allowed' : 'Not allowed'}</li>
          {allowJoinLate && (
            <li>
              • Late join window:{' '}
              {lateJoinCutoffMinutesAfterStart === null
                ? 'Anytime during event'
                : `Until ${formatMinutes(lateJoinCutoffMinutesAfterStart)} after start`}
            </li>
          )}
        </ul>
      </div>

      {/* Info */}
      <InfoBox>
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            <strong className="font-medium">Tip:</strong> Use presets for common
            scenarios or customize each setting individually.
          </p>
        </div>
      </InfoBox>
    </EditSection>
  );
}
