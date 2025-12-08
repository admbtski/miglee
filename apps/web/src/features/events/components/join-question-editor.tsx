'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, X, AlertCircle, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EventJoinQuestionsQuery } from '@/lib/api/__generated__/react-query-update';

type JoinQuestion = EventJoinQuestionsQuery['eventJoinQuestions'][0];
type QuestionType = 'TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE';

interface JoinQuestionEditorProps {
  eventId: string;
  questions: JoinQuestion[];
  onCreateQuestion: (question: {
    order: number;
    type: QuestionType;
    label: string;
    helpText?: string;
    required: boolean;
    options?: Array<{ label: string; value?: string }>;
    maxLength?: number;
  }) => void;
  onUpdateQuestion: (
    id: string,
    updates: Partial<{
      label: string;
      helpText: string;
      required: boolean;
      options: Array<{ label: string; value?: string }>;
      maxLength: number;
    }>
  ) => void;
  onDeleteQuestion: (id: string) => void;
  onReorderQuestions: (questionIds: string[]) => void;
  isLocked?: boolean;
  lockReason?: string;
  maxQuestions?: number;
}

interface NewQuestion {
  type: QuestionType;
  label: string;
  helpText: string;
  required: boolean;
  options: string[];
  maxLength: number;
}

const MAX_LABEL_LENGTH = 200;
const MAX_HELP_TEXT_LENGTH = 200;
const MAX_OPTIONS = 10;

/**
 * Editor for managing join questions (owner/mod only)
 */
export function JoinQuestionEditor({
  questions,
  onCreateQuestion,
  onDeleteQuestion,
  isLocked = false,
  lockReason,
  maxQuestions = 5,
}: JoinQuestionEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState<NewQuestion>({
    type: 'TEXT',
    label: '',
    helpText: '',
    required: true,
    options: [''],
    maxLength: 500,
  });

  const canAddMore = questions.length < maxQuestions && !isLocked;

  const handleStartAdding = () => {
    setIsAdding(true);
    setNewQuestion({
      type: 'TEXT',
      label: '',
      helpText: '',
      required: true,
      options: [''],
      maxLength: 500,
    });
  };

  const handleCancelAdding = () => {
    setIsAdding(false);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.label.trim()) {
      return;
    }

    const questionData: any = {
      order: questions.length,
      type: newQuestion.type,
      label: newQuestion.label.trim(),
      helpText: newQuestion.helpText.trim() || undefined,
      required: newQuestion.required,
    };

    if (
      newQuestion.type === 'SINGLE_CHOICE' ||
      newQuestion.type === 'MULTI_CHOICE'
    ) {
      const validOptions = newQuestion.options
        .filter((opt) => opt.trim() !== '')
        .map((opt) => ({ label: opt.trim() }));

      if (validOptions.length === 0) {
        return;
      }

      questionData.options = validOptions;
    } else if (newQuestion.type === 'TEXT') {
      questionData.maxLength = newQuestion.maxLength;
    }

    onCreateQuestion(questionData);
    setIsAdding(false);
  };

  const handleAddOption = () => {
    if (newQuestion.options.length < MAX_OPTIONS) {
      setNewQuestion({
        ...newQuestion,
        options: [...newQuestion.options, ''],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.filter((_, i) => i !== index),
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  if (isLocked) {
    return (
      <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800 bg-[#FFF9E6] dark:bg-amber-900/20 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-amber-900 dark:text-amber-100">
              Edycja pytań zablokowana
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              {lockReason ||
                'Nie możesz edytować pytań, ponieważ co najmniej jedna osoba już złożyła prośbę lub dołączyła.'}
            </p>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="mt-4 space-y-3">
            <h5 className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Aktualne pytania:
            </h5>
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="rounded-xl bg-white dark:bg-zinc-900 border-[0.5px] border-zinc-200 dark:border-zinc-800 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-zinc-500">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {q.label}
                    </p>
                    {q.helpText && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5">
                        {q.helpText}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5">
                      <Badge variant="outline" className="text-xs">
                        {q.type === 'TEXT'
                          ? 'Tekst'
                          : q.type === 'SINGLE_CHOICE'
                            ? 'Wybór pojedynczy'
                            : 'Wybór wielokrotny'}
                      </Badge>
                      {q.required && (
                        <Badge variant="outline" className="text-xs">
                          Wymagane
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing questions */}
      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="flex items-start gap-3 rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <GripVertical className="h-5 w-5 text-zinc-400 cursor-move" />
                <span className="text-sm font-medium text-zinc-500">
                  {index + 1}.
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                      {question.label}
                    </p>
                    {question.helpText && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">
                        {question.helpText}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {question.type === 'TEXT'
                          ? 'Tekst'
                          : question.type === 'SINGLE_CHOICE'
                            ? 'Wybór pojedynczy'
                            : 'Wybór wielokrotny'}
                      </Badge>
                      {question.required && (
                        <Badge variant="outline" className="text-xs">
                          Wymagane
                        </Badge>
                      )}
                      {question.type === 'TEXT' && question.maxLength && (
                        <Badge variant="outline" className="text-xs">
                          Max {question.maxLength} znaków
                        </Badge>
                      )}
                    </div>

                    {(question.type === 'SINGLE_CHOICE' ||
                      question.type === 'MULTI_CHOICE') &&
                      question.options && (
                        <div className="mt-3 space-y-1.5">
                          {(
                            question.options as Array<{
                              label: string;
                              value?: string;
                            }>
                          ).map((opt, i) => (
                            <p
                              key={i}
                              className="text-sm text-zinc-600 dark:text-zinc-400"
                            >
                              • {opt.label}
                            </p>
                          ))}
                        </div>
                      )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteQuestion(question.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new question */}
      {!isAdding && canAddMore && (
        <Button
          onClick={handleStartAdding}
          variant="outline"
          className="w-full"
          data-add-question-trigger
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj pytanie ({questions.length}/{maxQuestions})
        </Button>
      )}

      {!canAddMore && !isLocked && (
        <div className="rounded-xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <AlertCircle className="h-4 w-4" />
            <span>Osiągnięto maksymalną liczbę pytań ({maxQuestions})</span>
          </div>
        </div>
      )}

      {/* New question form */}
      {isAdding && (
        <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm max-w-[720px] mx-auto">
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
              Nowe pytanie
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelAdding}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-5 space-y-5">
            {/* Question type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Typ pytania</Label>
              <Select
                value={newQuestion.type}
                onValueChange={(value) =>
                  setNewQuestion({
                    ...newQuestion,
                    type: value as QuestionType,
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Tekst</SelectItem>
                  <SelectItem value="SINGLE_CHOICE">
                    Wybór pojedynczy
                  </SelectItem>
                  <SelectItem value="MULTI_CHOICE">
                    Wybór wielokrotny
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question label */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Pytanie <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newQuestion.label}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, label: e.target.value })
                }
                maxLength={MAX_LABEL_LENGTH}
                placeholder="Np. Jakie masz doświadczenie w tym sporcie?"
                className="h-11"
              />
              <p className="text-xs text-zinc-500 text-right">
                {newQuestion.label.length} / {MAX_LABEL_LENGTH}
              </p>
            </div>

            {/* Help text */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Tekst pomocniczy (opcjonalnie)
              </Label>
              <Textarea
                value={newQuestion.helpText}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, helpText: e.target.value })
                }
                maxLength={MAX_HELP_TEXT_LENGTH}
                rows={2}
                placeholder="Dodatkowe informacje dla użytkownika..."
              />
              <p className="text-xs text-zinc-500 text-right">
                {newQuestion.helpText.length} / {MAX_HELP_TEXT_LENGTH}
              </p>
            </div>

            {/* Options for CHOICE types */}
            {(newQuestion.type === 'SINGLE_CHOICE' ||
              newQuestion.type === 'MULTI_CHOICE') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Opcje <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        placeholder={`Opcja ${index + 1}`}
                        className="h-11"
                      />
                      {newQuestion.options.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                          className="h-11 w-11 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {newQuestion.options.length < MAX_OPTIONS && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="w-full h-10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Dodaj opcję
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Max length for TEXT */}
            {newQuestion.type === 'TEXT' && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Maksymalna długość odpowiedzi
                </Label>
                <Input
                  type="number"
                  value={newQuestion.maxLength}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      maxLength: parseInt(e.target.value) || 500,
                    })
                  }
                  min={10}
                  max={2000}
                  className="h-11"
                />
              </div>
            )}

            {/* Required checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={newQuestion.required}
                onCheckedChange={(checked) =>
                  setNewQuestion({
                    ...newQuestion,
                    required: checked as boolean,
                  })
                }
              />
              <Label htmlFor="required" className="cursor-pointer text-sm">
                Pytanie wymagane
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              onClick={handleCancelAdding}
              className="h-11 px-6"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleAddQuestion}
              disabled={!newQuestion.label.trim()}
              className="h-11 px-6"
            >
              Dodaj pytanie
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
