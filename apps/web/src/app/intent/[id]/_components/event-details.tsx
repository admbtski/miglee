import type { EventDetailsData } from '@/types/event-details';
import { formatDuration } from '@/lib/utils/intent-join-state';
import {
  Clock,
  ClockFading,
  Gauge,
  Globe,
  Info,
  Lock,
  MapPin,
  Rocket,
  Sprout,
} from 'lucide-react';

type EventDetailsProps = {
  event: EventDetailsData;
};

export function EventDetails({ event }: EventDetailsProps) {
  const startDate = new Date(event.startISO);
  const endDate = new Date(event.endISO);
  const duration = formatDuration(startDate, endDate);

  return (
    <div className="space-y-6">
      {/* When and Where Section */}
      <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Kiedy i gdzie
        </h2>

        <div className="space-y-4">
          {/* Duration */}
          <div className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition">
            <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Czas trwania
              </p>
              <p className="text-md text-neutral-800 dark:text-neutral-200">
                {duration}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.meetingKind !== 'ONLINE' && (
            <div className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition">
              <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Lokalizacja
                </p>
                {event.addressVisibility === 'PUBLIC' && event.address ? (
                  <p className="text-md text-neutral-800 dark:text-neutral-200 break-words">
                    {event.address}
                    {event.radiusKm && event.radiusKm > 0 && (
                      <span className="ml-2 text-xs text-neutral-500">
                        (obszar w promieniu {event.radiusKm} km)
                      </span>
                    )}
                  </p>
                ) : event.addressVisibility === 'AFTER_JOIN' ? (
                  <p className="text-md text-neutral-800 dark:text-neutral-200">
                    Adres widoczny po dołączeniu
                  </p>
                ) : (
                  <p className="text-md text-neutral-800 dark:text-neutral-200">
                    Adres ukryty
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Online URL */}
          {(event.meetingKind === 'ONLINE' || event.meetingKind === 'HYBRID') &&
            event.onlineUrl && (
              <div className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition">
                <Globe className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Link online
                  </p>
                  <a
                    href={event.onlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-md text-blue-600 hover:underline underline-offset-2 dark:text-blue-400 break-all"
                  >
                    Otwórz link do spotkania
                  </a>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Join Window Settings */}
      {(event.joinOpensMinutesBeforeStart ||
        event.joinCutoffMinutesBeforeStart ||
        event.allowJoinLate ||
        event.lateJoinCutoffMinutesAfterStart ||
        event.joinManuallyClosed) && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-800 dark:bg-indigo-900/20">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            <Gauge className="h-4 w-4" />
            Ustawienia zapisów
          </div>
          <div className="space-y-3 text-sm text-indigo-900 dark:text-indigo-100">
            {event.joinOpensMinutesBeforeStart && (
              <div className="flex items-start gap-2">
                <Sprout className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Zapisy otwierają się{' '}
                  <strong className="font-semibold tabular-nums">
                    {event.joinOpensMinutesBeforeStart} min
                  </strong>{' '}
                  przed startem
                </span>
              </div>
            )}
            {event.joinCutoffMinutesBeforeStart && (
              <div className="flex items-start gap-2">
                <Rocket className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                <span>
                  Zapisy zamykają się{' '}
                  <strong className="font-semibold tabular-nums">
                    {event.joinCutoffMinutesBeforeStart} min
                  </strong>{' '}
                  przed startem
                </span>
              </div>
            )}
            {event.allowJoinLate ? (
              <div className="flex items-start gap-2">
                <ClockFading className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <span>
                  Można dołączyć po starcie
                  {event.lateJoinCutoffMinutesAfterStart && (
                    <>
                      {' '}
                      (do{' '}
                      <strong className="font-semibold tabular-nums">
                        {event.lateJoinCutoffMinutesAfterStart} min
                      </strong>{' '}
                      po starcie)
                    </>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <ClockFading className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
                <span className="text-indigo-700 dark:text-indigo-300">
                  Brak możliwości dołączenia po starcie
                </span>
              </div>
            )}
            {event.joinManuallyClosed && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-100/50 p-3 dark:border-amber-700 dark:bg-amber-900/30">
                <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400" />
                <div>
                  <div className="font-semibold text-amber-900 dark:text-amber-200">
                    Zapisy ręcznie zamknięte
                  </div>
                  {event.joinManualCloseReason && (
                    <div className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      {event.joinManualCloseReason}
                    </div>
                  )}
                  {event.joinManuallyClosedAt && (
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      {new Date(event.joinManuallyClosedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description Section */}
      {event.description && (
        <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Opis
          </h2>
          <p className="text-md text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-6">
            {event.description}
          </p>
        </div>
      )}

      {/* Categories and Tags */}
      {(event.categories.length > 0 || event.tags.length > 0) && (
        <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Kontekst
          </h2>

          <div className="flex flex-wrap items-start gap-2">
            {event.categories.map((cat) => (
              <span
                key={cat.slug}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-100"
              >
                {cat.name}
              </span>
            ))}
            {event.tags.map((tag) => (
              <span
                key={tag.slug}
                className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                #{tag.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Activity Section */}
      <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Aktywność
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Komentarze
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {event.commentsCount}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Wiadomości w czacie
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {event.messagesCount}
            </p>
          </div>
        </div>
      </div>

      {/* Notes (Owner/Mod only) */}
      {event.notes && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
              Notatki organizatora
            </h2>
          </div>
          <p className="whitespace-pre-wrap text-md text-amber-800 dark:text-amber-200 leading-6">
            {event.notes}
          </p>
        </div>
      )}
    </div>
  );
}
