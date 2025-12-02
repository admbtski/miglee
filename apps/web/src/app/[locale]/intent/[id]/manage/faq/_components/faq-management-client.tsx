/**
 * FAQ Management Client Component
 * Handles adding, editing, removing, and reordering FAQs
 */

'use client';

import { useState } from 'react';
import { useIntentDetailQuery } from '@/lib/api/intents';
import {
  HelpCircle,
  Plus,
  Trash2,
  GripVertical,
  Save,
  MoreVertical,
  Edit2,
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { toast } from 'sonner';
import { useUpdateIntentFaqsMutation } from '@/lib/api/intents';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react';

interface FaqItem {
  id: string; // Temporary ID for new items (cuid for existing)
  question: string;
  answer: string;
}

interface FaqManagementClientProps {
  intentId: string;
}

// FAQ Action Menu Component using floating-ui
function FaqActionMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'bottom-end',
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        aria-label="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 min-w-[160px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black/5 dark:ring-white/5"
            >
              <div className="p-1">
                <button
                  onClick={() => {
                    onEdit();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-sm transition-colors rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edytuj</span>
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 transition-colors rounded-md dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Usuń</span>
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}

export function FaqManagementClient({ intentId }: FaqManagementClientProps) {
  const { data, isLoading, error, refetch } = useIntentDetailQuery({
    id: intentId,
  });
  const updateFaqsMutation = useUpdateIntentFaqsMutation();

  // Local state for FAQs
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Initialize FAQs from query data
  const intent = data?.intent;
  const initialFaqs = (intent as any)?.faqs || [];

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
    setEditingId(newFaq.id); // Auto-edit new FAQ
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
        input: {
          intentId,
          faqs: faqs.map((faq) => ({
            question: faq.question.trim(),
            answer: faq.answer.trim(),
          })),
        },
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
          {faqs.map((faq, index) => {
            const isEditing = editingId === faq.id;

            return (
              <Reorder.Item
                key={faq.id}
                value={faq}
                className={`p-6 border rounded-lg ${
                  isEditing
                    ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-300 dark:border-indigo-700'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                }`}
                drag={!isEditing}
                dragListener={!isEditing}
                dragControls={undefined}
                dragElastic={0.05}
                dragMomentum={false}
                initial={false}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                whileDrag={{
                  scale: 1.02,
                  boxShadow:
                    '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  cursor: 'grabbing',
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15 },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 40,
                }}
                style={{
                  position: 'relative',
                  zIndex: isEditing ? 1 : 'auto',
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div
                    className={`flex items-center justify-center w-8 h-8 mt-1 transition rounded ${
                      isEditing
                        ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                        : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing'
                    }`}
                    style={{ touchAction: 'none' }}
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* FAQ Content */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Pytanie {index + 1}
                        {isEditing && (
                          <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
                            (Edycja)
                          </span>
                        )}
                      </label>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) =>
                              handleUpdateFaq(
                                faq.id,
                                'question',
                                e.target.value
                              )
                            }
                            placeholder="np. Jak mogę dołączyć do wydarzenia?"
                            maxLength={500}
                            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            autoFocus
                          />
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {faq.question.length}/500 znaków
                          </p>
                        </>
                      ) : (
                        <div className="px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                          {faq.question || (
                            <span className="text-zinc-400 dark:text-zinc-500 italic">
                              Brak pytania
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Odpowiedź
                      </label>
                      {isEditing ? (
                        <>
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
                        </>
                      ) : (
                        <div className="px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                          {faq.answer || (
                            <span className="text-zinc-400 dark:text-zinc-500 italic">
                              Brak odpowiedzi
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Edit mode actions */}
                    {isEditing && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 transition bg-indigo-100 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                        >
                          Zakończ edycję
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Menu */}
                  <div className="mt-1">
                    <FaqActionMenu
                      onEdit={() => setEditingId(faq.id)}
                      onDelete={() => handleRemoveFaq(faq.id)}
                    />
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
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
