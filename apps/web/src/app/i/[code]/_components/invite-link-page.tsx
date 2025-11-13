'use client';

import * as React from 'react';
import {
  useValidateInviteLinkQuery,
  useJoinByInviteLinkMutation,
} from '@/lib/api/invite-links';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Users,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import clsx from 'clsx';

interface InviteLinkPageProps {
  code: string;
}

export function InviteLinkPage({ code }: InviteLinkPageProps) {
  const router = useRouter();
  const { data, isLoading, error } = useValidateInviteLinkQuery({ code });
  const joinMutation = useJoinByInviteLinkMutation();

  const validation = data?.validateInviteLink;

  const handleJoin = async () => {
    try {
      const result = await joinMutation.mutateAsync({ code });
      // Redirect to event page
      router.push(`/intent/${result.joinByInviteLink.id}`);
    } catch (err) {
      console.error('Failed to join:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Sprawdzanie zaproszenia...
          </p>
        </div>
      </div>
    );
  }

  if (error || !validation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900/30 dark:bg-zinc-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Nieprawidłowy link
          </h1>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Ten link zaproszeniowy jest nieprawidłowy lub wygasł.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Wróć do strony głównej
          </button>
        </div>
      </div>
    );
  }

  if (!validation.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xl dark:border-amber-900/30 dark:bg-zinc-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Link niedostępny
          </h1>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            {validation.reason}
          </p>
          {validation.intent && (
            <button
              onClick={() => router.push(`/intent/${validation.intent!.id}`)}
              className="mb-3 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Zobacz wydarzenie
            </button>
          )}
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Wróć do strony głównej
          </button>
        </div>
      </div>
    );
  }

  const { intent } = validation;

  if (!intent) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-purple-950/20 p-4">
      <div className="w-full max-w-2xl">
        {/* Success indicator */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
            <Check className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Zostałeś zaproszony!
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Kliknij poniżej, aby dołączyć do wydarzenia
            </p>
          </div>

          {/* Event details */}
          <div className="mb-8 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {intent.title}
            </h2>

            {intent.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {intent.description}
              </p>
            )}

            <div className="space-y-3 pt-4">
              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <div className="text-sm">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(new Date(intent.startAt), 'EEEE, d MMMM yyyy', {
                      locale: pl,
                    })}
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    {format(new Date(intent.startAt), 'HH:mm', { locale: pl })}{' '}
                    - {format(new Date(intent.endAt), 'HH:mm', { locale: pl })}
                  </div>
                </div>
              </div>

              {/* Location */}
              {intent.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <div className="text-sm text-zinc-700 dark:text-zinc-300">
                    {intent.address}
                  </div>
                </div>
              )}

              {/* Participants */}
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <div className="text-sm">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {intent.joinedCount} / {intent.max}
                  </span>
                  <span className="ml-1 text-zinc-600 dark:text-zinc-400">
                    uczestników
                  </span>
                  {intent.isFull && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Pełne
                    </span>
                  )}
                </div>
              </div>

              {/* Organizer */}
              {intent.owner && (
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  {intent.owner.imageUrl && (
                    <img
                      src={intent.owner.imageUrl}
                      alt={intent.owner.name}
                      className="h-10 w-10 rounded-full"
                    />
                  )}
                  <div className="text-sm">
                    <div className="text-zinc-600 dark:text-zinc-400">
                      Organizator
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {intent.owner.name}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending || intent.isFull}
              className={clsx(
                'w-full rounded-xl px-6 py-4 text-base font-semibold text-white shadow-lg transition-all',
                intent.isFull
                  ? 'cursor-not-allowed bg-zinc-400 dark:bg-zinc-700'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl'
              )}
            >
              {joinMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Dołączanie...
                </span>
              ) : intent.isFull ? (
                'Wydarzenie jest pełne'
              ) : (
                'Dołącz do wydarzenia'
              )}
            </button>

            <button
              onClick={() => router.push(`/intent/${intent.id}`)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Zobacz szczegóły wydarzenia
            </button>
          </div>

          {joinMutation.isError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
              <p className="text-sm text-red-700 dark:text-red-400">
                Wystąpił błąd podczas dołączania do wydarzenia. Spróbuj ponownie
                później.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
