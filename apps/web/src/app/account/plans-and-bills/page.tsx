'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  ArrowRight,
  Download,
  Eye,
  Gift,
  MoreHorizontal,
  Plus,
  Users,
} from 'lucide-react';

import {
  Badge,
  PaymentRow,
  Progress,
  SmallButton,
  Th,
  Td,
} from './_components/ui';

import { ManageCardsModal } from './_components/manage-cards-modal';
import { EditCardModal } from './_components/edit-card-modal';
import { AddCardModal } from './_components/add-card-modal';
import { ConfirmDeleteModal } from './_components/confirm-delete-modal';
import { InvoiceViewModal } from './_components/invoice-view-modal';
import { CancelSubscriptionModal } from './_components/cancel-subscription-modal';
import { CardItem } from './types';
import Link from 'next/link';

export default function BillingPage() {
  // Demo plan
  const plan = {
    name: 'Free',
    status: 'Active',
    price: 0,
    cycle: 'monthly',
    renewsOn: 'March 25th, 2023',
    seatsUsed: 5,
    seatsTotal: 20,
  };

  // Demo cards state
  const [cards, setCards] = useState<CardItem[]>([
    {
      id: 'pm_visa_1',
      brand: 'Visa',
      last4: '9016',
      expMonth: '12',
      expYear: '25',
      isDefault: true,
    },
    {
      id: 'pm_mc_2',
      brand: 'MasterCard',
      last4: '4242',
      expMonth: '04',
      expYear: '24',
    },
    {
      id: 'pm_mc_3',
      brand: 'MasterCard',
      last4: '0232',
      expMonth: '01',
      expYear: '20',
      expired: true,
    },
    {
      id: 'pm_visa_4',
      brand: 'Visa',
      last4: '9016',
      expMonth: '06',
      expYear: '20',
      expired: true,
    },
  ]);

  // Modals
  const [manageOpen, setManageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<null | CardItem>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<null | CardItem>(null);
  const [cancelSubOpen, setCancelSubOpen] = useState(false);
  const [invoiceView, setInvoiceView] = useState<null | {
    id: string;
    amount: number;
    date: string;
    method: string;
  }>(null);

  const invoices = useMemo(
    () => [
      { id: 'inv_2502', date: '25 Feb, 2023', amount: 39, plan: 'Startup' },
      { id: 'inv_2501', date: '25 Jan, 2023', amount: 39, plan: 'Startup' },
      { id: 'inv_2512', date: '25 Dec, 2022', amount: 39, plan: 'Startup' },
      { id: 'inv_2511', date: '25 Nov, 2022', amount: 39, plan: 'Startup' },
    ],
    []
  );

  const seatsPct = Math.min(
    100,
    Math.round((plan.seatsUsed / plan.seatsTotal) * 100)
  );

  // Card actions (mock backend) - memoized
  const setDefaultCard = useCallback((id: string) => {
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  }, []);

  const saveEditedCard = useCallback((updated: CardItem) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const addNewCard = useCallback((data: Omit<CardItem, 'id'>) => {
    const id = `pm_${Date.now()}`;
    setCards((prev) => {
      const cleared = data.isDefault
        ? prev.map((c) => ({ ...c, isDefault: false }))
        : prev;
      return [...cleared, { id, ...data }];
    });
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleCancelSubscription = useCallback(() => {
    // TODO: Implement actual subscription cancellation logic
    console.log('Subscription cancelled');
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Plans & Billing
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[70ch]">
            Manage your subscription and billing information
          </p>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-[32px] border-2 border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center ring-1 ring-black/5 shadow-lg">
              <Users className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                  {plan.name}
                </h3>
                <Badge tone="indigo">{plan.status}</Badge>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Renews on {plan.renewsOn}
              </p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-4xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
              ${plan.price}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {plan.cycle}
            </div>
          </div>
        </div>

        {/* Seats Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Team Seats
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {plan.seatsUsed} of {plan.seatsTotal} used
            </span>
          </div>
          <Progress value={seatsPct} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/account/subscription"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Upgrade plan <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-2xl border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
            Manage seats
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-2xl border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Gift className="w-4 h-4" />
            Gift PRO
          </button>
          <button
            type="button"
            onClick={() => setCancelSubOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-2xl border-2 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
          >
            Cancel subscription
          </button>
        </div>
      </div>

      {/* Payment methods */}
      <div className="rounded-[32px] border-2 border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 mb-1">
              Payment Methods
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Manage your payment methods securely
            </p>
          </div>
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded-xl border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors self-start sm:self-auto"
          >
            Manage cards
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {cards.slice(0, 2).map((pm) => (
            <PaymentRow
              key={pm.id}
              brand={pm.brand}
              last4={pm.last4}
              expires={`${pm.expMonth}/${pm.expYear}`}
              isDefault={!!pm.isDefault}
              onEdit={() => setEditOpen(pm)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Add new card
        </button>
      </div>

      {/* Invoices */}
      <div className="rounded-[32px] border-2 border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-zinc-200 dark:border-white/5">
          <h3 className="text-xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 mb-1">
            Invoices
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            View and download your billing history
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/5">
            <thead>
              <tr className="text-sm text-left bg-zinc-50 dark:bg-[#0a0b12]">
                <Th>Invoice</Th>
                <Th>Billing date</Th>
                <Th>Amount</Th>
                <Th>Plan</Th>
                <Th className="text-right pr-6 md:pr-8">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="text-sm hover:bg-zinc-50 dark:hover:bg-[#0a0b12] transition-colors"
                >
                  <Td>
                    <span className="inline-flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 text-white text-xs font-bold bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg ring-1 ring-black/5 shadow-sm">
                        PDF
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {inv.id.toUpperCase()}
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {inv.date}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      ${inv.amount}
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {inv.plan}
                    </span>
                  </Td>
                  <Td className="text-right pr-6 md:pr-8">
                    <div className="flex justify-end gap-2">
                      <SmallButton
                        onClick={() =>
                          setInvoiceView({
                            id: inv.id,
                            amount: inv.amount,
                            date: inv.date,
                            method: cards.find((c) => c.isDefault)
                              ? `${cards.find((c) => c.isDefault)!.brand} •••• ${
                                  cards.find((c) => c.isDefault)!.last4
                                }`
                              : '—',
                          })
                        }
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </SmallButton>
                      <SmallButton>
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </SmallButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modals ─── */}
      <ManageCardsModal
        open={manageOpen}
        cards={cards}
        onClose={() => setManageOpen(false)}
        onSetDefault={setDefaultCard}
        onEdit={setEditOpen}
        onAdd={() => setAddOpen(true)}
      />

      <EditCardModal
        open={!!editOpen}
        card={editOpen}
        onClose={() => setEditOpen(null)}
        onDelete={(c) => setConfirmDelete(c)}
        onSave={(c) => {
          saveEditedCard(c);
          setEditOpen(null);
        }}
      />

      <AddCardModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(payload) => {
          addNewCard(payload);
          setAddOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        card={confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={(id) => {
          deleteCard(id);
          setConfirmDelete(null);
          setManageOpen(true);
        }}
      />

      <InvoiceViewModal
        open={!!invoiceView}
        invoice={invoiceView}
        onClose={() => setInvoiceView(null)}
      />

      <CancelSubscriptionModal
        open={cancelSubOpen}
        renewDate={plan.renewsOn}
        onClose={() => setCancelSubOpen(false)}
        onConfirm={handleCancelSubscription}
      />
    </div>
  );
}
