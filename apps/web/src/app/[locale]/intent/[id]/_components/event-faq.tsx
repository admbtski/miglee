/**
 * Event FAQ Display Component
 * Shows frequently asked questions for an event
 */

'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface EventFaqProps {
  faqs: FaqItem[];
}

export function EventFaq({ faqs }: EventFaqProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <div
      className="p-6 border rounded-2xl border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40"
      id="faq"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Najczęściej zadawane pytania
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Odpowiedzi na najważniejsze pytania dotyczące tego wydarzenia
          </p>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isExpanded = expandedId === faq.id;

          return (
            <div
              key={faq.id}
              className="border rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              {/* Question (clickable) */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                className="flex items-center justify-between w-full px-4 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {faq.question}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                </motion.div>
              </button>

              {/* Answer (expandable) */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-13 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
