// src/components/StarRating.jsx
import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

/**
 * Renders a star rating display based on a numeric rating.
 * @param {Object} props
 * @param {number} props.rating - The average rating (e.g., 4.5)
 * @param {number} [props.reviewCount] - The total number of reviews
 * @param {string} [props.className] - Optional class names for the container
 * @param {string} [props.starSize='h-4 w-4'] - Tailwind class for star size
 */
export default function StarRating({ rating = 0, reviewCount, className, starSize = 'h-4 w-4' }) {
  const normalizedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(normalizedRating);
  
  // Logic to determine if a half star should be shown: between 0.25 and 0.75 of the fraction
  const fraction = normalizedRating % 1;
  const hasHalfStar = fraction >= 0.25 && fraction < 0.75; 
  
  const roundedRating = normalizedRating.toFixed(1);

  const stars = [];

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star key={`full-${i}`} className={cn(starSize, "fill-yellow-400 text-yellow-400")} />
    );
  }

  // Add half star
  if (hasHalfStar) {
    stars.push(
      <StarHalf key="half" className={cn(starSize, "fill-yellow-400 text-yellow-400")} />
    );
  }

  // Add empty stars to make it up to 5 total
  const starsRendered = stars.length;
  const remainingEmpty = 5 - starsRendered;
  for (let i = 0; i < remainingEmpty; i++) {
    stars.push(
      <Star key={`empty-${i}`} className={cn(starSize, "fill-gray-300 text-gray-300")} />
    );
  }

  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      {stars}
      <span className="text-sm font-semibold text-gray-700 ml-1">
        {/* --- MODIFIED LOGIC HERE --- */}
        {reviewCount === 0 ? '0/0' : roundedRating}
        {reviewCount !== undefined && (
          <span className="ml-1 font-normal text-gray-500">({reviewCount} reviews)</span>
        )}
      </span>
    </div>
  );
}