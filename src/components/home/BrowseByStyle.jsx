import React from "react";
import Link from "next/link";

// Helper for individual style cards
function StyleCard({ title, image, className, href }) {
  return (
    <Link 
      href={href} 
      className={`relative group overflow-hidden rounded-[20px] bg-white h-[290px] cursor-pointer ${className}`}
    >
      {/* Label */}
      <span className="absolute top-6 left-6 text-3xl font-bold text-black z-10">
        {title}
      </span>
      
      {/* Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-top transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${image})` }}
      />
    </Link>
  );
}

export default function BrowseByStyle() {
  return (
    <section className="w-full py-10 px-6">
      <div className="max-w-[1240px] mx-auto bg-[#F0F0F0] rounded-[40px] px-6 md:px-16 py-16">
        
        {/* Section Heading */}
        <h2 className="text-3xl md:text-5xl font-black text-center uppercase tracking-tighter mb-12">
          Browse By Dress Style
        </h2>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Row 1: Casual (Small) + Formal (Large) */}
          <StyleCard 
            title="Casual" 
            href="/products?q=casual"
            image="https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=600&auto=format&fit=crop"
            className="md:col-span-1" 
          />
          <StyleCard 
            title="Formal" 
            href="/products?q=formal"
            image="https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1000&auto=format&fit=crop"
            className="md:col-span-2" 
          />

          {/* Row 2: Party (Large) + Gym (Small) */}
          <StyleCard 
            title="Party" 
            href="/products?q=party"
            image="https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000&auto=format&fit=crop"
            className="md:col-span-2" 
          />
          <StyleCard 
            title="Gym" 
            href="/products?q=gym"
            image="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=600&auto=format&fit=crop"
            className="md:col-span-1" 
          />

        </div>
      </div>
    </section>
  );
}