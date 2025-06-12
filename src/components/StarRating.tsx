
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  className
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = Math.floor(maxRating - rating);

  return (
    <div className={cn("flex items-center", className)}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, index) => (
        <Star
          key={`star-full-${index}`}
          size={size}
          className="text-foodYellow fill-foodYellow"
        />
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
          <Star
            size={size}
            className="text-foodYellow absolute top-0 left-0"
          />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden" style={{ height: `${size}px` }}>
            <Star
              size={size}
              className="text-foodYellow fill-foodYellow"
            />
          </div>
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, index) => (
        <Star
          key={`star-empty-${index}`}
          size={size}
          className="text-foodYellow"
        />
      ))}
      
      <span className="ml-2 text-foodGray font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

export default StarRating;
