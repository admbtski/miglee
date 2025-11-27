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
  Lock,
  Mail,
  Rocket,
  Sprout,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import * as React from 'react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { IntentFormValues } from './types';
import { JoinFormStep, JoinFormQuestion } from './join-form-step';
import { cn } from '@/lib/utils';

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
      className={cn(
        'relative flex-1 inline-flex items-center justify-center gap-2 rounded-xl transition-all',
        'px-4 py-3 text-sm font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled &&
          (active
            ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
            : 'text-zinc-700 bg-white border-2 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 dark:text-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:border-zinc-600')
      )}
    >
      {Icon ? <Icon className="w-5 h-5" aria-hidden /> : null}
      <span>{children}</span>
    </button>
  );
}

type JoinMode = 'OPEN' | 'INVITE_ONLY' | 'REQUEST';
type VisibilityMode = 'PUBLIC' | 'HIDDEN';
type LevelValue = IntentFormValues['levels'][number];

const LEVEL_OPTIONS: Array<{ value: LevelValue; label: string; Icon: any }> = [
  { value: 'BEGINNER', label: 'Początkujący', Icon: Sprout },
  { value: 'INTERMEDIATE', label: 'Średniozaawansowany', Icon: Gauge },
  { value: 'ADVANCED', label: 'Zaawansowany', Icon: Rocket },
];

function FormSection({
  title,
  description,
  children,
  error,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </label>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <span className="text-base">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

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
    control,
    setValue,
    formState: { errors },
  } = form;

  // re-render na zmiany:
  const levels = (useWatch({ control, name: 'levels' }) ?? []) as LevelValue[];
  const joinMode = useWatch({ control, name: 'joinMode' }) as JoinMode;

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
      <FormSection
        title="Tryb dołączania"
        description="Zdecyduj, kto i w jaki sposób może dołączyć do Twojego wydarzenia."
        error={errors.joinMode?.message}
      >
        <Controller
          control={control}
          name="joinMode"
          render={({ field }) => (
            <SegmentedControl<JoinMode>
              aria-label="Tryb dołączania"
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

        {/* Help text based on selected mode */}
        <div className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {joinMode === 'OPEN' && (
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
              {joinMode === 'INVITE_ONLY' && (
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
              {joinMode === 'REQUEST' && (
                <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {joinMode === 'OPEN' && 'Wydarzenie otwarte'}
                {joinMode === 'INVITE_ONLY' && 'Tylko dla zaproszonych'}
                {joinMode === 'REQUEST' && 'Wymaga akceptacji'}
              </p>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {joinMode === 'OPEN' &&
                  'Każdy może dołączyć bez zgody organizatora. Idealne dla publicznych wydarzeń i spotkań otwartych.'}
                {joinMode === 'INVITE_ONLY' &&
                  'Tylko osoby z linkiem zaproszenia mogą dołączyć. Zapewnia pełną kontrolę nad uczestnikami.'}
                {joinMode === 'REQUEST' &&
                  'Użytkownicy wysyłają prośbę o dołączenie, którą musisz zaakceptować. Możesz dodać własne pytania.'}
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Visibility */}
      <FormSection
        title="Widoczność wydarzenia"
        description="Kontroluj, gdzie i jak Twoje wydarzenie będzie widoczne dla innych użytkowników."
        error={errors.visibility?.message}
      >
        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <SegmentedControl<VisibilityMode>
              aria-label="Widoczność"
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

        <div className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {form.watch('visibility') === 'PUBLIC' ? (
                <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {form.watch('visibility') === 'PUBLIC'
                  ? 'Widoczne w wyszukiwarce'
                  : 'Dostępne tylko przez link'}
              </p>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {form.watch('visibility') === 'PUBLIC'
                  ? 'Wydarzenie pojawi się na mapie, w wynikach wyszukiwania i listach publicznych.'
                  : 'Wydarzenie nie pojawi się w wyszukiwaniu. Dostęp tylko dla osób z bezpośrednim linkiem.'}
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Levels */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Poziom zaawansowania
            </label>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Określ dla kogo przeznaczone jest wydarzenie. Możesz wybrać wiele
              poziomów.
            </p>
          </div>
          {levels.length > 0 && (
            <button
              type="button"
              onClick={clearLevels}
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              title="Wyczyść wybór poziomów"
            >
              <X className="w-4 h-4" />
              Wyczyść
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
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

        {levels.length === 0 && (
          <div className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              💡 <strong>Wskazówka:</strong> Brak wyboru oznacza, że wydarzenie
              jest dla wszystkich poziomów zaawansowania.
            </p>
          </div>
        )}

        {errors.levels && (
          <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <span className="text-base">⚠️</span>
            {String(errors.levels.message)}
          </p>
        )}
      </div>

      {/* Members visibility */}
      <FormSection
        title="Widoczność listy uczestników"
        description="Określ, kto może widzieć listę osób biorących udział w wydarzeniu."
        error={errors.membersVisibility?.message}
      >
        <Controller
          control={control}
          name="membersVisibility"
          render={({ field }) => (
            <SegmentedControl<MembersVisibility>
              aria-label="Widoczność uczestników"
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
      </FormSection>

      {/* Address visibility */}
      <FormSection
        title="Widoczność dokładnego adresu"
        description="Zdecyduj, kto może zobaczyć pełny adres spotkania."
        error={errors.addressVisibility?.message}
      >
        <Controller
          control={control}
          name="addressVisibility"
          render={({ field }) => (
            <SegmentedControl<AddressVisibility>
              aria-label="Widoczność adresu"
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

        <div className="p-4 border rounded-xl bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Prywatność adresu
              </p>
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                {form.watch('addressVisibility') === AddressVisibility.Public &&
                  'Dokładny adres będzie widoczny dla wszystkich, którzy zobaczą wydarzenie.'}
                {form.watch('addressVisibility') ===
                  AddressVisibility.AfterJoin &&
                  'Dokładny adres otrzymają tylko osoby, które dołączą do wydarzenia.'}
                {form.watch('addressVisibility') === AddressVisibility.Hidden &&
                  'Dokładny adres pozostanie ukryty. Wyświetlony zostanie tylko przybliżony obszar.'}
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Join Form Questions - only shown when joinMode is REQUEST */}
      {joinMode === 'REQUEST' && onJoinFormQuestionsChange && (
        <div className="p-6 border-2 border-indigo-200 border-dashed rounded-2xl dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10">
          <div className="mb-4">
            <label className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Pytania w formularzu prośby o dołączenie
            </label>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Dodaj niestandardowe pytania, które użytkownicy będą musieli
              wypełnić przy prośbie o dołączenie (opcjonalne).
            </p>
          </div>
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
