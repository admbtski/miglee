/**
 * Feedback Panel Component
 * Manages feedback questions and displays results
 * Pattern: Similar to join-form-management-client.tsx
 */

// TODO i18n: All Polish strings need translation keys
// - All button labels, error messages, placeholders
// - Tab labels, result labels, question type names

'use client';

import { useState } from 'react';
import { useEventDetailQuery } from '@/features/events/api/events';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  MoreVertical,
  Edit2,
  FileQuestion,
  BarChart3,
  Loader2,
  AlertCircle,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  useEventFeedbackQuestionsQuery,
  useEventFeedbackResultsQuery,
  useSendFeedbackRequestsMutation,
  useUpdateEventFeedbackQuestionsMutation,
} from '@/features/feedback';
import type { FeedbackQuestionType } from '@/lib/api/__generated__/react-query-update';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '@/features/event-management/components/plan-upgrade-banner';
import { Button } from '@/components/ui/button';

interface QuestionItem {
  id: string; // Temporary ID for new items (cuid for existing)
  type: 'TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[]; // For choice questions
  maxLength?: number; // For text questions
}

interface FeedbackPanelProps {
  eventId: string;
}

type TabType = 'questions' | 'results';

// ============================================================================
// Question Action Menu Component using floating-ui
// ============================================================================
function QuestionActionMenu({
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

// ============================================================================
// Main Component
// ============================================================================
export function FeedbackPanel({ eventId }: FeedbackPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('questions');

  // Fetch event to check plan
  const { data: eventData, isLoading: eventLoading } = useEventDetailQuery({
    id: eventId,
  });

  // Fetch existing questions
  const {
    data: serverQuestions = [],
    isLoading: questionsLoading,
    error: questionsError,
    refetch: refetchQuestions,
  } = useEventFeedbackQuestionsQuery({ eventId });

  // Fetch results (only when results tab is active)
  const {
    data: results,
    isLoading: resultsLoading,
    error: resultsError,
  } = useEventFeedbackResultsQuery(
    { eventId },
    { enabled: activeTab === 'results' }
  );

  // Mutations
  const updateQuestionsMutation = useUpdateEventFeedbackQuestionsMutation();
  const sendFeedbackRequests = useSendFeedbackRequestsMutation();

  // Local state for questions
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const [sendRequestsState, setSendRequestsState] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Check if plan allows feedback
  const sponsorshipPlan = eventData?.event?.sponsorshipPlan as SponsorshipPlan;

  // Initialize questions from server data (only once)
  if (
    serverQuestions.length > 0 &&
    !initialized &&
    !questionsLoading &&
    !hasChanges
  ) {
    setQuestions(
      serverQuestions.map((q: any) => ({
        id: q.id,
        type: q.type,
        label: q.label,
        helpText: q.helpText,
        required: q.required,
        options: q.options?.map((opt: any) => opt.label) || [],
        maxLength: q.maxLength,
      }))
    );
    setInitialized(true);
  }

  // Reset initialization when eventId changes
  if (initialized && serverQuestions.length === 0 && questions.length > 0) {
    setQuestions([]);
    setInitialized(false);
  }

  const handleAddQuestion = () => {
    const newQuestion: QuestionItem = {
      id: `temp-${Date.now()}`,
      type: 'TEXT',
      label: '',
      required: false, // Default to optional for feedback
      maxLength: 500,
    };
    setQuestions([...questions, newQuestion]);
    setEditingId(newQuestion.id);
    setHasChanges(true);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
    setHasChanges(true);
  };

  const handleUpdateQuestion = (
    id: string,
    field: keyof QuestionItem,
    value: any
  ) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
    setHasChanges(true);
  };

  const handleReorder = (newOrder: QuestionItem[]) => {
    setQuestions(newOrder);
    setHasChanges(true);
  };

  const handleAddOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, options: [...(q.options || []), ''] } : q
      )
    );
    setHasChanges(true);
  };

  const handleUpdateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: (q.options || []).map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
    setHasChanges(true);
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: (q.options || []).filter(
                (_, idx) => idx !== optionIndex
              ),
            }
          : q
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validate
    for (const q of questions) {
      if (!q.label.trim()) {
        toast.error('Wszystkie pytania muszą mieć treść');
        return;
      }
      if (q.label.length > 200) {
        toast.error('Treść pytania nie może przekraczać 200 znaków');
        return;
      }
      if (q.helpText && q.helpText.length > 200) {
        toast.error('Tekst pomocniczy nie może przekraczać 200 znaków');
        return;
      }
      if (
        (q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') &&
        (!q.options || q.options.filter((o) => o.trim()).length === 0)
      ) {
        toast.error('Pytania wyboru muszą mieć przynajmniej jedną opcję');
        return;
      }
    }

    try {
      await updateQuestionsMutation.mutateAsync({
        input: {
          eventId,
          questions: questions.map((q, index) => ({
            type: q.type as FeedbackQuestionType,
            label: q.label.trim(),
            helpText: q.helpText?.trim() || undefined,
            required: q.required,
            order: index,
            options:
              q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE'
                ? q.options
                    ?.filter((o) => o.trim())
                    .map((o) => ({ label: o.trim() }))
                : undefined,
            maxLength: q.type === 'TEXT' ? q.maxLength : undefined,
          })),
        },
      });
      toast.success('Pytania zostały zaktualizowane');
      setHasChanges(false);
      setEditingId(null);
      refetchQuestions();
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się zapisać pytań');
    }
  };

  const handleSendFeedbackRequests = async () => {
    setSendRequestsState(null);
    try {
      const result = await sendFeedbackRequests.mutateAsync({
        eventId,
      });

      if (result.sendFeedbackRequests.success) {
        setSendRequestsState({
          success: true,
          message:
            result.sendFeedbackRequests.message ||
            `Wysłano prośby o feedback do ${result.sendFeedbackRequests.sentCount} uczestników`,
        });
      } else {
        setSendRequestsState({
          success: false,
          message:
            result.sendFeedbackRequests.message ||
            'Nie udało się wysłać próśb o feedback',
        });
      }
    } catch (error: any) {
      setSendRequestsState({
        success: false,
        message:
          error.message || 'Wystąpił błąd podczas wysyłania próśb o feedback',
      });
    }
  };

  if (eventLoading || questionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent" />
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-900 dark:text-red-100">
          Nie udało się załadować pytań
        </p>
      </div>
    );
  }

  return (
    <PlanUpgradeBanner
      currentPlan={sponsorshipPlan}
      requiredPlan="PLUS"
      featureName="Rozszerzony feedback dostępny w planach Plus i Pro"
      featureDescription="Zbieraj szczegółowe opinie od uczestników za pomocą niestandardowych ankiet. Uczestnicy mogą wystawić ocenę i odpowiedzieć na Twoje pytania po zakończeniu wydarzenia."
      eventId={eventId}
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 w-fit">
          <button
            onClick={() => setActiveTab('questions')}
            className={cn(
              'h-9 px-4 rounded-md text-sm font-medium transition-all flex items-center gap-2',
              activeTab === 'questions'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
            )}
          >
            <FileQuestion className="w-4 h-4" />
            Pytania ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={cn(
              'h-9 px-4 rounded-md text-sm font-medium transition-all flex items-center gap-2 relative',
              activeTab === 'results'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Wyniki
            {results && results.totalRespondents > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                {results.totalRespondents}
              </span>
            )}
          </button>
        </div>

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div>
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                  <FileQuestion className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Pytania feedbackowe
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Dodaj pytania, które uczestnicy wypełnią po wydarzeniu
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Dodaj pytanie
              </button>
            </div>

            {/* Send Feedback Requests Section */}
            <div className="p-6 border shadow-sm rounded-2xl border-zinc-200/80 dark:border-zinc-800 bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900/50 dark:to-zinc-900/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
                    Wyślij prośby o feedback
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-[60ch]">
                    Wyślij emaile z prośbą o ocenę wydarzenia do wszystkich
                    uczestników ze statusem "Dołączony". Można wysłać w dowolnym
                    momencie po zakończeniu wydarzenia.
                  </p>
                </div>
                <Button
                  onClick={handleSendFeedbackRequests}
                  disabled={
                    sendFeedbackRequests.isPending ||
                    !eventData?.event?.endAt ||
                    new Date(eventData.event.endAt) > new Date()
                  }
                  size="lg"
                  className="flex-shrink-0"
                >
                  {sendFeedbackRequests.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Wysyłanie...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Wyślij prośby
                    </>
                  )}
                </Button>
              </div>

              {/* Send result message */}
              {sendRequestsState && (
                <div
                  className={cn(
                    'mt-4 p-4 rounded-lg border',
                    sendRequestsState.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {sendRequestsState.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <p
                      className={cn(
                        'text-sm',
                        sendRequestsState.success
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      )}
                    >
                      {sendRequestsState.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Warning if event not ended */}
              {eventData?.event?.endAt &&
                new Date(eventData.event.endAt) > new Date() && (
                  <div className="p-4 mt-4 border rounded-lg border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Prośby o feedback można wysłać dopiero po zakończeniu
                        wydarzenia.
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {/* Questions List (Reorderable) */}
            {questions.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-lg border-zinc-300 dark:border-zinc-700">
                <FileQuestion className="w-12 h-12 mx-auto mb-4 text-zinc-400 dark:text-zinc-600" />
                <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Brak pytań
                </h3>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Dodaj pierwsze pytanie, aby zacząć budować formularz feedbacku
                </p>
                <button
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj pierwsze pytanie
                </button>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={questions}
                onReorder={handleReorder}
                className="space-y-4"
              >
                {questions.map((question, index) => {
                  const isEditing = editingId === question.id;

                  return (
                    <Reorder.Item
                      key={question.id}
                      value={question}
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

                        {/* Question Content */}
                        <div className="flex-1 space-y-4">
                          {/* Question Header */}
                          <div className="flex items-start justify-between">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              Pytanie {index + 1}
                              {isEditing && (
                                <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
                                  (Edycja)
                                </span>
                              )}
                            </label>
                            {!isEditing && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {question.type === 'TEXT'
                                    ? 'Tekst'
                                    : question.type === 'SINGLE_CHOICE'
                                      ? 'Wybór jednokrotny'
                                      : 'Wybór wielokrotny'}
                                </span>
                                {question.required && (
                                  <span className="text-xs px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                    Wymagane
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Question Label */}
                          {isEditing ? (
                            <>
                              <div>
                                <input
                                  type="text"
                                  value={question.label}
                                  onChange={(e) =>
                                    handleUpdateQuestion(
                                      question.id,
                                      'label',
                                      e.target.value
                                    )
                                  }
                                  placeholder="np. Jak oceniasz organizację wydarzenia?"
                                  maxLength={200}
                                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  autoFocus
                                />
                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                  {question.label.length}/200 znaków
                                </p>
                              </div>

                              {/* Type Selector */}
                              <div>
                                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                  Typ pytania
                                </label>
                                <Select
                                  value={question.type}
                                  onValueChange={(value: any) =>
                                    handleUpdateQuestion(
                                      question.id,
                                      'type',
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="TEXT">Tekst</SelectItem>
                                    <SelectItem value="SINGLE_CHOICE">
                                      Wybór jednokrotny
                                    </SelectItem>
                                    <SelectItem value="MULTI_CHOICE">
                                      Wybór wielokrotny
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Help Text */}
                              <div>
                                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                  Tekst pomocniczy (opcjonalnie)
                                </label>
                                <input
                                  type="text"
                                  value={question.helpText || ''}
                                  onChange={(e) =>
                                    handleUpdateQuestion(
                                      question.id,
                                      'helpText',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Dodatkowe informacje..."
                                  maxLength={200}
                                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                  {(question.helpText || '').length}/200 znaków
                                </p>
                              </div>

                              {/* Options for choice questions */}
                              {(question.type === 'SINGLE_CHOICE' ||
                                question.type === 'MULTI_CHOICE') && (
                                <div>
                                  <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Opcje
                                  </label>
                                  <div className="space-y-2">
                                    {(question.options || []).map(
                                      (option, optIdx) => (
                                        <div
                                          key={optIdx}
                                          className="flex items-center gap-2"
                                        >
                                          <input
                                            type="text"
                                            value={option}
                                            onChange={(e) =>
                                              handleUpdateOption(
                                                question.id,
                                                optIdx,
                                                e.target.value
                                              )
                                            }
                                            placeholder={`Opcja ${optIdx + 1}`}
                                            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                          />
                                          {(question.options || []).length >
                                            1 && (
                                            <button
                                              onClick={() =>
                                                handleRemoveOption(
                                                  question.id,
                                                  optIdx
                                                )
                                              }
                                              className="p-2 text-red-600 transition rounded hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      )
                                    )}
                                    {(question.options || []).length < 10 && (
                                      <button
                                        onClick={() =>
                                          handleAddOption(question.id)
                                        }
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 transition rounded-lg hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                                      >
                                        <Plus className="w-3 h-3" />
                                        Dodaj opcję
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Required checkbox */}
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`required-${question.id}`}
                                  checked={question.required}
                                  onCheckedChange={(checked) =>
                                    handleUpdateQuestion(
                                      question.id,
                                      'required',
                                      checked
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`required-${question.id}`}
                                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
                                >
                                  Wymagane
                                </label>
                              </div>

                              {/* Edit mode actions */}
                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 transition bg-indigo-100 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                >
                                  Zakończ edycję
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Read-only view */}
                              <div className="px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                                {question.label || (
                                  <span className="text-zinc-400 dark:text-zinc-500 italic">
                                    Brak treści pytania
                                  </span>
                                )}
                              </div>
                              {question.helpText && (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                  {question.helpText}
                                </p>
                              )}
                              {(question.type === 'SINGLE_CHOICE' ||
                                question.type === 'MULTI_CHOICE') &&
                                question.options &&
                                question.options.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                      Opcje:
                                    </p>
                                    <ul className="pl-4 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                                      {question.options
                                        .filter((o) => o.trim())
                                        .map((option, idx) => (
                                          <li key={idx} className="list-disc">
                                            {option}
                                          </li>
                                        ))}
                                    </ul>
                                  </div>
                                )}
                            </>
                          )}
                        </div>

                        {/* Action Menu */}
                        <div className="mt-1">
                          <QuestionActionMenu
                            onEdit={() => setEditingId(question.id)}
                            onDelete={() => handleRemoveQuestion(question.id)}
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
                    disabled={updateQuestionsMutation.isPending}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {updateQuestionsMutation.isPending
                      ? 'Zapisywanie...'
                      : 'Zapisz zmiany'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {resultsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            )}

            {resultsError && (
              <div className="p-4 border border-red-200 rounded-lg dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      Błąd ładowania wyników
                    </h4>
                    <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                      Nie udało się załadować wyników feedbacku.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {results && (
              <>
                {/* Summary */}
                <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Podsumowanie
                      </h4>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {results.totalRespondents} osób wypełniło ankietę
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {results.totalRespondents}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        odpowiedzi
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions results */}
                {results.questionStats.length === 0 ? (
                  <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-8 text-center shadow-sm">
                    <BarChart3 className="w-10 h-10 mx-auto mb-4 text-zinc-400" />
                    <h4 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">
                      Brak wyników
                    </h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Nie ma jeszcze żadnych odpowiedzi na pytania feedbackowe.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {results.questionStats.map((stat, index) => (
                      <div
                        key={stat.question.id}
                        className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <span className="text-sm font-medium text-zinc-500">
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <h5 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                              {stat.question.label}
                            </h5>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {stat.totalAnswers} odpowiedzi
                            </p>
                          </div>
                        </div>

                        {/* Choice distribution */}
                        {stat.choiceDistribution && (
                          <div className="mt-4 space-y-3">
                            {stat.choiceDistribution.map((choice) => (
                              <div key={choice.option} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-zinc-700 dark:text-zinc-300">
                                    {choice.option}
                                  </span>
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {choice.count} (
                                    {choice.percentage.toFixed(1)}
                                    %)
                                  </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                  <div
                                    className="h-full transition-all bg-indigo-500 rounded-full dark:bg-indigo-400"
                                    style={{ width: `${choice.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Text answers */}
                        {stat.textAnswers && (
                          <div className="mt-4 space-y-3">
                            {stat.textAnswers.map((textAnswer, i) => (
                              <div
                                key={i}
                                className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                              >
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                  {textAnswer.answer}
                                </p>
                                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                  — {textAnswer.userName}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </PlanUpgradeBanner>
  );
}
