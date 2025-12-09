/**
 * Account Subscription Plans Page
 * Dedicated page for choosing and purchasing subscription plans
 */

import type { Metadata } from 'next';

import { SubscriptionPageClient } from './_components/subscription-page-client';

// TODO i18n: metadata title/description
export const metadata: Metadata = {
  title: 'Plany użytkownika | Miglee',
  description: 'Wybierz i wykup swój plan subskrypcji',
};

export default function SubscriptionPage() {
  return <SubscriptionPageClient />;
}
