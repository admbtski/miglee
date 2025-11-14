'use client';

import { useState } from 'react';
import { FileQuestion, AlertCircle, Info } from 'lucide-react';
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

type QuestionType = 'TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE';

export interface JoinFormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  maxLength?: number;
}

interface JoinFormStepProps {
  questions: JoinFormQuestion[];
  onChange: (questions: JoinFormQuestion[]) => void;
  maxQuestions?: number;
}

/**
 * Step component for configuring join form questions during event creation
 * This is a simplified version that stores questions in memory until event is created
 */
export function JoinFormStep({
  questions,
  onChange,
  maxQuestions = 5,
}: JoinFormStepProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<JoinFormQuestion>>({
    type: 'TEXT',
    label: '',
    helpText: '',
    required: true,
    options: [''],
    maxLength: 500,
  });

  const canAddMore = questions.length < maxQuestions;

  const handleAddQuestion = () => {
    if (!newQuestion.label?.trim()) return;

    const question: JoinFormQuestion = {
      id: `temp-${Date.now()}`,
      type: newQuestion.type as QuestionType,
      label: newQuestion.label.trim(),
      helpText: newQuestion.helpText?.trim(),
      required: newQuestion.required ?? true,
      options:
        newQuestion.type === 'SINGLE_CHOICE' ||
        newQuestion.type === 'MULTI_CHOICE'
          ? newQuestion.options?.filter((o) => o.trim())
          : undefined,
      maxLength:
        newQuestion.type === 'TEXT' ? newQuestion.maxLength : undefined,
    };

    onChange([...questions, question]);
    setIsAdding(false);
    setNewQuestion({
      type: 'TEXT',
      label: '',
      helpText: '',
      required: true,
      options: [''],
      maxLength: 500,
    });
  };

  const handleDeleteQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const handleAddOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...(newQuestion.options || ['']), ''],
    });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...(newQuestion.options || [])];
    newOptions.splice(index, 1);
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(newQuestion.options || [])];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Optional Join Form</p>
            <p className="text-blue-700 dark:text-blue-200">
              Add custom questions that users must answer when requesting to
              join your event (only for REQUEST join mode). Questions will be
              created after the event is published.
            </p>
          </div>
        </div>
      </div>

      {/* Existing questions */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Questions ({questions.length}/{maxQuestions})
          </h4>
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {index + 1}.
                    </span>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {question.type === 'TEXT' && 'Text'}
                      {question.type === 'SINGLE_CHOICE' && 'Single Choice'}
                      {question.type === 'MULTI_CHOICE' && 'Multiple Choice'}
                    </span>
                    {question.required && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {question.label}
                  </p>
                  {question.helpText && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      {question.helpText}
                    </p>
                  )}
                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {question.options.map((option, i) => (
                        <p
                          key={i}
                          className="text-xs text-neutral-600 dark:text-neutral-400"
                        >
                          • {option}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="shrink-0"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add question form */}
      {isAdding ? (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              New Question
            </h4>
          </div>

          {/* Question type */}
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select
              value={newQuestion.type}
              onValueChange={(value: string) =>
                setNewQuestion({ ...newQuestion, type: value as QuestionType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEXT">Text</SelectItem>
                <SelectItem value="SINGLE_CHOICE">Single Choice</SelectItem>
                <SelectItem value="MULTI_CHOICE">Multiple Choice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question label */}
          <div className="space-y-2">
            <Label>
              Question <span className="text-red-500">*</span>
            </Label>
            <Input
              value={newQuestion.label}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, label: e.target.value })
              }
              placeholder="e.g., What's your experience level?"
              maxLength={200}
            />
          </div>

          {/* Help text */}
          <div className="space-y-2">
            <Label>Help Text (optional)</Label>
            <Textarea
              value={newQuestion.helpText}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, helpText: e.target.value })
              }
              placeholder="Additional information..."
              maxLength={200}
              rows={2}
            />
          </div>

          {/* Options for choice types */}
          {(newQuestion.type === 'SINGLE_CHOICE' ||
            newQuestion.type === 'MULTI_CHOICE') && (
            <div className="space-y-2">
              <Label>
                Options <span className="text-red-500">*</span>
              </Label>
              {(newQuestion.options || ['']).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {(newQuestion.options?.length || 0) > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveOption(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {(newQuestion.options?.length || 0) < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="w-full"
                >
                  + Add Option
                </Button>
              )}
            </div>
          )}

          {/* Max length for text */}
          {newQuestion.type === 'TEXT' && (
            <div className="space-y-2">
              <Label>Max Length</Label>
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
              />
            </div>
          )}

          {/* Required checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={newQuestion.required}
              onCheckedChange={(checked) =>
                setNewQuestion({ ...newQuestion, required: checked as boolean })
              }
            />
            <Label htmlFor="required" className="cursor-pointer">
              Required question
            </Label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewQuestion({
                  type: 'TEXT',
                  label: '',
                  helpText: '',
                  required: true,
                  options: [''],
                  maxLength: 500,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddQuestion}
              disabled={!newQuestion.label?.trim()}
            >
              Add Question
            </Button>
          </div>
        </div>
      ) : (
        canAddMore && (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <FileQuestion className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        )
      )}

      {/* Empty state */}
      {questions.length === 0 && !isAdding && (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-8 text-center">
          <FileQuestion className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            No questions yet
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Add custom questions for users to answer when requesting to join
          </p>
        </div>
      )}

      {!canAddMore && !isAdding && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-100">
              Maximum {maxQuestions} questions reached
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
