// app/(wherever)/PrivacyStep.tsx
'use client';

import { SegmentedControl } from '@/components/ui/segment-control';
import {
  Eye,
  EyeOff,
  Info,
  Link as LinkIcon, // zostawiony jeśli używasz gdzieś indziej
  Users,
  Lock,
  Mail,
  Sprout,
  Gauge,
  Rocket,
} from 'lucide-react';
import * as React from 'react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { IntentFormValues } from './types';

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
}: {
  form: UseFormReturn<IntentFormValues>;
}) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form;

  // re-render na zmiany:
  const levels = (useWatch({ control, name: 'levels' }) ?? []) as LevelValue[];
  const radiusKm = useWatch({ control, name: 'location.radiusKm' }) as
    | number
    | undefined;

  const radiusMetersText =
    typeof radiusKm === 'number' && radiusKm > 0
      ? ` (${Math.round(radiusKm * 1000)} m)`
      : '';

  const joinModeHintId = 'join-mode-hint';
  const visibilityHintId = 'visibility-hint';
  const memberCountHintId = 'member-count-hint';
  const showAddressHintId = 'show-address-hint';
  const levelsHintId = 'levels-hint';

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

      {/* Levels (multi-select, z ikonami) */}
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

      {/* showMemberCount */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Licznik uczestników
        </label>
        <p
          id={memberCountHintId}
          className="mb-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          Pokaż aktualną liczbę osób, które dołączyły (np. <i>7 / 20</i>) —
          zwiększa transparentność i motywację do zapisu.
        </p>

        <label className="flex cursor-pointer items-center gap-3 select-none text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            {...register('showMemberCount')}
            className="sr-only peer"
            aria-describedby={memberCountHintId}
          />
          <div
            className="
              relative h-6 w-11 rounded-full
              bg-zinc-300 dark:bg-zinc-700
              transition-colors duration-300
              shadow-inner
              peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-violet-500
              after:content-[''] after:absolute after:left-1 after:top-1
              after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-md
              after:transition-all after:duration-300 after:ease-in-out
              after:transform peer-checked:after:translate-x-5
              peer-checked:after:shadow-[0_0_6px_rgba(99,102,241,0.6)]
            "
          />
          <span className="transition-colors duration-300 peer-checked:text-indigo-600 dark:peer-checked:text-indigo-400">
            Pokaż liczbę uczestników
          </span>
        </label>
        {errors.showMemberCount && (
          <p className="mt-1 text-xs text-red-600">
            {String(errors.showMemberCount.message)}
          </p>
        )}
      </div>

      {/* showAddress */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Widoczność adresu
        </label>
        <p
          id={showAddressHintId}
          className="mb-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          Włącz, by pokazać dokładny adres w szczegółach. Wyłącz, jeśli wolisz
          pokazać tylko przybliżenie (np. z promieniem).
        </p>

        <label className="flex cursor-pointer items-center gap-3 select-none text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            {...register('showAddress')}
            className="sr-only peer"
            aria-describedby={showAddressHintId}
          />
          <div
            className="
              relative h-6 w-11 rounded-full
              bg-zinc-300 dark:bg-zinc-700
              transition-colors duration-300
              shadow-inner
              peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-violet-500
              after:content-[''] after:absolute after:left-1 after:top-1
              after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-md
              after:transition-all after:duration-300 after:ease-in-out
              after:transform peer-checked:after:translate-x-5
              peer-checked:after:shadow-[0_0_6px_rgba(99,102,241,0.6)]
            "
          />
          <span className="transition-colors duration-300 peer-checked:text-indigo-600 dark:peer-checked:text-indigo-400">
            Pokaż dokładny adres
          </span>
        </label>
        {errors.showAddress && (
          <p className="mt-1 text-xs text-red-600">
            {String(errors.showAddress.message)}
          </p>
        )}
      </div>

      {/* Info note */}
      <div
        role="note"
        className="flex items-start gap-2 rounded-2xl border border-blue-300/50 bg-blue-50 p-3
                   text-blue-700 dark:border-blue-400/30 dark:bg-blue-900/20 dark:text-blue-200"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full
                     bg-blue-100/70 text-blue-700 ring-1 ring-blue-300/60
                     dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/30"
        >
          <Info className="h-3.5 w-3.5" />
        </span>
        <p className="text-sm leading-5">
          Dla prywatnych miejsc rozważ <b>Ukryte</b> i ustaw <b>promień</b>
          {radiusMetersText} &gt; 0, aby zamaskować dokładny adres na mapie.
        </p>
      </div>
    </div>
  );
}
