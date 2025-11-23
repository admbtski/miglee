'use client';

import React from 'react';
import {
  ArrowRight,
  Download,
  Eye,
  Gift,
  MoreHorizontal,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import {
  useMyPlan,
  useMySubscription,
  useCancelSubscription,
} from '@/lib/api/billing';
import { Badge, Progress, Th, Td, SmallButton } from './ui';
import { CancelSubscriptionModal } from './cancel-subscription-modal';
import { toast } from 'sonner';

export function BillingPageWrapper() {
  const { data: planData, isLoading: planLoading } = useMyPlan();
  const { data: subData, isLoading: subLoading } = useMySubscription();
  const cancelSubscription = useCancelSubscription();

  const [cancelSubOpen, setCancelSubOpen] = React.useState(false);

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription.mutateAsync({ immediately: false });
      toast.success(
        'Subscription will be canceled at the end of billing period'
      );
      setCancelSubOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription');
    }
  };

  if (planLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading billing info...
          </p>
        </div>
      </div>
    );
  }

  const plan = planData?.myPlan;
  const subscription = subData?.mySubscription;

  // Determine plan details
  const planName = plan?.plan || 'FREE';
  const isActive = planName !== 'FREE';
  const renewsOn = plan?.planEndsAt
    ? new Date(plan.planEndsAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  // Mock data for seats (you can extend the API to include this)
  const seatsUsed = 5;
  const seatsTotal = planName === 'PRO' ? 50 : planName === 'PLUS' ? 20 : 5;
  const seatsPct = Math.min(100, Math.round((seatsUsed / seatsTotal) * 100));

  // Price based on plan
  const price =
    planName === 'PRO'
      ? plan?.source === 'SUBSCRIPTION'
        ? 69.99
        : plan?.billingPeriod === 'YEARLY'
          ? 839.99
          : 83.99
      : planName === 'PLUS'
        ? plan?.source === 'SUBSCRIPTION'
          ? 29.99
          : plan?.billingPeriod === 'YEARLY'
            ? 359.99
            : 35.99
        : 0;

  const cycle =
    plan?.source === 'SUBSCRIPTION'
      ? 'monthly subscription'
      : plan?.billingPeriod === 'YEARLY'
        ? 'yearly'
        : 'monthly';

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
                  {planName}
                </h3>
                <Badge tone={isActive ? 'indigo' : 'zinc'}>
                  {isActive ? 'Active' : 'Free'}
                </Badge>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {isActive ? `Renews on ${renewsOn}` : 'No active plan'}
              </p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-4xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
              zł{price.toFixed(2)}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {cycle}
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
              {seatsUsed} of {seatsTotal} used
            </span>
          </div>
          <Progress value={seatsPct} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {!isActive && (
            <Link
              href="/account/subscription"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Upgrade plan <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {isActive && (
            <>
              <Link
                href="/account/subscription"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Change plan <ArrowRight className="w-4 h-4" />
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
            </>
          )}
          {subscription && subscription.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => setCancelSubOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-2xl border-2 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
            >
              Cancel subscription
            </button>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-[32px] border-2 border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-zinc-200 dark:border-white/5">
          <h3 className="text-xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 mb-1">
            Payment History
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            View your billing history and receipts
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/5">
            <thead>
              <tr className="text-sm text-left bg-zinc-50 dark:bg-[#0a0b12]">
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th className="text-right pr-6 md:pr-8">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {plan && isActive ? (
                <tr className="text-sm hover:bg-zinc-50 dark:hover:bg-[#0a0b12] transition-colors">
                  <Td>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {new Date(plan.planStartsAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {planName} Plan - {cycle}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      zł{price.toFixed(2)}
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Paid
                    </span>
                  </Td>
                  <Td className="text-right pr-6 md:pr-8">
                    <div className="flex justify-end gap-2">
                      <SmallButton>
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </SmallButton>
                      <SmallButton>
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Receipt</span>
                      </SmallButton>
                    </div>
                  </Td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      No payment history yet
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        open={cancelSubOpen}
        renewDate={renewsOn}
        onClose={() => setCancelSubOpen(false)}
        onConfirm={handleCancelSubscription}
      />
    </div>
  );
}
