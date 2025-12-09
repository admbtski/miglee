/**
 * Help & Support Page
 *
 * Features:
 * - Contact form for support requests
 * - Quick contact info (email)
 * - FAQ links to relevant pages
 *
 * All text uses i18n via useI18n hook
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { HelpCircle, Mail, MessageSquare, Send } from 'lucide-react';

import { SimpleSelect, SelectOption } from '@/components/forms/simple-select';
import { useLocalePath } from '@/hooks/use-locale-path';
import { useI18n } from '@/lib/i18n/provider-ssr';

import { AccountPageHeader } from '../_components';

export default function HelpPage() {
  const { t } = useI18n();
  const { localePath } = useLocalePath();
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions: SelectOption[] = [
    { value: 'account', label: t.help.form.category.account },
    { value: 'events', label: t.help.form.category.events },
    { value: 'billing', label: t.help.form.category.billing },
    { value: 'technical', label: t.help.form.category.technical },
    { value: 'other', label: t.help.form.category.other },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !subject || !message) {
      toast.error(t.help.form.error);
      return;
    }

    setIsSubmitting(true);

    // TODO: Integrate with actual feedback/support API (e.g., useSendFeedbackMutation)
    // Currently simulating API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(t.help.form.success);

    // Reset form
    setCategory('');
    setSubject('');
    setMessage('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <AccountPageHeader title={t.help.title} description={t.help.subtitle} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Form - Main area */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {t.help.form.title}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t.help.form.subtitle}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                >
                  {t.help.form.category.label}
                </label>
                <SimpleSelect
                  value={category}
                  onChange={setCategory}
                  options={categoryOptions}
                  placeholder={t.help.form.category.placeholder}
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                >
                  {t.help.form.subject.label}
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t.help.form.subject.placeholder}
                  className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                >
                  {t.help.form.message.label}
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.help.form.message.placeholder}
                  rows={8}
                  className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t.help.form.responseTime}
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:focus:ring-offset-zinc-900"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t.help.form.sending}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t.help.form.submit}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Quick Contact - Sidebar */}
        <div className="space-y-6">
          {/* Email Support */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t.help.contact.emailTitle}
              </h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {t.help.contact.emailDescription}
            </p>
            <a
              href="mailto:support@miglee.pl"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              support@miglee.pl
            </a>
          </div>

          {/* FAQs */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <HelpCircle className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t.help.contact.faqTitle}
              </h3>
            </div>
            <ul className="space-y-3">
              {/* TODO: Link these FAQ items to actual help/docs pages when available */}
              <li>
                <Link
                  href={localePath('/help')}
                  className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.help.contact.faqItems.createEvent}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath('/account/subscription')}
                  className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.help.contact.faqItems.manageSubscription}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath('/account/privacy')}
                  className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.help.contact.faqItems.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath('/account/plans-and-bills')}
                  className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.help.contact.faqItems.paymentIssues}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
