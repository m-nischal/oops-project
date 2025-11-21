import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerNavbar from '@/components/CustomerNavbar';
import HeroSection from '@/components/home/HeroSection';
import BrandStrip from '@/components/home/BrandStrip';
import NewArrivals from '@/components/home/NewArrivals';
import LocalProducts from '@/components/home/LocalProducts';
import BrowseByStyle from '@/components/home/BrowseByStyle'; // <--- Import Added
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check who is viewing the page
    async function checkUserRole() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        
        // If not logged in, allow guest access
        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        const user = data.user;

        // Redirect Business/Delivery roles to their dashboards
        if (user && ["RETAILER", "WHOLESALER", "ADMIN", "DELIVERY"].includes(user.role)) {
          if (user.role === "RETAILER") router.replace("/retailer/dashboard");
          else if (user.role === "WHOLESALER") router.replace("/wholesaler/dashboard");
          else if (user.role === "DELIVERY") router.replace("/delivery/assigned");
          else router.replace("/admin");
          return; 
        }

        // Customers stay here
        setIsLoading(false);

      } catch (e) {
        setIsLoading(false);
      }
    }

    checkUserRole();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
        
        {/* Divider Line */}
        <div className="max-w-[1240px] mx-auto px-6">
            <hr className="border-gray-200" />
        </div>

        {/* 5. Local Products Section */}
        <LocalProducts />

        {/* 6. Browse By Dress Style Section (New) */}
        <BrowseByStyle />
        
        {/* Footer Placeholder */}
        <div className="py-20 text-center text-gray-400 text-sm">
          — End of Home Page —
        </div>
      </main>
    </div>
  );
}