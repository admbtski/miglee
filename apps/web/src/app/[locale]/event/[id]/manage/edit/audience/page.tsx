'use client';

/**
 * Audience Section
 * Features: Skill level selection (multi-select)
 */

// TODO: Add i18n for all hardcoded strings (labels, level names, descriptions, tips)

import { useState, useEffect } from 'react';
import { Award, GraduationCap, Info, Target, Trophy } from 'lucide-react';

// Local components
import { useEdit } from '../_components/edit-provider';
import { EditSection, FormField, InfoBox } from '../_components/edit-section';

type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const LEVELS: {
  value: Level;
  label: string;
  description: string;
  Icon: any;
}[] = [
  {
    value: 'BEGINNER',
    label: 'Beginner',
    description: 'New to this activity, learning the basics',
    Icon: GraduationCap,
  },
  {
    value: 'INTERMEDIATE',
    label: 'Intermediate',
    description: 'Has some experience, comfortable with fundamentals',
    Icon: Award,
  },
  {
    value: 'ADVANCED',
    label: 'Advanced',
    description: 'Experienced, looking for challenging activities',
    Icon: Trophy,
  },
];

export default function AudiencePage() {
  const { event, isLoading, saveSection } = useEdit();

  const [levels, setLevels] = useState<Level[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize from event data
  useEffect(() => {
    if (!event) return;

    setLevels(event.levels || []);
    setIsDirty(false);
  }, [event]);

  // Save handler
  const handleSave = async () => {
    return saveSection('Audience', {
      levels: levels.length > 0 ? levels : null,
    });
  };

  // Toggle level
  const toggleLevel = (level: Level) => {
    setLevels((prev) => {
      if (prev.includes(level)) {
        return prev.filter((l) => l !== level);
      }
      return [...prev, level];
    });
    setIsDirty(true);
  };

  // Select all
  const selectAll = () => {
    setLevels(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
    setIsDirty(true);
  };

  // Clear all
  const clearAll = () => {
    setLevels([]);
    setIsDirty(true);
  };

  const allSelected = levels.length === 3;
  const noneSelected = levels.length === 0;

  return (
    <EditSection
      title="Audience"
      description="Define who this event is best suited for"
      onSave={handleSave}
      isDirty={isDirty}
      isLoading={isLoading}
    >
      {/* Skill Levels */}
      <FormField
        label="Skill levels"
        description="Select one or more levels. Leave empty for all levels."
      >
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={allSelected}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                allSelected
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                  : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
              ].join(' ')}
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={noneSelected}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                noneSelected
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
              ].join(' ')}
            >
              Clear all
            </button>
          </div>

          {/* Level cards */}
          <div className="space-y-3">
            {LEVELS.map(({ value, label, description, Icon }) => {
              const isSelected = levels.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleLevel(value)}
                  className={[
                    'w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                  ].join(' ')}
                >
                  {/* Checkbox */}
                  <div
                    className={[
                      'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-zinc-300 dark:border-zinc-600',
                    ].join(' ')}
                  >
                    {isSelected && (
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

                  {/* Icon */}
                  <div
                    className={[
                      'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                      isSelected
                        ? 'bg-indigo-100 dark:bg-indigo-800/40'
                        : 'bg-zinc-100 dark:bg-zinc-700',
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'w-5 h-5',
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-zinc-500',
                      ].join(' ')}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={[
                        'text-sm font-medium',
                        isSelected
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-zinc-900 dark:text-zinc-100',
                      ].join(' ')}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </FormField>

      {/* Current selection display */}
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Target audience:
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {noneSelected
              ? 'All levels welcome'
              : allSelected
                ? 'All levels'
                : levels
                    .map((l) => LEVELS.find((lv) => lv.value === l)?.label)
                    .join(', ')}
          </span>
        </div>
      </div>

      {/* Info */}
      <InfoBox>
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            <strong className="font-medium">Tip:</strong> Skill levels help
            participants understand if the event fits their experience. If you
            don&apos;t select any levels, the event is open to everyone.
          </p>
        </div>
      </InfoBox>
    </EditSection>
  );
}
