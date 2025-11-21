import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNewArrivals() {
      try {
        // Fetch sorted by createdAt descending (newest first)
        const res = await fetch('/api/products?sort=createdAt:desc&limit=4'); 
        const data = await res.json();
        const items = data.items || [];
        setProducts(items);
      } catch (error) {
        console.error("Failed to fetch new arrivals", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNewArrivals();
  }, []);

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-gray-300" /></div>;
  }

  if (products.length === 0) return null;

  return (
    <section className="w-full py-16 border-b border-gray-100">
      <div className="max-w-[1440px] mx-auto px-6">
        
        {/* Section Heading */}
        <h2 className="text-3xl md:text-5xl font-black text-center uppercase tracking-tighter mb-10 md:mb-14">
          New Arrivals
        </h2>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-10 text-center">
          <Link href="/products?sort=newest">
            <Button variant="outline" className="rounded-full px-16 py-6 text-base border-gray-200 hover:bg-gray-50 transition-colors w-full md:w-auto">
              View All
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}