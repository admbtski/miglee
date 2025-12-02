/**
 * FAQ Management Client Component
 * Handles adding, editing, removing, and reordering FAQs
 */

'use client';

import { useState } from 'react';
import { useIntentDetailQuery } from '@/lib/api/intents';
import { useUpdateIntentFaqsMutation } from './_hooks/use-update-intent-faqs';
import { HelpCircle, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { toast } from 'sonner';

interface FaqItem {
  id: string; // Temporary ID for new items (cuid for existing)
  question: string;
  answer: string;
}

interface FaqManagementClientProps {
  intentId: string;
}

export function FaqManagementClient({ intentId }: FaqManagementClientProps) {
  const { data, isLoading, error, refetch } = useIntentDetailQuery({
    id: intentId,
  });
  const updateFaqsMutation = useUpdateIntentFaqsMutation();

  // Local state for FAQs
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize FAQs from query data
  const intent = data?.intent;
  const initialFaqs = intent?.faqs || [];

  // Sync with server data on load
  if (initialFaqs.length > 0 && faqs.length === 0 && !hasChanges) {
    setFaqs(
      initialFaqs.map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
      }))
    );
  }

  const handleAddFaq = () => {
    const newFaq: FaqItem = {
      id: `temp-${Date.now()}`,
      question: '',
      answer: '',
    };
    setFaqs([...faqs, newFaq]);
    setHasChanges(true);
  };

  const handleRemoveFaq = (id: string) => {
    setFaqs(faqs.filter((faq) => faq.id !== id));
    setHasChanges(true);
  };

  const handleUpdateFaq = (
    id: string,
    field: 'question' | 'answer',
    value: string
  ) => {
    setFaqs(
      faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq))
    );
    setHasChanges(true);
  };

  const handleReorder = (newOrder: FaqItem[]) => {
    setFaqs(newOrder);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validate
    for (const faq of faqs) {
      if (!faq.question.trim()) {
        toast.error('Wszystkie pytania muszą być wypełnione');
        return;
      }
      if (faq.question.length > 500) {
        toast.error('Pytanie nie może przekraczać 500 znaków');
        return;
      }
      if (!faq.answer.trim()) {
        toast.error('Wszystkie odpowiedzi muszą być wypełnione');
        return;
      }
      if (faq.answer.length > 2000) {
        toast.error('Odpowiedź nie może przekraczać 2000 znaków');
        return;
      }
    }

    try {
      await updateFaqsMutation.mutateAsync({
        intentId,
        faqs: faqs.map((faq) => ({
          question: faq.question.trim(),
          answer: faq.answer.trim(),
        })),
      });
      toast.success('FAQ zostało zaktualizowane');
      setHasChanges(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się zapisać FAQ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent" />
      </div>
    );
  }

  if (error || !intent) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-900 dark:text-red-100">
          Nie udało się załadować FAQ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Dodaj pytania i odpowiedzi, które będą widoczne na stronie
              wydarzenia
            </p>
          </div>
        </div>
        <button
          onClick={handleAddFaq}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Dodaj pytanie
        </button>
      </div>

      {/* FAQs List (Reorderable) */}
      {faqs.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed rounded-lg border-zinc-300 dark:border-zinc-700">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-zinc-400 dark:text-zinc-600" />
          <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Brak pytań
          </h3>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Dodaj pierwsze pytanie, aby zacząć budować FAQ dla tego wydarzenia
          </p>
          <button
            onClick={handleAddFaq}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Dodaj pierwsze pytanie
          </button>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={faqs}
          onReorder={handleReorder}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <Reorder.Item
              key={faq.id}
              value={faq}
              className="p-6 border rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-start gap-4">
                {/* Drag Handle */}
                <div className="flex items-center justify-center w-8 h-8 mt-1 transition rounded cursor-move text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* FAQ Content */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Pytanie {index + 1}
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) =>
                        handleUpdateFaq(faq.id, 'question', e.target.value)
                      }
                      placeholder="np. Jak mogę dołączyć do wydarzenia?"
                      maxLength={500}
                      className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {faq.question.length}/500 znaków
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Odpowiedź
                    </label>
                    <textarea
                      value={faq.answer}
                      onChange={(e) =>
                        handleUpdateFaq(faq.id, 'answer', e.target.value)
                      }
                      placeholder="Wpisz odpowiedź..."
                      maxLength={2000}
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg resize-none bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {faq.answer.length}/2000 znaków
                    </p>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFaq(faq.id)}
                  className="flex items-center justify-center w-8 h-8 transition rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label="Usuń pytanie"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Save Button (Sticky Bottom) */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-6 z-10"
        >
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={updateFaqsMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {updateFaqsMutation.isPending
                ? 'Zapisywanie...'
                : 'Zapisz zmiany'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
