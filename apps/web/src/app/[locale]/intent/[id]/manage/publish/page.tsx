'use client';

import {
  CalendarClock,
  Clock,
  Eye,
  EyeOff,
  FileEdit,
  Globe,
  Rocket,
  Send,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { useIntentManagement } from '../_components/intent-management-provider';
import {
  usePublishIntentMutation,
  useScheduleIntentPublicationMutation,
  useCancelScheduledPublicationMutation,
  useUnpublishIntentMutation,
} from '@/lib/api/intents';
import { toast } from '@/lib/utils';

// Local enum until codegen runs
enum PublicationStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Scheduled = 'SCHEDULED',
}

/**
 * PublishPage - Manage event publication status
 *
 * Features:
 * - Publish immediately
 * - Schedule publication
 * - Unpublish (return to draft)
 * - Status overview
 */
export default function PublishPage() {
  const { intent, isLoading, refetch } = useIntentManagement();

  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  const { mutateAsync: publishAsync, isPending: isPublishing } =
    usePublishIntentMutation();
  const { mutateAsync: scheduleAsync, isPending: isScheduling } =
    useScheduleIntentPublicationMutation();
  const { mutateAsync: cancelScheduleAsync, isPending: isCancellingSchedule } =
    useCancelScheduledPublicationMutation();
  const { mutateAsync: unpublishAsync, isPending: isUnpublishing } =
    useUnpublishIntentMutation();

  const isMutating =
    isPublishing || isScheduling || isCancellingSchedule || isUnpublishing;

  // Get status from intent data (use any until codegen runs)
  const intentAny = intent as any;
  const status: PublicationStatus =
    (intentAny?.publicationStatus as PublicationStatus) ??
    PublicationStatus.Draft;

  const handlePublishNow = useCallback(async () => {
    if (!intent?.id) return;
    try {
      await publishAsync({ id: intent.id });
      toast.success('Wydarzenie zostało opublikowane!');
      refetch();
    } catch (error: any) {
      toast.error('Nie udało się opublikować wydarzenia', {
        description: error?.message ?? 'Spróbuj ponownie',
      });
    }
  }, [intent?.id, publishAsync, refetch]);

  const handleSchedule = useCallback(async () => {
    if (!intent?.id || !scheduledDate || !scheduledTime) return;

    const publishAt = new Date(`${scheduledDate}T${scheduledTime}`);

    try {
      await scheduleAsync({
        id: intent.id,
        publishAt: publishAt.toISOString(),
      });
      toast.success('Publikacja została zaplanowana!');
      setScheduledDate('');
      setScheduledTime('');
      refetch();
    } catch (error: any) {
      toast.error('Nie udało się zaplanować publikacji', {
        description: error?.message ?? 'Spróbuj ponownie',
      });
    }
  }, [intent?.id, scheduledDate, scheduledTime, scheduleAsync, refetch]);

  const handleUnpublish = useCallback(async () => {
    if (!intent?.id) return;
    try {
      await unpublishAsync({ id: intent.id });
      toast.success('Wydarzenie wróciło do wersji roboczej');
      refetch();
    } catch (error: any) {
      toast.error('Nie udało się cofnąć publikacji', {
        description: error?.message ?? 'Spróbuj ponownie',
      });
    }
  }, [intent?.id, unpublishAsync, refetch]);

  const handleCancelSchedule = useCallback(async () => {
    if (!intent?.id) return;
    try {
      await cancelScheduleAsync({ id: intent.id });
      toast.success('Zaplanowana publikacja została anulowana');
      setScheduledDate('');
      setScheduledTime('');
      refetch();
    } catch (error: any) {
      toast.error('Nie udało się anulować planowania', {
        description: error?.message ?? 'Spróbuj ponownie',
      });
    }
  }, [intent?.id, cancelScheduleAsync, refetch]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-96 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  // Get minimum date (now)
  const now = new Date();
  const minDate = now.toISOString().split('T')[0];

  // Format scheduled date for display (use any until codegen runs)
  const scheduledPublishAt = intentAny?.scheduledPublishAt
    ? new Date(intentAny.scheduledPublishAt)
    : null;
  const formattedScheduledDate = scheduledPublishAt
    ? scheduledPublishAt.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  const formattedScheduledTime = scheduledPublishAt
    ? scheduledPublishAt.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Publikacja wydarzenia
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Zarządzaj statusem publikacji swojego wydarzenia.
        </p>
      </div>

      {/* Current Status */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div
            className={[
              'flex items-center justify-center w-12 h-12 rounded-xl',
              status === PublicationStatus.Draft
                ? 'bg-zinc-100 dark:bg-zinc-800'
                : status === PublicationStatus.Published
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-amber-100 dark:bg-amber-900/30',
            ].join(' ')}
          >
            {status === PublicationStatus.Draft && (
              <FileEdit className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
            )}
            {status === PublicationStatus.Published && (
              <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            )}
            {status === PublicationStatus.Scheduled && (
              <CalendarClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {status === PublicationStatus.Draft && 'Wersja robocza'}
                {status === PublicationStatus.Published && 'Opublikowane'}
                {status === PublicationStatus.Scheduled && 'Zaplanowane'}
              </h2>
              <span
                className={[
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  status === PublicationStatus.Draft
                    ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                    : status === PublicationStatus.Published
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                ].join(' ')}
              >
                {status}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {status === PublicationStatus.Draft &&
                'Wydarzenie jest widoczne tylko dla Ciebie i moderatorów. Opublikuj je, aby inni mogli je zobaczyć.'}
              {status === PublicationStatus.Published &&
                'Wydarzenie jest widoczne dla wszystkich użytkowników zgodnie z ustawieniami prywatności.'}
              {status === PublicationStatus.Scheduled &&
                `Wydarzenie zostanie opublikowane ${formattedScheduledDate} o ${formattedScheduledTime}.`}
            </p>
            {intentAny?.publishedAt &&
              status === PublicationStatus.Published && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Opublikowano:{' '}
                  {new Date(intentAny.publishedAt).toLocaleString('pl-PL')}
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Draft Actions */}
      {status === PublicationStatus.Draft && (
        <div className="space-y-6">
          {/* Publish Now */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <Rocket className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Opublikuj teraz
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Wydarzenie natychmiast stanie się widoczne dla użytkowników.
                </p>
                <button
                  type="button"
                  onClick={handlePublishNow}
                  disabled={isMutating}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publikowanie...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Opublikuj wydarzenie
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Publication */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <CalendarClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Zaplanuj publikację
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Ustaw datę i godzinę, kiedy wydarzenie ma zostać automatycznie
                  opublikowane.
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Data
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={minDate}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Godzina
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={isMutating || !scheduledDate || !scheduledTime}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-300 rounded-xl border-2 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isScheduling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Zaplanuj publikację
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Published Actions */}
      {status === PublicationStatus.Published && (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <EyeOff className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Cofnij publikację
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Wydarzenie wróci do wersji roboczej i nie będzie widoczne dla
                innych użytkowników.
              </p>
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={isMutating}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 rounded-xl border-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isUnpublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                Cofnij publikację
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Actions */}
      {status === PublicationStatus.Scheduled && (
        <div className="space-y-6">
          {/* Publish Now Option */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <Rocket className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Opublikuj teraz
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Nie chcesz czekać? Opublikuj wydarzenie natychmiast.
                </p>
                <button
                  type="button"
                  onClick={handlePublishNow}
                  disabled={isMutating}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Opublikuj teraz
                </button>
              </div>
            </div>
          </div>

          {/* Cancel Schedule */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Anuluj zaplanowaną publikację
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Wydarzenie wróci do wersji roboczej i nie zostanie
                  automatycznie opublikowane.
                </p>
                <button
                  type="button"
                  onClick={handleCancelSchedule}
                  disabled={isMutating}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-red-700 dark:text-red-300 rounded-xl border-2 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isCancellingSchedule ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  Anuluj planowanie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Info */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Kto widzi wersję roboczą?
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              Tylko Ty (właściciel), moderatorzy wydarzenia oraz administratorzy
              systemu mogą zobaczyć wydarzenie w trybie wersji roboczej.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
