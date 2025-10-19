'use client';

import React from 'react';
import { ModalShell } from './modal-shell';
import { FileDown, Printer } from 'lucide-react';

type Invoice = {
  id: string;
  amount: number; // kwota brutto zapłacona
  date: string; // np. "April 22, 2020"
  method: string; // np. "MasterCard •••• 4242"
  tax?: number; // opcjonalnie kwota podatku; gdy brak pokażę $0.00
  merchantName?: string; // np. "Miglee" / "Preline" – domyślnie "Miglee"
};

export function InvoiceViewModal({
  open,
  invoice,
  onClose,
}: {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
}) {
  if (!open || !invoice) return null;

  const merchant = invoice.merchantName ?? 'Miglee';
  const tax = typeof invoice.tax === 'number' ? invoice.tax : 0;
  const subtotal = Math.max(invoice.amount - tax, 0);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={`Invoice ${invoice.id}`}
      maxWidth="max-w-xl"
    >
      {/* AVATAR + TITLE */}
      <div className="flex justify-center w-full mb-2">
        <div className="grid w-12 h-12 text-white rounded-full place-items-center bg-zinc-800 ring-4 ring-zinc-950/60 dark:bg-zinc-200 dark:text-zinc-900 dark:ring-zinc-900/60">
          {merchant[0]?.toUpperCase() ?? 'I'}
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">{merchant}</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Invoice <span className="font-medium">Invoice: #{invoice.id}</span>
        </p>
      </div>

      {/* TOP INFO GRID */}
      <div className="grid grid-cols-1 gap-3 mt-5 sm:grid-cols-3">
        <InfoBlock
          label="Amount paid"
          value={`$${invoice.amount.toFixed(2)}`}
        />
        <InfoBlock label="Date paid" value={invoice.date} />
        <InfoBlock label="Payment method" value={invoice.method} />
      </div>

      {/* SUMMARY */}
      <div className="mt-5">
        <div className="mb-2 text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
          Summary
        </div>
        <div className="overflow-hidden border rounded-xl border-zinc-200 dark:border-zinc-700">
          <SummaryRow
            label={`Payment to ${merchant}`}
            value={`$${subtotal.toFixed(2)}`}
          />
          <SummaryRow label="Tax fee" value={`$${tax.toFixed(2)}`} />
          <SummaryRow
            label="Amount paid"
            value={`$${invoice.amount.toFixed(2)}`}
            highlight
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={() => console.log('Download PDF', invoice.id)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <FileDown className="w-4 h-4" /> PDF
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Printer className="w-4 h-4" /> Print details
        </button>
      </div>

      {/* FOOTER HELP */}
      <div className="p-3 mt-5 text-xs border rounded-xl border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        If you have any questions, please contact us at{' '}
        <a
          href="mailto:example@site.com"
          className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          example@site.com
        </a>{' '}
        or call at{' '}
        <a
          href="tel:+1898345492"
          className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          +1 898-34-5492
        </a>
        .
      </div>
    </ModalShell>
  );
}

/* ───────── small local bits ───────── */

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="p-3 border rounded-xl border-zinc-200 dark:border-zinc-700">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center justify-between px-4 py-3 text-sm',
        'border-b border-zinc-200 last:border-b-0 dark:border-zinc-700',
        highlight ? 'bg-zinc-100/70 dark:bg-zinc-800/60' : '',
      ].join(' ')}
    >
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
