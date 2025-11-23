// src/components/home/Recommendations.jsx
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Search } from "lucide-react";

// Helper to filter out purchased product IDs from results
function filterPurchased(products, purchasedIds) {
  const purchasedSet = new Set(purchasedIds.map(String));
  return products.filter(p => !purchasedSet.has(String(p._id)));
}

// Function to find common tags and prioritize the search
async function getRecommendedProductsByTags(token, purchasedTags, purchasedProductIds, maxResults = 4) {
    if (purchasedTags.length === 0) return [];
    
    // 1. Count tag frequency
    const tagCounts = purchasedTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});
    
    // 2. Sort tags by frequency (most frequent first)
    const sortedTags = Object.entries(tagCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([tag]) => tag);
    
    // 3. Construct query filter to search for products matching ANY of the top 5 tags
    const topTags = sortedTags.slice(0, 5).join(',');

    try {
        // We use the 'similar' API endpoint to query by multiple tags
        const res = await fetch(`/api/products/similar?tags=${topTags}&limit=20`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        // --- FIX: Improved Error Handling to read server response ---
        if (!res.ok) {
            const errorText = await res.text();
            let errorMessage = `Failed to fetch similar products (HTTP ${res.status}).`;
            try {
                 // Try to parse the error message as JSON
                 const errorJson = JSON.parse(errorText);
                 errorMessage = errorJson.error || errorJson.message || errorMessage;
            } catch (e) {
                 // Fallback to plain text if not JSON
                 errorMessage = `Failed to fetch similar products (HTTP ${res.status}). Server returned: ${errorText.substring(0, 100)}`;
            }
            throw new Error(errorMessage);
        }
        // -----------------------------------------------------------
        
        const data = await res.json();
        
        const products = data.items || [];

        // 4. Filter out items the user has already purchased
        let filtered = filterPurchased(products, purchasedProductIds);

        // 5. Secondary sort by highest tag match count (in-memory)
        filtered.forEach(p => {
            p.tagMatchCount = p.tags ? p.tags.filter(tag => sortedTags.includes(tag)).length : 0;
        });
        filtered.sort((a, b) => b.tagMatchCount - a.tagMatchCount);

        return filtered.slice(0, maxResults);

    } catch (e) {
        console.error("Error fetching tag-based recommendations:", e);
        throw e;
    }
}


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
      // 1. Fetch ALL Orders (user's purchases)
      const ordersRes = await fetch("/api/orders?limit=100", { // Increased limit to gather more history
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (ordersRes.status === 401) {
        setIsAuthenticated(false);
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

      // 2. Extract unique product IDs and all tags from purchased items
      const purchasedProductIds = [];
      const purchasedTags = [];
      orders.forEach(order => {
        order.items.forEach(item => {
            purchasedProductIds.push(item.productId);
        });
      });
      
      // 3. Fetch tags for all unique purchased products
      const uniquePurchasedIds = [...new Set(purchasedProductIds)];
      
      const tagPromises = uniquePurchasedIds.map(id => 
          fetch(`/api/products/${id}`).then(r => r.ok ? r.json() : null)
      );
      
      const tagResults = await Promise.all(tagPromises);
      
      tagResults.forEach(r => {
          if (r && r.product && Array.isArray(r.product.tags)) {
              r.product.tags.forEach(tag => purchasedTags.push(tag));
          }
      });

      // 4. Find new products based on the aggregated tags
      const recommendationsList = await getRecommendedProductsByTags(
          token, 
          purchasedTags, 
          uniquePurchasedIds, 
          4
      );
      
      setRecommendations(recommendationsList);

    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      // Use the error message from the inner function call
      setError(err.message); 
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