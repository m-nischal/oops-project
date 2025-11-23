import React, { useEffect, useState } from 'react';
import RetailerLayout from '../../components/RetailerLayout';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    AlertTriangle, 
    Loader2, 
    ShoppingCart, 
    Check, 
    CheckCircle, 
    Package, 
    Search, 
    Filter,
    MapPin,
    CalendarClock,
    Truck,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useAuthGuard } from '../../hooks/useAuthGuard';

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;
const PRODUCTS_PER_PAGE = 12;
const CATEGORY_OPTIONS = ["Men", "Women", "Unisex", "Boys", "Girls"];

// --- Updated Delivery Estimate Helper ---
function getEstimatedDeliveryDate(distKm, leadTimeDays = 2) {
    if (distKm === Infinity || distKm === null || distKm === undefined) return null;
    
    // Logic: 
    // 1. Base Transit Time: 400km per day (approx truck speed)
    // 2. Plus Warehouse Lead Time (Packing/Processing)
    const travelDays = Math.ceil(distKm / 400); 
    const totalDays = travelDays + Number(leadTimeDays);
    
    const date = new Date();
    date.setDate(date.getDate() + totalDays);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

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
  
  // --- Data State ---
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  
  // --- Filters State ---
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // --- Location State ---
  const [retailerAddresses, setRetailerAddresses] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null); // { lat, lng }

  // --- Order Dialog State ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderSize, setOrderSize] = useState("");
  const [orderQty, setOrderQty] = useState(10);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [stockedProductIds, setStockedProductIds] = useState(new Set());

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  // 1. Fetch Profile & Init Location
  useEffect(() => {
      async function fetchProfile() {
          try {
             const token = localStorage.getItem("token");
             const res = await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` }});
             if (res.ok) {
                 const data = await res.json();
                 const addrs = data.user?.addresses || [];
                 setRetailerAddresses(addrs);
                 
                 // Default to first address
                 if (addrs.length > 0) {
                     setSelectedLocationId(addrs[0]._id);
                     if (addrs[0].location?.coordinates) {
                         setCurrentLocation({
                             lng: addrs[0].location.coordinates[0],
                             lat: addrs[0].location.coordinates[1]
                         });
                     }
                 }
             }
          } catch(e) { console.error("Profile load error", e); }
      }
      if (!isAuthLoading) fetchProfile();
  }, [isAuthLoading]);

  // Handle Location Selection
  const handleLocationChange = (id) => {
      setSelectedLocationId(id);
      const addr = retailerAddresses.find(a => a._id === id);
      if (addr && addr.location?.coordinates) {
          setCurrentLocation({
              lng: addr.location.coordinates[0],
              lat: addr.location.coordinates[1]
          });
      } else {
          setCurrentLocation(null);
      }
  };

  // 2. Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(searchQuery);
        setPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Fetch Products (With Server-Side Filters & Sort)
  useEffect(() => {
    if (isAuthLoading) return;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        const authHeaders = { 'Authorization': `Bearer ${token}` };

        // Determine sort key for API
        let apiSort = sortOption;

        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: PRODUCTS_PER_PAGE.toString(),
            sort: apiSort,
            ...(debouncedSearch && { q: debouncedSearch }),
            ...(selectedCategory !== "All" && { category: selectedCategory }),
            ...(minPrice && { minPrice }),
            ...(maxPrice && { maxPrice }),
            ...(currentLocation && { lat: currentLocation.lat, lng: currentLocation.lng })
        });

        const res = await fetch(
          `/api/retailer/wholesale-products?${queryParams.toString()}`, 
          { headers: authHeaders }
        );
        
        if (!res.ok) throw new Error('Failed to fetch products');
        
        const data = await res.json();
        
        // The backend now returns items with _distance already calculated if lat/lng were sent
        // We use that directly instead of re-calculating here to avoid mismatch.
        setProducts(data.items);
        setTotalProducts(data.total);
      } catch (err) {
        console.error(err);
        setError("Could not load products. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [page, debouncedSearch, sortOption, selectedCategory, minPrice, maxPrice, currentLocation, isAuthLoading]);


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenOrder = (product) => {
    setSelectedProduct(product);
    if (product.sizes && product.sizes.length > 0) {
      setOrderSize(product.sizes[0].size);
    }
    setOrderQty(product.minOrderQuantity || 1); 
  };

  const handlePlaceOrder = async () => {
    const minQty = selectedProduct.minOrderQuantity || 1;
    if (!selectedProduct || !orderSize) return;
    const quantity = Number(orderQty);
    if (isNaN(quantity) || quantity < minQty) {
        alert(`Minimum Order Quantity is ${minQty}.`);
        return;
    }

    setIsOrdering(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/retailer/place-wholesale-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: selectedProduct._id, size: orderSize, qty: quantity })
      });

      if (!res.ok) {
        if (res.status === 409) setStockedProductIds(prev => new Set(prev).add(selectedProduct._id));
        throw new Error("Failed to place order");
      }

      setStockedProductIds(prev => new Set(prev).add(selectedProduct._id));
      setSelectedProduct(null); 
      setShowSuccessModal(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  if (isAuthLoading) return <RetailerLayout>Loading...</RetailerLayout>;

  return (
    <RetailerLayout>
      <div className="max-w-[1400px] mx-auto">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Wholesale Market</h1>
                <p className="text-gray-500 mt-1">Browse and stock high-quality products.</p>
            </div>
            
            <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-gray-200 rounded-full pl-12 h-12 shadow-sm placeholder:text-gray-400" 
                    placeholder="Search by name, brand, category..." 
                />
            </div>
          </div>

          {/* CONTROLS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
             
             <div className="flex items-center gap-3 flex-wrap">
                 
                 {/* 1. FILTER DROPDOWN (Categories + Price) */}
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="rounded-full border-gray-300 gap-2">
                            <Filter className="w-4 h-4" /> 
                            {selectedCategory === "All" ? "Filters" : selectedCategory}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-4" align="start">
                        <DropdownMenuLabel>Category</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                            <DropdownMenuRadioItem value="All">All Categories</DropdownMenuRadioItem>
                            {CATEGORY_OPTIONS.map(cat => (
                                <DropdownMenuRadioItem key={cat} value={cat}>{cat}</DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>

                        <div className="my-3 border-t pt-3">
                            <DropdownMenuLabel className="px-0 mb-2">Price Range (₹)</DropdownMenuLabel>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Min" 
                                    type="number" 
                                    value={minPrice} 
                                    onChange={(e) => setMinPrice(e.target.value)} 
                                    className="h-8 text-xs"
                                />
                                <Input 
                                    placeholder="Max" 
                                    type="number" 
                                    value={maxPrice} 
                                    onChange={(e) => setMaxPrice(e.target.value)} 
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>
                    </DropdownMenuContent>
                 </DropdownMenu>

                 {/* 2. LOCATION SELECTOR */}
                 <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500 hidden sm:inline">Ship to:</span>
                    <Select value={selectedLocationId} onValueChange={handleLocationChange}>
                        <SelectTrigger className="h-8 w-[160px] border-none bg-transparent shadow-none focus:ring-0 p-0 text-xs font-bold truncate">
                            <SelectValue placeholder="Select Address" />
                        </SelectTrigger>
                        <SelectContent>
                            {retailerAddresses.length > 0 ? (
                                retailerAddresses.map(addr => (
                                    <SelectItem key={addr._id} value={addr._id}>
                                        {addr.label || "Address"} - {addr.city}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>No addresses found</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                 </div>
             </div>

             {/* 3. SORT DROPDOWN */}
             <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
                 <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-[180px] rounded-full h-10 border-gray-300">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest Arrivals</SelectItem>
                        <SelectItem value="price_low">Price: Low to High</SelectItem>
                        <SelectItem value="price_high">Price: High to Low</SelectItem>
                        <SelectItem value="distance">
                            Distance: Nearest First
                        </SelectItem>
                    </SelectContent>
                 </Select>
             </div>
          </div>

          {/* PRODUCT GRID */}
          {loading && (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-gray-300" />
            </div>
          )}
          
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {products.map(product => {
                const isStocking = (selectedProduct && selectedProduct._id === product._id && isOrdering);
                const isStocked = stockedProductIds.has(product._id);
                const stockCount = totalStockFrom(product);
                const distKm = product._distance;
                
                // Calculate dynamic delivery date based on distance AND lead time
                const leadTime = product.warehouses?.[0]?.leadTimeDays || 2;
                const estimatedDate = getEstimatedDeliveryDate(distKm, leadTime);
                
                return (
                  <div key={product._id} className="group cursor-pointer" onClick={() => handleOpenOrder(product)}>
                    <Card className="border-none shadow-none bg-transparent">
                      <CardContent className="p-0">
                        <div className="bg-[#F0EEED] rounded-[20px] aspect-square mb-4 overflow-hidden relative group-hover:scale-[1.02] transition-transform duration-300">
                          <img
                            src={product.images && product.images[0] ? product.images[0] : "/images/placeholder.png"}
                            alt={product.name}
                            className="w-full h-full object-cover object-center mix-blend-multiply"
                          />
                          
                          <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                             {product.minOrderQuantity > 1 && (
                                <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                    MOQ: {product.minOrderQuantity}
                                </span>
                             )}
                          </div>
                          
                          {/* Delivery Estimate Badge */}
                          {estimatedDate && (
                             <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-sm flex items-center gap-2">
                                 <div className="bg-blue-50 p-1.5 rounded-full">
                                     <Truck className="w-3 h-3 text-blue-600" />
                                 </div>
                                 <div className="flex flex-col leading-none">
                                     <span className="text-[10px] text-gray-500 font-medium">Estimated Delivery</span>
                                     <span className="text-xs font-bold text-gray-900">{estimatedDate}</span>
                                 </div>
                             </div>
                          )}
                        </div>

                        <div className="space-y-1 px-1">
                           <h3 className="font-bold text-lg truncate leading-tight text-black group-hover:text-gray-600 transition-colors">
                             {product.name}
                           </h3>
                           
                           <div className="flex items-center justify-between mt-2">
                              <div className="flex flex-col">
                                 <span className="font-bold text-xl">{formatPrice(product.price)}</span>
                                 <span className="text-xs text-gray-400">Wholesale Price</span>
                              </div>
                              
                              <Button
                                disabled={isStocking || isStocked}
                                size="icon"
                                className={`rounded-full w-10 h-10 shadow-sm transition-all ${isStocked ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-black text-white hover:scale-110'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenOrder(product);
                                }}
                              >
                                {isStocking ? <Loader2 className="h-4 w-4 animate-spin" /> : isStocked ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-4 w-4" />}
                              </Button>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
          
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-32 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
              <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-xl font-bold text-gray-900">No products match your filters.</p>
              <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setMinPrice(""); setMaxPrice(""); }} className="mt-2 text-blue-600">Clear Filters</Button>
            </div>
          )}

          {/* --- Order Dialog & Success Modal (Same as before) --- */}
          <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Stock Product</DialogTitle></DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl items-center border border-gray-100">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-gray-200 shrink-0">
                        <img src={selectedProduct?.images?.[0]} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                        <p className="font-bold text-sm line-clamp-1">{selectedProduct?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatPrice(selectedProduct?.price)} / unit</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Size Variant</Label>
                    <Select value={orderSize} onValueChange={setOrderSize}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select size" /></SelectTrigger>
                        <SelectContent>{selectedProduct?.sizes?.map(s => (<SelectItem key={s.size} value={s.size}>{s.size} <span className="text-gray-400">({s.stock})</span></SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={orderQty} onChange={e => setOrderQty(e.target.value)} min={selectedProduct?.minOrderQuantity || 1} className="h-11 rounded-xl" /></div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="font-medium text-gray-500">Total Cost</span>
                  <span className="font-black text-3xl">{formatPrice((selectedProduct?.price || 0) * orderQty)}</span>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button><Button onClick={handlePlaceOrder} disabled={isOrdering} className="bg-black text-white">{isOrdering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Pay"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {showSuccessModal && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
              <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-green-600" /></div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Stock Added!</h2>
                <p className="text-gray-500 mb-8 text-sm">Order successfully placed.</p>
                <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 rounded-xl bg-black text-white font-bold text-lg shadow-xl">Continue Shopping</button>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination className="mt-16">
              <PaginationContent>
                <PaginationItem>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="rounded-full w-9 h-9"
                     onClick={() => handlePageChange(1)}
                     disabled={page === 1}
                     title="First Page"
                   >
                      <ChevronsLeft className="h-4 w-4" />
                   </Button>
                </PaginationItem>

                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                    className={page === 1 ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-gray-100 rounded-full"}
                  />
                </PaginationItem>
                
                <PaginationItem>
                  <PaginationLink href="#" isActive className="rounded-full bg-black text-white">
                    {page}
                  </PaginationLink>
                </PaginationItem>
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}
                    className={page >= totalPages ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-gray-100 rounded-full"}
                  />
                </PaginationItem>

                <PaginationItem>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="rounded-full w-9 h-9"
                     onClick={() => handlePageChange(totalPages)}
                     disabled={page >= totalPages}
                     title="Last Page"
                   >
                      <ChevronsRight className="h-4 w-4" />
                   </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
      </div>
    </RetailerLayout>
  );
}