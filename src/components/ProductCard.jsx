import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Star, StarHalf } from "lucide-react";

// Helper to render stars
function StarRating({ rating }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
      <span className="text-sm text-gray-600 ml-1">{rating}/5</span>
    </div>
  );
}

export default function ProductCard({ product, label }) {
  // Calculate average rating from reviews (if any), default to 4.5 for demo
  const rating = product.reviews?.length 
    ? (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
    : "4.5"; 

  return (
    <Link href={`/product/${product._id}`} className="group">
      <Card className="border-none shadow-none bg-transparent hover:scale-[1.02] transition-transform cursor-pointer">
        <CardContent className="p-0">
          <div className="bg-[#F0EEED] rounded-[20px] aspect-square mb-4 overflow-hidden relative">
             <img 
               src={product.images?.[0] || "/images/placeholder.png"} 
               alt={product.name}
               className="w-full h-full object-cover object-center"
             />
             
             {/* --- NEW: LABEL BADGE --- */}
             {label && (
               <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm z-10">
                 {label}
               </span>
             )}
             {/* ------------------------ */}
             
          </div>
          <h3 className="font-bold text-lg truncate mb-1 group-hover:text-primary">{product.name}</h3>
          <StarRating rating={Number(rating)} />
          <div className="mt-2 flex items-center gap-3">
             <span className="font-bold text-xl">₹{product.price?.toLocaleString('en-IN')}</span>
             {product.discount > 0 && (
                <>
                  <span className="text-gray-400 line-through font-medium">
                    ₹{Math.round(product.price * (1 + product.discount/100)).toLocaleString('en-IN')}
                  </span>
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                    -{product.discount}%
                  </span>
                </>
             )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}