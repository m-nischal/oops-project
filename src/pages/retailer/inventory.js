// src/pages/retailer/inventory.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import RetailerLayout from '../../components/RetailerLayout';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Edit, Archive, CheckCircle } from "lucide-react";

export default function InventoryPage() {
  const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthLoading) return;

    async function fetchInventory() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const authHeaders = { 'Authorization': `Bearer ${token}` };

        // --- CHANGE: Removed 'status=draft' to fetch ALL products ---
        const res = await fetch(`/api/retailer/products?limit=100`, {
          headers: authHeaders,
          cache: 'no-store'
        });
        
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        setProducts(data.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, [isAuthLoading]);

  if (isAuthLoading) return <RetailerLayout>Loading...</RetailerLayout>;

  return (
    <RetailerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Master Inventory</h1>
        <p className="text-muted-foreground">
          View and manage all items in your warehouse, both published and unpublished.
        </p>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4"/><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      {!loading && !error && products.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Archive className="h-10 w-10 mx-auto mb-4 opacity-20" />
            <p>Your inventory is empty.</p>
            <p className="text-sm mt-2">Go to "Stock from Wholesaler" to buy products.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
        {products.map(product => (
          <Card key={product._id} className={`border-2 ${product.isPublished ? 'border-green-100 bg-white' : 'border-dashed bg-gray-50/50'}`}>
            <CardHeader className="pb-2 relative">
              {/* --- Status Badge --- */}
              <div className="absolute top-4 right-4">
                {product.isPublished ? (
                  <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Live</Badge>
                ) : (
                  <Badge variant="secondary" className="text-gray-500">Draft</Badge>
                )}
              </div>
              
              <CardTitle className="text-lg truncate pr-16">{product.name}</CardTitle>
              <CardDescription>Total Stock: {product.totalStock || 0}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                 <img 
                   src={product.images?.[0] || "/images/placeholder.png"} 
                   alt={product.name} 
                   className={`h-full w-full object-contain ${product.isPublished ? '' : 'opacity-75'}`} 
                 />
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/retailer/products/${product._id}/edit`} passHref className="w-full">
                <Button className="w-full" variant={product.isPublished ? "outline" : "secondary"}>
                  <Edit className="mr-2 h-4 w-4" /> {product.isPublished ? "Edit Details" : "Setup & Publish"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </RetailerLayout>
  );
}