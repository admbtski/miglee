import { Suspense } from 'react';
import { BillingPageWrapper } from './_components/billing-page-wrapper';
import { PaymentResultModal } from '@/app/[locale]/account/plans-and-bills/_components/payment-result-modal';

export default function BillingPage() {
  return (
    <>
      <BillingPageWrapper />
      <Suspense fallback={null}>
        <PaymentResultModal context="account" />
      </Suspense>
    </>
  );
}
