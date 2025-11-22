'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Clock,
  Info,
  Lock,
  CreditCard,
  Building2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SponsorPlan } from '../../subscription/_components/subscription-panel-types';

interface CheckoutPanelProps {
  intentId: string;
  selectedPlan: SponsorPlan;
  onBack: () => void;
}

interface BillingDetails {
  companyName: string;
  country: string;
  vatId: string;
  city: string;
  street: string;
  building: string;
  postalCode: string;
}

type PaymentMethod = 'blik' | 'card' | 'transfer' | 'wallet';

const PLAN_PRICES = {
  Basic: { net: 4.07, vat: 0.93, gross: 5.0 },
  Plus: { net: 8.13, vat: 1.87, gross: 10.0 },
  Pro: { net: 12.2, vat: 2.8, gross: 15.0 },
};

export function CheckoutPanel({
  intentId,
  selectedPlan,
  onBack,
}: CheckoutPanelProps) {
  const [billingModalOpen, setBillingModalOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] =
    React.useState<PaymentMethod | null>(null);
  const [discountCode, setDiscountCode] = React.useState('');
  const [blikCode, setBlikCode] = React.useState('');
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);

  const [billingDetails, setBillingDetails] = React.useState<BillingDetails>({
    companyName: 'Przykładowa Firma Sp. z o.o.',
    country: 'Polska',
    vatId: '1234567890',
    city: 'Warszawa',
    street: 'ul. Marszałkowska',
    building: '1/23',
    postalCode: '00-001',
  });

  const pricing = PLAN_PRICES[selectedPlan];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#05060a]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Powrót do planów
        </button>

        {/* Main checkout card */}
        <div className="rounded-[32px] bg-white dark:bg-[#10121a] border border-zinc-200/50 dark:border-white/5 shadow-sm p-8 space-y-8">
          {/* SUMMARY SECTION */}
          <section>
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase mb-4">
              Podsumowanie
            </h2>
            <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0a0b12] overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid md:grid-cols-6 gap-4 px-6 py-3 bg-zinc-50 dark:bg-[#050608] border-b border-zinc-200 dark:border-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <div className="col-span-2">Produkt</div>
                <div>Typ</div>
                <div>Ilość</div>
                <div>Netto</div>
                <div className="text-right">Brutto</div>
              </div>

              {/* Table row */}
              <div className="px-6 py-4">
                <div className="grid md:grid-cols-6 gap-4 items-center">
                  <div className="col-span-2">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      Plan sponsorowania – {selectedPlan}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Jednorazowa płatność
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      {selectedPlan}
                    </span>
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-50">1</div>
                  <div className="text-zinc-900 dark:text-zinc-50">
                    {pricing.net.toFixed(2)} zł
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                      {pricing.gross.toFixed(2)} zł
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      VAT: {pricing.vat.toFixed(2)} zł
                    </p>
                  </div>
                </div>
              </div>

              {/* Active until */}
              <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#050608]">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    Twój plan będzie aktywny do:{' '}
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {new Date(
                        Date.now() + 365 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('pl-PL')}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* DISCOUNT CODE SECTION */}
          <section>
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase mb-4">
              Kod rabatowy
            </h2>
            <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0a0b12] p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Wpisz kod rabatowy"
                  className="flex-1 px-6 py-3 rounded-2xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#050608] text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
                <button
                  type="button"
                  className="px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Zastosuj
                </button>
              </div>
            </div>
          </section>

          {/* VAT INVOICE DETAILS SECTION */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase">
                Dane do faktury VAT
              </h2>
              <button
                onClick={() => setBillingModalOpen(true)}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Aktualizuj dane
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0a0b12] p-6 space-y-4">
              {/* Warning banner */}
              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                    <Info className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Zweryfikuj swoje dane rozliczeniowe
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Upewnij się, że dane do faktury są poprawne. Błędne dane
                      mogą opóźnić proces realizacji zamówienia.
                    </p>
                  </div>
                  <button
                    onClick={() => setBillingModalOpen(true)}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
                  >
                    Zweryfikuj
                  </button>
                </div>
              </div>

              {/* Billing details grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Nazwa firmy
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.companyName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Miasto
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.city}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Kod pocztowy
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.postalCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Ulica
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.street} {billingDetails.building}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Kraj
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.country}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    NIP
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.vatId}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PAYMENT METHODS SECTION */}
          <section>
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase mb-4">
              Wybierz metodę płatności i dokończ zamówienie
            </h2>

            <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0a0b12] divide-y divide-zinc-200 dark:divide-white/5">
              {/* BLIK */}
              <div className="p-6">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPayment === 'blik'}
                    onChange={() => setSelectedPayment('blik')}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      Płatność BLIK
                    </span>
                    <div className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-50">
                      BLIK
                    </div>
                  </div>
                </label>

                <AnimatePresence>
                  {selectedPayment === 'blik' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-[#050608]">
                        <input
                          type="text"
                          value={blikCode}
                          onChange={(e) =>
                            setBlikCode(
                              e.target.value.replace(/\D/g, '').slice(0, 6)
                            )
                          }
                          placeholder="000-000"
                          maxLength={7}
                          className="w-full px-6 py-3 rounded-2xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0b12] text-center text-2xl font-mono tracking-widest text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-2">
                          Wpisz 6-cyfrowy kod z aplikacji bankowej
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Card */}
              <div className="p-6">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPayment === 'card'}
                    onChange={() => setSelectedPayment('card')}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      Płatność kartą
                    </span>
                    <div className="flex gap-2">
                      <CreditCard className="w-8 h-5 text-zinc-400" />
                    </div>
                  </div>
                </label>

                <AnimatePresence>
                  {selectedPayment === 'card' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-6 rounded-2xl bg-zinc-50 dark:bg-[#050608] border-2 border-dashed border-zinc-300 dark:border-white/10 text-center">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
                        <p className="font-medium text-zinc-900 dark:text-zinc-50 mb-1">
                          Dodaj nową kartę
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Zostaniesz przekierowany do bezpiecznej strony
                          płatności
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Online transfer */}
              <div className="p-6">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPayment === 'transfer'}
                    onChange={() => setSelectedPayment('transfer')}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      Przelew online
                    </span>
                    <div className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-50">
                      Paynow
                    </div>
                  </div>
                </label>

                <AnimatePresence>
                  {selectedPayment === 'transfer' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-[#050608]">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                          Wybierz swój bank:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            'mBank',
                            'ING',
                            'PKO BP',
                            'Santander',
                            'Pekao',
                            'Millennium',
                            'Alior',
                            'BNP',
                          ].map((bank) => (
                            <button
                              key={bank}
                              type="button"
                              className="p-4 rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0b12] hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                            >
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                {bank}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Digital wallet */}
              <div className="p-6">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPayment === 'wallet'}
                    onChange={() => setSelectedPayment('wallet')}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      Portfele cyfrowe
                    </span>
                    <div className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-50">
                      GPay
                    </div>
                  </div>
                </label>

                <AnimatePresence>
                  {selectedPayment === 'wallet' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-6 rounded-2xl bg-zinc-50 dark:bg-[#050608] text-center">
                        <button
                          type="button"
                          className="w-full max-w-xs mx-auto px-6 py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                        >
                          Zapłać z Google Pay
                        </button>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                          Zostaniesz przekierowany do Google Pay
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* SECURITY & AGREEMENTS */}
          <section className="space-y-4">
            {/* Security notice */}
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <Lock className="w-4 h-4" />
              <span className="font-medium">
                Wszystkie transakcje są bezpieczne i szyfrowane
              </span>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Wyrażam zgodę na natychmiastowe wykonanie Umowy i przyjmuję do
                wiadomości, że w związku z tym utracę prawo do odstąpienia od
                Umowy. Zapoznałem/am się z{' '}
                <a
                  href="#"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Regulaminem
                </a>{' '}
                i{' '}
                <a
                  href="#"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Polityką Prywatności
                </a>
                .
              </span>
            </label>
          </section>

          {/* TOTAL & CTA */}
          <section className="pt-6 border-t border-zinc-200 dark:border-white/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Suma całkowita
                </p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {pricing.gross.toFixed(2)} PLN
                </p>
              </div>
              <button
                type="button"
                disabled={!agreeToTerms || !selectedPayment}
                className="px-8 py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
              >
                Zamów i zapłać {pricing.gross.toFixed(2)} PLN
              </button>
            </div>

            {/* Payment logos */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-zinc-200 dark:border-white/5">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Akceptowane metody płatności:
              </p>
              <div className="flex flex-wrap gap-3">
                {['BLIK', 'Visa', 'Mastercard', 'GPay', 'Paynow'].map(
                  (logo) => (
                    <div
                      key={logo}
                      className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {logo}
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Billing Details Modal */}
      <BillingDetailsModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        billingDetails={billingDetails}
        onSave={setBillingDetails}
      />
    </div>
  );
}

interface BillingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingDetails: BillingDetails;
  onSave: (details: BillingDetails) => void;
}

function BillingDetailsModal({
  isOpen,
  onClose,
  billingDetails,
  onSave,
}: BillingDetailsModalProps) {
  const [formData, setFormData] = React.useState(billingDetails);

  React.useEffect(() => {
    setFormData(billingDetails);
  }, [billingDetails]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-[32px] bg-white dark:bg-[#10121a] border border-zinc-200 dark:border-white/5 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-200 dark:border-white/5">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Dane rozliczeniowe
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Company name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Nazwa firmy <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full px-6 py-3 rounded-2xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0b12] text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Kraj <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-6 py-3 rounded-2xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0b12] text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Polska</option>
                <option>Niemcy</option>
                <option>Wielka Brytania</option>
              </select>
            </div>

            {/* VAT ID */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                NIP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.vatId}
                onChange={(e) =>
                  setFormData({ ...formData, vatId: e.target.value })
                }
                className="w-full px-6 py-3 rounded-2xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0b12] text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Miasto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-6 py-3 rounded-2xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0b12] text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Postal code */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Kod pocztowy <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData({ ...formData, postalCode: e.target.value })
                }
                className="w-full px-6 py-3 rounded-2xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0b12] text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Street */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Ulica <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                className="w-full px-6 py-3 rounded-2xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0b12] text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Building */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Nr budynku/lokalu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.building}
                onChange={(e) =>
                  setFormData({ ...formData, building: e.target.value })
                }
                className="w-full px-6 py-3 rounded-2xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-[#0a0b12] text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full px-8 py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Zapisz dane
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
