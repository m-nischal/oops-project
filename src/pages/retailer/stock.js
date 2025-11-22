// src/pages/retailer/stock.js
import React, { useEffect, useState } from 'react';
import RetailerLayout from '../../components/RetailerLayout';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, ShoppingCart, Check, CheckCircle } from "lucide-react";
import { useAuthGuard } from '../../hooks/useAuthGuard';

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;
const PRODUCTS_PER_PAGE = 12;

function totalStockFrom(product = {}) {
  if (Array.isArray(product.sizes)) {
    return product.sizes.reduce((acc, it) => acc + (Number(it.stock || 0)), 0);
  }
  return product.totalStock || 0;
}

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
  const [showSuccessModal, setShowSuccessModal] = useState(false); // <--- NEW STATE
  
  // Track stocked items
  const [stockedProductIds, setStockedProductIds] = useState(new Set());

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  const fetchWholesaleProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found. Please log in again.");

      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const res = await fetch(
        `/api/retailer/wholesale-products?page=${page}&limit=${PRODUCTS_PER_PAGE}`, 
        { headers: authHeaders }
      );
      
      if (!res.ok) {
         const errData = await res.json();
         throw new Error(errData.error || 'Failed to fetch products');
      }
      const data = await res.json();
      setProducts(data.items);
      setTotalProducts(data.total);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) fetchWholesaleProducts();
  }, [page, isAuthLoading]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // --- Set default Qty to MOQ when opening dialog ---
  const handleOpenOrder = (product) => {
    setSelectedProduct(product);
    if (product.sizes && product.sizes.length > 0) {
      setOrderSize(product.sizes[0].size);
    }
    // Default to MOQ
    setOrderQty(product.minOrderQuantity || 1); 
  };

  const handlePlaceOrder = async () => {
    // --- Validate MOQ ---
    const minQty = selectedProduct.minOrderQuantity || 1;
    
    if (!selectedProduct || !orderSize) return;
    
    // STRICT CHECK: Ensure quantity is a number and meets the minimum
    const quantity = Number(orderQty);
    if (isNaN(quantity) || quantity < minQty) {
        alert(`This product has a Minimum Order Quantity of ${minQty}. Please increase your order.`);
        return; // STOP EXECUTION HERE
    }

    setIsOrdering(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      const res = await fetch('/api/retailer/place-wholesale-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProduct._id,
          size: orderSize,
          qty: quantity // Send the validated number
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 409) { 
          setStockedProductIds(prev => new Set(prev).add(selectedProduct._id));
        }
        throw new Error(errData.error || "Failed to place order");
      }

      setStockedProductIds(prev => new Set(prev).add(selectedProduct._id));
      setSelectedProduct(null); 
      
      // --- Show Success Modal instead of Alert ---
      setShowSuccessModal(true);

    } catch (err) {
      console.error(err);
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
        <p className="text-muted-foreground">
          Browse products from all wholesalers and add them to your store.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* --- Products Grid --- */}
      {!loading && !error && products.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(product => {
            const isStocking = (selectedProduct && selectedProduct._id === product._id && isOrdering);
            const isStocked = stockedProductIds.has(product._id);
            
            return (
              <Card key={product._id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>
                     {formatPrice(product.price)} / unit 
                     {product.minOrderQuantity > 1 && <span className="block text-xs font-semibold text-blue-600 mt-1">MOQ: {product.minOrderQuantity} units</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[150px] w-full rounded-md bg-gray-100 flex items-center justify-center mb-4">
                    <img
                      src={product.images && product.images[0] ? product.images[0] : "/images/placeholder.png"}
                      alt={product.name}
                      className="h-full w-full object-cover rounded-md"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description || "No description."}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-black">{totalStockFrom(product)}</span>
                    <span className="ml-1">avail</span>
                  </div>
                  <Button
                    onClick={() => handleOpenOrder(product)}
                    disabled={isStocking || isStocked}
                  >
                    {isStocking ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isStocked ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    {isStocking ? "Ordering..." : (isStocked ? "Ordered" : "Place Order")}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {!loading && !error && products.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No products found from any wholesalers.
            </p>
          </CardContent>
        </Card>
      )}

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
            
            {/* Quantity Input with Min Constraint */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Quantity</Label>
              <div className="col-span-3">
                  <Input 
                    type="number" 
                    value={orderQty} 
                    onChange={e => setOrderQty(e.target.value)} 
                    min={selectedProduct?.minOrderQuantity || 1} 
                  />
                  {selectedProduct?.minOrderQuantity > 1 && (
                      <p className="text-xs text-red-500 mt-1">
                        Minimum required: {selectedProduct.minOrderQuantity} units
                      </p>
                  )}
              </div>
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

      {/* --- SUCCESS MODAL --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
              Order Placed!
            </h2>
            <p className="text-gray-500 mb-8">
              Your bulk order has been successfully placed with the wholesaler.
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-4 rounded-xl bg-black text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                className={page === 1 ? "opacity-50 pointer-events-none" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}
                className={page >= totalPages ? "opacity-50 pointer-events-none" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </RetailerLayout>
  );
}