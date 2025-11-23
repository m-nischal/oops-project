// src/components/home/Recommendations.jsx
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Search } from "lucide-react";

export default function Recommendations() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    
    setIsAuthenticated(true);
    
    try {
      // 1. Fetch Order History (B2C Orders)
      const ordersRes = await fetch("/api/orders?limit=10", {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (ordersRes.status === 401) {
        setIsAuthenticated(false); // Token invalid or expired
        setLoading(false);
        return;
      }
      
      const ordersData = await ordersRes.json();
      const orders = ordersData.items || [];
      
      if (orders.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // 2. Extract unique product IDs from recent orders (simulation of history/preference)
      const uniqueProductIds = new Set();
      orders.forEach(order => {
        order.items.forEach(item => uniqueProductIds.add(item.productId));
      });
      
      // 3. Fetch full product details for a maximum of 4 recommended items
      const productPromises = Array.from(uniqueProductIds).slice(0, 4).map(id => 
        fetch(`/api/products/${id}`).then(r => r.ok ? r.json() : null)
      );

      const productResults = await Promise.all(productPromises);
      
      const products = productResults
        .filter(r => r && r.product)
        .map(r => r.product);
      
      setRecommendations(products);

    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to load personalized recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (!isAuthenticated) {
    return (
      <section className="w-full py-16 border-b border-gray-100 bg-gray-50">
        <div className="max-w-[1440px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-center uppercase tracking-tighter mb-6">
            Personalized For You
          </h2>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Search className="w-8 h-8 text-gray-500" />
            <p className="text-gray-600 max-w-md">
              Log in to see product recommendations based on your previous orders and searches.
            </p>
            <Link href="/login">
                <Button className="rounded-full px-8 bg-black text-white hover:bg-gray-800">
                    Sign In Now
                </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-gray-300" /></div>;
  }
  
  if (error || recommendations.length === 0) {
      return null; // Don't show the section if no data or error
  }

  return (
    <section className="w-full py-16 border-b border-gray-100">
      <div className="max-w-[1440px] mx-auto px-6">
        
        {/* Section Heading */}
        <h2 className="text-3xl md:text-5xl font-black text-center uppercase tracking-tighter mb-10 md:mb-14">
          Based on Your History
        </h2>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {recommendations.map((product) => (
            <ProductCard key={product._id} product={product} label="RECOMMENDED" />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-10 text-center">
          <Link href="/products?sort=recommended">
            <Button variant="outline" className="rounded-full px-16 py-6 text-base border-gray-200 hover:bg-gray-50 transition-colors w-full md:w-auto">
              View All Recommendations
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}