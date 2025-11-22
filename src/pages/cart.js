// src/pages/cart.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import CustomerNavbar from "@/components/CustomerNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, ShoppingCart, Package, MapPin, XCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/router"; 

import CustomerAddressModal from "@/components/CustomerAddressModal";
import ManualLocationModal from "@/components/ManualLocationModal";

// --- HELPERS ---
const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

function loadCart() {
  try { return JSON.parse(localStorage.getItem("livemart_cart") || "[]"); } catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem("livemart_cart", JSON.stringify(cart)); }

// --- FIX: Update Stock Helper to use Proxy Availability ---
function getStockForSize(product, sizeLabel) {
  if (!product || !Array.isArray(product.sizes)) return 0;
  const sizeObj = product.sizes.find(s => String(s.size) === String(sizeLabel));
  // Check 'totalAvailable' (which includes Proxy stock from the API) first
  return Number(sizeObj?.totalAvailable ?? sizeObj?.stock ?? 0);
}

// --- MAIN COMPONENT ---

export default function CartPage() {
  const router = useRouter(); 
  const [cart, setCart] = useState([]);
  const [productDetails, setProductDetails] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState(null);
  const [deliveryData, setDeliveryData] = useState(null); 
  
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  // Location State
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Select Location");
  
  // Modal & User States
  const [user, setUser] = useState(null); 
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false); 
  const [showManualModal, setShowManualModal] = useState(false); 
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); 
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);
  
  // --- New Failure State ---
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');


  // --- Derived Calculations (useMemo) ---
  const itemsWithDetails = useMemo(() => {
    return cart.map(item => {
      const product = productDetails[item.productId];
      const delivery = deliveryData?.detailedItems.find(d => 
        String(d.productId) === String(item.productId) && 
        String(d.sizeLabel) === String(item.size)
      );

      const price = Number(product?.price || item.price || 0);
      const discountPercent = Number(product?.discount || 0);
      
      const originalPriceBeforeDiscount = Math.round(price / (1 - discountPercent / 100));
      const discountedPrice = price; 
      const unitDiscount = originalPriceBeforeDiscount - discountedPrice;
      
      const totalDiscount = unitDiscount * item.qty;
      const subtotalBeforeDiscount = originalPriceBeforeDiscount * item.qty;
      const subtotalAfterDiscount = discountedPrice * item.qty;
      
      const estimatedDeliveryDays = delivery?.estimatedDays || null;
      const estimatedDeliveryDate = estimatedDeliveryDays 
        ? formatDate(new Date(Date.now() + estimatedDeliveryDays * 24 * 60 * 60 * 1000)) 
        : 'N/A';
      
      // This now uses the fixed helper to see Proxy stock
      const stock = product ? getStockForSize(product, item.size) : 0;
      
      return {
        ...item,
        product,
        originalPriceBeforeDiscount, 
        discountedPrice,             
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

    const locData = {
      city: addressObj.city,
      pincode: addressObj.pincode,
      addressLine1: addressObj.addressLine1,
      lat: addressObj.location.coordinates[1],
      lng: addressObj.location.coordinates[0],
    };
    localStorage.setItem("livemart_active_location", JSON.stringify(locData));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("livemart-location-update"));
      window.location.reload(); 
    }
  }, []);

  const handleDeliverToClick = () => {
    if (user) {
      setIsAddressModalOpen(true);
    } else {
      setShowManualModal(true);
    }
  };

  const handleAddressSelect = (address) => {
    setIsAddressModalOpen(false);
    setActiveLocationAndReload(address);
  };

  const handleAddressAdded = (updatedUser) => {
    setUser(updatedUser);
    const newlyAddedAddress = updatedUser.addresses[updatedUser.addresses.length - 1];
    if (newlyAddedAddress) {
        setActiveLocationAndReload(newlyAddedAddress);
    }
    setIsAddressModalOpen(false); 
  };
  
  const handleManualLocationSet = (locData) => {
    setShowManualModal(false);
  };

  const updateCartCount = () => {
    const cartItems = loadCart();
    setCart(cartItems);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('livemart-cart-update'));
  };

  // --- FIX 2: Fetch individual product details to get PROXY DATA ---
  const fetchProductDetails = useCallback(async (cartItems) => {
    if (cartItems.length === 0) {
      setProductDetails({});
      return;
    }
    
    setLoading(true);
    try {
      const uniqueIds = [...new Set(cartItems.map(i => i.productId))];
      
      const promises = uniqueIds.map(id => 
          fetch(`/api/products/${id}`).then(r => r.ok ? r.json() : null)
      );
      
      const results = await Promise.all(promises);
      
      const detailsMap = {};
      results.forEach(data => {
          if (data && data.product) {
              detailsMap[String(data.product._id)] = data.product;
          }
      });

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
  
  useEffect(() => {
    updateCartCount();
    const handleStorageChange = () => updateCartCount();
    window.addEventListener("livemart-cart-update", handleStorageChange);
    
    async function fetchUserWithAddresses() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setUser(null);
                return;
            }
            
            const res = await fetch("/api/user/profile", { 
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user); 
            } else {
                setUser(null);
            }
        } catch (e) {
            setUser(null);
        }
    }
    fetchUserWithAddresses();

    return () => window.removeEventListener("livemart-cart-update", handleStorageChange);
  }, [router]);
  
  // Check for Payment Failure Query Parameter
  useEffect(() => {
    if (router.query.paymentFailed) {
      setFailureMessage(decodeURIComponent(router.query.paymentFailed));
      setShowFailureModal(true);
      // Clean up the query parameter in the URL
      router.replace('/cart', undefined, { shallow: true });
    }
  }, [router]);
  
  useEffect(() => {
    // Fetch details even if cart is empty to confirm state, but optimize inside the function
    if (cart.length > 0) {
        fetchProductDetails(cart);
    } else {
        setLoading(false); // Ensure loading is false if cart is empty
    }
  }, [cart, fetchProductDetails]);
  
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
    
    handleLocationUpdate(); 
    window.addEventListener("livemart-location-update", handleLocationUpdate); 
    
    return () => window.removeEventListener("livemart-location-update", handleLocationUpdate);
    
  }, []);
  
  useEffect(() => {
    if (Object.keys(productDetails).length > 0 && customerLocation) {
        fetchDeliveryFee(cart, customerLocation);
    }
  }, [cart, productDetails, customerLocation, fetchDeliveryFee]);
  
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

  const confirmRemoval = useCallback(() => {
    if (itemToDeleteIndex === null) return;

    const newCart = cart.filter((_, idx) => idx !== itemToDeleteIndex);
    setCart(newCart);
    saveCart(newCart);

    if (typeof window !== 'undefined') window.dispatchEvent(new Event('livemart-cart-update'));

    fetchDeliveryFee(newCart, customerLocation);

    setShowDeleteConfirm(false);
    setItemToDeleteIndex(null);
  }, [cart, itemToDeleteIndex, fetchDeliveryFee, customerLocation]);

  const handleRemoveItem = useCallback((index) => {
    setItemToDeleteIndex(index);
    setShowDeleteConfirm(true);
  }, []);


  const handleGoToCheckout = () => {
    if (!isCartValidForCheckout) {
        alert("Please resolve all out-of-stock items and ensure a location is selected before proceeding.");
        return;
    }
    
    if (!user || user.role !== "CUSTOMER") {
        setShowLoginPrompt(true); 
        return;
    }
    
    localStorage.setItem("lm_cart", JSON.stringify(
        itemsWithDetails.map(item => ({ 
            productId: item.productId, 
            sizeLabel: item.size, 
            qty: item.qty,
            unitPrice: item.discountedPrice
        }))
    ));
    
    router.push("/checkout");
  };

  if (loading && cart.length > 0) {
    return (
      <>
        <CustomerNavbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }
  
  // --- FIX: Explicit Empty Cart View ---
  // This ensures that if the cart is empty, we ALWAYS show this UI, 
  // stopping the function from returning null or crashing.
  if (cart.length === 0) {
     return (
      <div className="min-h-screen bg-gray-50/50 font-sans">
        <CustomerNavbar />
        <main className="max-w-[1440px] mx-auto px-6 py-10">
          <h1 className="text-4xl font-black mb-8 tracking-tight">Your Cart</h1>
          <Card className="p-10 text-center lg:col-span-12 flex flex-col items-center justify-center h-[400px]">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-800">Your cart is empty.</p>
            <p className="text-gray-500 mt-2 mb-6">Looks like you haven't added anything to your cart yet.</p>
            
            <Link href="/" passHref>
                <Button className="rounded-full px-8 py-6 text-lg bg-black text-white hover:bg-black/80 transition-all shadow-lg">
                    Continue Shopping
                </Button>
            </Link>
          </Card>
        </main>
        <PaymentFailureModal isOpen={showFailureModal} errorMessage={failureMessage} onTryAgain={() => router.push('/checkout')} />
      </div>
    );
  }

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
            
            <div className="lg:col-span-8 space-y-4">
              
              <button 
                  onClick={handleDeliverToClick}
                  className="w-full text-left flex items-center text-sm font-medium p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                 <MapPin className="h-4 w-4 mr-2 text-black" />
                 Delivery Location: <strong className="ml-1 text-black truncate">{locationLabel}</strong>
                 <span className="text-xs text-blue-600 font-semibold ml-auto">Change</span>
              </button>
              
              {itemsWithDetails.map((item, index) => {
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
                    
                    <Link href={`/product/${item.productId}`} className="w-24 h-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <img src={item.image || "/images/placeholder.png"} alt={item.name} className="w-full h-full object-cover" />
                    </Link>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                         <h3 className="font-bold text-lg truncate pr-8">{item.name}</h3>
                         <Button 
                             variant="ghost" 
                             size="icon-sm" 
                             onClick={() => handleRemoveItem(index)} 
                             className="text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0" 
                         >
                             <Trash2 className="h-5 w-5" />
                         </Button>
                      </div>
                      
                      <p className="text-sm text-gray-500">Size: <span className="font-semibold">{item.size}</span></p>
                      
                      {priceComponent}
                      
                      <p className={`text-sm ${isOutOfStock ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {isOutOfStock ? `Out of Stock. Available: ${item.availableStock}` : `Available: ${item.availableStock}`}
                      </p>
                      
                      <p className="text-sm text-green-700 pt-1 flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          Delivery by: {item.estimatedDeliveryDate}
                      </p>
                      
                    </div>

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

            <Card className="lg:col-span-4 self-start sticky top-20 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
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
                
                <div className="flex justify-between text-xl font-bold">
                  <span>Order Total</span>
                  <span className="text-black">{formatPrice(grandTotal)}</span>
                </div>
                
                <div className="text-sm text-muted-foreground pt-2">
                    <p className="font-semibold text-black">Delivery Estimate:</p>
                    <p>All items delivered by: <strong className="text-green-700">{maxDeliveryDate}</strong></p>
                </div>
                
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                
                <Button 
                    onClick={handleGoToCheckout} 
                    className="w-full rounded-full py-6 text-lg bg-black text-white hover:bg-black/80"
                    disabled={!isCartValidForCheckout}
                >
                    Proceed to Checkout
                </Button>
                
                {!isCartValidForCheckout && itemsWithDetails.some(item => !item.isAvailable) && (
                    <p className="text-xs text-red-500 font-medium">Please remove out-of-stock items before checkout.</p>
                )}
                
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


      {user && (
        <CustomerAddressModal 
          isOpen={isAddressModalOpen} 
          onClose={() => setIsAddressModalOpen(false)}
          addresses={user.addresses || []} 
          onSelect={handleAddressSelect} 
          onAddressAdded={handleAddressAdded}
        />
      )}
        
      <ManualLocationModal 
        isOpen={showManualModal} 
        onClose={() => setShowManualModal(false)}
        onLocationSet={handleManualLocationSet}
      />
      
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please log in as a customer to proceed to the checkout and place your order.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
              <p className="text-center text-sm text-muted-foreground">
                  Only authenticated customers can finalize orders.
              </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>
              Stay on Cart
            </Button>
            <Button onClick={() => router.push("/login")} className="bg-black text-white hover:bg-gray-800">
              Login Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-red-600">Remove Item?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from your cart?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoval}>
              Yes, Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Failure Modal (from Checkout Redirect) */}
      <PaymentFailureModal
        isOpen={showFailureModal}
        errorMessage={failureMessage}
        onTryAgain={() => {
            setShowFailureModal(false);
            router.push('/checkout'); 
        }}
      />
    </div>
  );
}

// --- PAYMENT FAILURE MODAL (NEW COMPONENT FOR CART PAGE) ---
const PaymentFailureModal = ({ isOpen, errorMessage, onTryAgain }) => (
    <Dialog open={isOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-2">
                <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <DialogTitle className="text-xl text-red-600">Payment Failed</DialogTitle>
            <DialogDescription className="text-gray-600">
              Your recent payment attempt could not be completed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4 text-center">
              <p className="text-sm font-medium text-gray-800">Reason:</p>
              <Alert variant="destructive" className="text-left">
                  <AlertDescription>{errorMessage || "Payment timed out or invalid details provided."}</AlertDescription>
              </Alert>
          </div>

          <DialogFooter className="flex-col sm:flex-row">
            <Button onClick={onTryAgain} className="w-full bg-black hover:bg-gray-800">
              Review Cart
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
);