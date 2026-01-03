'use client';

import { ShieldBan, Clock } from 'lucide-react';
import { format, pl } from '@/lib/date';

interface SuspendedAccountScreenProps {
  suspendedAt?: string | null;
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
}

/**
 * Suspended Account Screen
 *
 * Displayed to users whose accounts have been suspended by administrators.
 * Shows suspension details including reason, start date, and end date if temporary.
 *
 * ✅ Requirements:
 * - Clear communication about suspension status
 * - Show reason (if provided by admin)
 * - Show end date for temporary suspensions
 * - Support contact information
 */
export function SuspendedAccountScreen({
  suspendedAt,
  suspendedUntil,
  suspensionReason,
}: SuspendedAccountScreenProps) {
  const isTemporary = !!suspendedUntil;
  const endDate = suspendedUntil ? new Date(suspendedUntil) : null;
  const startDate = suspendedAt ? new Date(suspendedAt) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
            <ShieldBan className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Konto zawieszone
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Twoje konto zostało tymczasowo zawieszone
          </p>
        </div>

        {/* Suspension Details Card */}
        <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm dark:border-red-800 dark:bg-zinc-950">
          {/* Suspension Type */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {isTemporary ? 'Zawieszenie czasowe' : 'Zawieszenie bezterminowe'}
              </h2>
            </div>
            {isTemporary && endDate ? (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Twoje konto zostanie automatycznie przywrócone:{' '}
                <span className="font-semibold">
                  {format(endDate, 'dd MMMM yyyy, HH:mm', { locale: pl })}
                </span>
              </p>
            ) : (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Konto zostało zawieszone na czas nieokreślony. Skontaktuj się z
                pomocą techniczną.
              </p>
            )}
          </div>

          {/* Suspension Reason */}
          {suspensionReason && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
              <h3 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                Powód zawieszenia
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {suspensionReason}
              </p>
            </div>
          )}

          {/* Start Date */}
          {startDate && (
            <div className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                Data zawieszenia:{' '}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {format(startDate, 'dd MMMM yyyy, HH:mm', { locale: pl })}
                </span>
              </p>
            </div>
          )}

          {/* What This Means */}
          <div className="mb-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Co to oznacza?
            </h3>
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <li>• Nie możesz tworzyć ani zarządzać wydarzeniami</li>
              <li>• Nie możesz dołączać do wydarzeń</li>
              <li>• Nie możesz dodawać komentarzy ani recenzji</li>
              <li>• Nie możesz wysyłać wiadomości do innych użytkowników</li>
            </ul>
          </div>

          {/* Support Contact */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
              Potrzebujesz pomocy?
            </h3>
            <p className="mb-3 text-sm text-blue-800 dark:text-blue-200">
              Jeśli uważasz, że to zawieszenie jest pomyłką lub chcesz
              wyjaśnić sytuację, skontaktuj się z naszym zespołem wsparcia.
            </p>
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Skontaktuj się z pomocą techniczną
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            ID konta: {/* user ID would go here */}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            W przypadku pytań, prosimy podać ID konta w wiadomości
          </p>
        </div>
      </div>
    </div>
  );
}

