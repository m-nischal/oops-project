import React from "react";

export default function BrandStrip() {
  // Simple text representation of logos matching the font style in screenshot
  // In a real app, replace these <span> with <img src="/logo.png" />
  return (
    <div className="w-full bg-black py-8">
      <div className="max-w-[1440px] mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-0">
        <span className="text-white text-2xl md:text-4xl font-serif uppercase tracking-widest">Versace</span>
        <span className="text-white text-2xl md:text-4xl font-serif uppercase tracking-widest">Zara</span>
        <span className="text-white text-2xl md:text-4xl font-serif uppercase tracking-widest">Gucci</span>
        <span className="text-white text-2xl md:text-4xl font-bold uppercase tracking-widest">Prada</span>
        <span className="text-white text-2xl md:text-4xl font-sans uppercase tracking-wide">Calvin Klein</span>
      </div>
    </div>
  );
}