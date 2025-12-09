/**
 * Join Form Management Client Component
 * Handles adding, editing, removing, and reordering join form questions
 * Similar to FAQ management
 */

// TODO i18n: All Polish strings need translation keys
// TODO i18n: Date formatting should be locale-aware

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
  UserPlus,
  Loader2,
  AlertCircle,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  useEventJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
  useUpdateEventJoinQuestionsMutation,
} from '@/features/events/api/join-form';
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
import type { EventJoinRequestsQuery } from '@/lib/api/__generated__/react-query-update';
import type { JoinQuestionType } from '@/lib/api/__generated__/react-query-update';

type JoinRequest = EventJoinRequestsQuery['eventJoinRequests']['items'][0];

interface QuestionItem {
  id: string; // Temporary ID for new items (cuid for existing)
  type: 'TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[]; // For choice questions
  maxLength?: number; // For text questions
}

interface JoinFormManagementClientProps {
  eventId: string;
}

type TabType = 'questions' | 'requests';

// ============================================================================
// Join Request Card Component
// ============================================================================
function JoinRequestCard({
  request,
  onApprove,
  onReject,
  isProcessing,
}: {
  request: JoinRequest;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  isProcessing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const user = request.member.user;
  const answers = request.answers || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
          {user.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {user.name}
          </h4>
          {user.profile?.bioShort && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
              {user.profile.bioShort}
            </p>
          )}
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {new Date(request.member.joinedAt || Date.now()).toLocaleDateString(
              'pl-PL',
              {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onReject(request.member.userId)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Odrzuć
          </button>
          <button
            onClick={() => onApprove(request.member.userId)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Akceptuj
          </button>
        </div>
      </div>

      {/* Answers Toggle */}
      {answers.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition border-t border-zinc-200 dark:border-zinc-800"
          >
            <span>
              {answers.length}{' '}
              {answers.length === 1
                ? 'odpowiedź'
                : answers.length < 5
                  ? 'odpowiedzi'
                  : 'odpowiedzi'}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                expanded && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800">
                  {answers.map((answer, idx) => (
                    <div key={answer.id || idx} className="space-y-1">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {answer.question?.label || `Pytanie ${idx + 1}`}
                      </p>
                      <div className="px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100">
                        {Array.isArray(answer.answer)
                          ? answer.answer.join(', ')
                          : String(answer.answer)}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// Question Action Menu Component using floating-ui
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

export function JoinFormManagementClient({
  eventId,
}: JoinFormManagementClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('questions');

  const { data, isLoading, error, refetch } = useEventDetailQuery({
    id: eventId,
  });
  const updateQuestionsMutation = useUpdateEventJoinQuestionsMutation();

  // Join Requests
  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEventJoinRequestsQuery({ eventId, limit: 20 });

  const approveRequest = useApproveJoinRequestMutation();
  const rejectRequest = useRejectJoinRequestMutation();
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // Flatten paginated requests
  const allRequests =
    (requestsData as any)?.pages?.flatMap(
      (page: any) =>
        (page as EventJoinRequestsQuery).eventJoinRequests?.items ?? []
    ) ?? [];

  const pendingRequestsCount = allRequests.length;

  // Local state for questions
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Initialize questions from query data
  const event = data?.event;
  const initialQuestions = (event as any)?.joinQuestions || [];

  // Sync with server data on load
  if (initialQuestions.length > 0 && questions.length === 0 && !hasChanges) {
    setQuestions(
      initialQuestions.map((q: any) => ({
        id: q.id,
        type: q.type,
        label: q.label,
        helpText: q.helpText,
        required: q.required,
        options: q.options?.map((opt: any) => opt.label) || [],
        maxLength: q.maxLength,
      }))
    );
  }

  const handleAddQuestion = () => {
    const newQuestion: QuestionItem = {
      id: `temp-${Date.now()}`,
      type: 'TEXT',
      label: '',
      required: true,
      maxLength: 500,
    };
    setQuestions([...questions, newQuestion]);
    setEditingId(newQuestion.id); // Auto-edit new question
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
            type: q.type as JoinQuestionType,
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
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się zapisać pytań');
    }
  };

  // Request handlers
  const handleApprove = async (userId: string) => {
    try {
      setProcessingUserId(userId);
      await approveRequest.mutateAsync({
        input: { eventId, userId },
      });
      toast.success('Prośba została zaakceptowana');
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Nie udało się zaakceptować prośby');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setProcessingUserId(userId);
      await rejectRequest.mutateAsync({
        input: { eventId, userId },
      });
      toast.success('Prośba została odrzucona');
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Nie udało się odrzucić prośby');
    } finally {
      setProcessingUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-900 dark:text-red-100">
          Nie udało się załadować pytań
        </p>
      </div>
    );
  }

  return (
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
          onClick={() => setActiveTab('requests')}
          className={cn(
            'h-9 px-4 rounded-md text-sm font-medium transition-all flex items-center gap-2 relative',
            activeTab === 'requests'
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
              : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
          )}
        >
          <UserPlus className="w-4 h-4" />
          Prośby
          {pendingRequestsCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <>
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                <FileQuestion className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Pytania formularza
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Dodaj pytania, które użytkownicy muszą wypełnić przed
                  wysłaniem prośby
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

          {/* Questions List (Reorderable) */}
          {questions.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed rounded-lg border-zinc-300 dark:border-zinc-700">
              <FileQuestion className="w-12 h-12 mx-auto mb-4 text-zinc-400 dark:text-zinc-600" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Brak pytań
              </h3>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Dodaj pierwsze pytanie, aby zacząć budować formularz dołączania
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
                                placeholder="np. Dlaczego chcesz dołączyć?"
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
        </>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Prośby o dołączenie
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Przeglądaj i zarządzaj prośbami użytkowników
              </p>
            </div>
          </div>

          {/* Requests List */}
          {requestsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : requestsError ? (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    Błąd ładowania
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                    Nie udało się załadować próśb. Spróbuj ponownie.
                  </p>
                </div>
              </div>
            </div>
          ) : allRequests.length === 0 ? (
            <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-8 text-center shadow-sm">
              <UserPlus className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
              <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Brak oczekujących próśb
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[50ch] mx-auto">
                Gdy ktoś wyśle prośbę o dołączenie, zobaczysz ją tutaj.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allRequests.map((request: JoinRequest) => (
                <JoinRequestCard
                  key={request.member.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={processingUserId === request.member.userId}
                />
              ))}

              {/* Load more button */}
              {hasNextPage && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition disabled:opacity-50"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ładowanie...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Załaduj więcej
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
