import { AccountPageHeader, AccountEmptyState } from '../_components';
import { HelpCircle, Mail } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <AccountPageHeader
        title="Help & Support"
        description="Get help with your account and events"
      />

      <AccountEmptyState
        illustration={
          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-12 dark:from-indigo-900/20 dark:to-violet-900/20">
            <HelpCircle className="h-32 w-32 text-indigo-600 dark:text-indigo-400" />
          </div>
        }
        title="Need help?"
        description="We're here to help! Contact our support team and we'll get back to you as soon as possible."
        action={
          <a
            href="mailto:support@miglee.pl"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Mail className="h-5 w-5" />
            Contact Support
          </a>
        }
      />
    </div>
  );
}
