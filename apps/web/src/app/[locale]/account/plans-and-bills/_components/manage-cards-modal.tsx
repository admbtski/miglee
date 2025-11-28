'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { CardItem } from '../types';
import { Badge } from './ui';
import { Modal } from '@/components/feedback/modal';

function BrandPill({ brand }: { brand: CardItem['brand'] }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
      {brand === 'MasterCard' ? 'MC' : brand}
    </span>
  );
}

const isExpired = (mm: string, yy: string) => {
  const month = parseInt(mm, 10);
  const year = 2000 + parseInt(yy, 10);
  if (!month || !year) return false;
  const exp = new Date(year, month, 0).getTime();
  return Date.now() > exp;
};

export function ManageCardsModal({
  open,
  onClose,
  cards,
  onSetDefault,
  onEdit,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  cards: CardItem[];
  onSetDefault: (id: string) => void;
  onEdit: (c: CardItem) => void;
  onAdd: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="centered"
      size="lg"
      density="comfortable"
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Manage cards
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
          <div className="space-y-3">
            {cards.map((c) => {
              const expired = c.expired || isExpired(c.expMonth, c.expYear);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 border rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40"
                >
                  <div className="flex items-center gap-3">
                    <BrandPill brand={c.brand} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-50">
                          {c.brand} •••• {c.last4}
                        </div>
                        {c.isDefault ? (
                          <Badge tone="zinc">Default</Badge>
                        ) : null}
                      </div>
                      <div
                        className={`text-xs ${expired ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}`}
                      >
                        {expired
                          ? `Expired ${c.expMonth}/${c.expYear}`
                          : `Debit Expires ${c.expMonth}/${c.expYear}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!c.isDefault && (
                      <button
                        className="rounded-xl border-2 border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        onClick={() => onSetDefault(c.id)}
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      className="rounded-xl border-2 border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => onEdit(c)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              + Add new card
            </button>
          </div>
        </div>
      }
    />
  );
}
