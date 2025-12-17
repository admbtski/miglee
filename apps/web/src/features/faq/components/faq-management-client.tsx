/**
 * FAQ Management Client Component
 * Handles adding, editing, removing, and reordering FAQs
 */

// TODO i18n: All hardcoded strings need translation keys

'use client';

import { useState } from 'react';
import {
  useEventDetailQuery,
  useUpdateEventFaqsMutation,
} from '@/features/events';
import {
  HelpCircle,
  Plus,
  Trash2,
  GripVertical,
  Save,
  MoreVertical,
  Edit2,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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
  id: string;
  question: string;
  answer: string;
}

interface FaqManagementClientProps {
  eventId: string;
}

// FAQ Action Menu Component
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
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="flex items-center justify-center w-9 h-9 transition-all rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        aria-label="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <FloatingPortal>
            <FloatingFocusManager context={context} modal={false}>
              <motion.div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="z-50 min-w-[160px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl"
              >
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      onEdit();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full gap-2.5 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors rounded-lg dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            </FloatingFocusManager>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </>
  );
}

export function FaqManagementClient({ eventId }: FaqManagementClientProps) {
  const { data, isLoading, error, refetch } = useEventDetailQuery({
    id: eventId,
  });
  const updateFaqsMutation = useUpdateEventFaqsMutation();

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const event = data?.event;
  const initialFaqs = (event as any)?.faqs || [];

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
    setEditingId(newFaq.id);
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
        toast.error('All questions must be filled in');
        return;
      }
      if (faq.question.length > 500) {
        toast.error('Question cannot exceed 500 characters');
        return;
      }
      if (!faq.answer.trim()) {
        toast.error('All answers must be filled in');
        return;
      }
      if (faq.answer.length > 2000) {
        toast.error('Answer cannot exceed 2000 characters');
        return;
      }
    }

    try {
      await updateFaqsMutation.mutateAsync({
        input: {
          eventId,
          faqs: faqs.map((faq) => ({
            question: faq.question.trim(),
            answer: faq.answer.trim(),
          })),
        },
      });
      toast.success('FAQ saved successfully');
      setHasChanges(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save FAQ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Loading FAQ...
          </p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 dark:text-red-400" />
          <p className="mt-3 text-sm text-red-700 dark:text-red-300">
            Failed to load FAQ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Add questions and answers visible on your event page
            </p>
          </div>
        </div>
        <button
          onClick={handleAddFaq}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add question
        </button>
      </div>

      {/* FAQs List */}
      {faqs.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed rounded-2xl border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30">
          <HelpCircle className="w-14 h-14 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            No questions yet
          </h3>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Add your first question to help participants find answers quickly
          </p>
          <button
            onClick={handleAddFaq}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add first question
          </button>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={faqs}
          onReorder={handleReorder}
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {faqs.map((faq, index) => {
              const isEditing = editingId === faq.id;

              return (
                <Reorder.Item
                  key={faq.id}
                  value={faq}
                  className={[
                    'p-5 border rounded-2xl transition-all',
                    isEditing
                      ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
                  ].join(' ')}
                  drag={!isEditing}
                  dragListener={!isEditing}
                  dragElastic={0.05}
                  dragMomentum={false}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  whileDrag={{
                    scale: 1.02,
                    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
                    cursor: 'grabbing',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <div className="flex items-start gap-4">
                    {/* Drag Handle */}
                    <div
                      className={[
                        'flex items-center justify-center w-8 h-8 mt-0.5 transition rounded-lg',
                        isEditing
                          ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                          : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing',
                      ].join(' ')}
                      style={{ touchAction: 'none' }}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* FAQ Content */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Question {index + 1}
                          {isEditing && (
                            <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">
                              (editing)
                            </span>
                          )}
                        </label>
                        {isEditing ? (
                          <div className="space-y-1.5">
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
                              placeholder="e.g. How can I join the event?"
                              maxLength={500}
                              className="w-full px-4 py-3 text-sm border rounded-xl bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                              autoFocus
                            />
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-right">
                              {faq.question.length}/500
                            </p>
                          </div>
                        ) : (
                          <div className="px-4 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                            {faq.question || (
                              <span className="text-zinc-400 dark:text-zinc-500 italic">
                                No question entered
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Answer
                        </label>
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <textarea
                              value={faq.answer}
                              onChange={(e) =>
                                handleUpdateFaq(
                                  faq.id,
                                  'answer',
                                  e.target.value
                                )
                              }
                              placeholder="Enter your answer..."
                              maxLength={2000}
                              rows={4}
                              className="w-full px-4 py-3 text-sm border rounded-xl resize-none bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                            />
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-right">
                              {faq.answer.length}/2000
                            </p>
                          </div>
                        ) : (
                          <div className="px-4 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                            {faq.answer || (
                              <span className="text-zinc-400 dark:text-zinc-500 italic">
                                No answer entered
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
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 transition-all bg-indigo-100 rounded-xl hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                          >
                            <Check className="w-4 h-4" />
                            Done editing
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Menu */}
                    <div className="mt-0.5">
                      <FaqActionMenu
                        onEdit={() => setEditingId(faq.id)}
                        onDelete={() => handleRemoveFaq(faq.id)}
                      />
                    </div>
                  </div>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Save Button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-6 z-10"
          >
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={updateFaqsMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl"
              >
                {updateFaqsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
