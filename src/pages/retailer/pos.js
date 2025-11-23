import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import RetailerLayout from '@/components/RetailerLayout';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
    Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, User, Loader2, CheckCircle, ScanBarcode 
} from "lucide-react";

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

export default function RetailerPOS() {
  const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");
  const router = useRouter();

  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Filters
  const [activeCategory, setActiveCategory] = useState("All");

  // Customer Info (Optional)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Success Modal
  const [lastOrder, setLastOrder] = useState(null);

  // --- FETCH PRODUCTS ---
  useEffect(() => {
    if (isAuthLoading) return;
    
    async function loadInventory() {
        try {
            const token = localStorage.getItem("token");
            // Fetch ALL published products (limit high for POS)
            const res = await fetch(`/api/retailer/products?status=published&limit=200`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data.items || []);
            }
        } catch (e) {
            console.error("Inventory load failed", e);
        } finally {
            setLoading(false);
        }
    }
    loadInventory();
  }, [isAuthLoading]);

  // --- FILTERING ---
  const filteredProducts = useMemo(() => {
      let filtered = products;
      
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
      }
      
      if (activeCategory !== "All") {
          filtered = filtered.filter(p => p.category === activeCategory || p.tags?.includes(activeCategory));
      }
      
      return filtered;
  }, [products, searchQuery, activeCategory]);

  // --- CART ACTIONS ---
  const addToCart = (product, size) => {
      setCart(prev => {
          const existingIdx = prev.findIndex(item => item._id === product._id && item.size === size.size);
          if (existingIdx > -1) {
              // Increment existing
              const newCart = [...prev];
              const currentQty = newCart[existingIdx].qty;
              // Check stock
              if (currentQty < size.stock) {
                  newCart[existingIdx].qty += 1;
              } else {
                  alert("Max stock reached for this size.");
              }
              return newCart;
          } else {
              // Add new
              return [...prev, {
                  _id: product._id,
                  name: product.name,
                  price: product.price,
                  size: size.size,
                  maxStock: size.stock,
                  qty: 1,
                  image: product.images?.[0]
              }];
          }
      });
  };

  const updateQty = (index, delta) => {
      setCart(prev => {
          const newCart = [...prev];
          const item = newCart[index];
          const newQty = item.qty + delta;
          
          if (newQty <= 0) {
              // Remove if 0
              return prev.filter((_, i) => i !== index);
          }
          
          if (newQty > item.maxStock) {
              // Cap at max
              return prev;
          }
          
          item.qty = newQty;
          return newCart;
      });
  };

  const removeFromCart = (index) => {
      setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
  };

  // --- CHECKOUT ---
  const handleCheckout = async (paymentMethod) => {
      if (cart.length === 0) return;
      setProcessing(true);

      try {
          const token = localStorage.getItem("token");
          const itemsPayload = cart.map(item => ({
              productId: item._id,
              sizeLabel: item.size,
              qty: item.qty
          }));

          const res = await fetch('/api/retailer/pos/checkout', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({
                  items: itemsPayload,
                  customer: {
                      name: customerName || "Walk-in Customer",
                      phone: customerPhone
                  },
                  paymentMethod
              })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Sale failed");

          setLastOrder({ id: data.orderId, total: data.total, change: 0 }); // Change calc can be added later
          clearCart();

      } catch (e) {
          alert(e.message);
      } finally {
          setProcessing(false);
      }
  };

  // Calculations
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);


  if (isAuthLoading) return <RetailerLayout>Loading...</RetailerLayout>;

  return (
    <RetailerLayout>
      <div className="h-[calc(100vh-100px)] flex gap-6">
          
          {/* LEFT: CATALOG */}
          <div className="flex-1 flex flex-col gap-4">
              {/* Search Bar */}
              <div className="flex gap-4">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input 
                          className="pl-10 h-12 rounded-xl bg-white border-none shadow-sm text-lg" 
                          placeholder="Search products or scan barcode..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                      />
                  </div>
                  <Button variant="outline" className="h-12 w-12 rounded-xl p-0">
                      <ScanBarcode className="h-6 w-6 text-gray-600" />
                  </Button>
              </div>

              {/* Categories (Optional Tabs) */}
              {/* Could map unique categories from products here */}

              {/* Product Grid */}
              <ScrollArea className="flex-1 pr-4">
                  {loading ? (
                      <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
                  ) : (
                      <div className="grid grid-cols-3 gap-4">
                          {filteredProducts.map(product => (
                              <Card key={product._id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                                  <div className="aspect-square bg-gray-100 relative">
                                      <img src={product.images?.[0] || "/images/placeholder.png"} className="w-full h-full object-cover mix-blend-multiply" alt={product.name} />
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                          <p className="text-white font-bold">{formatPrice(product.price)}</p>
                                      </div>
                                  </div>
                                  <div className="p-3">
                                      <h3 className="font-semibold text-sm line-clamp-1 mb-2">{product.name}</h3>
                                      <div className="flex flex-wrap gap-1">
                                          {product.sizes?.map(s => (
                                              <Button 
                                                key={s.size} 
                                                size="sm" 
                                                variant="secondary" 
                                                className={`h-7 px-2 text-xs ${s.stock <= 0 ? 'opacity-50' : ''}`}
                                                disabled={s.stock <= 0}
                                                onClick={() => addToCart(product, s)}
                                              >
                                                  {s.size}
                                              </Button>
                                          ))}
                                      </div>
                                  </div>
                              </Card>
                          ))}
                      </div>
                  )}
              </ScrollArea>
          </div>

          {/* RIGHT: CART & CHECKOUT */}
          <div className="w-[400px] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* Customer Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium uppercase tracking-wide">
                      <User className="w-4 h-4" /> Customer Info (Optional)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <Input 
                          placeholder="Name" 
                          className="bg-white h-9 text-sm" 
                          value={customerName} 
                          onChange={e => setCustomerName(e.target.value)}
                      />
                      <Input 
                          placeholder="Phone" 
                          className="bg-white h-9 text-sm" 
                          value={customerPhone} 
                          onChange={e => setCustomerPhone(e.target.value)}
                      />
                  </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                          <p>Cart is empty</p>
                      </div>
                  ) : (
                      cart.map((item, idx) => (
                          <div key={`${item._id}-${item.size}`} className="flex gap-3 items-center bg-gray-50 p-3 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                              <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                  <img src={item.image} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate">{item.name}</p>
                                  <p className="text-xs text-gray-500">Size: {item.size} | {formatPrice(item.price)}</p>
                              </div>
                              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-1 py-0.5">
                                  <button onClick={() => updateQty(idx, -1)} className="p-1 hover:bg-gray-100 rounded"><Minus className="w-3 h-3" /></button>
                                  <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                                  <button onClick={() => updateQty(idx, 1)} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-3 h-3" /></button>
                              </div>
                          </div>
                      ))
                  )}
              </div>

              {/* Footer: Totals & Pay */}
              <div className="p-6 bg-gray-900 text-white">
                  <div className="flex justify-between items-center mb-6">
                      <span className="text-gray-400">Total Amount</span>
                      <span className="text-3xl font-bold">{formatPrice(totalAmount)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => handleCheckout('Cash')} 
                        disabled={cart.length === 0 || processing}
                        className="bg-green-600 hover:bg-green-700 text-white h-12 font-bold text-base"
                      >
                          <Banknote className="mr-2 h-5 w-5" /> Cash
                      </Button>
                      <Button 
                        onClick={() => handleCheckout('Card/UPI')} 
                        disabled={cart.length === 0 || processing}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-12 font-bold text-base"
                      >
                          <CreditCard className="mr-2 h-5 w-5" /> Card/UPI
                      </Button>
                  </div>
                  
                  <div className="mt-4 text-center">
                     <button onClick={clearCart} className="text-xs text-gray-500 hover:text-gray-300 underline">Clear Cart</button>
                  </div>
              </div>
          </div>
      </div>

      {/* SUCCESS MODAL */}
      <Dialog open={!!lastOrder} onOpenChange={(open) => !open && setLastOrder(null)}>
          <DialogContent className="sm:max-w-sm text-center">
              <DialogHeader>
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <DialogTitle className="text-center text-xl">Sale Recorded!</DialogTitle>
              </DialogHeader>
              
              <div className="py-4 space-y-2">
                  <p className="text-gray-500">Total Amount Collected</p>
                  <p className="text-4xl font-black text-gray-900">{formatPrice(lastOrder?.total)}</p>
                  <p className="text-sm text-gray-400 pt-2">Order #{lastOrder?.id?.slice(-6)}</p>
              </div>

              <DialogFooter className="sm:justify-center">
                  <Button onClick={() => setLastOrder(null)} className="w-full h-12 text-lg">
                      Start New Sale
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </RetailerLayout>
  );
}
