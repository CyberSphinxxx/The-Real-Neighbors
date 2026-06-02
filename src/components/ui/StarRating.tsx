import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  ratings: Record<string, number>;
  currentUid: string;
  onRate?: (star: number) => void;
  size?: 'sm' | 'md';
}

export const StarRating: React.FC<StarRatingProps> = ({ ratings, currentUid, onRate, size = 'sm' }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const isInteractive = onRate !== undefined;
  const iconSize = size === 'sm' ? 12 : 16;
  
  const values = Object.values(ratings);
  const count = values.length;
  const average = count > 0 ? values.reduce((a, b) => a + b, 0) / count : 0;
  const displayRating = hoverRating !== null ? hoverRating : Math.round(average);
  
  const userRating = ratings[currentUid];
  const hasUserRated = userRating !== undefined;

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col gap-0.5">
      <div 
        className={`flex items-center gap-0.5 ${isInteractive ? 'cursor-pointer' : ''}`}
        onMouseLeave={() => isInteractive && setHoverRating(null)}
        title={isInteractive ? "Rate this playlist" : undefined}
      >
        {stars.map((star) => {
          const isFilled = star <= displayRating;
          // Use primary color for user's own rating if they hover or if it's their rating and they aren't hovering something else
          let starColor = isFilled ? 'text-amber-400' : 'text-muted';
          let fillColor = isFilled ? 'currentColor' : 'none';

          if (isInteractive && hasUserRated && hoverRating === null && star <= Math.round(average)) {
             // We can just keep amber for average, but the prompt says: "Current user's own rating: stars filled with --color-primary instead of amber so they can distinguish their vote".
             // Actually, if we show average by default, maybe we only show primary if they are hovering?
             // The prompt: "Current user's own rating: stars filled with --color-primary instead of amber so they can distinguish their vote".
             // If we display the average, it's a bit weird to color it primary. But let's color it primary if the user has rated it.
             starColor = 'text-primary';
          }

          // If hovering, always use primary to show they are interacting
          if (hoverRating !== null && isFilled) {
            starColor = 'text-primary';
          }

          return (
            <Star
              key={star}
              size={iconSize}
              className={`${starColor} transition-colors`}
              fill={fillColor}
              onMouseEnter={() => isInteractive && setHoverRating(star)}
              onClick={(e) => {
                e.stopPropagation();
                if (isInteractive && onRate) onRate(star);
              }}
            />
          );
        })}
      </div>
      {size === 'md' && (
        <div className="text-xs text-faint mt-1 font-medium">
          {average > 0 ? `${average.toFixed(1)} · ${count} rating${count !== 1 ? 's' : ''}` : 'No ratings yet'}
        </div>
      )}
    </div>
  );
};
