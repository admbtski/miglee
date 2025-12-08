'use client';

import { MapPin, Globe, Eye, EyeOff } from 'lucide-react';

type LocationTabProps = {
  event: any;
  onRefresh?: () => void;
};

export function LocationTab({ event }: LocationTabProps) {
  return (
    <div className="space-y-6">
      {/* Meeting Kind */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Typ spotkania
        </h3>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {event.meetingKind || 'Nie określono'}
          </span>
        </div>
      </div>

      {/* Online URL */}
      {event.onlineUrl && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Link online
          </h3>
          <a
            href={event.onlineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {event.onlineUrl}
          </a>
        </div>
      )}

      {/* Physical Location */}
      {(event.address || event.lat || event.lng) && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Lokalizacja fizyczna
          </h3>
          <div className="space-y-3">
            {event.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-900 dark:text-zinc-100">
                  {event.address}
                </span>
              </div>
            )}
            {event.lat && event.lng && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Współrzędne: {event.lat.toFixed(6)}, {event.lng.toFixed(6)}
              </div>
            )}
            {event.radiusKm && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Promień: {event.radiusKm} km
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Ustawienia prywatności
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {event.addressVisibility === 'PUBLIC' ? (
                <Eye className="h-4 w-4 text-zinc-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-zinc-400" />
              )}
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Widoczność adresu:
              </span>
            </div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {event.addressVisibility || 'PUBLIC'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {event.membersVisibility === 'PUBLIC' ? (
                <Eye className="h-4 w-4 text-zinc-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-zinc-400" />
              )}
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Widoczność członków:
              </span>
            </div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {event.membersVisibility || 'PUBLIC'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
