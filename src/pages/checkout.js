import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import CheckoutNavbar from "@/components/CheckoutNavbar";
import CheckoutAddressForm from "@/components/CheckoutAddressForm";
import CheckoutOrderSummary from "@/components/CheckoutOrderSummary";
import CustomerAddressModal from "@/components/CustomerAddressModal";
import ManualLocationModal from "@/components/ManualLocationModal";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Loader2, 
  Wallet, 
  Check, 
  AlertTriangle, 
  MapPin, 
  Edit, 
  RefreshCw, 
  CreditCard,
  QrCode,
  Truck,
  Send,
  Timer,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- HELPERS ---
const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

function loadCart() {
  try { return JSON.parse(localStorage.getItem("livemart_cart") || "[]"); } catch (e) { return []; }
}

function getStockForSize(product, sizeLabel) {
  if (!product || !Array.isArray(product.sizes)) return 0;
  const sizeObj = product.sizes.find(s => String(s.size) === String(sizeLabel));
  return Number(sizeObj?.totalAvailable ?? sizeObj?.stock ?? 0);
}

function formatCardNumberDisplay(value) {
    const cleaned = String(value || '').replace(/\D/g, '').slice(0, 16);
    return cleaned.match(/.{1,4}/g)?.join(' ') || '';
}

function validateCard(details) {
    const cleanedNumber = String(details.number || '').replace(/\s/g, '').slice(0, 16);
    const cleanedCvv = String(details.cvv || '').replace(/\D/g, '').slice(0, 3);
    const cleanedName = String(details.name || '').trim();

    if (cleanedNumber.length !== 16) return "Card number must be exactly 16 digits.";
    if (cleanedCvv.length !== 3) return "CVV must be exactly 3 digits.";

    const [monthStr, yearStr] = details.expiry.split('/');
    const month = Number(monthStr);
    const year = Number(yearStr);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1; 
    
    if (!monthStr || !yearStr || monthStr.length !== 2 || yearStr.length !== 2) {
         return "Expiry date must be in MM/YY format.";
    }
    if (month < 1 || month > 12) {
        return "Expiry month is invalid (01-12).";
    }
    
    if (year < currentYear) {
        return "Card has expired.";
    }
    
    if (year === currentYear && month < currentMonth) {
        return "Card has expired.";
    }

    if (cleanedName.length === 0) return "Cardholder name cannot be empty.";
    if (/[^a-zA-Z\s]/.test(cleanedName)) return "Cardholder name can only contain alphabets and spaces.";

    return null;
}

function validateUpiId(id) {
    const cleanedId = String(id || '').trim();
    if (/[^a-zA-Z0-9@.]/.test(cleanedId)) {
        return "UPI ID contains invalid characters. Only letters, numbers, '@', and '.' are allowed.";
    }
    if (!cleanedId.includes('@')) return "UPI ID must contain '@'.";
    const parts = cleanedId.split('@');
    if (parts.length !== 2) return "UPI ID must contain exactly one '@' symbol.";
    if (parts[0].length === 0) return "UPI ID must have characters before '@'.";
    if (parts[1].length === 0) return "UPI ID must have characters after '@'.";
    return null;
}

function generateMockOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
}


const emptyAddress = {
    email: '', phone: '', countryCode: '+91', firstName: '', lastName: '', 
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India',
    location: null 
};

const PAYMENT_OPTIONS = [
    { id: 'COD', label: 'Cash on Delivery (COD)', icon: Truck, group: 'Offline' },
    { id: 'Card', label: 'Credit/Debit Card', icon: CreditCard, group: 'Online' },
    { id: 'UPI_ID', label: 'UPI ID (PhonePe/GPay/Paytm)', icon: Send, group: 'Online' },
    { id: 'UPI_QR', label: 'UPI Scan (QR Code)', icon: QrCode, group: 'Online' },
];


export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null); 
  const [deliveryData, setDeliveryData] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  
  const [activeTab, setActiveTab] = useState('shipping'); 
  const [isShippingComplete, setIsShippingComplete] = useState(false);
  
  const [checkoutInfo, setCheckoutInfo] = useState(emptyAddress);
  
  // --- UPDATED PAYMENT STATE ---
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_OPTIONS[0].id); 
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });

  // --- Payment Flow State ---
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  
  // --- MODIFIED STATE FOR FINAL SUCCESS ---
  const [showFinalSuccessModal, setShowFinalSuccessModal] = useState(false);
  const [ordersPlaced, setOrdersPlaced] = useState([]);
  // ----------------------------------------
  
  const [paymentInitiating, setPaymentInitiating] = useState(false);
  const [finalPaymentMethod, setFinalPaymentMethod] = useState(null);
  const [finalPaymentId, setFinalPaymentId] = useState(null);
  
  // --- Modal States ---
  const [showPaymentFailureModal, setShowPaymentFailureModal] = useState(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showUpiIdModal, setShowUpiIdModal] = useState(false);
  const [showUpiQrModal, setShowUpiQrModal] = useState(false); 
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  const [showBrowserBackWarning, setShowBrowserBackWarning] = useState(false);
  const [targetUrl, setTargetUrl] = useState(null);
  const ignoreNextPopState = useRef(false);
  const otpTimerRef = useRef(null);

  
  // **************************************************
  // *********** DERIVED CALCULATIONS *****************
  // **************************************************
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
  
  const totalDiscountAmount = itemsWithDetails.reduce((s, item) => s + item.totalDiscount, 0);
  const totalSubtotalBeforeDiscount = itemsWithDetails.reduce((s, item) => s + item.subtotalBeforeDiscount, 0);
  const totalFee = typeof deliveryData?.totalDeliveryFee === 'number' ? deliveryData.totalDeliveryFee : 0;
  const grandTotal = (totalSubtotalBeforeDiscount - totalDiscountAmount) + totalFee;
  const maxDeliveryDate = deliveryData?.estimatedDeliveryDate ? new Date(deliveryData.estimatedDeliveryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
  
  const isCartValidForCheckout = itemsWithDetails.length > 0 && !loading && !cartError && itemsWithDetails.every(item => item.isAvailable);


  // **************************************************
  // *********** CRITICAL CALLBACKS *****************
  // **************************************************

  // --- PAYMENT FAILURE HANDLER ---
  const handlePaymentFailure = useCallback((message) => {
    setIsOtpModalOpen(false);
    setPaymentInitiating(false);
    setLoading(false);
    router.push(`/cart?paymentFailed=${encodeURIComponent(message || "Payment Failed")}`);
  }, [router]);
  
  // --- FINAL ORDER CREATION (MODIFIED) ---
  const handleFinalizeOrder = useCallback(async (paymentId, paymentMethodNote) => {
    setLoading(true);
    setSubmissionError(null);
    
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
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            customer: customerPayload, 
            items: itemsPayload,
            payment: {
                paymentId: paymentId,
                method: paymentMethodNote,
                paidAt: paymentMethodNote !== 'COD' ? new Date() : undefined,
            }
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Order creation failed");
      }
      
      const data = await res.json(); 

      // --- Cleanup and Redirect Logic ---
      localStorage.removeItem("lm_cart");
      localStorage.removeItem("livemart_cart");
      localStorage.removeItem("livemart_active_address_full"); 
      window.dispatchEvent(new Event("livemart-cart-update"));
      
      const orderList = data.orders || [data]; // Capture array of orders
      
      // 1. Set the split status flag in localStorage
      if (orderList.length > 1) {
          localStorage.setItem('order_split_info', JSON.stringify({
              isSplit: true,
              orderIds: orderList.map(o => o._id || o.id),
              count: orderList.length,
          }));
      }
      
      setOrdersPlaced(orderList); // Set the list to check for splits in the modal
      setShowFinalSuccessModal(true); // Trigger the unified success modal
      
    }catch (e) {
      setSubmissionError("Order Failed: " + (e.message || e));
      console.error(e);
      handlePaymentFailure("Order Finalization Failed: " + (e.message || "Unknown Error"));
    } finally { 
      setLoading(false); 
    }
  }, [checkoutInfo, itemsWithDetails, handlePaymentFailure]);


  // --- OTP TIMER LOGIC ---
  useEffect(() => {
    if (isOtpModalOpen && otpTimer > 0) {
      otpTimerRef.current = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(otpTimerRef.current);
            handlePaymentFailure("Payment timeout. OTP expired.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isOtpModalOpen || otpTimer === 0) {
      clearInterval(otpTimerRef.current);
    }
    return () => clearInterval(otpTimerRef.current);
  }, [isOtpModalOpen, otpTimer, handlePaymentFailure]);

  // --- MAIN PLACE ORDER INITIATOR ---
  const handlePlaceOrder = async () => {
    if (!isShippingComplete) {
        setSubmissionError("Please complete the shipping information first.");
        return;
    }
    if (grandTotal <= 0 && selectedPaymentMethod !== 'COD') {
        setSubmissionError("Cannot place order with zero total amount unless COD is selected.");
        return;
    }
    
    setSubmissionError(null);
    setPaymentInitiating(true);

    if (selectedPaymentMethod === 'Card') {
        const validationError = validateCard(cardDetails);
        if (validationError) {
            setSubmissionError(validationError); 
            setShowCardModal(true); 
            setPaymentInitiating(false);
            return;
        }
        setFinalPaymentMethod('Card');
        const mock = generateMockOtp();
        setMockOtp(mock);
        setOtpInput('');
        setOtpTimer(30); 
        setIsOtpModalOpen(true);
        
    } else if (selectedPaymentMethod === 'UPI_ID') {
        const validationError = validateUpiId(upiId);
        if (validationError) {
            setSubmissionError(validationError);
            setShowUpiIdModal(true);
            setPaymentInitiating(false);
            return;
        }
        setFinalPaymentMethod(`UPI (ID: ${upiId})`);
        const mock = generateMockOtp();
        setMockOtp(mock);
        setOtpInput('');
        setOtpTimer(30);
        setIsOtpModalOpen(true);
        
    } else if (selectedPaymentMethod === 'COD') {
        const paymentId = `COD_${Date.now()}`;
        setFinalPaymentMethod('COD');
        await handleFinalizeOrder(paymentId, 'COD'); // Direct Finalize
    
    } else if (selectedPaymentMethod === 'UPI_QR') {
        setFinalPaymentMethod('UPI (QR Scan)');
        setShowUpiQrModal(true);
    }
    
    setPaymentInitiating(false);
  };
  
  // --- UPI QR CODE HANDLER ---
  const handleUpiQrSuccess = async () => {
    setShowUpiQrModal(false);
    setLoading(true);

    try {
      const paymentId = `UPI_QR_SCAN_${Date.now()}_MOCK`;
      const payRes = await fetch("/api/payments/mock/charge", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: grandTotal, method: 'UPI (QR Scan)' })
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.success) {
          throw new Error(payData.error || "Payment processing failed.");
      }
      await handleFinalizeOrder(payData.paymentId, 'UPI (QR Scan)');
    } catch (e) {
      handlePaymentFailure("UPI QR Payment Failed: " + (e.message || "Unknown error"));
    }
  };
  
  // --- OTP SUBMISSION HANDLER ---
  const handleOtpSubmit = async () => {
    if (otpInput === mockOtp) {
        setIsOtpModalOpen(false);
        setLoading(true);
        setSubmissionError(null);

        try {
            const payRes = await fetch("/api/payments/mock/charge", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: grandTotal, method: finalPaymentMethod })
            });
            const payData = await payRes.json();
            if (!payRes.ok || !payData.success) {
                throw new Error(payData.error || "Payment processing failed.");
            }
            await handleFinalizeOrder(payData.paymentId, finalPaymentMethod);
        } catch (e) {
            handlePaymentFailure("Payment Processing Failed: " + (e.message || "Unknown error"));
        }
    } else {
        handlePaymentFailure("Payment failed: Invalid OTP entered.");
    }
  };


  const fetchProductDetails = useCallback(async (cartItems) => {
    if (cartItems.length === 0) return;
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
      console.warn("Fee calculation failed");
    }
  }, []);
  
  const setActiveLocationAndReload = useCallback((addressObj) => {
    if (!addressObj || !addressObj.location?.coordinates) return;

    const [lng, lat] = addressObj.location.coordinates;
    const locData = {
      city: addressObj.city,
      pincode: addressObj.pincode,
      addressLine1: addressObj.addressLine1,
      lat, lng
    };
    localStorage.setItem("livemart_active_location", JSON.stringify(locData));
    localStorage.setItem("livemart_active_address_full", JSON.stringify(addressObj));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("livemart-location-update"));
      window.location.reload(); 
    }
  }, []);

  const handleAddressSelect = (address) => {
    setActiveLocationAndReload(address);
    setIsAddressModalOpen(false);
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

  // --- NEW: Handle updating editable contact fields ---
  const handleContactInfoChange = (field, value) => {
      setCheckoutInfo(prev => ({
          ...prev,
          [field]: value
      }));
  };

  const handleShippingContinue = () => {
      setSubmissionError(null); 
      if (!isCartValidForCheckout) {
          setCartError("One or more items are out of stock. Please return to cart to adjust.");
          return;
      }
      // Check for address (read-only from location) AND contact info (editable)
      if (!checkoutInfo.addressLine1 || !checkoutInfo.city || !checkoutInfo.email || !checkoutInfo.phone) {
          setCartError("Please ensure all shipping and contact details are filled.");
          return;
      }

      setIsShippingComplete(true);
      setActiveTab('payment');
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

  const handleConfirmBrowserBack = () => {
      setShowBrowserBackWarning(false);
      ignoreNextPopState.current = true; 
      if (targetUrl) {
          router.push(targetUrl);
      } else {
           router.back();
      }
  };


  // --- Initial Load Logic ---
  useEffect(() => {
    const initialCart = loadCart();
    if (initialCart.length === 0) {
        router.replace('/cart');
        return;
    }
    setCart(initialCart);
    
    router.beforePopState(({ url, as, options }) => {
        if (ignoreNextPopState.current) {
            ignoreNextPopState.current = false;
            return true;
        }
        if (router.pathname === '/checkout') {
            setTargetUrl(as);
            setShowBrowserBackWarning(true);
            return false;
        }
        return true;
    });

    async function init() {
      setLoading(true);
      
      let initialUser = null;
      let fullAddressObj = null;
      
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
      
      const savedLoc = localStorage.getItem("livemart_active_location");
      const savedFullAddress = localStorage.getItem("livemart_active_address_full"); 

      let initialAddress = null;

      if (savedFullAddress) {
          fullAddressObj = JSON.parse(savedFullAddress);
          initialAddress = {
              lat: fullAddressObj.location?.coordinates?.[1],
              lng: fullAddressObj.location?.coordinates?.[0],
              city: fullAddressObj.city, 
              pincode: fullAddressObj.pincode, 
              addressLine1: fullAddressObj.addressLine1
          };
      } else if (savedLoc) {
          initialAddress = JSON.parse(savedLoc);
      } else if (initialUser?.addresses?.length > 0) {
          const def = initialUser.addresses[0];
          fullAddressObj = def;
          initialAddress = {
              lat: def.location.coordinates[1],
              lng: def.location.coordinates[0],
              city: def.city, 
              pincode: def.pincode, 
              addressLine1: def.addressLine1,
          };
      }
      
      let info = { ...emptyAddress, email: initialUser?.email || '' };
      
      if (initialUser) {
          info.firstName = initialUser.name?.split(' ')[0] || '';
          info.lastName = initialUser.name?.split(' ').slice(1).join(' ') || '';
          info.phone = initialUser.phone || '';
      }
      
      if (fullAddressObj) {
          info = {
              ...info,
              ...fullAddressObj,
              location: initialAddress,
              countryCode: fullAddressObj.countryCode || info.countryCode, 
              phone: fullAddressObj.phone || info.phone,
          };
      } else if (initialAddress) {
           info = { ...info, ...initialAddress, location: initialAddress };
      }
      
      if (initialUser?.email && !info.email) info.email = initialUser.email;
      
      setCheckoutInfo(info);
      setCustomerLocation(initialAddress);
      
      if (initialCart.length > 0) {
         const uniqueIds = [...new Set(initialCart.map(i => i.productId))];
         Promise.all(uniqueIds.map(id => fetch(`/api/products/${id}`).then(r => r.ok ? r.json() : null)))
             .then(results => {
                 const detailsMap = {};
                 results.forEach(data => {
                     if (data && data.product) detailsMap[String(data.product._id)] = data.product;
                 });
                 setProductDetails(detailsMap);
                 setLoading(false);
             });
      } else {
         setLoading(false);
      }
    }
    
    init();
    
    return () => {
         window.removeEventListener("livemart-location-update", handleLocationUpdate);
         router.beforePopState(() => true);
    };
  }, [router]);
  
  // Handler definition was missing from useEffect deps in original code, adding here
  const handleLocationUpdate = () => {
      // Re-run init logic if location changes externally
      if (typeof window !== 'undefined') window.location.reload();
  };

  useEffect(() => {
    if (Object.keys(productDetails).length > 0 && customerLocation && cart.length > 0) {
        fetchDeliveryFee(cart, customerLocation);
    }
  }, [cart, productDetails, customerLocation, fetchDeliveryFee]);


  if (loading || cart.length === 0) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  // --- Shipping Summary Component ---
  const ShippingSummary = () => (
    <div className="p-6 md:p-8 space-y-4">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg mb-1">{checkoutInfo.firstName} {checkoutInfo.lastName}</h3>
                <p className="text-gray-600 text-sm">{checkoutInfo.addressLine1} {checkoutInfo.addressLine2}</p>
                <p className="text-gray-600 text-sm">{checkoutInfo.city}, {checkoutInfo.pincode}, {checkoutInfo.country}</p>
                <p className="text-gray-600 text-sm mt-2">Contact: {checkoutInfo.email} | {checkoutInfo.countryCode}{checkoutInfo.phone}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
                setIsShippingComplete(false);
                setActiveTab('shipping');
            }} className="mt-1">
                <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
        </div>
    </div>
  );

  const PaymentOptions = () => {
    const paymentActionDisabled = loading || paymentInitiating; 

    return (
        <div className="p-6 md:p-8 space-y-6">
            <h4 className="font-semibold text-xl">Select Payment Option</h4>
            
            <div className="grid gap-3">
                {PAYMENT_OPTIONS.map((option) => {
                    const isSelected = selectedPaymentMethod === option.id;

                    return (
                        <div 
                            key={option.id}
                            className={`border rounded-xl cursor-pointer transition-colors ${isSelected ? 'border-black bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
                            onClick={() => setSelectedPaymentMethod(option.id)}
                        >
                            <label className="flex items-center space-x-3 p-4 cursor-pointer justify-between">
                                <div className="flex items-center space-x-3">
                                    <input 
                                        type="radio" 
                                        name="paymentMethod" 
                                        checked={isSelected}
                                        onChange={() => setSelectedPaymentMethod(option.id)}
                                        className="h-4 w-4 text-black"
                                    />
                                    <option.icon className="h-5 w-5 text-gray-700" />
                                    <span className="font-medium text-lg">{option.label}</span>
                                </div>
                                
                                {isSelected && (option.id === 'Card' || option.id === 'UPI_ID') && (
                                     <div 
                                        className="bg-white p-2 rounded-lg shadow-md border border-gray-200 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            if (option.id === 'Card') setShowCardModal(true);
                                            if (option.id === 'UPI_ID') setShowUpiIdModal(true);
                                        }}
                                     >
                                        {validateCard(cardDetails) === null && option.id === 'Card' ?
                                            <CheckCircle className="w-6 h-6 text-green-600"/> :
                                            (validateUpiId(upiId) === null && option.id === 'UPI_ID' ?
                                                <CheckCircle className="w-6 h-6 text-green-600"/> :
                                                <Edit className="w-6 h-6 text-gray-400"/>)
                                        }
                                    </div>
                                )}
                                
                                {isSelected && option.id === 'UPI_QR' && (
                                     <div 
                                        className="bg-white p-2 rounded-lg shadow-md border border-gray-200 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowUpiQrModal(true);
                                        }}
                                     >
                                        <QrCode className="w-6 h-6 text-black"/>
                                    </div>
                                )}
                                
                                {/* COD badge for clarity */}
                                {isSelected && option.id === 'COD' && (
                                    <span className="text-sm font-semibold text-gray-500">
                                        Pay on Delivery
                                    </span>
                                )}
                            </label>
                            
                            {isSelected && option.id === 'COD' && (
                                <div className="p-4 pt-0">
                                    <Alert>
                                        <AlertDescription className="text-sm flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-primary"/> Pay the delivery partner <strong>{formatPrice(grandTotal)}</strong> upon receipt of your order.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <Button 
                onClick={handlePlaceOrder}
                disabled={paymentActionDisabled}
                className="w-full h-14 rounded-xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8"
            >
                {paymentInitiating ? <Loader2 className="h-6 w-6 animate-spin" /> : `Place Order & Pay ${formatPrice(grandTotal)}`}
            </Button>
        </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <CheckoutNavbar user={user} onLogout={handleLogout} />
      
      <main className="max-w-[1440px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-4 border-b border-gray-200 text-lg font-semibold mb-6">
                <button onClick={() => setActiveTab('shipping')} className={`pb-3 transition-colors ${activeTab === 'shipping' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}>Shipping Information</button>
                <button onClick={() => setActiveTab('payment')} disabled={!isShippingComplete} className={`pb-3 transition-colors ${!isShippingComplete ? 'opacity-50 cursor-not-allowed' : (activeTab === 'payment' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}`}>Payment</button>
            </div>

            {(cartError || submissionError) && (
              <Alert variant="destructive" className="mb-4"><AlertTitle>Checkout Error</AlertTitle><AlertDescription>{cartError || submissionError}</AlertDescription></Alert>
            )}

            <Card className="shadow-lg min-h-[400px]">
                {(activeTab === 'shipping' && !isShippingComplete) && (
                    <>
                        <CardHeader className="pb-0">
                            <CardTitle className="text-2xl flex items-center justify-between">
                                <span>Shipping Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <CheckoutAddressForm 
                                initialData={checkoutInfo} 
                                onContactChange={handleContactInfoChange} // Passed down
                                onContinue={handleShippingContinue} 
                            />
                        </CardContent>
                    </>
                )}
                
                {(activeTab === 'shipping' && isShippingComplete) && (
                     <>
                        <CardHeader className="pb-0">
                            <CardTitle className="text-2xl flex items-center justify-between"><span>Shipping Information</span><Check className="h-6 w-6 text-green-600" /></CardTitle>
                        </CardHeader>
                        <CardContent className="p-0"><ShippingSummary /></CardContent>
                    </>
                )}

                {activeTab === 'payment' && (
                    <>
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Wallet className="h-6 w-6" />
                                <span>Payment</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isShippingComplete ? (
                                <PaymentOptions />
                            ) : (
                                <p className="p-6 text-muted-foreground">Complete Shipping Information to proceed to payment.</p>
                            )}
                        </CardContent>
                    </>
                )}
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 space-y-6 max-h-[calc(100vh - 100px)] overflow-y-auto">
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle className="text-xl">Delivery Location</CardTitle>
                      <CardDescription>{customerLocation?.city || 'No Location Set'}</CardDescription>
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

              <CheckoutOrderSummary orderData={{ itemsWithDetails, totalSubtotalBeforeDiscount, totalDiscountAmount, totalFee, grandTotal }} />
            </div>
          </div>
        </div>
      </main>
      
      {user && <CustomerAddressModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} addresses={user.addresses || []} onSelect={handleAddressSelect} onAddressAdded={handleAddressAdded} />}
      <ManualLocationModal isOpen={showManualModal} onClose={() => setShowManualModal(false)} onLocationSet={handleManualLocationSet} />
      
      {/* Modals */}
      <Dialog open={showBrowserBackWarning} onOpenChange={setShowBrowserBackWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Leave Checkout?</DialogTitle><DialogDescription>Are you sure you want to leave the checkout page? Your progress may be lost.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setShowBrowserBackWarning(false)}>Stay on Page</Button><Button onClick={handleConfirmBrowserBack} variant="destructive">Yes, Exit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <MockOtpModal isOtpModalOpen={isOtpModalOpen} handlePaymentFailure={handlePaymentFailure} otpTimer={otpTimer} mockOtp={mockOtp} otpInput={otpInput} setOtpInput={setOtpInput} handleOtpSubmit={handleOtpSubmit} loading={loading} submissionError={submissionError} finalPaymentMethod={finalPaymentMethod || ''} userEmail={checkoutInfo.email} />

      <UpiQrModal isOpen={showUpiQrModal} onClose={() => handlePaymentFailure("UPI QR payment was cancelled or interrupted.")} onPaymentSuccess={handleUpiQrSuccess} grandTotal={grandTotal} />

      <CardInputModal isOpen={showCardModal} onClose={() => setShowCardModal(false)} cardDetails={cardDetails} setCardDetails={setCardDetails} onConfirm={() => { setShowCardModal(false); const mock = generateMockOtp(); setMockOtp(mock); setOtpInput(''); setOtpTimer(30); setFinalPaymentMethod('Card'); setIsOtpModalOpen(true); }} onCancel={() => setShowCardModal(false)} />

      <UpiIdInputModal isOpen={showUpiIdModal} onClose={() => setShowUpiIdModal(false)} upiId={upiId} setUpiId={setUpiId} onConfirm={() => { setShowUpiIdModal(false); const mock = generateMockOtp(); setMockOtp(mock); setOtpInput(''); setOtpTimer(30); setFinalPaymentMethod(`UPI (ID: ${upiId})`); setIsOtpModalOpen(true); }} onCancel={() => setShowUpiIdModal(false)} />
      
      {/* --- FINAL SUCCESS MODAL --- */}
      <OrderSuccessRedirectModal 
          isOpen={showFinalSuccessModal}
          ordersPlaced={ordersPlaced}
          onClose={() => {
            setShowFinalSuccessModal(false);
            router.replace('/orders'); // Redirects to Order History
          }}
      />
    </div>
  );
}

// -----------------------------------------------------------
// NEW COMPONENT: Unified Success Modal with Redirect to /orders
// -----------------------------------------------------------
const OrderSuccessRedirectModal = ({ isOpen, ordersPlaced, onClose }) => {
    const isSplit = ordersPlaced.length > 1;
    // Use the first order ID for display, fallback for missing ID
    const primaryOrderId = ordersPlaced[0]?._id?.slice(-6).toUpperCase() || ordersPlaced[0]?.id?.slice(-6).toUpperCase() || 'MOCK';
    
    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                    <div className="flex justify-center mb-2">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Order Placed Successfully!</DialogTitle>
                    <DialogDescription className="text-gray-600">
                        {isSplit ? (
                            <>
                                Your cart was split into <strong>{ordersPlaced.length} separate orders</strong> due to multiple retailers.
                                <p className="mt-1 text-sm text-gray-800 font-medium">Primary Order ID: #{primaryOrderId}</p>
                            </>
                        ) : (
                            <>
                                Your order has been successfully confirmed.
                                <p className="mt-1 text-sm text-gray-800 font-medium">Order ID: #{primaryOrderId}</p>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                
                <DialogFooter>
                    <Button 
                        onClick={onClose} 
                        className="w-full py-3 rounded-xl bg-black text-white font-bold text-lg hover:bg-gray-800"
                    >
                        Proceed to Order History
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// -----------------------------------------------------------
// MOCK/INPUT COMPONENTS (Unchanged)
// -----------------------------------------------------------

const MockOtpModal = ({ isOtpModalOpen, handlePaymentFailure, otpTimer, mockOtp, otpInput, setOtpInput, handleOtpSubmit, loading, submissionError, finalPaymentMethod, userEmail }) => {
    const paymentMethod = finalPaymentMethod || '';
    const contactMethod = paymentMethod === 'Card' || paymentMethod.startsWith('UPI') ? 
                          (userEmail || "your registered email/phone") : "your device";
    
    return (
        <Dialog open={isOtpModalOpen} onOpenChange={(open) => { if (!open) handlePaymentFailure("Payment cancelled by user."); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Secure Payment Verification</DialogTitle>
                <DialogDescription>
                  A One-Time Password (OTP) has been sent to **{contactMethod}**.
                  <p className="text-xs text-muted-foreground mt-1">
                      Payment Method: <strong>{finalPaymentMethod}</strong>
                  </p>
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4 text-center">
                <div className="flex items-center justify-center text-red-600 font-bold text-3xl">
                    <Timer className="h-6 w-6 mr-2 animate-pulse" /> {otpTimer}s
                </div>
                <Alert variant="destructive"><AlertDescription className="text-sm"><strong>[DEV MODE] Enter this OTP: {mockOtp}</strong></AlertDescription></Alert>
                <div className="space-y-2">
                    <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                    <Input id="otp" type="text" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" className="text-center text-2xl font-mono tracking-widest"/>
                    {submissionError && <p className="text-red-500 text-sm mt-2">{submissionError}</p>}
                </div>
                <div className="text-sm text-gray-500">You have {otpTimer} seconds remaining.</div>
              </div> 
              <DialogFooter>
                <Button variant="outline" onClick={() => handlePaymentFailure("Payment cancelled by user.")}>Cancel Payment</Button>
                <Button onClick={handleOtpSubmit} disabled={otpInput.length !== 6 || loading}>Verify & Pay</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    );
};

function UpiQrModal({ isOpen, onClose, onPaymentSuccess, grandTotal }) {
    const mockUpiId = "livemart@upi";
    const amount = (grandTotal / 100).toFixed(2); 
    const upiLink = `upi://pay?pa=${mockUpiId}&pn=LiveMart&am=${amount}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-xl">Scan to Pay ({formatPrice(grandTotal)})</DialogTitle>
                    <DialogDescription>Scan the QR code with any UPI app (GPay, PhonePe, Paytm).</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-center">
                    <div className="flex justify-center p-2 border border-gray-300 rounded-lg bg-white shadow-inner"><img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48" /></div>
                    <p className="text-2xl font-bold text-black">{formatPrice(grandTotal)}</p>
                    <p className="text-sm text-muted-foreground">Paying to: {mockUpiId}</p>
                </div>
                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button onClick={onPaymentSuccess} className="w-full bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-2"/> Simulate Payment Success</Button>
                    <Button type="button" variant="outline" onClick={() => onClose(false)} className="w-full">Cancel Payment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CardInputModal({ isOpen, onClose, cardDetails, setCardDetails, onConfirm, onCancel }) {
    const [localCardDetails, setLocalCardDetails] = useState(cardDetails);
    const [localError, setLocalError] = useState(null);

    useEffect(() => { if (isOpen) { setLocalCardDetails(cardDetails); setLocalError(null); } }, [isOpen, cardDetails]);
    
    const handleNumberChange = (e) => { setLocalCardDetails(prev => ({ ...prev, number: e.target.value.replace(/\D/g, '').slice(0, 16) })); setLocalError(null); };
    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
        else if (value.length === 2 && localCardDetails.expiry.length < 2) value = value + '/';
        setLocalCardDetails(prev => ({ ...prev, expiry: value.slice(0, 5) })); setLocalError(null);
    };
    const handleCvvChange = (e) => { setLocalCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })); setLocalError(null); };
    const handleNameChange = (e) => { setLocalCardDetails(prev => ({ ...prev, name: e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '') })); setLocalError(null); };

    const handleSave = (e) => {
        e.preventDefault();
        const validationError = validateCard(localCardDetails);
        if (validationError) { setLocalError(validationError); return; }
        setCardDetails(localCardDetails); onConfirm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Enter Card Details</DialogTitle><DialogDescription>Securely enter your debit or credit card information.</DialogDescription></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-4">
                     <Input placeholder="Card Number (16 Digits)" value={formatCardNumberDisplay(localCardDetails.number)} onChange={handleNumberChange} maxLength={19} required type="text"/>
                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="MM/YY" value={localCardDetails.expiry} onChange={handleExpiryChange} maxLength={5} required type="text"/>
                        <Input placeholder="CVV" value={localCardDetails.cvv} onChange={handleCvvChange} maxLength={3} required type="password" />
                    </div>
                    <Input placeholder="Cardholder Name (A-Z only)" value={localCardDetails.name} onChange={handleNameChange} type="text" required/>
                    {localError && <Alert variant="destructive"><AlertDescription className="text-xs">{localError}</AlertDescription></Alert>}
                    <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" className="bg-black hover:bg-gray-800"><Check className="w-4 h-4 mr-1"/> Confirm</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function UpiIdInputModal({ isOpen, onClose, upiId, setUpiId, onConfirm, onCancel }) {
    const [localUpiId, setLocalUpiId] = useState(upiId);
    const [localError, setLocalError] = useState(null);

    const handleUpiInputChange = (e) => { setLocalUpiId(e.target.value.replace(/[^a-zA-Z0-9@.]/g, '')); setLocalError(null); };

    useEffect(() => { if (isOpen) { setLocalUpiId(upiId); setLocalError(null); } }, [isOpen, upiId]);
    
    const handleSave = (e) => {
        e.preventDefault();
        const validationError = validateUpiId(localUpiId);
        if (validationError) { setLocalError(validationError); return; }
        setUpiId(localUpiId); onConfirm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Enter UPI ID</DialogTitle><DialogDescription>Enter your virtual payment address (VPA) for payment via UPI.</DialogDescription></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <Input placeholder="yourupiid@bank" value={localUpiId} onChange={handleUpiInputChange} required type="text"/>
                    {localError && <Alert variant="destructive"><AlertDescription className="text-xs">{localError}</AlertDescription></Alert>}
                    <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" className="bg-black hover:bg-gray-800"><Check className="w-4 h-4 mr-1"/> Confirm</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}