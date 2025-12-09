'use client';

/**
 * Schedule Section
 * Features: Quick presets, date/time pickers, duration presets, timezone info
 */

// TODO i18n: All hardcoded strings (labels, preset names, errors, tips)
// TODO i18n: date/time formatting should be locale-aware

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Coffee,
  Info,
  Sun,
  Sunrise,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react';

import { useEdit } from '../_components/edit-provider';
import { EditSection, FormField, InfoBox } from '../_components/edit-section';

// Quick presets for start time
const QUICK_PRESETS = [
  {
    label: 'Now +1h',
    Icon: Zap,
    getValue: () => {
      const now = new Date();
      const start = roundTo15Min(new Date(now.getTime() + 60 * 60 * 1000));
      return start;
    },
  },
  {
    label: 'Tonight',
    Icon: Sunrise,
    getValue: () => {
      const today = new Date();
      today.setHours(19, 0, 0, 0);
      if (today < new Date()) today.setDate(today.getDate() + 1);
      return today;
    },
  },
  {
    label: 'Tomorrow',
    Icon: Sun,
    getValue: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      return tomorrow;
    },
  },
  {
    label: 'Weekend',
    Icon: Calendar,
    getValue: () => {
      const today = new Date();
      const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + daysUntilSat);
      saturday.setHours(11, 0, 0, 0);
      return saturday;
    },
  },
];

// Duration presets
const DURATION_PRESETS = [
  { label: 'Coffee', duration: 30, Icon: Coffee },
  { label: 'Lunch', duration: 60, Icon: Utensils },
  { label: 'Workshop', duration: 120, Icon: Wrench },
  { label: 'Half day', duration: 240, Icon: Sun },
  { label: 'Full day', duration: 480, Icon: Calendar },
  { label: 'Hackathon', duration: 720, Icon: Zap },
];

// Quick duration buttons (minutes)
const QUICK_DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 360, 480];

function roundTo15Min(date: Date): Date {
  const ms = 15 * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SchedulePage() {
  const { event, isLoading, saveSection } = useEdit();

  const [startAt, setStartAt] = useState<Date>(new Date());
  const [endAt, setEndAt] = useState<Date>(new Date());
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get user timezone
  const timezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  // Initialize from event data
  useEffect(() => {
    if (!event) return;

    setStartAt(new Date(event.startAt));
    setEndAt(new Date(event.endAt));
    setIsDirty(false);
  }, [event]);

  // Calculate duration in minutes
  const durationMinutes = useMemo(() => {
    return Math.round((endAt.getTime() - startAt.getTime()) / (60 * 1000));
  }, [startAt, endAt]);

  // Validation
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const now = new Date();
    const minStart = new Date(now.getTime() + 5 * 60 * 1000);

    if (startAt < minStart) {
      newErrors.startAt = 'Start time must be at least 5 minutes from now';
    }

    if (endAt <= startAt) {
      newErrors.endAt = 'End time must be after start time';
    }

    const maxDuration = 30 * 24 * 60; // 30 days in minutes
    if (durationMinutes > maxDuration) {
      newErrors.endAt = 'Maximum event duration is 30 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [startAt, endAt, durationMinutes]);

  // Save handler
  const handleSave = async () => {
    if (!validate()) return false;

    return saveSection('Schedule', {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    });
  };

  // Apply quick preset
  const applyQuickPreset = (getValue: () => Date) => {
    const newStart = getValue();
    const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000); // Default 1h duration
    setStartAt(newStart);
    setEndAt(newEnd);
    setIsDirty(true);
    setErrors({});
  };

  // Apply duration preset
  const applyDurationPreset = (minutes: number) => {
    const newEnd = new Date(startAt.getTime() + minutes * 60 * 1000);
    setEndAt(newEnd);
    setIsDirty(true);
    if (errors.endAt) setErrors((e) => ({ ...e, endAt: '' }));
  };

  // Handle start change
  const handleStartChange = (value: string) => {
    const newStart = new Date(value);
    setStartAt(newStart);
    // Auto-adjust end if it's before new start
    if (endAt <= newStart) {
      setEndAt(new Date(newStart.getTime() + 60 * 60 * 1000));
    }
    setIsDirty(true);
    setErrors({});
  };

  // Handle end change
  const handleEndChange = (value: string) => {
    setEndAt(new Date(value));
    setIsDirty(true);
    if (errors.endAt) setErrors((e) => ({ ...e, endAt: '' }));
  };

  return (
    <EditSection
      title="Schedule"
      description="Set when your event starts and ends"
      onSave={handleSave}
      isDirty={isDirty}
      isLoading={isLoading}
    >
      {/* Quick Presets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Quick start
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map(({ label, Icon, getValue }) => (
            <button
              key={label}
              type="button"
              onClick={() => applyQuickPreset(getValue)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Start Date/Time */}
      <FormField label="Start date & time" required error={errors.startAt}>
        <div className="relative">
          <input
            type="datetime-local"
            value={toLocalDateTimeString(startAt)}
            onChange={(e) => handleStartChange(e.target.value)}
            min={toLocalDateTimeString(new Date())}
            className={[
              'w-full rounded-xl border px-4 py-3 text-sm transition-all',
              'bg-white dark:bg-zinc-900/60',
              'text-zinc-900 dark:text-zinc-100',
              errors.startAt
                ? 'border-red-500 focus:ring-red-500/40'
                : 'border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/40',
              'focus:outline-none focus:ring-2',
            ].join(' ')}
          />
        </div>
      </FormField>

      {/* Duration Presets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Duration presets
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map(({ label, duration, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => applyDurationPreset(duration)}
              className={[
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                durationMinutes === duration
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className="text-xs text-zinc-500">
                ({formatDuration(duration)})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* End Date/Time */}
      <FormField label="End date & time" required error={errors.endAt}>
        <div className="space-y-3">
          <input
            type="datetime-local"
            value={toLocalDateTimeString(endAt)}
            onChange={(e) => handleEndChange(e.target.value)}
            min={toLocalDateTimeString(startAt)}
            className={[
              'w-full rounded-xl border px-4 py-3 text-sm transition-all',
              'bg-white dark:bg-zinc-900/60',
              'text-zinc-900 dark:text-zinc-100',
              errors.endAt
                ? 'border-red-500 focus:ring-red-500/40'
                : 'border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/40',
              'focus:outline-none focus:ring-2',
            ].join(' ')}
          />

          {/* Quick duration buttons */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_DURATIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => applyDurationPreset(mins)}
                className={[
                  'px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all',
                  durationMinutes === mins
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                ].join(' ')}
              >
                {formatDuration(mins)}
              </button>
            ))}
          </div>
        </div>
      </FormField>

      {/* Duration Display */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        <Clock className="w-4 h-4 text-zinc-500" />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          <strong>Duration:</strong> {formatDuration(durationMinutes)}
        </span>
      </div>

      {/* Timezone Info */}
      <InfoBox>
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p>
              <strong className="font-medium">Timezone:</strong> {timezone}
            </p>
            <p className="mt-1 text-xs opacity-80">
              Times are shown in your timezone. Add a note if guests join from
              elsewhere.
            </p>
          </div>
        </div>
      </InfoBox>

      {/* Overlap Warning - would need to check other events */}
      {/* This is a placeholder - actual implementation would check for overlaps */}
    </EditSection>
  );
}
