// src/pages/cart.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import CustomerNavbar from "@/components/CustomerNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, ShoppingCart, Package, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/router"; // Import useRouter

// <--- NEW IMPORTS: Required for the modal functionality --->
import CustomerAddressModal from "@/components/CustomerAddressModal";
import ManualLocationModal from "@/components/ManualLocationModal";
// <------------------------------------------------------->

// --- HELPERS ---
const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;
const formatDate = (dateString) => {
// ... (rest of formatDate, loadCart, saveCart, getStockForSize unchanged) ...
  if (!dateString) return 'N/A';
  // Use toLocaleDateString for a nice format, e.g., "Nov 22, 2025"
  return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

function loadCart() {
  try { return JSON.parse(localStorage.getItem("livemart_cart") || "[]"); } catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem("livemart_cart", JSON.stringify(cart)); }

// Get the actual available stock for a specific size from a product document
function getStockForSize(product, sizeLabel) {
  if (!product || !Array.isArray(product.sizes)) return 0;
  const sizeObj = product.sizes.find(s => String(s.size) === String(sizeLabel));
  return Number(sizeObj?.stock || 0);
}


// --- MAIN COMPONENT ---

export default function CartPage() {
  const router = useRouter(); // Initialize router
  const [cart, setCart] = useState([]);
  const [productDetails, setProductDetails] = useState({}); // Map of productId -> product data
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState(null);
  const [deliveryData, setDeliveryData] = useState(null); // { totalDeliveryFee, estimatedDeliveryDate, detailedItems }
  
  // Detailed Bill Modal
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  // --- LOCATION STATE ---
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Select Location");
  
  // <--- NEW MODAL & USER STATES --->
  const [user, setUser] = useState(null); // To determine which modal to open
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false); // For logged-in users
  const [showManualModal, setShowManualModal] = useState(false); // For guests/temporary location
  // <-------------------------------->

  // --- Derived Calculations (useMemo) ---
// ... (itemsWithDetails, totalSubtotalBeforeDiscount, etc. unchanged) ...
  const itemsWithDetails = useMemo(() => {
    return cart.map(item => {
      const product = productDetails[item.productId];
      const delivery = deliveryData?.detailedItems.find(d => 
        String(d.productId) === String(item.productId) && 
        String(d.sizeLabel) === String(item.size)
      );

      const price = Number(product?.price || item.price || 0);
      const discountPercent = Number(product?.discount || 0);
      
      // Calculate original price for display (if discounted)
      const originalPriceBeforeDiscount = Math.round(price / (1 - discountPercent / 100));

      const discountedPrice = price; // The stored price is the discounted price
      const unitDiscount = originalPriceBeforeDiscount - discountedPrice;
      
      const totalDiscount = unitDiscount * item.qty;
      const subtotalBeforeDiscount = originalPriceBeforeDiscount * item.qty;
      const subtotalAfterDiscount = discountedPrice * item.qty;
      
      const estimatedDeliveryDays = delivery?.estimatedDays || null;
      const estimatedDeliveryDate = estimatedDeliveryDays 
        ? formatDate(new Date(Date.now() + estimatedDeliveryDays * 24 * 60 * 60 * 1000)) 
        : 'N/A';
      
      const stock = product ? getStockForSize(product, item.size) : 0;
      
      return {
        ...item,
        product,
        originalPriceBeforeDiscount, // Undiscounted price per unit
        discountedPrice,             // Discounted price per unit
        totalDiscount,
        subtotalBeforeDiscount,
        subtotalAfterDiscount,
        estimatedDeliveryDate,
        deliveryFee: delivery?.deliveryFee || 0,
        distanceKm: delivery?.distanceKm || null,
        isAvailable: stock >= item.qty,
        availableStock: stock
      };
    });
  }, [cart, productDetails, deliveryData]);
  
  const totalSubtotalBeforeDiscount = itemsWithDetails.reduce((s, item) => s + item.subtotalBeforeDiscount, 0);
  const totalDiscountAmount = itemsWithDetails.reduce((s, item) => s + item.totalDiscount, 0);
  const totalFee = deliveryData?.totalDeliveryFee || 0;
  const grandTotal = (totalSubtotalBeforeDiscount - totalDiscountAmount) + totalFee;
  const maxDeliveryDate = deliveryData?.estimatedDeliveryDate ? formatDate(deliveryData.estimatedDeliveryDate) : 'N/A';
  
  const isCartValidForCheckout = itemsWithDetails.length > 0 && 
                                 !loading && 
                                 !cartError && 
                                 customerLocation &&
                                 itemsWithDetails.every(item => item.isAvailable);


  // Helper: Update Local Storage & Trigger Refetch/Reload
  const setActiveLocationAndReload = useCallback((addressObj) => {
    if (!addressObj || !addressObj.location?.coordinates) return;

    // 1. Extract and save to persistent storage
    const locData = {
      city: addressObj.city,
      pincode: addressObj.pincode,
      addressLine1: addressObj.addressLine1,
      lat: addressObj.location.coordinates[1],
      lng: addressObj.location.coordinates[0],
    };
    localStorage.setItem("livemart_active_location", JSON.stringify(locData));

    // 2. Notify and Reload
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("livemart-location-update"));
      // Force reload to refresh data on the cart page and clear modal context
      window.location.reload(); 
    }
  }, []);


  // <--- NEW HANDLERS: Match Navbar functionality --->
  const handleDeliverToClick = () => {
    // If user is logged in, use the address management modal
    if (user) {
      setIsAddressModalOpen(true);
    } else {
      // If guest, use the manual location modal
      setShowManualModal(true);
    }
  };

  const handleAddressSelect = (address) => {
    setIsAddressModalOpen(false);
    // FIX: Explicitly call location set and reload.
    setActiveLocationAndReload(address);
  };

  const handleAddressAdded = (updatedUser) => {
    setUser(updatedUser);
    // The CustomerAddressModal typically sets the newly added address as the active one.
    const newlyAddedAddress = updatedUser.addresses[updatedUser.addresses.length - 1];
    if (newlyAddedAddress) {
        // FIX: Set new address as active and reload
        setActiveLocationAndReload(newlyAddedAddress);
    }
    setIsAddressModalOpen(false); // Close the modal
  };
  
  const handleManualLocationSet = (locData) => {
    setShowManualModal(false);
    // The ManualLocationModal saves to localStorage and triggers window.location.reload(),
    // so just closing the modal is often enough, but keeping onLocationSet for completeness.
  };
  // <---------------------------------------------->

  // --- DATA FETCHING & LOGIC ---
// ... (updateCartCount, fetchProductDetails, fetchDeliveryFee unchanged) ...
  const updateCartCount = () => {
    const cartItems = loadCart();
    setCart(cartItems);
    
    // --- REDIRECT LOGIC REMOVED/SUPPRESSED ---
    
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('livemart-cart-update'));
  };

  const fetchProductDetails = useCallback(async (cartItems) => {
    if (cartItems.length === 0) {
      setProductDetails({});
      return;
    }
    
    // Fetch a general list of products to extract stock and discount info
    try {
      setLoading(true);
      const allRes = await fetch(`/api/products?limit=50`); 
      const allData = await allRes.json();
      const allProducts = allData.items || [];
      
      const detailsMap = {};
      const productIds = cartItems.map(i => i.productId);
      
      for (const p of allProducts) {
        if (productIds.includes(String(p._id))) {
            detailsMap[String(p._id)] = p;
        }
      }

      setProductDetails(detailsMap);
    } catch (err) {
      console.error("Failed to fetch product details:", err);
      setCartError("Failed to load product details.");
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchDeliveryFee = useCallback(async (items, location) => {
    if (!location || !location.lat || !items.length) {
        setDeliveryData(null);
        return;
    }

    try {
      const res = await fetch("/api/delivery/fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          customerLocation: {
            lat: location.lat,
            lng: location.lng,
            city: location.city,
            pincode: location.pincode,
          },
          items: items.map(i => ({ 
            productId: i.productId, 
            sizeLabel: i.size, 
            qty: i.qty 
          }))
        })
      });
      if (!res.ok) throw new Error("Failed to get delivery estimate.");
      
      const data = await res.json();
      setDeliveryData(data);
    } catch (err) {
      console.error("Delivery fee error:", err);
      setCartError("Failed to calculate delivery fee. Location services may be unavailable.");
      setDeliveryData(null);
    }
  }, []);

  // --- EFFECTS ---
  
  // 1. Initial cart load, auth check, and event listener setup
  useEffect(() => {
    updateCartCount();
    const handleStorageChange = () => updateCartCount();
    window.addEventListener("livemart-cart-update", handleStorageChange);
    
    // **FIX START: Use /api/user/profile to fetch the user with explicit addresses**
    async function fetchUserWithAddresses() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setUser(null);
                return;
            }
            
            // Use /api/user/profile to ensure 'addresses' field is present
            const res = await fetch("/api/user/profile", { 
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user); // data.user now contains addresses
            } else {
                setUser(null);
            }
        } catch (e) {
            setUser(null);
        }
    }
    fetchUserWithAddresses();
    // **FIX END**

    return () => window.removeEventListener("livemart-cart-update", handleStorageChange);
  }, [router]);
  
  // 2. Fetch product details when cart changes
  useEffect(() => {
    fetchProductDetails(cart);
  }, [cart, fetchProductDetails]);
  
  // 3. Get customer location from local storage & LISTEN (MODIFIED to use listener logic)
  useEffect(() => {
    const handleLocationUpdate = () => {
      try {
        const savedLoc = localStorage.getItem("livemart_active_location");
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          setCustomerLocation({ 
              lat: parsed.lat, 
              lng: parsed.lng,
              city: parsed.city,
              pincode: parsed.pincode
          });
          setLocationLabel(`${parsed.city} ${parsed.pincode || ''}`);
          setCartError(null);
        } else {
          setCustomerLocation(null);
          setLocationLabel("Select Location");
          setCartError("Please select a delivery location from the top navigation bar.");
        }
      } catch (e) {
        setCustomerLocation(null);
        setCartError("Failed to load your delivery location. Please select one.");
      }
    };
    
    handleLocationUpdate(); // Initial load
    // Listen for custom event dispatched by Navbar or LocalProducts on location change
    window.addEventListener("livemart-location-update", handleLocationUpdate); 
    
    return () => window.removeEventListener("livemart-location-update", handleLocationUpdate);
    
  }, []);
  
  // 4. Fetch delivery fee when products/location change
  useEffect(() => {
    if (Object.keys(productDetails).length > 0 && customerLocation) {
        fetchDeliveryFee(cart, customerLocation);
    }
  }, [cart, productDetails, customerLocation, fetchDeliveryFee]);
  
  // ... existing user action handlers (handleUpdateQty, handleRemoveItem, handleGoToCheckout) ...

  const handleUpdateQty = useCallback((index, change) => {
    let newQty = cart[index].qty + change;
    newQty = Math.max(1, newQty);
    
    const item = itemsWithDetails[index];
    const maxStock = item?.availableStock || 0;

    if (newQty > maxStock) {
      alert(`Maximum available units for "${item.name}" (size ${item.size}) is ${maxStock}.`);
      newQty = maxStock;
    }
    
    const newCart = cart.map((i, idx) => idx === index ? { ...i, qty: newQty } : i);
    setCart(newCart);
    saveCart(newCart);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('livemart-cart-update'));
  }, [cart, itemsWithDetails]);

  // **Corrected Delete Button Logic**
  const handleRemoveItem = useCallback((index) => {
    // Only proceed if the user confirms (window.confirm returns true)
    if (!window.confirm("Are you sure you want to remove this item from your cart?")) {
      return;
    }
    
    const newCart = cart.filter((_, idx) => idx !== index);
    setCart(newCart);
    saveCart(newCart);
    
    // No redirection here. The UI will update to show the empty cart message.

    if (typeof window !== 'undefined') window.dispatchEvent(new Event('livemart-cart-update'));
    
    // Re-fetch delivery data if cart contents changed significantly
    fetchDeliveryFee(newCart, customerLocation); 
  }, [cart, fetchDeliveryFee, customerLocation]);


  const handleGoToCheckout = () => {
    if (!isCartValidForCheckout) {
        alert("Please resolve all out-of-stock items and ensure a location is selected before proceeding.");
        return;
    }
    
    // Pass the calculated discounted price (subtotalAfterDiscount / qty) as unitPrice
    // for compatibility with the old checkout API route logic (OrderService.createOrder)
    localStorage.setItem("lm_cart", JSON.stringify(
        itemsWithDetails.map(item => ({ 
            productId: item.productId, 
            sizeLabel: item.size, 
            qty: item.qty,
            unitPrice: item.discountedPrice
        }))
    ));
    
    // Navigate
    router.push("/checkout");
  };


  // --- RENDER ---

  if (loading && cart.length > 0) {
// ... (loading render logic unchanged) ...
    return (
      <>
        <CustomerNavbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }
  
  // If we reach here with an empty cart, display the empty message.
  if (cart.length === 0 && !loading) {
     return (
      <div className="min-h-screen bg-gray-50/50 font-sans">
        <CustomerNavbar />
        <main className="max-w-[1440px] mx-auto px-6 py-10">
          <h1 className="text-4xl font-black mb-8 tracking-tight">Your Cart</h1>
          <Card className="p-10 text-center lg:col-span-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold">Your cart is empty.</p>
            {/* The existing code already satisfies the requirement to link to the home page */}
            <Link href="/" passHref>
                <Button className="mt-4 rounded-full px-8 py-6 text-lg bg-black text-white hover:bg-black/80">
                    Go Shop Now
                </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  // If cart is not empty, continue rendering the full cart.
  if (itemsWithDetails.length === 0) return null;
  
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <CustomerNavbar />
      
      <main className="max-w-[1440px] mx-auto px-6 py-10">
        <h1 className="text-4xl font-black mb-8 tracking-tight">Your Cart</h1>
        
        {cartError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Cart Error</AlertTitle>
            <AlertDescription>{cartError}</AlertDescription>
          </Alert>
        )}

        {itemsWithDetails.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- Left Column: Cart Items (60-75% width, using lg:col-span-8) --- */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* MODIFIED: Location Status BUTTON */}
              <button 
                  onClick={handleDeliverToClick}
                  className="w-full text-left flex items-center text-sm font-medium p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                 <MapPin className="h-4 w-4 mr-2 text-black" />
                 Delivery Location: <strong className="ml-1 text-black truncate">{locationLabel}</strong>
                 {/* Explicit 'Change' text for better UX */}
                 <span className="text-xs text-blue-600 font-semibold ml-auto">Change</span>
              </button>
              
              {/* Item List */}
              {itemsWithDetails.map((item, index) => {
// ... (rest of item map loop unchanged) ...
                const isOutOfStock = !item.isAvailable;
                const priceComponent = (
                  <div className="flex items-center gap-3 pt-1">
                      <span className="font-bold text-xl text-black">{formatPrice(item.discountedPrice)}</span>
                      {item.totalDiscount > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(item.originalPriceBeforeDiscount)}
                        </span>
                      )}
                      {item.totalDiscount > 0 && (
                        <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded-full">
                          {item.product?.discount || 0}% OFF
                        </span>
                      )}
                  </div>
                );

                return (
                  <Card key={item.productId + item.size} className={`p-4 flex gap-4 transition-all ${isOutOfStock ? 'opacity-60 border-red-300 bg-red-50' : 'bg-white'}`}>
                    
                    {/* Image Area (Left) */}
                    <Link href={`/product/${item.productId}`} className="w-24 h-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <img src={item.image || "/images/placeholder.png"} alt={item.name} className="w-full h-full object-cover" />
                    </Link>

                    {/* Details and Controls (Middle) */}
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                         <h3 className="font-bold text-lg truncate pr-8">{item.name}</h3>
                         {/* Delete Button (Top Right of row) */}
                         <Button 
                             variant="ghost" 
                             size="icon-sm" 
                             onClick={() => handleRemoveItem(index)}
                             className="text-gray-500 hover:text-red-600 shrink-0"
                         >
                             <Trash2 className="h-5 w-5" />
                         </Button>
                      </div>
                      
                      <p className="text-sm text-gray-500">Size: <span className="font-semibold">{item.size}</span></p>
                      
                      {/* Price / Discount Row */}
                      {priceComponent}
                      
                      {/* Stock Info */}
                      <p className={`text-sm ${isOutOfStock ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {isOutOfStock ? `Out of Stock. Available: ${item.availableStock}` : `Available: ${item.availableStock}`}
                      </p>
                      
                      {/* Delivery ETA */}
                      <p className="text-sm text-green-700 pt-1 flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          Delivery by: {item.estimatedDeliveryDate}
                      </p>
                      
                    </div>

                    {/* Quantity Controls (Right) */}
                    <div className="flex flex-col items-end justify-start space-y-2 pt-2">
                        <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleUpdateQty(index, -1)}
                                disabled={item.qty <= 1 || isOutOfStock}
                            >
                                −
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleUpdateQty(index, 1)}
                                disabled={isOutOfStock || item.qty >= item.availableStock}
                            >
                                +
                            </Button>
                        </div>
                    </div>
                  </Card>
                );
              })}
              
            </div>

            {/* --- Right Column: Order Summary (lg:col-span-4) --- */}
            <Card className="lg:col-span-4 self-start sticky top-20 bg-white shadow-lg">
{/* ... (rest of summary card unchanged) */}
              <CardHeader>
                <CardTitle className="text-2xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Summary Lines */}
                <div className="space-y-2 text-base">
                  <div className="flex justify-between">
                    <span>Subtotal (Before Discount)</span>
                    <span className="font-medium">{formatPrice(totalSubtotalBeforeDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Total Discount</span>
                    <span>-{formatPrice(totalDiscountAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-medium">{formatPrice(totalFee)}</span>
                  </div>
                </div>
                
                <Separator />
                
                {/* Total */}
                <div className="flex justify-between text-xl font-bold">
                  <span>Order Total</span>
                  <span className="text-black">{formatPrice(grandTotal)}</span>
                </div>
                
                {/* Delivery ETA */}
                <div className="text-sm text-muted-foreground pt-2">
                    <p className="font-semibold text-black">Delivery Estimate:</p>
                    <p>All items delivered by: <strong className="text-green-700">{maxDeliveryDate}</strong></p>
                </div>
                
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                
                {/* Checkout Button */}
                <Button 
                    onClick={handleGoToCheckout} 
                    className="w-full rounded-full py-6 text-lg bg-black text-white hover:bg-black/80"
                    disabled={!isCartValidForCheckout}
                >
                    Proceed to Checkout
                </Button>
                
                {/* Out of Stock Warning */}
                {!isCartValidForCheckout && itemsWithDetails.some(item => !item.isAvailable) && (
                    <p className="text-xs text-red-500 font-medium">Please remove out-of-stock items before checkout.</p>
                )}
                
                {/* Detailed Bill Button */}
                <Button 
                    onClick={() => setIsBillModalOpen(true)}
                    variant="link"
                    className="w-full text-blue-600 p-0 h-auto"
                >
                    Detailed Bill
                </Button>
              </CardFooter>
            </Card>
            
          </div>
        )}
      </main>
      
      {/* --- Detailed Bill Modal (UNCHANGED) --- */}
      <Dialog open={isBillModalOpen} onOpenChange={setIsBillModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detailed Bill</DialogTitle>
            <DialogDescription>
              A breakdown of all charges for your order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Undiscounted Unit Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total Discount</TableHead>
                  <TableHead className="text-right">Net Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsWithDetails.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{formatPrice(item.originalPriceBeforeDiscount)}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right text-red-600">-{formatPrice(item.totalDiscount)}</TableCell>
                    <TableCell className="text-right font-bold">{formatPrice(item.subtotalAfterDiscount)}</TableCell>
                  </TableRow>
                ))}
                
                {/* Summary Rows */}
                <TableRow className="font-bold bg-gray-50">
                    <TableCell colSpan="4" className="text-right">Subtotal (Before Discount)</TableCell>
                    <TableCell className="text-right">{formatPrice(totalSubtotalBeforeDiscount)}</TableCell>
                </TableRow>
                <TableRow className="text-red-600">
                    <TableCell colSpan="4" className="text-right">Total Discount Applied</TableCell>
                    <TableCell className="text-right">-{formatPrice(totalDiscountAmount)}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan="4" className="text-right">Delivery Fee</TableCell>
                    <TableCell className="text-right">{formatPrice(totalFee)}</TableCell>
                </TableRow>
                <TableRow className="text-xl font-bold bg-gray-100">
                    <TableCell colSpan="4" className="text-right">Grand Total</TableCell>
                    <TableCell className="text-right">{formatPrice(grandTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsBillModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* <--- MODALS ADDED ---> */}
      {/* Address Modal for Logged In Users */}
      {user && (
        <CustomerAddressModal 
          isOpen={isAddressModalOpen} 
          onClose={() => setIsAddressModalOpen(false)}
          addresses={user.addresses || []} 
          onSelect={handleAddressSelect} 
          onAddressAdded={handleAddressAdded}
        />
      )}
        
      {/* Manual Location Modal (For guests or temporary location) */}
      <ManualLocationModal 
        isOpen={showManualModal} 
        onClose={() => setShowManualModal(false)}
        onLocationSet={handleManualLocationSet}
      />
      {/* <----------------------> */}
    </div>
  );
}