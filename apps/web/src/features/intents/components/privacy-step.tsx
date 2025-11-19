// app/(wherever)/PrivacyStep.tsx
'use client';

import { SegmentedControl } from '@/components/ui/segment-control';
import {
  AddressVisibility,
  MembersVisibility,
} from '@/lib/api/__generated__/react-query-update';
import {
  Eye,
  EyeOff,
  Gauge,
  Info,
  Lock,
  Mail,
  Rocket,
  Sprout,
  UserCheck,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { IntentFormValues } from './types';
import { JoinFormStep, JoinFormQuestion } from './join-form-step';

/** Segmented-like multi-select pill (kolorystyka spójna z SegmentedControl) */
function TogglePill({
  active,
  onClick,
  children,
  title,
  disabled,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      className={[
        'relative w-full inline-flex items-center justify-center gap-2 rounded-xl transition',
        'px-3 py-2 text-sm',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled &&
          (active
            ? 'bg-zinc-900 text-white dark:bg-indigo-600 shadow-sm'
            : 'text-zinc-700 bg-white ring-1 ring-zinc-200 hover:bg-zinc-100 dark:text-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700 dark:hover:bg-zinc-800'),
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
      ].join(' ')}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
      {children}
    </button>
  );
}

type JoinMode = 'OPEN' | 'INVITE_ONLY' | 'REQUEST';
type VisibilityMode = 'PUBLIC' | 'HIDDEN';
type LevelValue = IntentFormValues['levels'][number];

const LEVEL_OPTIONS: Array<{ value: LevelValue; label: string; Icon: any }> = [
  { value: 'BEGINNER', label: 'Beginner', Icon: Sprout },
  { value: 'INTERMEDIATE', label: 'Intermediate', Icon: Gauge },
  { value: 'ADVANCED', label: 'Advanced', Icon: Rocket },
];

export function PrivacyStep({
  form,
  joinFormQuestions,
  onJoinFormQuestionsChange,
}: {
  form: UseFormReturn<IntentFormValues>;
  joinFormQuestions?: JoinFormQuestion[];
  onJoinFormQuestionsChange?: (questions: JoinFormQuestion[]) => void;
}) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form;

  // re-render na zmiany:
  const levels = (useWatch({ control, name: 'levels' }) ?? []) as LevelValue[];
  const joinMode = useWatch({ control, name: 'joinMode' }) as JoinMode;
  const radiusKm = useWatch({ control, name: 'location.radiusKm' }) as
    | number
    | undefined;

  const radiusMetersText =
    typeof radiusKm === 'number' && radiusKm > 0
      ? ` (${Math.round(radiusKm * 1000)} m)`
      : '';

  const joinModeHintId = 'join-mode-hint';
  const visibilityHintId = 'visibility-hint';
  const levelsHintId = 'levels-hint';
  const addrVisHintId = 'addr-vis-hint';
  const memVisHintId = 'mem-vis-hint';

  const toggleLevel = (lv: LevelValue) => {
    const next = levels.includes(lv)
      ? levels.filter((x) => x !== lv)
      : [...levels, lv];
    setValue('levels', next as LevelValue[], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const clearLevels = () => {
    setValue('levels', [] as LevelValue[], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* Join mode */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tryb dołączania
        </label>
        <p
          id={joinModeHintId}
          className="mb-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          Zdecyduj, kto i jak może dołączyć do wydarzenia:
          <b> Otwarte</b> — każdy; <b>Na zaproszenie</b> — tylko zaproszeni;
          <b> Na prośbę</b> — uczestnicy wysyłają prośbę.
        </p>

        <Controller
          control={control}
          name="joinMode"
          render={({ field }) => (
            <SegmentedControl<JoinMode>
              aria-label="Tryb dołączania"
              aria-describedby={joinModeHintId}
              value={field.value}
              size="md"
              fullWidth
              withPill
              animated
              onChange={(v) => field.onChange(v)}
              options={[
                { value: 'OPEN', label: 'Otwarte', Icon: Users },
                { value: 'INVITE_ONLY', label: 'Na zaproszenie', Icon: Lock },
                { value: 'REQUEST', label: 'Na prośbę', Icon: Mail },
              ]}
            />
          )}
        />
        {errors.joinMode && (
          <p className="mt-1 text-xs text-red-600">
            {String(errors.joinMode.message)}
          </p>
        )}
      </div>

      {/* Visibility */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Widoczność wydarzenia
        </label>
        <p
          id={visibilityHintId}
          className="mb-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <b>Publiczne</b> — widoczne w wyszukiwaniu i na listach. <b>Ukryte</b>{' '}
          — dostęp wyłącznie z linku lub zaproszenia.
        </p>

        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <SegmentedControl<VisibilityMode>
              aria-label="Widoczność"
              aria-describedby={visibilityHintId}
              value={field.value}
              size="md"
              fullWidth
              withPill
              animated
              onChange={(v) => field.onChange(v)}
              options={[
                { value: 'PUBLIC', label: 'Publiczne', Icon: Eye },
                { value: 'HIDDEN', label: 'Ukryte', Icon: EyeOff },
              ]}
            />
          )}
        />
        {errors.visibility && (
          <p className="mt-1 text-xs text-red-600">
            {String(errors.visibility.message)}
          </p>
        )}
      </div>

      {/* Levels */}
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Poziom uczestników
        </label>
        {levels.length > 0 && (
          <button
            type="button"
            onClick={clearLevels}
            className="text-xs text-zinc-500 hover:underline"
            title="Wyczyść wybór poziomów"
          >
            Wyczyść
          </button>
        )}
      </div>
      <p
        id={levelsHintId}
        className="mb-2 text-xs text-zinc-500 dark:text-zinc-400"
      >
        Wybierz docelowy poziom doświadczenia. Brak wyboru = wydarzenie dla
        wszystkich.
      </p>
      <div className="flex flex-nowrap gap-2" aria-describedby={levelsHintId}>
        {LEVEL_OPTIONS.map(({ value, label, Icon }) => {
          const active = levels.includes(value);
          return (
            <TogglePill
              key={value}
              active={active}
              onClick={() => toggleLevel(value)}
              title={`Przełącz: ${label}`}
              Icon={Icon}
            >
              {label}
            </TogglePill>
          );
        })}
      </div>
      {errors.levels && (
        <p className="mt-1 text-xs text-red-600">
          {String(errors.levels.message)}
        </p>
      )}

      {/* Members visibility */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Widoczność listy uczestników
        </label>
        <p
          id={memVisHintId}
          className="mb-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <b>Publiczna</b> — każdy widzi listę uczestników. <b>Po dołączeniu</b>{' '}
          — lista widoczna dopiero po dołączeniu. <b>Ukryta</b> — lista
          niewidoczna dla gości i uczestników (widziana tylko przez
          organizatorów).
        </p>

        <Controller
          control={control}
          name="membersVisibility"
          render={({ field }) => (
            <SegmentedControl<MembersVisibility>
              aria-label="Widoczność uczestników"
              aria-describedby={memVisHintId}
              value={field.value as MembersVisibility}
              size="md"
              fullWidth
              withPill
              animated
              onChange={(v) => field.onChange(v)}
              options={[
                {
                  value: MembersVisibility.Public,
                  label: 'Publiczna',
                  Icon: Users,
                },
                {
                  value: MembersVisibility.AfterJoin,
                  label: 'Po dołączeniu',
                  Icon: UserCheck,
                },
                {
                  value: MembersVisibility.Hidden,
                  label: 'Ukryta',
                  Icon: EyeOff,
                },
              ]}
            />
          )}
        />
        {errors.membersVisibility && (
          <p className="mt-1 text-xs text-red-600">
            {String(errors.membersVisibility.message)}
          </p>
        )}
      </div>

      {/* Address visibility (segment zamiast checkboxa showAddress) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Widoczność adresu
        </label>
        <p
          id={addrVisHintId}
          className="mb-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <b>Publiczny</b> — każdy widzi dokładny adres. <b>Po dołączeniu</b> —
          dokładny adres dostaną tylko osoby, które dołączą. <b>Ukryty</b> —
          dokładny adres nie jest ujawniany.
        </p>

        <Controller
          control={control}
          name="addressVisibility"
          render={({ field }) => (
            <SegmentedControl<AddressVisibility>
              aria-label="Widoczność adresu"
              aria-describedby={addrVisHintId}
              value={field.value as AddressVisibility}
              size="md"
              fullWidth
              withPill
              animated
              onChange={(v) => field.onChange(v)}
              options={[
                {
                  value: AddressVisibility.Public,
                  label: 'Publiczny',
                  Icon: Eye,
                },
                {
                  value: AddressVisibility.AfterJoin,
                  label: 'Po dołączeniu',
                  Icon: UserCheck,
                },
                {
                  value: AddressVisibility.Hidden,
                  label: 'Ukryty',
                  Icon: EyeOff,
                },
              ]}
            />
          )}
        />
        {errors.addressVisibility && (
          <p className="mt-1 text-xs text-red-600">
            {String(errors.addressVisibility.message)}
          </p>
        )}
      </div>

      {/* Join Form Questions - only shown when joinMode is REQUEST */}
      {joinMode === 'REQUEST' && onJoinFormQuestionsChange && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Pytania w formularzu prośby o dołączenie
          </label>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            Dodaj niestandardowe pytania, które użytkownicy będą musieli
            wypełnić przy prośbie o dołączenie (opcjonalne).
          </p>
          <JoinFormStep
            questions={joinFormQuestions || []}
            onChange={onJoinFormQuestionsChange}
            maxQuestions={5}
          />
        </div>
      )}
    </div>
  );
}
