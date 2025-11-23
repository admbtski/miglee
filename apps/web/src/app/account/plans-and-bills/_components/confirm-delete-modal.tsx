'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { CardItem } from '../types';
import { Modal } from '@/components/feedback/modal';

export function ConfirmDeleteModal({
  open,
  card,
  onClose,
  onConfirm,
}: {
  open: boolean;
  card: CardItem | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  if (!card) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="centered"
      size="sm"
      density="comfortable"
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Are you sure?
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      }
      content={
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Are you sure you want to delete this card?
          </p>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-indigo-600 dark:accent-indigo-500"
            />
            Don&apos;t show me this again
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(card.id)}
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-red-600 hover:bg-red-500 transition-colors"
            >
              Yes, I&apos;m sure
            </button>
          </div>
        </div>
      }
    />
  );
}
