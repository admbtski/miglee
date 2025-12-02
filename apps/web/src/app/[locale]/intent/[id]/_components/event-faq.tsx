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
      className="p-6 border rounded-2xl border-zinc-200 bg-white/70 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40 shadow-sm transition-all duration-300"
      id="faq"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 shadow-sm">
          <HelpCircle className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Często zadawane pytania
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {faqs.length}{' '}
            {faqs.length === 1
              ? 'pytanie'
              : faqs.length < 5
                ? 'pytania'
                : 'pytań'}
          </p>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-2">
        {faqs.map((faq, index) => {
          const isExpanded = expandedId === faq.id;

          return (
            <div
              key={faq.id}
              className={`border rounded-xl transition-all duration-200 ${
                isExpanded
                  ? 'border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 shadow-md'
                  : 'border-zinc-200 dark:border-zinc-700/50 bg-white/50 dark:bg-zinc-800/30 hover:border-violet-200 dark:hover:border-violet-800/50 hover:shadow-sm'
              }`}
            >
              {/* Question (clickable) */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                className="flex items-center justify-between w-full px-5 py-4 text-left transition-colors rounded-xl group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span
                    className={`flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-lg shrink-0 mt-0.5 transition-all ${
                      isExpanded
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 group-hover:bg-violet-100 group-hover:text-violet-700 dark:group-hover:bg-violet-900/30 dark:group-hover:text-violet-300'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`font-medium transition-colors ${
                      isExpanded
                        ? 'text-violet-900 dark:text-violet-100'
                        : 'text-zinc-900 dark:text-zinc-100 group-hover:text-violet-900 dark:group-hover:text-violet-100'
                    }`}
                  >
                    {faq.question}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="ml-3 shrink-0"
                >
                  <ChevronDown
                    className={`w-5 h-5 transition-colors ${
                      isExpanded
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-zinc-400 dark:text-zinc-500 group-hover:text-violet-600 dark:group-hover:text-violet-400'
                    }`}
                  />
                </motion.div>
              </button>

              {/* Answer (expandable) */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1">
                      <div className="pl-9 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap border-l-2 border-violet-200 dark:border-violet-800/50 ml-0.5">
                        {faq.answer}
                      </div>
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
