'use client';

import * as React from 'react';
import { ArrowLeft, Lock, Clock, Loader2 } from 'lucide-react';
import { PlanType, BillingType } from './subscription-plans-wrapper';
import {
  useCreateSubscriptionCheckout,
  useCreateOneOffCheckout,
} from '@/lib/api/billing';
import { toast } from 'sonner';

interface AccountCheckoutPanelProps {
  selectedPlan: {
    id: PlanType;
    name: string;
    billingType: BillingType;
    price: number;
  };
  onBack: () => void;
}

export function AccountCheckoutPanel({
  selectedPlan,
  onBack,
}: AccountCheckoutPanelProps) {
  const createSubscriptionCheckout = useCreateSubscriptionCheckout();
  const createOneOffCheckout = useCreateOneOffCheckout();

  const [isCreatingCheckout, setIsCreatingCheckout] = React.useState(false);
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);

  const handleCreateCheckout = async () => {
    if (selectedPlan.id === 'free') {
      toast.error('Cannot purchase FREE plan');
      onBack();
      return;
    }

    if (!agreeToTerms) {
      toast.error('Please agree to terms and conditions');
      return;
    }

    setIsCreatingCheckout(true);

    try {
      const plan = selectedPlan.id.toUpperCase() as 'PLUS' | 'PRO';

      if (selectedPlan.billingType === 'monthly-subscription') {
        // Create subscription checkout (auto-renewable)
        const result = await createSubscriptionCheckout.mutateAsync({
          input: {
            plan: plan as any, // GraphQL enum
            billingPeriod: 'MONTHLY' as any, // GraphQL enum
            withTrial: true, // 7-14 day trial
          },
        });

        // Redirect to Stripe Checkout
        window.location.href = result.createSubscriptionCheckout.checkoutUrl;
      } else {
        // Create one-off checkout
        const billingPeriod =
          selectedPlan.billingType === 'annual-onetime' ? 'YEARLY' : 'MONTHLY';

        const result = await createOneOffCheckout.mutateAsync({
          input: {
            plan: plan as any, // GraphQL enum
            billingPeriod: billingPeriod as any, // GraphQL enum
          },
        });

        // Redirect to Stripe Checkout
        window.location.href = result.createOneOffCheckout.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Failed to create checkout:', error);
      toast.error(error.message || 'Failed to create checkout session');
      setIsCreatingCheckout(false);
    }
  };

  const getBillingTypeLabel = () => {
    switch (selectedPlan.billingType) {
      case 'monthly-subscription':
        return 'Monthly Subscription (Auto-renewal)';
      case 'monthly-onetime':
        return 'Monthly One-time Payment';
      case 'annual-onetime':
        return 'Annual One-time Payment';
    }
  };

  const getActiveUntilDate = () => {
    const days = selectedPlan.billingType === 'annual-onetime' ? 365 : 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString(
      'en-US',
      { month: 'long', day: 'numeric', year: 'numeric' }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={isCreatingCheckout}
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to plans
      </button>

      {/* Main checkout card */}
      <div className="rounded-[32px] bg-white dark:bg-[#10121a] border-2 border-zinc-200/80 dark:border-white/5 shadow-sm p-8 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 mb-2">
            Complete Your Purchase
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Review your order before proceeding to payment
          </p>
        </div>

        {/* Order Summary */}
        <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0a0b12] overflow-hidden">
          <div className="px-6 py-4 bg-zinc-50 dark:bg-[#050608] border-b border-zinc-200 dark:border-white/5">
            <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase">
              Order Summary
            </h3>
          </div>

          <div className="p-6 space-y-4">
            {/* Plan details */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {selectedPlan.name} Plan
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {getBillingTypeLabel()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  zł{selectedPlan.price.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Active until */}
            <div className="pt-4 border-t border-zinc-200 dark:border-white/5">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Clock className="w-4 h-4" />
                <span>
                  Your plan will be active until:{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {getActiveUntilDate()}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Features reminder */}
        <div className="p-6 border border-indigo-200 rounded-2xl dark:border-indigo-800/30 bg-indigo-50 dark:bg-indigo-900/10">
          <h4 className="mb-3 text-sm font-semibold text-indigo-900 dark:text-indigo-100">
            What's included in {selectedPlan.name}:
          </h4>
          <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
            {selectedPlan.id === 'plus' ? (
              <>
                <li>✓ Unlimited events</li>
                <li>✓ Up to 100 participants per event</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
              </>
            ) : selectedPlan.id === 'pro' ? (
              <>
                <li>✓ Everything in Plus</li>
                <li>✓ Unlimited participants</li>
                <li>✓ API access</li>
                <li>✓ Dedicated account manager</li>
              </>
            ) : null}
          </ul>
        </div>

        {/* Terms checkbox */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <Lock className="w-4 h-4" />
            <span className="font-medium">
              All transactions are secure and encrypted
            </span>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              disabled={isCreatingCheckout}
              className="w-4 h-4 mt-1 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50"
            />
            <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              I agree to the{' '}
              <a
                href="#"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a
                href="#"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Privacy Policy
              </a>
              . I understand that I will be redirected to Stripe for secure
              payment processing.
            </span>
          </label>
        </div>

        {/* Total & CTA */}
        <div className="pt-6 border-t border-zinc-200 dark:border-white/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                Total amount
              </p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                zł{selectedPlan.price.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateCheckout}
              disabled={!agreeToTerms || isCreatingCheckout}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white transition-colors rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingCheckout ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </>
              )}
            </button>
          </div>

          {/* Payment info */}
          <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-white/5">
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
              Powered by{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Stripe
              </span>
              . You will be redirected to complete your payment securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
