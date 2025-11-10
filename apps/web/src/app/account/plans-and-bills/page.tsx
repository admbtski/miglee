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
  Card,
  GhostButton,
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
import { CardItem } from './types';

export default function BillingPage() {
  // Demo plan
  const plan = {
    name: 'Startup',
    status: 'Active',
    price: 39,
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

  const handleManageOpen = useCallback(() => setManageOpen(true), []);
  const handleManageClose = useCallback(() => setManageOpen(false), []);
  const handleAddOpen = useCallback(() => setAddOpen(true), []);
  const handleAddClose = useCallback(() => setAddOpen(false), []);
  const handleEditClose = useCallback(() => setEditOpen(null), []);
  const handleConfirmDeleteClose = useCallback(
    () => setConfirmDelete(null),
    []
  );
  const handleInvoiceViewClose = useCallback(() => setInvoiceView(null), []);

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Plan &amp; Billing</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            View your plan information or switch plans according to your needs.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border shadow-sm rounded-xl border-zinc-200 ring-1 ring-black/5 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
        >
          <Gift className="w-4 h-4" />
          Gift PRO
        </button>
      </div>

      {/* Top grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Plan */}
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid text-white h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 ring-1 ring-black/5">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <Badge tone="indigo">{plan.status}</Badge>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Renews on {plan.renewsOn}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold">${plan.price}</div>
              <div className="text-xs opacity-70">{plan.cycle}</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold">Seats</div>
            <Progress value={seatsPct} />
            <div className="mt-1 text-xs text-right opacity-70">
              {plan.seatsUsed} of {plan.seatsTotal} used
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <MoreHorizontal className="w-4 h-4" />
                Manage seats
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 mt-5 sm:grid-cols-2">
            <GhostButton>Cancel subscription</GhostButton>
            <GhostButton primary>
              Upgrade plan <ArrowRight className="w-4 h-4" />
            </GhostButton>
          </div>
        </Card>

        {/* Payment methods */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Payment methods</h3>
            <button
              type="button"
              onClick={() => setManageOpen(true)}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Manage cards
            </button>
          </div>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Add and manage your payment methods using our secure payment system.
          </p>

          <div className="space-y-3">
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

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <Plus className="w-4 h-4" />
              Add new card
            </button>
          </div>
        </Card>
      </div>

      {/* Invoices */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-[#171a1f]/80">
        <div className="px-4 py-3 text-sm font-semibold border-b border-zinc-200 dark:border-zinc-700">
          Invoices
        </div>
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="min-w-full divide-y table-fixed divide-zinc-200 dark:divide-zinc-800">
            <thead>
              <tr className="text-sm text-left">
                <Th>Invoice</Th>
                <Th>Billing date</Th>
                <Th>Amount</Th>
                <Th>Plan</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="text-sm">
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <span className="grid text-white bg-pink-600 rounded-lg h-7 w-7 place-items-center ring-1 ring-black/5">
                        PDF
                      </span>
                      <span className="font-medium">
                        {inv.id.toUpperCase()}
                      </span>
                    </span>
                  </Td>
                  <Td>{inv.date}</Td>
                  <Td>${inv.amount}</Td>
                  <Td>{inv.plan}</Td>
                  <Td className="text-right">
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
                        View
                      </SmallButton>
                      <SmallButton>
                        <Download className="w-4 h-4" />
                        Download
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
    </>
  );
}
