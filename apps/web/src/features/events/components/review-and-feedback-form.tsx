'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventFeedbackQuestionsQuery } from '@/lib/api/__generated__/react-query-update';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type FeedbackQuestion =
  EventFeedbackQuestionsQuery['eventFeedbackQuestions'][0];

interface ReviewAndFeedbackFormProps {
  eventTitle: string;
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
  eventTitle,
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
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Review Section */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            <Star className="h-3.5 w-3.5 fill-current" />
            Krok 1/2
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Jak oceniasz wydarzenie?
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            &quot;{eventTitle}&quot;
          </p>
        </div>

        {/* Star Rating */}
        <div className="space-y-3 p-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-800/50 dark:to-zinc-800/30 border border-zinc-200/50 dark:border-zinc-700/50">
          <Label className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Twoja ocena <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-all hover:scale-125 active:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-full"
              >
                <Star
                  className={cn(
                    'h-10 w-10 md:h-12 md:w-12 transition-all duration-200',
                    (hoveredRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.4)]'
                      : 'text-zinc-300 dark:text-zinc-600'
                  )}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {rating === 1 && '⭐ Słabo'}
                {rating === 2 && '⭐⭐ Niezbyt dobrze'}
                {rating === 3 && '⭐⭐⭐ W porządku'}
                {rating === 4 && '⭐⭐⭐⭐ Bardzo dobrze'}
                {rating === 5 && '⭐⭐⭐⭐⭐ Doskonale!'}
              </span>
            </div>
          )}
          {errors.rating && (
            <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.rating}</span>
            </div>
          )}
        </div>

        {/* Review Content */}
        <div className="space-y-3">
          <Label
            htmlFor="content"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Twoja opinia{' '}
            <span className="text-zinc-400 text-sm font-normal">
              (opcjonalnie)
            </span>
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={5}
            placeholder="Podziel się swoimi wrażeniami z wydarzenia..."
            className={cn(
              'resize-none text-base',
              errors.content ? 'border-red-500 focus-visible:ring-red-500' : ''
            )}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {content.length} / 500 znaków
            </p>
            {errors.content && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.content}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Questions Section */}
      {questions.length > 0 && (
        <div className="space-y-6 pt-8 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Krok 2/2
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Dodatkowe pytania
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Pomóż nam ulepszyć przyszłe wydarzenia dzięki krótkim odpowiedziom
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="space-y-3 p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50"
              >
                <Label
                  htmlFor={`question-${question.id}`}
                  className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-start gap-2"
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <span>
                    {question.label}
                    {question.required && (
                      <span className="ml-1.5 text-red-500">*</span>
                    )}
                  </span>
                </Label>

                {question.helpText && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 ml-8">
                    {question.helpText}
                  </p>
                )}

                <div className="ml-8">
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
                          className={cn(
                            'resize-none',
                            errors[question.id]
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : ''
                          )}
                        />
                      )}
                      {question.maxLength && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
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
                      className="space-y-3"
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
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white dark:hover:bg-zinc-700/50 transition-colors"
                          >
                            <RadioGroupItem
                              value={optionValue}
                              id={`question-${question.id}-option-${optIndex}`}
                            />
                            <Label
                              htmlFor={`question-${question.id}-option-${optIndex}`}
                              className="font-normal cursor-pointer flex-1"
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
                    <div className="space-y-3">
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
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white dark:hover:bg-zinc-700/50 transition-colors"
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
                              className="font-normal cursor-pointer flex-1"
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
                    <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors[question.id]}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="text-red-500">*</span> Pola wymagane
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="w-full sm:w-auto min-w-[220px] h-12 text-base font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Wysyłanie...
            </>
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
