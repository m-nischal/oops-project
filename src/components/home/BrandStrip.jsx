// src/components/home/BrandStrip.jsx
import React from "react";

export default function BrandStrip() {
  // Styles updated to provide a unique and modern visual contrast for each brand.
  return (
    <div className="w-full bg-black py-8">
      <div className="max-w-[1440px] mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-0">
        
        {/* ZARA: Elegant Serif, tight tracking (Didone style) */}
        <span className="text-white text-2xl md:text-4xl font-serif uppercase font-extrabold tracking-tighter">ZARA</span>
        
        {/* H&M: Punchy, Bold Sans-serif with Red Accent */}
        <span className="text-red-500 text-2xl md:text-4xl font-sans uppercase font-black tracking-widest">H&M</span>
        
        {/* Tommy Hilfiger: Clean, Bold Sans-serif, Navy/White Aesthetic */}
        {/* Uses Tailwind styles for the dark blue background and white text */}
        <span style={{ color: '#F0F0F0', border: '2px solid #00235D', backgroundColor: '#00235D' }} className="text-2xl md:text-4xl font-sans uppercase font-bold tracking-normal px-2 py-1">TOMMY HILFIGER</span>
        
        {/* Allen Solly: Distinctive, Dark/Rich color, subtle Serif for sophistication */}
        <span style={{ color: '#000735', backgroundColor: '#FFFFFF' }} className="text-2xl md:text-4xl font-serif uppercase font-extrabold tracking-wide px-2 py-1 rounded-sm shadow-md">Allen Solly</span>
        
        {/* US Polo Assn.: Traditional, Solid Serif/Slab, Dark Blue */}
        <span style={{ color: '#00235D' }} className="text-white text-2xl md:text-4xl font-serif uppercase font-black tracking-wider bg-white px-2 py-1 rounded-sm shadow-md">US POLO ASSN.</span>
      </div>
    </div>
  );
}