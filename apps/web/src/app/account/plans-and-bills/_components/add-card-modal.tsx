'use client';

import React, { useMemo, useState } from 'react';
import type { CardItem, CardBrand } from '../types';
import { Input } from './ui';
import { ModalShell } from './modal-shell';
import { CountryCombo } from './country-combo';

/* ───────── helpers ───────── */

const brandFromNumber = (num: string): CardBrand => {
  const n = num.replace(/\s+/g, '');
  if (/^4\d{0,}$/.test(n)) return 'Visa' as CardBrand;
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))\d{0,}$/.test(n))
    return 'MasterCard' as CardBrand;
  if (/^3[47]\d{0,}$/.test(n)) return 'AmEx' as CardBrand;
  if (/^6(011|5|4[4-9])\d{0,}$/.test(n)) return 'Discover' as CardBrand;
  return 'Visa' as CardBrand;
};

const formatCardNumber = (raw: string) =>
  raw
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();

const normalizeExp = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const isValidExp = (exp: string) => {
  const m = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const mm = parseInt(m[1], 10);
  return mm >= 1 && mm <= 12;
};

/* ───────── component ───────── */

export function AddCardModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (
    card: Omit<CardItem, 'id'> & {
      billing?: {
        street?: string;
        line2?: string;
        city?: string;
        state?: string;
        zip?: string;
        countryCode?: string;
      };
    }
  ) => void;
}) {
  // Card fields
  const [number, setNumber] = useState('');
  const brand: CardBrand = useMemo(() => brandFromNumber(number), [number]);
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');

  // Billing
  const [street, setStreet] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState<string | undefined>(undefined);

  const [isDefault, setIsDefault] = useState(true);

  const last4 = (number.replace(/\D/g, '').slice(-4) || '').padStart(4, '•');

  const canSubmit =
    number.replace(/\D/g, '').length >= 12 &&
    isValidExp(exp) &&
    (brand === 'AmEx'
      ? cvv.replace(/\D/g, '').length >= 4
      : cvv.replace(/\D/g, '').length >= 3);

  const submit = () => {
    if (!canSubmit) return;
    const [, mm, yy] = exp.match(/^(\d{2})\/(\d{2})$/) || [];
    onAdd({
      brand,
      last4,
      expMonth: mm!,
      expYear: yy!,
      isDefault,
      billing: {
        street: street || undefined,
        line2: line2 || undefined,
        city: city || undefined,
        state: state || undefined,
        zip: zip || undefined,
        countryCode: country,
      },
    });
    onClose();
    // (opcjonalnie) wyczyść stan
    setNumber('');
    setExp('');
    setCvv('');
    setStreet('');
    setLine2('');
    setCity('');
    setState('');
    setZip('');
    setCountry(undefined);
    setIsDefault(true);
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Add card details">
      <div className="grid gap-4">
        {/* Card details */}
        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Card details
        </div>

        <div className="grid gap-3">
          <Input
            label={`Card number • ${brand}`}
            value={number}
            onChange={(v) => setNumber(formatCardNumber(v))}
            placeholder="1234 5678 9012 3456"
            leftIcon={
              <span className="text-[10px] font-bold opacity-70">
                {brand === 'Visa'
                  ? 'VISA'
                  : brand === 'MasterCard'
                    ? 'MC'
                    : brand === 'AmEx'
                      ? 'AMX'
                      : 'DISC'}
              </span>
            }
            inputMode="numeric"
            autoComplete="cc-number"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiration"
              value={exp}
              onChange={(v) => setExp(normalizeExp(v))}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
            />
            <Input
              label="CVV"
              value={cvv}
              onChange={(v) =>
                setCvv(v.replace(/\D/g, '').slice(0, brand === 'AmEx' ? 4 : 3))
              }
              placeholder={brand === 'AmEx' ? '••••' : '•••'}
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-block w-3 h-3 border rounded-sm border-zinc-400" />
            This is a secure form
          </div>
        </div>

        {/* Billing address */}
        <div className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Billing address
        </div>

        <div className="grid gap-3">
          <Input
            label="Street address"
            value={street}
            onChange={setStreet}
            placeholder="Street address"
            autoComplete="address-line1"
          />
          <Input
            label="Apt or suite number"
            value={line2}
            onChange={setLine2}
            placeholder="Apt, suite, etc."
            autoComplete="address-line2"
          />
          <Input
            label="City"
            value={city}
            onChange={setCity}
            placeholder="City"
            autoComplete="address-level2"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State"
              value={state}
              onChange={setState}
              placeholder="State"
              autoComplete="address-level1"
            />
            <Input
              label="ZIP code"
              value={zip}
              onChange={(v) => setZip(v.replace(/[^\w- ]/g, '').slice(0, 10))}
              placeholder="ZIP"
              autoComplete="postal-code"
            />
          </div>
          <CountryCombo label="Country" value={country} onChange={setCountry} />
        </div>

        <label className="flex items-center gap-2 mt-1 text-sm">
          <input
            type="checkbox"
            className="accent-indigo-500"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Set as default payment method
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50"
        >
          Add card
        </button>
      </div>
    </ModalShell>
  );
}
