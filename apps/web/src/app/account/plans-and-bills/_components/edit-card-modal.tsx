'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Hash, Shield, ChevronDown } from 'lucide-react';
import type { CardItem } from '../types';
import { Input, Select, SecureNote } from './ui';
import { ModalShell } from './modal-shell';
import { CountryCombo } from './country-combo';

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Poland',
  'Germany',
  'France',
  'Spain',
  'Italy',
];

export function EditCardModal({
  open,
  card,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  card: CardItem | null;
  onClose: () => void;
  onSave: (card: CardItem) => void;
  onDelete: (card: CardItem) => void;
}) {
  const [form, setForm] = useState<CardItem | null>(card);

  // Billing address (demo-only/local state)
  const [street, setStreet] = useState('');
  const [apt, setApt] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);

  useEffect(() => {
    setForm(card ?? null);
  }, [card]);

  if (!open || !form) return null;

  const exp = `${form.expMonth}/${form.expYear}`;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Edit card details"
      maxWidth="max-w-xl"
    >
      {/* Card details */}
      <div className="mb-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        Card details
      </div>

      <div className="grid gap-3">
        <Input
          label="Card number"
          value={`${form.brand} •••• ${form.last4}`}
          disabled
          leftIcon={<CreditCard className="w-4 h-4" />}
          rightAddon={
            <span className="rounded-md border border-zinc-200 px-1.5 text-[10px] font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
              {form.brand === 'MasterCard' ? 'MC' : form.brand}
            </span>
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Expiration"
            value={exp}
            onChange={(v) => {
              const [m, y] = v.replace(/\s/g, '').split('/');
              setForm({ ...form, expMonth: m ?? '', expYear: y ?? '' });
            }}
            placeholder="MM/YY"
          />
          <Input
            label="CVV"
            placeholder="808"
            leftIcon={<Shield className="w-4 h-4" />}
          />
        </div>
        <SecureNote />
      </div>

      {/* Billing address */}
      <div className="mt-6 mb-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        Billing address
      </div>
      <div className="grid gap-3">
        <Input
          label="Street address"
          value={street}
          onChange={setStreet}
          leftIcon={<Hash className="w-4 h-4" />}
        />
        <Input label="Apt or suite number" value={apt} onChange={setApt} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="City" value={city} onChange={setCity} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="State" value={state} onChange={setState} />
            <Input label="ZIP code" value={zip} onChange={setZip} />
          </div>
        </div>
        <CountryCombo
          label="Country"
          value={country} // trzymaj w state: np. 'PL'
          onChange={setCountry}
        />

        <label className="flex items-center gap-2 mt-1 text-sm">
          <input
            type="checkbox"
            className="accent-indigo-600"
            checked={!!form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          Set as default payment method
        </label>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => onDelete(form)}
          className="px-3 py-2 text-sm border rounded-xl border-rose-500/40 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
        >
          Delete card
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
          >
            Save changes
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
