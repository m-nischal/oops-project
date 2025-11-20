// src/pages/retailer/products/add.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import RetailerLayout from '../../../components/RetailerLayout';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Edit } from "lucide-react";

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

export default function InventoryListPage() {
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
        const res = await fetch(`/api/retailer/products?status=draft&limit=50`, { // Fetch ONLY drafts
          headers: { 'Authorization': `Bearer ${token}` },
          cache: "no-store",
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
        <h1 className="text-3xl font-bold">Unpublished Inventory</h1>
        <p className="text-muted-foreground">
          These items are in your warehouse but not yet visible in your shop. 
          Edit and Publish them to start selling.
        </p>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4"/><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      {!loading && !error && products.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No unpublished items found. Go to "Stock from Wholesaler" to buy more stock.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
        {products.map(product => (
          <Card key={product._id} className="opacity-75 hover:opacity-100 transition-opacity">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg truncate">{product.name}</CardTitle>
              <CardDescription>Stock: {product.totalStock}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                 <img src={product.images?.[0] || "/images/placeholder.png"} alt={product.name} className="h-full object-contain" />
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/retailer/products/${product._id}/edit`} passHref className="w-full">
                <Button className="w-full" variant="secondary">
                  <Edit className="mr-2 h-4 w-4" /> Setup & Publish
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </RetailerLayout>
  );
}