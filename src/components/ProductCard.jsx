import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, StarHalf } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function getAverageRating(reviews = []) {
  if (!reviews || reviews.length === 0) return 0;
  const total = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
  return (total / reviews.length).toFixed(1);
}

function StarRating({ rating }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1 text-yellow-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 fill-current" />
      ))}
      {hasHalfStar && <StarHalf className="w-4 h-4 fill-current" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-200 fill-gray-100" />
      ))}
    </div>
  );
}

export default function ProductCard({ product, label }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const {
    _id,
    name,
    price,
    discount = 0,
    images = [],
    reviews = []
  } = product;

  const originalPrice = Number(price);
  const salePrice = discount > 0 
    ? originalPrice - (originalPrice * (discount / 100)) 
    : originalPrice;

  const rating = getAverageRating(reviews);

  useEffect(() => {
    let interval;
    if (images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <Link href={`/product/${_id}`} className="group block h-full">
      <div 
        className="flex flex-col h-full gap-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-[#F0EEED]">
          <img
            src={images[currentImageIndex] || "/images/placeholder.png"}
            alt={name}
            className="h-full w-full object-cover object-center transition-all duration-500"
          />
          
          {/* LABEL BADGE (For "LOCAL") */}
          {label && (
            <Badge className="absolute top-3 left-3 bg-black text-white border-none px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-md z-10">
              {label}
            </Badge>
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white border-none">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-black truncate group-hover:text-gray-600 transition-colors capitalize">
            {name}
          </h3>

          <div className="flex items-center gap-2 text-sm">
            <StarRating rating={Number(rating)} />
            <span className="text-sm text-gray-600">
              {rating}/5
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-black">
              ₹{salePrice.toLocaleString("en-IN")}
            </span>
            
            {discount > 0 && (
              <>
                <span className="text-xl font-bold text-gray-400 line-through">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
                <Badge variant="secondary" className="bg-red-100 text-red-600 hover:bg-red-100 border-none px-2 py-0.5 text-xs">
                  -{discount}%
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}