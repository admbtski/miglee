import { redirect } from 'next/navigation';

/**
 * Root page redirect
 * When user visits /, middleware will redirect to /{locale}/
 * This component handles the [locale] root
 */
export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Redirect to the main events page (formerly [[...slug]])
  redirect(`/${locale}/events`);
}
