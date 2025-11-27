'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntentFeedbackQuestionsQuery } from '@/lib/api/__generated__/react-query-update';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type FeedbackQuestion =
  IntentFeedbackQuestionsQuery['intentFeedbackQuestions'][0];

interface ReviewAndFeedbackFormProps {
  intentTitle: string;
  questions: FeedbackQuestion[];
  onSubmit: (data: {
    rating: number;
    content?: string;
    feedbackAnswers: Array<{ questionId: string; answer: any }>;
  }) => void;
  isSubmitting?: boolean;
  existingReview?: {
    rating: number;
    content?: string | null;
  };
}

interface FormErrors {
  [key: string]: string;
}

/**
 * Combined form for review (rating + comment) and feedback questions
 */
export function ReviewAndFeedbackForm({
  intentTitle,
  questions,
  onSubmit,
  isSubmitting = false,
  existingReview,
}: ReviewAndFeedbackFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState(existingReview?.content || '');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear error
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

    // Rating is required
    if (rating === 0) {
      newErrors.rating = 'Ocena jest wymagana';
    }

    // Validate content length
    if (content && content.length > 500) {
      newErrors.content = 'Maksymalnie 500 znaków';
    }

    // Validate required feedback questions
    questions.forEach((question) => {
      const answer = answers[question.id];

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

    // Convert answers to array format
    const feedbackAnswers = questions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => ({
        questionId: q.id,
        answer: answers[q.id],
      }));

    onSubmit({
      rating,
      content: content.trim() || undefined,
      feedbackAnswers,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Review Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Jak oceniasz wydarzenie?
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {intentTitle}
          </p>
        </div>

        {/* Star Rating */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Ocena <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    (hoveredRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-zinc-300 dark:text-zinc-600'
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                {rating} / 5
              </span>
            )}
          </div>
          {errors.rating && (
            <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.rating}</span>
            </div>
          )}
        </div>

        {/* Review Content */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm font-medium">
            Twoja opinia (opcjonalnie)
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Podziel się swoimi wrażeniami..."
            className={
              errors.content ? 'border-red-500 focus-visible:ring-red-500' : ''
            }
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {content.length} / 500
            </p>
            {errors.content && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.content}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Questions Section */}
      {questions.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Dodatkowe pytania
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Pomóż nam ulepszyć przyszłe wydarzenia
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
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
                        {answers[question.id]?.length || 0} /{' '}
                        {question.maxLength}
                      </p>
                    )}
                  </>
                )}

                {/* SINGLE_CHOICE type */}
                {question.type === 'SINGLE_CHOICE' && question.options && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) =>
                      handleAnswerChange(question.id, value)
                    }
                  >
                    {(
                      question.options as Array<{
                        label: string;
                        value?: string;
                      }>
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
                {question.type === 'MULTI_CHOICE' && question.options && (
                  <div className="space-y-2">
                    {(
                      question.options as Array<{
                        label: string;
                        value?: string;
                      }>
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
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors[question.id]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mr-auto">
          <span className="text-red-500">*</span> Pola wymagane
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            'Wysyłanie...'
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Wyślij opinię
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
