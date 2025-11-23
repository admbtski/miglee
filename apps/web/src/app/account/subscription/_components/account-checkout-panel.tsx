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
import { PlanType, BillingType } from './subscription-plans-wrapper';

interface AccountCheckoutPanelProps {
  selectedPlan: {
    id: PlanType;
    name: string;
    billingType: BillingType;
    price: number;
  };
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

export function AccountCheckoutPanel({
  selectedPlan,
  onBack,
}: AccountCheckoutPanelProps) {
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

  // Calculate pricing with VAT (23% in Poland)
  const net = selectedPlan.price / 1.23;
  const vat = selectedPlan.price - net;
  const gross = selectedPlan.price;

  const getBillingTypeLabel = () => {
    switch (selectedPlan.billingType) {
      case 'monthly-subscription':
        return 'Subskrypcja miesięczna';
      case 'monthly-onetime':
        return 'Płatność miesięczna (jednorazowa)';
      case 'annual-onetime':
        return 'Płatność roczna (jednorazowa)';
    }
  };

  const getActiveUntilDate = () => {
    const days = selectedPlan.billingType === 'annual-onetime' ? 365 : 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString(
      'pl-PL'
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#05060a]">
      <div className="max-w-5xl px-6 py-10 mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
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
                <div className="grid items-center gap-4 md:grid-cols-6">
                  <div className="col-span-2">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      Plan {selectedPlan.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {getBillingTypeLabel()}
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900/30 dark:text-indigo-300">
                      {selectedPlan.name}
                    </span>
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-50">1</div>
                  <div className="text-zinc-900 dark:text-zinc-50">
                    ${net.toFixed(2)}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      ${gross.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      VAT: ${vat.toFixed(2)}
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
                      {getActiveUntilDate()}
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
                  className="px-6 py-3 font-medium text-white transition-colors rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
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
                className="text-sm font-medium text-indigo-600 transition-colors dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Aktualizuj dane
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0a0b12] p-6 space-y-4">
              {/* Warning banner */}
              <div className="p-4 border border-red-200 rounded-2xl bg-red-50 dark:bg-red-900/20 dark:border-red-800/30">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-red-100 rounded-full dark:bg-red-900/40">
                    <Info className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-red-900 dark:text-red-100">
                      Zweryfikuj swoje dane rozliczeniowe
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Upewnij się, że dane do faktury są poprawne. Błędne dane
                      mogą opóźnić proces realizacji zamówienia.
                    </p>
                  </div>
                  <button
                    onClick={() => setBillingModalOpen(true)}
                    className="flex-shrink-0 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Zweryfikuj
                  </button>
                </div>
              </div>

              {/* Billing details grid */}
              <div className="grid grid-cols-2 gap-4 pt-2 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Nazwa firmy
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.companyName}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Miasto
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.city}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Kod pocztowy
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.postalCode}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Ulica
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.street} {billingDetails.building}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Kraj
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {billingDetails.country}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
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
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      Płatność BLIK
                    </span>
                    <div className="px-3 py-1 text-xs font-bold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50">
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
                        <p className="mt-2 text-xs text-center text-zinc-500 dark:text-zinc-400">
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
                  <div className="flex items-center justify-between flex-1">
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
                        <p className="mb-1 font-medium text-zinc-900 dark:text-zinc-50">
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
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      Przelew online
                    </span>
                    <div className="px-3 py-1 text-xs font-bold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50">
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
                        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                          Wybierz swój bank:
                        </p>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      Portfele cyfrowe
                    </span>
                    <div className="px-3 py-1 text-xs font-bold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50">
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
                          className="w-full max-w-xs px-6 py-4 mx-auto font-bold text-white transition-colors rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
                        >
                          Zapłać z Google Pay
                        </button>
                        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
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
                className="w-4 h-4 mt-1 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Suma całkowita
                </p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  ${gross.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                disabled={!agreeToTerms || !selectedPayment}
                className="px-8 py-4 text-lg font-bold text-white transition-colors rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zamów i zapłać ${gross.toFixed(2)}
              </button>
            </div>

            {/* Payment logos */}
            <div className="flex flex-wrap items-center gap-4 pt-6 mt-6 border-t border-zinc-200 dark:border-white/5">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Akceptowane metody płatności:
              </p>
              <div className="flex flex-wrap gap-3">
                {['BLIK', 'Visa', 'Mastercard', 'GPay', 'Paynow'].map(
                  (logo) => (
                    <div
                      key={logo}
                      className="px-3 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
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
            className="p-2 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Company name */}
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
            className="w-full px-8 py-4 font-bold text-white transition-colors rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
          >
            Zapisz dane
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
