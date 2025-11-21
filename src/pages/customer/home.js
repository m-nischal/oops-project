import React from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import CustomerNavbar from '@/components/CustomerNavbar';
import HeroSection from '@/components/home/HeroSection';
import BrandStrip from '@/components/home/BrandStrip';
import NewArrivals from '@/components/home/NewArrivals'; // <--- Import New Arrivals
import { Loader2 } from 'lucide-react';

export default function CustomerHomePage() {
  // 1. Protect the page
  const { isLoading } = useAuthGuard("CUSTOMER");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white font-sans">
      
      {/* LANDING SCREEN WRAPPER */}
      <div className="min-h-screen flex flex-col">
        {/* 1. Top Bar */}
        <CustomerNavbar />

        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Brand Strip */}
        <BrandStrip />
      </div>

      {/* CONTENT BELOW FOLD */}
      <main>
        {/* 4. New Arrivals Section */}
        <NewArrivals />
        
        {/* Placeholder for Top Selling */}
      </main>
    </div>
  );
}