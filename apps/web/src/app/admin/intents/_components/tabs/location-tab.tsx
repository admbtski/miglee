'use client';

import { MapPin, Globe, Eye, EyeOff } from 'lucide-react';

type LocationTabProps = {
  intent: any;
  onRefresh?: () => void;
};

export function LocationTab({ intent }: LocationTabProps) {
  return (
    <div className="space-y-6">
      {/* Meeting Kind */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Typ spotkania
        </h3>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {intent.meetingKind || 'Nie określono'}
          </span>
        </div>
      </div>

      {/* Online URL */}
      {intent.onlineUrl && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Link online
          </h3>
          <a
            href={intent.onlineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {intent.onlineUrl}
          </a>
        </div>
      )}

      {/* Physical Location */}
      {(intent.address || intent.lat || intent.lng) && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Lokalizacja fizyczna
          </h3>
          <div className="space-y-3">
            {intent.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {intent.address}
                </span>
              </div>
            )}
            {intent.lat && intent.lng && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Współrzędne: {intent.lat.toFixed(6)}, {intent.lng.toFixed(6)}
              </div>
            )}
            {intent.radiusKm && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Promień: {intent.radiusKm} km
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Ustawienia prywatności
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {intent.addressVisibility === 'PUBLIC' ? (
                <Eye className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Widoczność adresu:
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {intent.addressVisibility || 'PUBLIC'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {intent.membersVisibility === 'PUBLIC' ? (
                <Eye className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Widoczność członków:
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {intent.membersVisibility || 'PUBLIC'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
