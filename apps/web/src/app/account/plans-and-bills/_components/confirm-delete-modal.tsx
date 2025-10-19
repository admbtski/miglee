'use client';

import React from 'react';
import type { CardItem } from '../types';
import { ModalShell } from './modal-shell';

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
  if (!open || !card) return null;
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Are you sure?"
      maxWidth="max-w-md"
    >
      <p className="px-1 pb-2 text-sm text-zinc-300">
        Are you sure you want to delete this card?
      </p>
      <label className="flex items-center gap-2 px-1 mb-4 text-sm">
        <input type="checkbox" className="accent-indigo-500" /> Don&apos;t show
        me this again
      </label>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm border rounded-xl border-zinc-700 hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(card.id)}
          className="px-3 py-2 text-sm font-semibold text-white rounded-xl bg-rose-600 hover:bg-rose-500"
        >
          Yes, I&apos;m sure
        </button>
      </div>
    </ModalShell>
  );
}
