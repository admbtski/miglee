'use client';

import React from 'react';
import { Modal } from '@/components/feedback/modal';
import { FileDown, Printer, X } from 'lucide-react';

type Invoice = {
  id: string;
  amount: number;
  date: string;
  method: string;
  tax?: number;
  merchantName?: string;
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
  if (!invoice) return null;

  const merchant = invoice.merchantName ?? 'Miglee';
  const tax = typeof invoice.tax === 'number' ? invoice.tax : 0;
  const subtotal = Math.max(invoice.amount - tax, 0);

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
            Invoice {invoice.id}
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
        <div className="space-y-5">
          {/* AVATAR + TITLE */}
          <div className="flex justify-center w-full">
            <div className="grid w-12 h-12 text-white rounded-full place-items-center bg-zinc-800 ring-4 ring-zinc-200/50 dark:bg-zinc-200 dark:text-zinc-900 dark:ring-zinc-800/50">
              {merchant[0]?.toUpperCase() ?? 'I'}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {merchant}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Invoice{' '}
              <span className="font-medium">Invoice: #{invoice.id}</span>
            </p>
          </div>

          {/* TOP INFO GRID */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoBlock
              label="Amount paid"
              value={`$${invoice.amount.toFixed(2)}`}
            />
            <InfoBlock label="Date paid" value={invoice.date} />
            <InfoBlock label="Payment method" value={invoice.method} />
          </div>

          {/* SUMMARY */}
          <div>
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
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => console.log('Download PDF', invoice.id)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <FileDown className="w-4 h-4" /> PDF
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print details
            </button>
          </div>

          {/* FOOTER HELP */}
          <div className="p-3 text-xs border rounded-xl border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
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
        </div>
      }
    />
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
      <div className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
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
        highlight
          ? 'bg-zinc-100/70 dark:bg-zinc-800/60 font-medium'
          : 'text-zinc-700 dark:text-zinc-300',
      ].join(' ')}
    >
      <span>{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-50">
        {value}
      </span>
    </div>
  );
}
