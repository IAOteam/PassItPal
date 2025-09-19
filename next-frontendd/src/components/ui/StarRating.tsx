// frontend/src/components/ui/StarRating.tsx
import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number | undefined;
  size?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating = 0, size = 20, className }) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fullStar = rating >= i + 1;
        const halfStar = rating > i && rating < i + 1; // For potential future use
        
        return (
          <Star
            key={i}
            size={size}
            className={cn(
              fullStar ? 'text-yellow-400' : 'text-neutral-600'
            )}
            fill={fullStar ? 'currentColor' : 'none'}
          />
        );
      })}
    </div>
  );
};

export default StarRating;