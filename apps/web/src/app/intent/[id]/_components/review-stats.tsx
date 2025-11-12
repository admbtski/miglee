'use client';

import { Star } from 'lucide-react';

type ReviewStatsProps = {
  stats: {
    totalCount: number;
    averageRating: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
    }>;
  };
};

export function ReviewStats({ stats }: ReviewStatsProps) {
  const { totalCount, averageRating, ratingDistribution } = stats;

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-6">
        {/* Average Rating */}
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            {averageRating.toFixed(1)}
          </div>
          <div className="mt-1 flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-zinc-300 dark:text-zinc-600'
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {totalCount} {totalCount === 1 ? 'recenzja' : 'recenzji'}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const dist = ratingDistribution.find((d) => d.rating === rating);
            const count = dist?.count || 0;
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {rating}
                  </span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
