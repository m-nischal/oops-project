// src/pages/checkout.js
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import CheckoutNavbar from "@/components/CheckoutNavbar"; // NEW
import CheckoutAddressForm from "@/components/CheckoutAddressForm"; // NEW
import CheckoutOrderSummary from "@/components/CheckoutOrderSummary"; // NEW
import CustomerAddressModal from "@/components/CustomerAddressModal";
import ManualLocationModal from "@/components/ManualLocationModal";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowRight, MapPin, Wallet, Edit, RefreshCw, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import Dialog components needed for the custom back button warning
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // Keep Input for the payment card placeholder


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

function getStockForSize(product, sizeLabel) {
  if (!product || !Array.isArray(product.sizes)) return 0;
  const sizeObj = product.sizes.find(s => String(s.size) === String(sizeLabel));
  return Number(sizeObj?.stock || 0);
}

// --- INITIAL ADDRESS DATA STRUCTURE ---
const emptyAddress = {
    email: '', phone: '', countryCode: '+91', firstName: '', lastName: '', 
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India',
    location: null // { lat, lng }
};


// --- MAIN COMPONENT ---
export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null); // Consolidated non-cart error
  const [deliveryData, setDeliveryData] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  
  // Checkout Steps/Toggles
  const [activeTab, setActiveTab] = useState('shipping'); // 'shipping' or 'payment'
  const [isShippingComplete, setIsShippingComplete] = useState(false);
  
  // Address & Contact Info State
  const [checkoutInfo, setCheckoutInfo] = useState(emptyAddress);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Modals
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // --- BROWSER BACK STATE ---
  const [showBrowserBackWarning, setShowBrowserBackWarning] = useState(false);
  const [targetUrl, setTargetUrl] = useState(null);
  const ignoreNextPopState = useRef(false);
  // -----------------------------
  
  // --- Derived Calculations (useMemo) ---
  const itemsWithDetails = useMemo(() => {
    return loadCart().map(item => {
      const product = productDetails[item.productId];
      const price = Number(product?.price || item.price || 0);
      const discountPercent = Number(product?.discount || 0);
      
      const originalPriceBeforeDiscount = Math.round(price / (1 - discountPercent / 100));
      const discountedPrice = price; 
      
      const subtotalBeforeDiscount = originalPriceBeforeDiscount * item.qty;
      const subtotalAfterDiscount = discountedPrice * item.qty;
      const totalDiscount = subtotalBeforeDiscount - subtotalAfterDiscount;
      
      const stock = product ? getStockForSize(product, item.size) : 0;
      
      const delivery = deliveryData?.detailedItems.find(d => 
        String(d.productId) === String(item.productId) && 
        String(d.sizeLabel) === String(item.size)
      );

      return {
        ...item,
        product,
        discountedPrice,
        subtotalBeforeDiscount,
        subtotalAfterDiscount,
        totalDiscount,
        isAvailable: stock >= item.qty,
        deliveryFee: delivery?.deliveryFee || 0,
        name: product?.name || item.name || "Item",
        image: product?.images?.[0] || item.image || "/images/placeholder.png",
      };
    });
  }, [productDetails, deliveryData]);
  
  // Aggregation using the fixed properties
  const totalDiscountAmount = itemsWithDetails.reduce((s, item) => s + item.totalDiscount, 0);
  const totalSubtotalBeforeDiscount = itemsWithDetails.reduce((s, item) => s + item.subtotalBeforeDiscount, 0);
  const totalFee = typeof deliveryData?.totalDeliveryFee === 'number' ? deliveryData.totalDeliveryFee : 0;
  const grandTotal = (totalSubtotalBeforeDiscount - totalDiscountAmount) + totalFee;
  
  const isCartValidForCheckout = itemsWithDetails.length > 0 && 
                                 !loading && 
                                 !cartError && 
                                 itemsWithDetails.every(item => item.isAvailable);


  // --- CORE LOCATION & DATA FETCHING ---

  const fetchProductDetails = useCallback(async (cartItems) => {
    if (cartItems.length === 0) return;
    try {
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
          customerLocation: location,
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
      setCartError("Failed to calculate delivery fee.");
      setDeliveryData(null);
    }
  }, []);

  /**
   * Helper: Updates LocalStorage with *full* address object and triggers a reload.
   */
  const setActiveLocationAndReload = useCallback((addressObj) => {
    if (!addressObj || !addressObj.location?.coordinates) return;

    const [lng, lat] = addressObj.location.coordinates;
    
    // 1. Save LOCATION data (minimal lat/lng for delivery calculation)
    const locData = {
      city: addressObj.city,
      pincode: addressObj.pincode,
      addressLine1: addressObj.addressLine1,
      lat, lng
    };
    localStorage.setItem("livemart_active_location", JSON.stringify(locData));
    
    // 2. Save FULL ADDRESS object (for pre-filling form fields upon reload)
    localStorage.setItem("livemart_active_address_full", JSON.stringify(addressObj));


    // Dispatch event to re-fetch fees and update navbar
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("livemart-location-update"));
      // Force reload is generally safer to reset entire checkout flow
      window.location.reload(); 
    }
  }, []);


  // --- INITIALIZATION EFFECT ---
  useEffect(() => {
    const initialCart = loadCart();
    if (initialCart.length === 0) {
        router.replace('/cart'); // Redirect if cart is empty
        return;
    }
    setCart(initialCart);
    
    // FIX: Intercept Browser Back Button and use custom Dialog
    router.beforePopState(({ url, as, options }) => {
        if (ignoreNextPopState.current) {
            ignoreNextPopState.current = false; // Reset the flag
            return true; // Allow navigation to proceed
        }

        if (router.pathname === '/checkout') {
            setTargetUrl(as);
            setShowBrowserBackWarning(true);
            return false;
        }
        return true;
    });

    // Function to run initialization logic
    async function init() {
      setLoading(true);
      
      let initialUser = null;
      let initialAddress = null;
      let fullAddressObj = null;
      
      // 1. Fetch User Profile
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/user/profile", { 
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            initialUser = data.user;
            setUser(initialUser);
        }
      } catch (e) { console.error("Failed to fetch user profile", e); }
      
      // 2. Determine Active Location (Source of truth)
      const savedLoc = localStorage.getItem("livemart_active_location");
      const savedFullAddress = localStorage.getItem("livemart_active_address_full"); 

      if (savedFullAddress) {
          fullAddressObj = JSON.parse(savedFullAddress);
          initialAddress = savedLoc ? JSON.parse(savedLoc) : {
              lat: fullAddressObj.location?.coordinates?.[1],
              lng: fullAddressObj.location?.coordinates?.[0],
              city: fullAddressObj.city, pincode: fullAddressObj.pincode, addressLine1: fullAddressObj.addressLine1
          };
      } else if (savedLoc) {
          initialAddress = JSON.parse(savedLoc);
      } else if (initialUser?.addresses?.length > 0) {
          // Fallback to first address if logged in
          const def = initialUser.addresses[0];
          fullAddressObj = def;
          initialAddress = {
              lat: def.location.coordinates[1],
              lng: def.location.coordinates[0],
              city: def.city, pincode: def.pincode, addressLine1: def.addressLine1,
          };
      }
      
      // 3. Populate Checkout Info
      let info = { ...emptyAddress, email: initialUser?.email || '' };
      
      if (initialUser) {
          info.firstName = initialUser.name?.split(' ')[0] || '';
          info.lastName = initialUser.name?.split(' ').slice(1).join(' ') || '';
          info.phone = initialUser.phone || '';
      }
      
      // Use full address object if available to fill all fields
      if (fullAddressObj) {
          // Overwrite all fields from the full address object
          info = {
              ...info,
              ...fullAddressObj,
              location: initialAddress,
              countryCode: fullAddressObj.countryCode || info.countryCode, 
              phone: fullAddressObj.phone || info.phone,
          };
          setSelectedAddressId(fullAddressObj._id || 'manual');
      } else if (initialAddress) {
           // Fallback to just location data if only partial info is available
           info = { ...info, ...initialAddress, location: initialAddress };
           setSelectedAddressId('manual');
      }
      
      // Ensure basic user info (email) is present
      if (initialUser?.email && !info.email) info.email = initialUser.email;
      
      setCheckoutInfo(info);
      setCustomerLocation(initialAddress);
      
      // 4. Fetch Details
      await fetchProductDetails(initialCart);
      
      setLoading(false);
    }
    
    // Listen for location changes from Navbar or other components
    const handleLocationUpdate = () => init();
    window.addEventListener("livemart-location-update", handleLocationUpdate);
    
    init();
    
    // Cleanup function: restore default behavior on component unmount
    return () => {
         window.removeEventListener("livemart-location-update", handleLocationUpdate);
         router.beforePopState(() => true); // Restore default behavior
    };
  }, [router, fetchProductDetails]);
  
  // 5. Fetch Delivery Fee Effect
  useEffect(() => {
    if (Object.keys(productDetails).length > 0 && customerLocation && cart.length > 0) {
        fetchDeliveryFee(cart, customerLocation);
    }
  }, [cart, productDetails, customerLocation, fetchDeliveryFee]);


  // --- HANDLERS ---
  
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
  };
  
  const handleManualLocationSet = (locData) => {
    setShowManualModal(false);
  };

  const handleInfoChange = useCallback((newData) => {
    setCheckoutInfo(newData);
  }, []);
  
  const handleShippingContinue = () => {
      setSubmissionError(null); 
      if (!isCartValidForCheckout) {
          setCartError("One or more items are out of stock. Please return to cart to adjust.");
          return;
      }
      
      if (!checkoutInfo.addressLine1 || !checkoutInfo.city || !checkoutInfo.phone) {
          setCartError("Please fill all required shipping and contact details.");
          return;
      }

      setIsShippingComplete(true);
      setActiveTab('payment');
  };

  const handlePlaceOrder = async () => {
    if (!isShippingComplete) {
        setSubmissionError("Please complete the shipping information first.");
        return;
    }
    if (grandTotal <= 0) {
        setSubmissionError("Cannot place order with zero total amount.");
        return;
    }

    setLoading(true);
    setSubmissionError(null);
    
    // --- PROCEED TO ORDER CREATION (NO MOCK PAYMENT SIMULATION) ---

    const customerPayload = {
        name: `${checkoutInfo.firstName} ${checkoutInfo.lastName || ''}`.trim(),
        email: checkoutInfo.email,
        phone: `${checkoutInfo.countryCode}${checkoutInfo.phone}`,
        address: `${checkoutInfo.addressLine1}, ${checkoutInfo.city}, ${checkoutInfo.pincode}, ${checkoutInfo.country}`,
        customerLocation: {
            lat: checkoutInfo.location?.lat,
            lng: checkoutInfo.location?.lng,
        }
    };
    
    const itemsPayload = itemsWithDetails.map(item => ({ 
        productId: item.productId, 
        sizeLabel: item.size, 
        qty: item.qty,
        unitPrice: item.discountedPrice
    }));
    
    try {
      // Mock API call (for payment success structure)
      const payRes = await fetch("/api/payments/mock/charge", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ amount: grandTotal })
      });
      if (!payRes.ok) {
        throw new Error("Payment failed during API simulation.");
      }
      
      // Create Order
      const res = await fetch("/api/orders", {
        method:"POST", 
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ customer: customerPayload, items: itemsPayload })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Order creation failed");
      }
      const order = await res.json();

      // 3. Clear cart and redirect
      localStorage.removeItem("lm_cart");
      localStorage.removeItem("livemart_cart");
      localStorage.removeItem("livemart_active_address_full"); 
      window.dispatchEvent(new Event("livemart-cart-update"));
      router.push(`/order/${order._id}`);
      
    } catch (e) {
      setSubmissionError("Order Failed: " + (e.message || e));
      console.error(e);
    } finally { 
        setLoading(false); 
    }
  };
  
  const handleLogout = async () => {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
        localStorage.removeItem("token");
        localStorage.removeItem("livemart_active_address_full"); 
        setUser(null);
        router.push("/login"); 
    } catch (e) {
        console.error("Logout failed", e);
        router.push("/login");
    }
  };

  // --- BROWSER NAVIGATION HANDLERS ---
  const handleConfirmBrowserBack = () => {
      setShowBrowserBackWarning(false);
      ignoreNextPopState.current = true; 
      if (targetUrl) {
          router.push(targetUrl);
      } else {
           router.back();
      }
  };
  // -------------------------------------------------


  if (loading || cart.length === 0) {
    if (!loading && cart.length === 0) return null; // Should redirect in effect
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <CheckoutNavbar user={user} onLogout={handleLogout} />
      
      <main className="max-w-[1440px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Toggable Forms (col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Toggle Buttons */}
            <div className="flex gap-4 border-b border-gray-200 text-lg font-semibold mb-6">
                <button
                    onClick={() => setActiveTab('shipping')}
                    className={`pb-3 transition-colors ${activeTab === 'shipping' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    Shipping Information
                </button>
                <button
                    onClick={() => setActiveTab('payment')}
                    disabled={!isShippingComplete}
                    className={`pb-3 transition-colors ${!isShippingComplete ? 'opacity-50 cursor-not-allowed' : (activeTab === 'payment' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}`}
                >
                    Payment
                </button>
            </div>

            {/* Error Display */}
            {(cartError || submissionError) && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Checkout Error</AlertTitle>
                <AlertDescription>{cartError || submissionError}</AlertDescription>
              </Alert>
            )}

            {/* --- 3a. Shipping Information Card --- */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center justify-between">
                        <span className={activeTab === 'shipping' ? 'text-black' : 'text-gray-400'}>Shipping Information</span>
                        {isShippingComplete && <Check className="h-6 w-6 text-green-600" />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Form Component */}
                    {(activeTab === 'shipping' || !isShippingComplete) ? (
                        <CheckoutAddressForm 
                            initialData={checkoutInfo} 
                            onDataChange={handleInfoChange}
                            onContinue={handleShippingContinue}
                        />
                    ) : (
                        <div className="p-8 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{checkoutInfo.firstName} {checkoutInfo.lastName}</h3>
                                    <p className="text-gray-600 text-sm">{checkoutInfo.addressLine1} {checkoutInfo.addressLine2}</p>
                                    <p className="text-gray-600 text-sm">{checkoutInfo.city}, {checkoutInfo.pincode}, {checkoutInfo.country}</p>
                                    <p className="text-gray-600 text-sm mt-2">Contact: {checkoutInfo.email} | {checkoutInfo.countryCode}{checkoutInfo.phone}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setActiveTab('shipping')} className="mt-1">
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* --- 3b. Payment Card --- */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Wallet className="h-6 w-6" />
                        <span className={activeTab === 'payment' ? 'text-black' : 'text-gray-400'}>Payment</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {(activeTab === 'payment' && isShippingComplete) ? (
                        <div className="space-y-4">
                            <Alert variant="secondary">
                                <AlertTitle>Payment Method</AlertTitle>
                                <AlertDescription>
                                    Only "Pay Now" is supported in this demo application.
                                </AlertDescription>
                            </Alert>
                            
                            {/* Static Payment Option */}
                            <div className="border p-4 rounded-xl bg-gray-50 text-gray-700">
                                <label className="flex items-center space-x-3">
                                    <input type="radio" name="paymentMethod" defaultChecked className="h-4 w-4" disabled={true}/>
                                    <span className="font-medium">Pay Now (Total: {formatPrice(grandTotal)})</span>
                                </label>
                            </div>
                            
                            {/* Final Place Order Button */}
                            <Button 
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full h-14 rounded-xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Place Order"}
                            </Button>

                        </div>
                    ) : (
                        <p className="text-muted-foreground">Complete Shipping Information to proceed to payment.</p>
                    )}
                </CardContent>
            </Card>
          </div>
          
          {/* Right Column (col-span-1) */}
          <div className="lg:col-span-1">
            {/* Wrapper for Sticky positioning */}
            <div className="lg:sticky lg:top-20 space-y-6 max-h-[calc(100vh - 100px)] overflow-y-auto">
              
              {/* 4a. Change Address Card */}
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle className="text-xl">Delivery Location</CardTitle>
                      <CardDescription>
                          {customerLocation?.city || 'No Location Set'}
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                      <p className="text-sm text-gray-600 font-medium flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {customerLocation?.addressLine1 || 'Select your address below to fill shipping form.'}
                      </p>
                      <Button 
                          variant="outline" 
                          className="w-full border-dashed"
                          onClick={() => setIsAddressModalOpen(true)}
                          disabled={loading}
                      >
                          <RefreshCw className="h-4 w-4 mr-2" /> Change Address / Location
                      </Button>
                  </CardContent>
              </Card>

              {/* 4b. Your Order Display */}
              <CheckoutOrderSummary orderData={{ 
                  itemsWithDetails, 
                  totalSubtotalBeforeDiscount, 
                  totalDiscountAmount, 
                  totalFee, 
                  grandTotal
              }} />
            </div>
          </div>
        </div>
      </main>

      {/* --- Address Selection Modal (for logged-in users) --- */}
      {user && (
        <CustomerAddressModal 
          isOpen={isAddressModalOpen} 
          onClose={() => setIsAddressModalOpen(false)}
          addresses={user.addresses || []}
          onSelect={handleAddressSelect} // Calls setActiveLocationAndReload
          onAddressAdded={handleAddressAdded} // Calls setActiveLocationAndReload
        />
      )}
      
      {/* --- Manual Location Modal (for guest users) --- */}
      <ManualLocationModal 
        isOpen={showManualModal} 
        onClose={() => setShowManualModal(false)}
        onLocationSet={handleManualLocationSet} // Calls setActiveLocationAndReload
      />
      
      {/* --- Browser Back Confirmation Dialog --- */}
      <Dialog open={showBrowserBackWarning} onOpenChange={setShowBrowserBackWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Checkout?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave the checkout page? Your progress may be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrowserBackWarning(false)}>
              Stay on Page
            </Button>
            <Button onClick={handleConfirmBrowserBack} variant="destructive">
              Yes, Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}