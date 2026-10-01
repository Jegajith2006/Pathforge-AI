import React from 'react';
import { Star } from 'lucide-react';

export const FeedbackRating = ({
  rating = 0,
  max = 5,
  size = 'md',
  showNumber = true,
  interactive = false,
  onChange,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const starSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => {
          const starIndex = i + 1;
          const isFilled = rating >= starIndex;
          const isHalf = !isFilled && rating >= starIndex - 0.5;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starIndex)}
              className={`transition-transform ${
                interactive ? 'cursor-pointer hover:scale-115 focus:outline-none' : 'cursor-default'
              }`}
              aria-label={interactive ? `Rate ${starIndex} out of ${max}` : undefined}
            >
              <Star
                className={`${starSize} ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isHalf
                    ? 'text-amber-400 fill-amber-400/50'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-mono font-bold text-[var(--text-primary)] pl-0.5">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};
