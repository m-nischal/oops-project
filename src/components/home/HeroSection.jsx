import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    // Added flex-1 to make this section stretch to fill available space
    <section className="w-full bg-[#F2F0F1] flex-1 flex items-center">
      <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full h-full">
        
        {/* Left Content - Centered Vertically */}
        <div className="space-y-8 py-10 lg:py-0 flex flex-col justify-center h-full">
          <h1 className="text-5xl md:text-[64px] leading-[1] font-black uppercase tracking-tighter">
            Find Clothes That Matches Your Style
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-md leading-relaxed">
            Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.
          </p>
          
          <Link href="/products">
            <Button className="rounded-full px-12 py-6 text-lg bg-black text-white hover:bg-black/80 w-full md:w-auto">
              Shop Now
            </Button>
          </Link>
          
          {/* Statistics Block Removed per request */}
        </div>

        {/* Right Image - Stretches to fit container height */}
        <div className="relative h-full w-full flex items-end justify-center lg:justify-end overflow-hidden">
            {/* Decorative Stars */}
            <div className="absolute top-10 right-10 text-4xl animate-pulse">✨</div>
            <div className="absolute bottom-1/2 left-0 text-4xl animate-pulse delay-700">✨</div>

            {/* Main Hero Image */}
            <img 
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop" 
                alt="Fashion Models" 
                className="object-cover object-top w-full h-full max-h-[600px] lg:max-h-full mix-blend-multiply"
            />
        </div>
      </div>
    </section>
  );
}