'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SubscriptionPlans } from './subscription-plans';
import { AccountCheckoutPanel } from './account-checkout-panel';
import { useMyPlan } from '@/lib/api/billing';
import { Modal } from '@/components/feedback/modal';
import { CheckCircle2, XCircle } from 'lucide-react';

export type PlanType = 'free' | 'plus' | 'pro';
export type BillingType =
  | 'monthly-subscription'
  | 'monthly-onetime'
  | 'annual-onetime';

interface SubscriptionPlanData {
  id: PlanType;
  name: string;
  billingType: BillingType;
  price: number;
}

type View = 'plans' | 'checkout';

export function SubscriptionPlansWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: planData } = useMyPlan();

  const [view, setView] = React.useState<View>('plans');
  const [selectedPlan, setSelectedPlan] =
    React.useState<SubscriptionPlanData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showErrorModal, setShowErrorModal] = React.useState(false);

  // Check URL params for success/canceled
  React.useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setShowSuccessModal(true);
      // Clear URL params
      router.replace('/account/plans-and-bills');
    } else if (canceled === 'true') {
      setShowErrorModal(true);
      // Clear URL params after a short delay
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('canceled');
        router.replace(url.pathname);
        setShowErrorModal(false);
      }, 3000);
    }
  }, [searchParams, router]);

  const handlePlanSelect = (plan: SubscriptionPlanData) => {
    setSelectedPlan(plan);
    setView('checkout');
  };

  const handleBackToPlans = () => {
    setView('plans');
    setSelectedPlan(null);
  };

  const currentPlan = planData?.myPlan?.plan || 'FREE';

  if (view === 'checkout' && selectedPlan) {
    return (
      <AccountCheckoutPanel
        selectedPlan={selectedPlan}
        onBack={handleBackToPlans}
      />
    );
  }

  return (
    <>
      <SubscriptionPlans
        onPlanSelect={handlePlanSelect}
        currentPlan={currentPlan as 'FREE' | 'PLUS' | 'PRO'}
      />

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/account/plans-and-bills');
        }}
        variant="default"
        density="comfortable"
        header={
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Płatność zakończona sukcesem!
            </h3>
          </div>
        }
        content={
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Twój plan został aktywowany. Zostaniesz przekierowany do strony z
            planami i fakturami.
          </p>
        }
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/account/plans-and-bills');
              }}
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-500 transition-colors"
            >
              Przejdź do planów i faktur
            </button>
          </div>
        }
      />

      {/* Error Modal */}
      <Modal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        variant="default"
        density="comfortable"
        header={
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Płatność anulowana
            </h3>
          </div>
        }
        content={
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Płatność została anulowana. Możesz spróbować ponownie w dowolnym
            momencie.
          </p>
        }
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-6 py-2.5 text-sm font-medium border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Zamknij
            </button>
          </div>
        }
      />
    </>
  );
}
