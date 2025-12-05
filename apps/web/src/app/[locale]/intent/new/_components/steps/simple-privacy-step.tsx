'use client';

import { Eye, EyeOff, Info, Lock, Mail, Users } from 'lucide-react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { SimpleIntentFormValues } from '@/features/intents/components/types';
import { SegmentedControl } from '@/components/ui/segment-control';

type JoinMode = 'OPEN' | 'INVITE_ONLY' | 'REQUEST';
type VisibilityMode = 'PUBLIC' | 'HIDDEN';

/**
 * SimplePrivacyStep - Simplified privacy step
 *
 * Features:
 * - Event visibility (Public/Hidden)
 * - Join mode (Open/Request/Invite-only)
 * - Clear explanations for each option
 */
export function SimplePrivacyStep({
  form,
}: {
  form: UseFormReturn<SimpleIntentFormValues>;
}) {
  const {
    control,
    formState: { errors },
  } = form;

  const visibility = useWatch({
    control,
    name: 'visibility',
  }) as VisibilityMode;
  const joinMode = useWatch({ control, name: 'joinMode' }) as JoinMode;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Prywatność wydarzenia
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Zdecyduj, kto może zobaczyć i dołączyć do wydarzenia.
        </p>
      </div>

      {/* Visibility */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Widoczność wydarzenia
        </label>
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

        {/* Visibility description */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start gap-3">
            {visibility === 'PUBLIC' ? (
              <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            ) : (
              <EyeOff className="w-5 h-5 text-zinc-600 dark:text-zinc-400 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {visibility === 'PUBLIC'
                  ? 'Widoczne w wyszukiwarce'
                  : 'Dostępne tylko przez link'}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {visibility === 'PUBLIC'
                  ? 'Wydarzenie pojawi się na mapie, w wynikach wyszukiwania i listach publicznych.'
                  : 'Wydarzenie nie pojawi się w wyszukiwaniu. Dostęp tylko dla osób z bezpośrednim linkiem.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Join mode */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tryb dołączania
        </label>
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
                { value: 'REQUEST', label: 'Na prośbę', Icon: Mail },
                { value: 'INVITE_ONLY', label: 'Na zaproszenie', Icon: Lock },
              ]}
            />
          )}
        />

        {/* Join mode description */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {joinMode === 'OPEN' && (
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
              {joinMode === 'REQUEST' && (
                <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
              {joinMode === 'INVITE_ONLY' && (
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {joinMode === 'OPEN' && 'Wydarzenie otwarte'}
                {joinMode === 'REQUEST' && 'Wymaga akceptacji'}
                {joinMode === 'INVITE_ONLY' && 'Tylko dla zaproszonych'}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {joinMode === 'OPEN' &&
                  'Każdy może dołączyć bez zgody organizatora. Idealne dla publicznych wydarzeń i spotkań otwartych.'}
                {joinMode === 'REQUEST' &&
                  'Użytkownicy wysyłają prośbę o dołączenie, którą musisz zaakceptować.'}
                {joinMode === 'INVITE_ONLY' &&
                  'Tylko osoby z linkiem zaproszenia mogą dołączyć. Zapewnia pełną kontrolę nad uczestnikami.'}
              </p>
            </div>
          </div>
        </div>

        {errors.joinMode && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.joinMode.message as string}
          </p>
        )}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 dark:text-indigo-100">
          Zaawansowane ustawienia prywatności (widoczność adresu, listy
          uczestników, poziomy zaawansowania) skonfigurujesz w panelu
          wydarzenia.
        </p>
      </div>
    </div>
  );
}
