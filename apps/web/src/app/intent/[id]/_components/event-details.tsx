import type { EventDetailsData } from '@/types/event-details';
import { formatDuration } from '@/lib/utils/intent-join-state';
import { Clock, MapPin, Globe, Info } from 'lucide-react';

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
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Kiedy i gdzie
        </h2>

        <div className="space-y-4">
          {/* Duration */}
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Czas trwania
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {duration}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.meetingKind !== 'ONLINE' && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Lokalizacja
                </p>
                {event.addressVisibility === 'PUBLIC' && event.address ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {event.address}
                    {event.radiusKm && event.radiusKm > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        (obszar w promieniu {event.radiusKm} km)
                      </span>
                    )}
                  </p>
                ) : event.addressVisibility === 'AFTER_JOIN' ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adres widoczny po dołączeniu
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adres ukryty
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Online URL */}
          {(event.meetingKind === 'ONLINE' || event.meetingKind === 'HYBRID') &&
            event.onlineUrl && (
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Link online
                  </p>
                  <a
                    href={event.onlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {event.onlineUrl}
                  </a>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Description Section */}
      {event.description && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Opis
          </h2>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {event.description}
            </p>
          </div>
        </div>
      )}

      {/* Categories and Tags */}
      {(event.categories.length > 0 || event.tags.length > 0) && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Kategorie i tagi
          </h2>

          <div className="space-y-3">
            {event.categories.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kategorie
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((cat) => (
                    <span
                      key={cat.slug}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {event.tags.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tagi
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      #{tag.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Aktywność
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Komentarze
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {event.commentsCount}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Wiadomości w czacie
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {event.messagesCount}
            </p>
          </div>
        </div>
      </div>

      {/* Notes (Owner/Mod only) */}
      {event.notes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
          <div className="mb-2 flex items-center gap-2">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
              Notatki organizatora
            </h2>
          </div>
          <p className="whitespace-pre-wrap text-sm text-amber-800 dark:text-amber-200">
            {event.notes}
          </p>
        </div>
      )}
    </div>
  );
}
