'use client';

import React from 'react';
import type { CardItem } from '../types';
import { Badge } from './ui';
import { ModalShell } from './modal-shell';

function BrandPill({ brand }: { brand: CardItem['brand'] }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
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
    <ModalShell open={open} onClose={onClose} title="Manage cards">
      <div className="space-y-3">
        {cards.map((c) => {
          const expired = c.expired || isExpired(c.expMonth, c.expYear);
          return (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 border rounded-xl border-zinc-800 bg-zinc-900/40"
            >
              <div className="flex items-center gap-3">
                <BrandPill brand={c.brand} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">
                      {c.brand} •••• {c.last4}
                    </div>
                    {c.isDefault ? <Badge tone="zinc">Default</Badge> : null}
                  </div>
                  <div
                    className={`text-xs ${expired ? 'text-rose-400' : 'text-zinc-400'}`}
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
                    className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800"
                    onClick={() => onSetDefault(c.id)}
                  >
                    Set as default
                  </button>
                )}
                <button
                  className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800"
                  onClick={() => onEdit(c)}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 mt-3 border-t border-zinc-800">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-700 hover:bg-zinc-800"
        >
          + Add new card
        </button>
      </div>
    </ModalShell>
  );
}
