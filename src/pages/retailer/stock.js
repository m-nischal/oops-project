// src/pages/retailer/stock.js
import React, { useEffect, useState } from 'react';
import RetailerLayout from '../../components/RetailerLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, ShoppingCart } from "lucide-react";
import { useAuthGuard } from '../../hooks/useAuthGuard';

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;
const PRODUCTS_PER_PAGE = 12;

export default function StockFromWholesalerPage() {
  const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Order Dialog State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderSize, setOrderSize] = useState("");
  const [orderQty, setOrderQty] = useState(10);
  const [isOrdering, setIsOrdering] = useState(false);

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  const fetchWholesaleProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");
      
      const res = await fetch(`/api/retailer/wholesale-products?page=${page}&limit=${PRODUCTS_PER_PAGE}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.items);
      setTotalProducts(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) fetchWholesaleProducts();
  }, [page, isAuthLoading]);

  const handleOpenOrder = (product) => {
    setSelectedProduct(product);
    // Default to first available size
    if (product.sizes && product.sizes.length > 0) {
      setOrderSize(product.sizes[0].size);
    }
    setOrderQty(10); // Default quantity
  };

  const handlePlaceOrder = async () => {
    if (!selectedProduct || !orderSize || orderQty <= 0) return;
    setIsOrdering(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/retailer/place-wholesale-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProduct._id,
          size: orderSize,
          qty: orderQty
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to place order");
      }

      alert("Order placed successfully! Check your Order List.");
      setSelectedProduct(null); // Close dialog

    } catch (err) {
      alert(err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  if (isAuthLoading) return <RetailerLayout>Loading...</RetailerLayout>;

  return (
    <RetailerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Wholesale Market</h1>
        <p className="text-muted-foreground">Purchase stock from wholesalers. Items will appear in your inventory after delivery.</p>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4"/><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
        {!loading && products.map(product => (
          <Card key={product._id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg truncate">{product.name}</CardTitle>
              <CardDescription>{formatPrice(product.price)} / unit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                 <img src={product.images?.[0] || "/placeholder.png"} alt={product.name} className="h-full object-contain" />
              </div>
              <div className="text-sm text-gray-500 truncate">{product.description}</div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleOpenOrder(product)}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Place Order
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* --- Order Dialog --- */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order from {selectedProduct?.name}</DialogTitle>
            <DialogDescription>Choose size and quantity to order from Wholesaler.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Size</Label>
              <Select value={orderSize} onValueChange={setOrderSize}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct?.sizes?.map(s => (
                    <SelectItem key={s.size} value={s.size}>{s.size} (Avail: {s.stock})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Quantity</Label>
              <Input type="number" value={orderQty} onChange={e => setOrderQty(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Total</Label>
              <div className="col-span-3 font-bold">
                {formatPrice((selectedProduct?.price || 0) * orderQty)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
            <Button onClick={handlePlaceOrder} disabled={isOrdering}>
              {isOrdering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination (standard) */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem><PaginationPrevious onClick={() => page > 1 && setPage(page - 1)} /></PaginationItem>
            <PaginationItem><PaginationLink>{page}</PaginationLink></PaginationItem>
            <PaginationItem><PaginationNext onClick={() => page < totalPages && setPage(page + 1)} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </RetailerLayout>
  );
}