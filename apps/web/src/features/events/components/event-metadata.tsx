import type { EventDetailsData } from '@/features/events';
import { Calendar, Clock, FileText, InfoIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

type EventMetadataProps = {
  event: EventDetailsData;
};

export function EventMetadata({ event }: EventMetadataProps) {
  const createdDate = new Date(event.createdAt);
  const updatedDate = new Date(event.updatedAt);
  const isUpdated = updatedDate.getTime() - createdDate.getTime() > 60000; // More than 1 minute difference

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <InfoIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Informacje o wydarzeniu
        </h2>
      </div>

      <div className="space-y-3">
        {/* Created At */}
        <div className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
          <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Data utworzenia
            </p>
            <p className="text-md text-zinc-800 dark:text-zinc-200">
              {format(createdDate, "d MMMM yyyy 'o' HH:mm", { locale: pl })}
            </p>
          </div>
        </div>

        {/* Updated At */}
        {isUpdated && (
          <div className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
            <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Ostatnia aktualizacja
              </p>
              <p className="text-md text-zinc-800 dark:text-zinc-200">
                {format(updatedDate, "d MMMM yyyy 'o' HH:mm", { locale: pl })}
              </p>
            </div>
          </div>
        )}

        {/* Event ID (for support) */}
        <div className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
          <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              ID wydarzenia
            </p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400 break-all">
                {event.id}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(event.id);
                  // Optional: show a toast notification
                }}
                className="flex-shrink-0 rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700 transition"
                title="Kopiuj ID"
              >
                Kopiuj
              </button>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 ID wydarzenia może być przydatne przy kontakcie z supportem
          </p>
        </div>
      </div>
    </div>
  );
}
