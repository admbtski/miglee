'use client';

// TODO i18n: All Polish strings need translation keys
// - "Znaleziono zapisany szkic", time ago strings, "Tytuł:", "Opis:", warning, button labels
// TODO i18n: Date formatting should be locale-aware

import { Modal } from '@/components/ui/modal';
import { FileText, Clock, Trash2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface DraftRestoreModalProps {
  open: boolean;
  onClose: () => void;
  onRestore: () => void;
  onDiscard: () => void;
  draftDate: Date;
  draftPreview?: {
    title?: string;
    description?: string;
    coverUrl?: string;
  };
}

export function DraftRestoreModal({
  open,
  onClose,
  onRestore,
  onDiscard,
  draftDate,
  draftPreview,
}: DraftRestoreModalProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'przed chwilą';
    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours} godz. temu`;
    if (days === 1) return 'wczoraj';
    return `${days} dni temu`;
  };

  const handleRestore = () => {
    onRestore();
    onClose();
  };

  const handleDiscard = () => {
    onDiscard();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="centered"
      size="md"
      density="comfortable"
      closeOnBackdrop={false}
      closeOnEsc
      header={
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Znaleziono zapisany szkic
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Czy chcesz przywrócić poprzednią wersję?
            </p>
          </div>
        </div>
      }
      content={
        <div className="space-y-6">
          {/* Draft Info Card */}
          <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100/50 p-4 dark:border-zinc-700 dark:from-zinc-800/50 dark:to-zinc-800/30">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                Zapisano {getTimeAgo(draftDate)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono">
              {formatDate(draftDate)}
            </p>

            {/* Draft Preview */}
            {draftPreview && (
              <div className="mt-4 space-y-2">
                {draftPreview.title && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                      Tytuł:
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {draftPreview.title}
                    </p>
                  </div>
                )}
                {draftPreview.description && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                      Opis:
                    </p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
                      {draftPreview.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning Message */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-900/10 dark:border-amber-800/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Uwaga:</span> Przywrócenie szkicu
              zastąpi wszystkie aktualne zmiany.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <motion.button
              type="button"
              onClick={handleDiscard}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all border-2 border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50"
            >
              <Trash2 className="h-4 w-4" />
              Odrzuć szkic
            </motion.button>

            <motion.button
              type="button"
              onClick={handleRestore}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
            >
              <RotateCcw className="h-4 w-4" />
              Przywróć szkic
            </motion.button>
          </div>
        </div>
      }
    />
  );
}
