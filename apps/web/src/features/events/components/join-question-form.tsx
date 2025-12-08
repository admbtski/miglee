'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle } from 'lucide-react';
import type { EventJoinQuestionsQuery } from '@/lib/api/__generated__/react-query-update';

type JoinQuestion = EventJoinQuestionsQuery['eventJoinQuestions'][0];

interface JoinQuestionFormProps {
  questions: JoinQuestion[];
  onSubmit: (answers: Array<{ questionId: string; answer: any }>) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

interface FormErrors {
  [questionId: string]: string;
}

/**
 * Form for users to answer join questions when requesting to join an event
 */
export function JoinQuestionForm({
  questions,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Wyślij prośbę',
}: JoinQuestionFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    questions.forEach((question) => {
      const answer = answers[question.id];

      // Check required questions
      if (question.required) {
        if (question.type === 'TEXT') {
          if (!answer || answer.trim() === '') {
            newErrors[question.id] = 'To pytanie jest wymagane';
          } else if (question.maxLength && answer.length > question.maxLength) {
            newErrors[question.id] = `Maksymalnie ${question.maxLength} znaków`;
          }
        } else if (question.type === 'SINGLE_CHOICE') {
          if (!answer) {
            newErrors[question.id] = 'Wybierz jedną opcję';
          }
        } else if (question.type === 'MULTI_CHOICE') {
          if (!answer || answer.length === 0) {
            newErrors[question.id] = 'Wybierz przynajmniej jedną opcję';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Convert answers to array format expected by API
    const answersArray = questions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => ({
        questionId: q.id,
        answer: answers[q.id],
      }));

    onSubmit(answersArray);
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-2">
            <Label
              htmlFor={`question-${question.id}`}
              className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              {index + 1}. {question.label}
              {question.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>

            {question.helpText && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {question.helpText}
              </p>
            )}

            {/* TEXT type */}
            {question.type === 'TEXT' && (
              <>
                {question.maxLength && question.maxLength <= 100 ? (
                  <Input
                    id={`question-${question.id}`}
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    maxLength={question.maxLength || undefined}
                    placeholder="Twoja odpowiedź..."
                    className={
                      errors[question.id]
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : ''
                    }
                  />
                ) : (
                  <Textarea
                    id={`question-${question.id}`}
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    maxLength={question.maxLength || undefined}
                    placeholder="Twoja odpowiedź..."
                    rows={4}
                    className={
                      errors[question.id]
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : ''
                    }
                  />
                )}
                {question.maxLength && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {answers[question.id]?.length || 0} / {question.maxLength}
                  </p>
                )}
              </>
            )}

            {/* SINGLE_CHOICE type */}
            {question.type === 'SINGLE_CHOICE' &&
              question.options &&
              Array.isArray(question.options) &&
              question.options.length > 0 && (
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => {
                    handleAnswerChange(question.id, value);
                  }}
                >
                  {(
                    question.options as Array<{ label: string; value?: string }>
                  ).map((option, optIndex) => {
                    const optionValue = option.value || option.label;
                    return (
                      <div
                        key={optIndex}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={optionValue}
                          id={`question-${question.id}-option-${optIndex}`}
                        />
                        <Label
                          htmlFor={`question-${question.id}-option-${optIndex}`}
                          className="font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}

            {/* MULTI_CHOICE type */}
            {question.type === 'MULTI_CHOICE' &&
              question.options &&
              Array.isArray(question.options) &&
              question.options.length > 0 && (
                <div className="space-y-2">
                  {(
                    question.options as Array<{ label: string; value?: string }>
                  ).map((option, optIndex) => {
                    const optionValue = option.value || option.label;
                    const isChecked =
                      Array.isArray(answers[question.id]) &&
                      answers[question.id].includes(optionValue);

                    return (
                      <div
                        key={optIndex}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`question-${question.id}-option-${optIndex}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentAnswers = Array.isArray(
                              answers[question.id]
                            )
                              ? answers[question.id]
                              : [];

                            if (checked) {
                              handleAnswerChange(question.id, [
                                ...currentAnswers,
                                optionValue,
                              ]);
                            } else {
                              handleAnswerChange(
                                question.id,
                                currentAnswers.filter(
                                  (v: string) => v !== optionValue
                                )
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`question-${question.id}-option-${optIndex}`}
                          className="font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* Error message */}
            {errors[question.id] && (
              <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[question.id]}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="mr-auto text-xs text-zinc-600 dark:text-zinc-400">
          <span className="text-red-500">*</span> Pola wymagane
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Wysyłanie...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
