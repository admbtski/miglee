'use client';

import * as React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
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

  React.useEffect(() => {
    // Auto-create checkout when panel loads
    handleCreateCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCheckout = async () => {
    if (selectedPlan.id === 'free') {
      toast.error('Cannot purchase FREE plan');
      onBack();
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
      // Go back to plan selection
      setTimeout(() => onBack(), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 mx-auto text-indigo-600 dark:text-indigo-400 animate-spin" />
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Creating checkout session...
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            You'll be redirected to secure payment in a moment
          </p>
        </div>
        <button
          onClick={onBack}
          disabled={isCreatingCheckout}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to plans
        </button>
      </div>
    </div>
  );
}
