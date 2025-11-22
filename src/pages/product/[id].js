// src/pages/product/[id].js
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import SizeChartModal from "components/SizeChartModal";
import CustomerNavbar from "@/components/CustomerNavbar"; 
import StarRating from "@/components/StarRating"; 
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, MapPinOff, Info, RefreshCw, MapPin, Truck, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


/* Helpers */
function sizeLabelOf(s) {
  if (!s) return "";
  return typeof s.size !== "undefined" ? String(s.size) : (typeof s.label !== "undefined" ? String(s.label) : "");
}
function slugify(s = "") {
  return String(s || "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}
function totalStockFrom(product = {}) {
  if (!product) return 0;
  // Use totalAvailable if calculated by API (Proxy logic), otherwise fallback to standard stock
  if (Array.isArray(product.sizes)) {
      return product.sizes.reduce((acc, it) => acc + (Number(it.totalAvailable ?? it.stock ?? 0)), 0);
  }
  return 0;
}
function isClothingProduct(product = {}) {
  const pt = (product.productType || "").toString().toLowerCase();
  const cat = (product.category || "").toString().toLowerCase();
  return pt.includes("cloth") || cat.includes("cloth") || (product.sizeChart && product.sizeChart.chartName);
}

/**
 * Determine the size-chart image URL for a product.
 */
function sizeChartImageFor(prod) {
  if (!prod) return null;
  if (prod.sizeChart && prod.sizeChart.image) return prod.sizeChart.image;
  const tryNames = [];
  if (prod.sizeChart && prod.sizeChart.chartName) tryNames.push(slugify(prod.sizeChart.chartName));
  if (prod.category) tryNames.push(slugify(prod.category));
  if (prod.productType) tryNames.push(slugify(prod.productType));
  for (const name of tryNames) {
    if (!name) continue;
    return `/images/sizecharts/${name}.png`;
  }
  if (isClothingProduct(prod)) return `/images/sizecharts/clothing-default.png`;
  return null;
}

/* Local cart helpers (consistent with cart page) */
function getCart() {
  try { return JSON.parse(localStorage.getItem("livemart_cart") || "[]"); } catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem("livemart_cart", JSON.stringify(cart)); }

// NEW HELPER: Find an item in the cart
function getCartItem(productId, sizeLabel) {
    const cart = getCart();
    return cart.find(i => String(i.productId) === String(productId) && String(i.size) === String(sizeLabel));
}


// Helper to format price
const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

// Rating helper ensures 0.0/0 display
function getDisplayRating(product) {
  if (Array.isArray(product.reviews) && product.reviews.length > 0) {
    const totalRating = product.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return { 
        rating: (totalRating / product.reviews.length), 
        count: product.reviews.length 
    };
  }
  return { rating: 0.0, count: 0 }; 
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Image Gallery State
  const [mainImage, setMainImage] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  // Retailer Info State
  const [ownerData, setOwnerData] = useState(null); 
  
  // Tab State
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'reviews', 'similar'
  // Similar Products State
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);


  // size & quantity
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedSizeStock, setSelectedSizeStock] = useState(0);
  const [selectedProxyStock, setSelectedProxyStock] = useState(0); // Wholesaler Stock
  // NEW STATES FOR PROXY CHECK UI
  const [localStock, setLocalStock] = useState(0); // Retailer Stock only (calculated)
  const [proxyCheckState, setProxyCheckState] = useState('initial'); // 'initial', 'checking', 'checked_available', 'checked_unavailable'
  
  const [qty, setQty] = useState(1);
  const prevQtyRef = useRef(1);

  const [adding, setAdding] = useState(false);

  // size chart modal
  const [chartOpen, setChartOpen] = useState(false);
  const [sizeImage, setSizeImage] = useState(null);

  // New: UI confirmation state
  const [justAdded, setJustAdded] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  // Delivery Estimation State
  const [deliveryEstimate, setDeliveryEstimate] = useState(null); 
  const [locationError, setLocationError] = useState(false);
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [customerLocation, setCustomerLocation] = useState(null);
  
  const isProxyProduct = product?.wholesaleSourceId;
  const isLocalStockZeroOrLess = localStock <= 0;

  // NEW HANDLER: For the Check Availability button
  const handleCheckAvailability = () => {
      if (!isProxyProduct || !isLocalStockZeroOrLess) return;
      setProxyCheckState('checking');

      // Simulate API call delay (stock is already in selectedProxyStock)
      setTimeout(() => {
          if (selectedProxyStock > 0) {
              setProxyCheckState('checked_available');
              setQty(Math.max(1, qty)); // Ensure qty is at least 1
              prevQtyRef.current = Math.max(1, qty);
          } else {
              setProxyCheckState('checked_unavailable');
              setQty(0); // Cannot order
              prevQtyRef.current = 0;
          }
      }, 500); // Simulate network delay
  };

  // Max quantity a user can select. Depends on proxyCheckState if locally out of stock.
  const maxQtyLimit = useMemo(() => {
      if (isProxyProduct && isLocalStockZeroOrLess) {
          // If local stock is zero/less, limit to wholesaler stock only if checked AND available
          if (proxyCheckState === 'checked_available') {
              return selectedProxyStock;
          }
          return 0; // Cannot order before checking / if unavailable
      }
      return selectedSizeStock; // Use total available (local + proxy) if local stock is > 0
  }, [isProxyProduct, isLocalStockZeroOrLess, proxyCheckState, selectedProxyStock, selectedSizeStock]);

  // Fetch Retailer/Owner Data
  const fetchOwnerData = useCallback(async (ownerId) => {
    try {
        const res = await fetch(`/api/public/user/${ownerId}`); 
        if (res.ok) {
            const data = await res.json();
            setOwnerData({
                ...data,
                rating: data.reviewCount > 0 ? data.rating : 0.0,
                reviewCount: data.reviewCount || 0
            });
        } else {
            setOwnerData({ name: 'Unknown Retailer', rating: 0.0, reviewCount: 0 });
        }
    } catch (e) {
        console.error("Failed to fetch owner data:", e);
        setOwnerData({ name: 'Unknown Retailer', rating: 0.0, reviewCount: 0 });
    }
  }, []);

  // Fetch Similar Products
  const fetchSimilarProducts = useCallback(async (productId, tags) => {
    if (tags.length === 0) return;
    setSimilarLoading(true);
    try {
      const tagString = tags.join(',');
      const res = await fetch(`/api/products/similar?productId=${productId}&tags=${tagString}`);
      if (res.ok) {
        const data = await res.json();
        setSimilarProducts(data.items);
      }
    } catch (e) {
      console.error("Failed to fetch similar products:", e);
    } finally {
      setSimilarLoading(false);
    }
  }, []);


  const fetchDeliveryEstimate = useCallback(async (productId, location) => {
      setDeliveryEstimate(null);
      if (!location || (!location.lat && !location.city)) {
          setLocationError(true);
          return;
      }
      setLocationError(false);
      try {
          const res = await fetch("/api/products/estimate-delivery", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  productId,
                  customerLocation: {
                      city: location.city,
                      pincode: location.pincode,
                      lat: location.lat,
                      lng: location.lng
                  }
              })
          });
          if (res.ok) {
              const data = await res.json();
              setDeliveryEstimate(data.estimation);
          } else {
              setDeliveryEstimate({ estimatedDays: null, reason: "Failed to estimate delivery" });
          }
      } catch (e) {
          setDeliveryEstimate({ estimatedDays: null, reason: "Network error during estimation" });
      }
  }, []);
  
  
  // --- CORE FIX: Combined function to handle guest/logged-in location persistence ---
  const fetchAndSaveLocation = useCallback((product, forcedBrowserLocation = false) => {
    // Helper to process valid location data
    const estimate = (locData) => {
        setCustomerLocation(locData);
        
        setLocationError(false);
    };

    const savedLoc = localStorage.getItem("livemart_active_location");
    if (savedLoc && !forcedBrowserLocation) {
        // 1. Use saved location (from Navbar selection or previous successful geolocation)
        try {
            estimate(JSON.parse(savedLoc));
        } catch(e) { /* ignore corrupt json */ }
        return;
    } 
    
    // 2. Try browser geolocation (Guest Fallback)
    if (!navigator.geolocation) {
        setLocationError(true); // Cannot use geolocation
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const locToSave = {
                lat: latitude, lng: longitude, 
                city: "Current", pincode: "Location" // Generic labels for browser location
            };
            
            // Save to storage immediately after successful fetch
            localStorage.setItem("livemart_active_location", JSON.stringify(locToSave));
            estimate(locToSave);
        },
        (error) => {
            console.warn("Location access denied:", error);
            setLocationError(true); // Set error state to show help button
        }
    );
  }, []);


  // --- Effect to load product & handle location listeners ---
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) { setProduct(null); return; }
        const json = await res.json();
        const p = json && json.product ? json.product : json;
        if (cancelled) return;
        setProduct(p);
        
        if (p.ownerId) {
            fetchOwnerData(p.ownerId);
        }
        
        // Fetch similar products after getting the main product data
        if (p.tags && p.tags.length > 0) {
            fetchSimilarProducts(p._id, p.tags);
        }


        setMainImage(p.images && p.images[0] ? p.images[0] : "/images/placeholder.png");

        const sizes = p?.sizes || [];
        const initialSize = sizes && sizes.length ? sizes[0] : null;
        const initialSizeLabel = initialSize ? sizeLabelOf(initialSize) : null;

        // Default stock is now totalAvailable (local + proxy)
        let defaultTotalStock = initialSize ? Number(initialSize.totalAvailable ?? initialSize.stock ?? 0) : totalStockFrom(p);
        let defaultProxy = initialSize ? Number(initialSize.proxyStock || 0) : 0;
        let defaultLocal = defaultTotalStock - defaultProxy; // CALCULATE LOCAL STOCK
        
        let defaultQty = 1;

        if (initialSizeLabel) {
            const currentCartItem = getCartItem(p._id, initialSizeLabel);
            if (currentCartItem) {
                defaultQty = currentCartItem.qty; 
            }
        }
        
        // Final state setup
        if (initialSize) {
          setSelectedSize(initialSizeLabel);
          setSelectedSizeStock(defaultTotalStock);
          setSelectedProxyStock(defaultProxy);
          setLocalStock(defaultLocal); // SET LOCAL STOCK
          setProxyCheckState(defaultLocal > 0 ? 'checked_available' : 'initial'); // Pre-check if local stock exists
        } else {
          setSelectedSize(null);
          setSelectedSizeStock(defaultTotalStock);
          setSelectedProxyStock(0);
          setLocalStock(0); // SET LOCAL STOCK
          setProxyCheckState('initial');
        }
        
        setQty(defaultQty); 
        prevQtyRef.current = defaultQty;
        
        setSizeImage(sizeChartImageFor(p));
        
        // --- Init Location ---
        const handleLocationUpdate = () => fetchAndSaveLocation(p);
        
        fetchAndSaveLocation(p); // Initial call
        window.addEventListener("livemart-location-update", handleLocationUpdate);
        
        return () => { 
            cancelled = true; 
            window.removeEventListener("livemart-location-update", handleLocationUpdate);
        };
      } catch (err) {
        console.error("Failed to load product:", err);
        setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchOwnerData, fetchSimilarProducts, fetchAndSaveLocation]);
  
  // Re-estimate when location changes (Logic separated from fetchAndSaveLocation to avoid recursion)
  useEffect(() => {
      if (product && customerLocation) {
          fetchDeliveryEstimate(product._id, customerLocation);
      }
  }, [product, customerLocation, fetchDeliveryEstimate]);

  // CRITICAL: Memoize Delivery Data Calculation
  const deliveryData = useMemo(() => {
    if (!deliveryEstimate || !deliveryEstimate.estimatedDays) return { dateString: "N/A", totalDays: null, baseDays: null, extraDays: 0 };
    
    const baseDays = deliveryEstimate.estimatedDays;
    // Check if we are actively relying on proxy stock for this size
    const isUsingProxyBuffer = isProxyProduct && isLocalStockZeroOrLess && selectedProxyStock > 0;
    
    // Extra days logic: 3 days buffer if using proxy stock
    const extraDays = isUsingProxyBuffer ? 3 : 0; 
    const totalDays = baseDays + extraDays;
    
    const date = new Date();
    date.setDate(date.getDate() + totalDays);
    const dateString = date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

    return { 
      dateString, 
      totalDays, 
      baseDays,
      extraDays 
    };
  }, [deliveryEstimate, isProxyProduct, isLocalStockZeroOrLess, selectedProxyStock]);

  const handleLocateMeClick = () => {
    // When the user explicitly clicks the button, bypass the saved location check 
    // to force a new browser location prompt.
    fetchAndSaveLocation(product, true); 
    setShowLocationHelp(false);
  };
  

  // --- FIXED QTY HANDLERS ---
  const handleSizeChange = (newSizeLabel) => {
    setSelectedSize(newSizeLabel);
    const newSize = product.sizes.find(s => sizeLabelOf(s) === newSizeLabel);
    
    // Update stock states based on the newly selected size variant
    const newTotal = newSize ? Number(newSize.totalAvailable ?? newSize.stock ?? 0) : 0;
    const newProxy = newSize ? Number(newSize.proxyStock || 0) : 0;
    const newLocal = newTotal - newProxy; // CALCULATE LOCAL STOCK (Retailer's stock)
    
    setSelectedSizeStock(newTotal);
    setSelectedProxyStock(newProxy);
    setLocalStock(newLocal); // SET LOCAL STOCK

    // CRITICAL FIX: Reset check state to force user to re-check if local stock is zero
    setProxyCheckState(newLocal > 0 ? 'checked_available' : 'initial');

    const currentCartItem = getCartItem(product._id, newSizeLabel);
    const cartQty = currentCartItem ? currentCartItem.qty : 1;
    setQty(cartQty);
    prevQtyRef.current = cartQty;
  }
  
  const handleQtyChange = (e) => {
    let newQty = Number(e.target.value);
    
    // Use the derived limit
    const maxStock = maxQtyLimit;

    if (isNaN(newQty)) {
        newQty = prevQtyRef.current; // Revert to previous valid quantity if input is NaN
    }
    
    newQty = Math.floor(Math.max(1, newQty));
    
    if (newQty > maxStock) {
        alert(`Maximum available units is ${maxStock}.`);
        newQty = maxStock;
    }
    
    setQty(newQty);
    prevQtyRef.current = newQty; // Update ref for next invalid input
  }
  
  function incrementQty() {
    const newQty = Number(qty || 0) + 1;
    const maxStock = maxQtyLimit; // Use the derived limit
    
    if (newQty > maxStock) {
        alert(`Only ${maxStock} units available in total.`);
        return;
    }
    setQty(newQty);
    prevQtyRef.current = newQty;
  }
  
  function decrementQty() {
    const newQty = Math.max(1, Number(qty || 0) - 1);
    setQty(newQty);
    prevQtyRef.current = newQty;
  }
  
  async function handleAddToCart() {
    if (!product) { alert("Product not loaded"); return; }
    
    const desiredTotalQty = Number(qty) || 1; // The value from the input field
    setAdding(true);
    
    try {
      const cart = getCart();
      const pid = String(product._id || product.id);
      const sizeLabel = selectedSize;

      if (!sizeLabel) { alert("Please select a size."); return; }
      
      // CRITICAL CHECK for proxy: must have checked availability for this size
      if (isProxyProduct && isLocalStockZeroOrLess) {
          if (proxyCheckState !== 'checked_available' || selectedProxyStock <= 0) {
              alert("Please check stock availability first.");
              return;
          }
          if (desiredTotalQty > selectedProxyStock) {
              alert(`Cannot order more than ${selectedProxyStock} units from wholesaler.`);
              return;
          }
      }

      const existingIndex = cart.findIndex(i => String(i.productId) === pid && String(i.size) === sizeLabel);
      
      
      if (desiredTotalQty === 0) {
          // If qty is 0, remove it from cart
          if (existingIndex > -1) {
              cart.splice(existingIndex, 1);
          }
      } else if (existingIndex > -1) {
          // Item exists: Update the quantity to the desired total
          cart[existingIndex].qty = desiredTotalQty;
      } else {
          // Item does not exist: Add it with the desired quantity
          cart.push({
              productId: pid,
              name: product.name,
              price: product.price,
              size: sizeLabel,
              qty: desiredTotalQty,
              image: product.images && product.images[0]
          });
      }
      
      // Filter out any items that ended up with qty <= 0 (e.g., if validation was used)
      const newCart = cart.filter(i => i.qty > 0);

      saveCart(newCart);
      
      setJustAdded(true);
      setAddedCount(desiredTotalQty); // Show the final quantity for clarity
      setTimeout(() => { setJustAdded(false); }, 3500);
      
      // If the cart was modified, trigger updates
      try { window.dispatchEvent(new Event("storage")); } catch (e) { /* ignore */ }
      
    } catch (err) {
      console.error(err);
      alert("Error adding to cart");
    } finally {
      setAdding(false);
    }
  }

  // --- END FIXED QTY HANDLERS ---
  
  // NOTE: getDeliveryDate removed, deliveryData useMemo used instead.
  
  const showDeliveryWarning = locationError && !loading;

  if (loading) return <>
      <CustomerNavbar />
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </>;
    
  if (!product) return <>
      <CustomerNavbar />
      <div className="p-10 text-center">Product not found.</div>
    </>;

  const displayRating = getDisplayRating(product);
  
  // Use maxQtyLimit for UI max (it's 0 if check not done/unavailable)
  const maxAvailableForUI = maxQtyLimit; 

  const incrementDisabled = qty >= maxAvailableForUI;
  const decrementDisabled = qty <= 1;
  const isOutOfStock = maxAvailableForUI <= 0 && proxyCheckState !== 'initial'; // Out of stock if the limit is 0 AND we've checked.
  
  // Disable add to cart if we are waiting for a check AND local stock is zero
  const isAddToCartDisabled = isProxyProduct && isLocalStockZeroOrLess && proxyCheckState !== 'checked_available';
  
  const chartImageUrl = sizeImage;
  
  const chartAvailable = Boolean(chartImageUrl) || Boolean(product.sizeChart?.data);
  const showChartButton = chartAvailable && isClothingProduct(product);

  const currentPrice = product.price || 0;
  const discountPercent = product.discount || 0;
  
  let originalPrice = product.originalPrice;
  if (!originalPrice && discountPercent > 0) {
      originalPrice = Math.round(currentPrice / (1 - (discountPercent / 100)));
  } else if (!originalPrice) {
      originalPrice = currentPrice;
  }
  const showOriginalPrice = discountPercent > 0 && originalPrice > currentPrice;
  
  const galleryImages = product.images || [];
  const thumbnailImages = galleryImages.slice(0, 4);
  const remainingImagesCount = galleryImages.length - 4;
  
  const retailerName = ownerData?.name || product.retailer || 'Unknown Retailer';
  const retailerRating = ownerData?.rating || 0.0;
  const retailerReviewCount = ownerData?.reviewCount || 0;


  return (
    <div className="min-h-screen bg-white font-sans">
      <CustomerNavbar />
      
      {/* Product Details Section */}
      <main className="max-w-[1440px] mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left Column: Thumbnails + Main Image (unchanged) */}
          <div className="w-full lg:w-1/2 flex gap-4">
            
            <div className="flex flex-col gap-4 overflow-y-auto shrink-0 pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {thumbnailImages.map((img, index) => (
                    <div 
                      key={index} 
                      className={`w-20 h-20 bg-[#F0EEED] rounded-md shrink-0 overflow-hidden border-2 cursor-pointer transition-all ${mainImage === img ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}
                      onClick={() => setMainImage(img)}
                    >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                    </div>
                ))}
                
                {remainingImagesCount > 0 && (
                     <Button 
                       variant="outline" 
                       className="w-20 h-20 text-xs font-bold shrink-0 flex items-center justify-center border-dashed"
                       onClick={() => setIsGalleryOpen(true)}
                     >
                        +{remainingImagesCount} images
                     </Button>
                )}
            </div>

            <div className="flex-1 bg-[#F0EEED] rounded-xl overflow-hidden aspect-square h-[calc(100vh-320px)] min-h-[400px]">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="space-y-2">
              {/* Decrease font size */}
              <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">
                {product.name}
              </h1>
              {/* Product Rating */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 py-2">
                 <StarRating rating={displayRating.rating} reviewCount={displayRating.count} /> 
                 {/* Explicitly show rating/5 */}
                 <span className="text-sm text-gray-500 ml-1">({displayRating.rating.toFixed(1)}/5)</span>
              </div>
              
              {/* Brand and Retailer Info */}
              <div className="flex justify-between items-center pt-2">
                  <p className="text-gray-500 text-lg">
                      <span className="font-semibold text-black">Brand: </span> {product.brand || 'N/A'}
                  </p>
              </div>
              <div className="flex justify-between items-center">
                  <p className="text-gray-500 text-lg">
                      <span className="font-semibold text-black">Sold by: </span> {retailerName}
                  </p>
                  <div className="flex items-center">
                      <StarRating 
                          rating={retailerRating} 
                          reviewCount={retailerReviewCount} 
                          starSize="h-4 w-4" 
                          className="text-sm"
                      />
                      {/* Show retailer rating explicitly */}
                      <span className="text-sm text-gray-500 ml-1">({retailerRating.toFixed(1)}/5)</span>
                  </div>
              </div>
            </div>
            
            {/* Price & Discount (unchanged) */}
            <div className="space-y-2">
                <div className="font-bold text-3xl flex items-baseline gap-3">
                    <span className="text-black">{formatPrice(currentPrice)}</span>
                    {showOriginalPrice && (
                        <span className="text-xl text-gray-400 line-through font-medium">
                            {formatPrice(originalPrice)}
                        </span>
                    )}
                </div>
                {discountPercent > 0 && (
                    <span className="text-base text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                        {discountPercent}% OFF
                    </span>
                )}
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-lg font-medium">Select Size</label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map(s => {
                    const label = sizeLabelOf(s);
                    const isSelected = label === selectedSize;
                    
                    // CRITICAL FIX: Only disable if the total stock for THIS size is 0
                    const totalAvailable = Number(s.totalAvailable ?? s.stock ?? 0);
                    const isDisabled = totalAvailable <= 0;

                    return (
                      <Button
                        key={label}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleSizeChange(label)}
                        disabled={isDisabled}
                        className={`font-semibold ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} h-12 w-16`}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>

                {/* --- UPDATED STOCK STATUS MESSAGE BLOCK (Styling Applied) --- */}
                {selectedSize && (
                   <div className={`text-sm mt-2 p-3 rounded-lg transition-all ${!isProxyProduct || !isLocalStockZeroOrLess ? 'border-green-200 bg-green-50' : 'border-gray-300 bg-white'}`}>
                  
                    {/* SCENARIO 1: Retailer has local stock (or not a proxy product) */}
                    {!isProxyProduct || !isLocalStockZeroOrLess ? (
                      <span className="text-green-700 font-medium">
                        In Stock ({localStock} units)
                      </span>
                    ) : (
                      /* SCENARIO 2: Proxy product, local stock is zero or less */
                      <>
                        {proxyCheckState === 'initial' ? (
                          /* State 2a: Initial state for proxy out-of-local-stock (Styled) */
                          <div className="flex items-center justify-between p-2 rounded-lg border border-red-300 bg-red-50">
                            <span className="text-red-800 font-semibold text-sm">No local stock. Check wholesaler for backorder.</span>
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={handleCheckAvailability} 
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
                              disabled={proxyCheckState === 'checking'}
                            >
                              {proxyCheckState === 'checking' ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    Checking...
                                  </>
                              ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Check Availability
                                  </>
                              )}
                            </Button>
                          </div>
                        ) : proxyCheckState === 'checking' ? (
                           <div className="flex items-center text-blue-600 font-medium p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking availability...
                           </div>
                        ) : (
                          /* State 2b: Availability checked */
                          <>
                            {selectedProxyStock > 0 ? (
                              /* Result 2b-i: Stock available at wholesaler */
                              <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                                <Truck className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">stock available at wholesaler : {selectedProxyStock}</p>
                                  <p className="text-xs mt-1">Please allow <strong>3-5 extra days</strong> for delivery.</p>
                                </div>
                              </div>
                            ) : (
                              /* Result 2b-ii: No stock available */
                              <span className="text-red-600 font-bold">no stock available</span>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
                {/* --- END UPDATED STOCK STATUS MESSAGE BLOCK --- */}


                {/* Size Chart Button in the middle-right area */}
                {showChartButton && (
                    <div className="flex justify-start pt-4">
                        <Button 
                            variant="link"
                            type="button" 
                            onClick={() => setChartOpen(true)}
                            className="p-0 h-auto text-blue-600 text-sm font-medium"
                        >
                            View Size Chart
                        </Button>
                    </div>
                )}
              </div>
            )}
            
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    {/* Quantity Changer */}
                    <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
                        {/* Minus Button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            onClick={decrementQty}
                            disabled={decrementDisabled || isOutOfStock}
                        >
                            −
                        </Button>
                        {/* Input Field */}
                        <Input
                           type="number"
                           value={qty}
                           onChange={handleQtyChange}
                           onBlur={handleQtyChange}
                           min="1"
                           className="w-16 h-12 text-center text-lg font-semibold border-none focus-visible:ring-0 px-0"
                           disabled={isOutOfStock}
                        />
                        {/* Plus Button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            onClick={incrementQty}
                            disabled={incrementDisabled || isOutOfStock}
                        >
                            +
                        </Button>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                        onClick={handleAddToCart}
                        // Use isAddToCartDisabled to respect the pre-check requirement
                        disabled={adding || isOutOfStock || isAddToCartDisabled}
                        className="flex-1 rounded-full py-6 text-lg bg-black text-white hover:bg-black/80"
                    >
                        {isAddToCartDisabled ? (
                          <>
                           <CheckCircle className="h-4 w-4" /> Check Stock First
                          </>
                        ) : adding ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : "Add to Cart"}
                    </Button>
                </div>
                
                {isOutOfStock && (
                    <Alert variant="destructive">
                        <AlertTitle>Out of Stock</AlertTitle>
                        <AlertDescription>
                            This item is currently unavailable in this size/variant.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Confirmation UI (updated message) */}
                {justAdded && (
                    <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-md flex justify-between items-center">
                        <div>
                            <strong>{addedCount}</strong> item{addedCount > 1 ? "s" : ""} now in cart.
                        </div>
                        <Link href="/cart">
                          <Button variant="outline" size="sm" className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200">
                            View cart
                          </Button>
                        </Link>
                    </div>
                )}
            </div>
            
            {/* Delivery Estimation (Show Location Instructions) */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-lg font-bold">
                    <MapPin className="w-5 h-5 text-black" />
                    Delivery
                </div>
                
                {showDeliveryWarning ? (
                    <div className="text-sm text-red-600 flex flex-col items-start space-y-2">
                        <span className="flex items-center">
                            <MapPinOff className="w-4 h-4 mr-2" />
                            Provide location for estimated delivery date.
                        </span>
                        <Button 
                            variant="link"
                            className="p-0 h-auto text-blue-600 text-sm"
                            onClick={() => setShowLocationHelp(true)}
                        >
                            Click here for location help
                        </Button>
                    </div>
                ) : (
                    <p className="text-lg">
                        Estimated Delivery by: 
                        <strong className="ml-2 text-green-700">
                            {deliveryData.dateString}
                        </strong> 
                        {deliveryData.totalDays !== null && ` (${deliveryData.totalDays} days)`}
                        
                        {deliveryData.extraDays > 0 && (
                            <span className="text-sm text-red-600 ml-2 font-medium block md:inline-block">
                                (+{deliveryData.extraDays} days for Wholesaler handling)
                            </span>
                        )}
                    </p>
                )}
            </div>
            
          </div>
        </div >
      </main>

      {/* --- Toggle Buttons and Content Area (unchanged) --- */}
      <div className="max-w-[1440px] mx-auto px-6 py-10">
          
          {/* Toggle Buttons evenly spaced */}
          <div className="flex justify-between border-b border-gray-300 mb-6 font-semibold text-lg gap-8">
              <button 
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 text-center pb-3 transition-colors ${activeTab === 'details' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
              >
                  Product Details
              </button>
              <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 text-center pb-3 transition-colors ${activeTab === 'reviews' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
              >
                  Ratings and Reviews
              </button>
              <button 
                  onClick={() => setActiveTab('similar')}
                  className={`flex-1 text-center pb-3 transition-colors ${activeTab === 'similar' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
              >
                  Similar Products
              </button>
          </div>
          
          {/* Content Based on Active Tab */}
          {activeTab === 'details' && (
              <ProductDetailsTab product={product} />
          )}
          
          {activeTab === 'reviews' && (
              <ReviewsTab product={product} displayRating={displayRating} />
          )}
          
          {activeTab === 'similar' && (
              <SimilarProductsTab products={similarProducts} loading={similarLoading} />
          )}
          
      </div>


      {/* Size Chart Modal (unchanged) */}
      <SizeChartModal
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        imageUrl={chartImageUrl}
        title={product.sizeChart?.chartName || "Size Chart"}
      />
      
      {/* Location Help Modal (INSTRUCTIONS COPIED FROM LocalProducts.jsx) */}
      <Dialog open={showLocationHelp} onOpenChange={setShowLocationHelp}>
        <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Enable Location Access
              </DialogTitle>
              <DialogDescription>
                Your browser is blocking location access. Here is how to fix it:
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2 text-sm text-gray-600">
              <div className="flex gap-3 items-start">
                <div className="bg-gray-100 px-2 py-1 rounded font-mono text-xs font-bold text-black">1</div>
                <p>Click the <strong>Lock icon</strong> or <strong>Settings icon</strong> on the left side of your address bar (URL bar).</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-gray-100 px-2 py-1 rounded font-mono text-xs font-bold text-black">2</div>
                <p>Look for <strong>Location</strong> permissions and switch it to <strong>Allow</strong> or toggle it On.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-gray-100 px-2 py-1 rounded font-mono text-xs font-bold text-black">3</div>
                <p>Close this popup and use the "Deliver to" button in the Navbar, or click the button below to refresh.</p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={handleLocateMeClick} // Use new handler to re-trigger geolocation
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> I've Enabled It, Refresh Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Full Image Gallery Modal (for +X button) */}
        <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Product Gallery ({galleryImages.length} Images)</DialogTitle>
                    <DialogDescription>Click any image to set it as the main view.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                    {galleryImages.map((img, index) => (
                        <div 
                            key={index} 
                            className="bg-[#F0EEED] rounded-md overflow-hidden aspect-square border-2 border-transparent hover:border-black cursor-pointer"
                            onClick={() => {
                                setMainImage(img);
                                setIsGalleryOpen(false);
                            }}
                        >
                            <img 
                                src={img} 
                                alt={`Gallery image ${index + 1}`} 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}

// -----------------------------------------------------------
// TAB COMPONENTS
// -----------------------------------------------------------
const DETAIL_LABELS = {
  materialComposition: "Material Composition",
  sleeveType: "Sleeve Type",
  materialType: "Material Type",
  fitType: "Fit Type",
  length: "Length",
  neckStyle: "Neck Style",
  countryOfOrigin: "Country of Origin",
};

function ProductDetailsTab({ product }) {
    // FIX: Guard clause for null product object
    if (!product) return null;

    const details = product.productDetails || {};
    
    const processedDetails = [];

    // 1. Process ProductDetails properties, handling embedded lists/strings
    for (const key of Object.keys(DETAIL_LABELS)) {
        let value = details[key];
        
        if (value) {
            // Check for newline or semicolon separators to handle common inline formatting errors.
            if (typeof value === 'string' && (value.includes('\n') || value.includes(';'))) {
                const primaryParts = value.split(/\r?\n|\;/)
                                          .map(p => p.trim())
                                          .filter(p => p.length > 0);
                
                primaryParts.forEach(part => {
                    const [subKey, subValue] = part.split(':').map(s => s.trim());
                    
                    if (subKey && subValue) {
                        // Found a valid "Key : Value" pair
                        processedDetails.push({ key: subKey, value: subValue });
                    } else {
                         // If no colon, use the generic label
                         processedDetails.push({ key: DETAIL_LABELS[key], value: part });
                    }
                });
            } else if (typeof value === 'string' && value.includes(':')) {
                 // Handle "Key : Value" string if it's the only detail in that field
                 const [subKey, subValue] = value.split(':').map(s => s.trim());
                 if (subKey && subValue) {
                     processedDetails.push({ key: subKey, value: subValue });
                 } else {
                     processedDetails.push({ key: DETAIL_LABELS[key], value });
                 }
            } else {
                // Simple key-value pair, use the generic label
                processedDetails.push({ key: DETAIL_LABELS[key], value });
            }
        }
    }
    // 2. Process multi-line description if it exists
    if (product.description && typeof product.description === 'string') {
        const descriptionLines = product.description.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        descriptionLines.forEach(line => {
            const [key, ...rest] = line.split(':').map(s => s.trim());
            const value = rest.join(':').trim();
            if (key && value) {
                // Assume the line is a key:value pair
                processedDetails.push({ key, value });
            }
        });
    }

    
    return (
        <div className="py-4 flex flex-col items-center">
            <div className="max-w-2xl w-full"> {/* Center content container */}
                <h2 className="text-xl font-bold mb-4 text-center">Detailed Product Specifications</h2>
                {/* Product Description */}
                {/* NOTE: We removed product.description rendering here in favor of the structured listing below, but keeping it commented out in case it's needed. */}

                {/* Display details one after the other */}
                {processedDetails.length > 0 ? (
                    <div className="space-y-3">
                        {processedDetails.map(({ key, value }, index) => (
                            <div key={key + index} className="flex justify-between items-center border-b border-gray-100 pb-2">
                                {/* Key is 40% width, bold */}
                                <span className="font-bold text-black" style={{ flexBasis: '40%' }}>{key}:</span>
                                {/* Value is 60% width, regular weight */}
                                <span className="text-gray-700" style={{ flexBasis: '60%', textAlign: 'right' }}>{String(value)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center">No detailed specifications provided for this product.</p>
                )}
                
                <div className="mt-8 text-center">
                    <h3 className="text-lg font-bold mb-2">Materials & Tags</h3>
                    <p className="text-gray-700">Materials: {(product.materials || []).join(', ') || 'N/A'}</p>
                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {(product.tags || []).map(tag => (
                            <span key={tag} className="px-3 py-1 text-sm bg-gray-100 rounded-full text-gray-700">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReviewsTab({ product, displayRating }) {
    // FIX: Guard clause for null product object
    if (!product) return null;

    const reviews = product.reviews || [];

    if (reviews.length === 0) {
        return (
            <div className="py-10 text-center text-muted-foreground">
                <h2 className="text-xl font-bold">No reviews yet.</h2>
                <p>Be the first to review this product!</p>
            </div>
        );
    }
    
    // Display summary and list reviews
    return (
        <div className="py-4">
            <h2 className="text-xl font-bold mb-4">Customer Rating Summary</h2>
            <div className="flex items-center space-x-4 mb-8">
                <span className="text-4xl font-bold text-black">{displayRating.rating.toFixed(1)}/5</span>
                <StarRating rating={displayRating.rating} reviewCount={displayRating.count} starSize="h-6 w-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review, index) => (
                    <div key={review._id || index} className="p-4 border rounded-lg">
                        <div className="font-bold text-sm">{review.author || 'Anonymous'}</div>
                        <StarRating rating={review.rating} starSize="h-3 w-3" className="mt-1" />
                        <p className="text-xs text-gray-500 mt-2">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">Posted on {new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SimilarProductsTab({ products, loading }) {
    if (loading) {
        return <div className="py-10 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-300" /></div>;
    }
    
    if (products.length === 0) {
        return (
            <div className="py-10 text-center text-muted-foreground">
                <h2 className="text-xl font-bold">No similar products found.</h2>
                <p>Try browsing our categories instead.</p>
            </div>
        );
    }

    return (
        <div className="py-4">
            <h2 className="text-xl font-bold mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map(product => (
                    <ProductCard key={product._id} product={product} label="Similar" />
                ))}
            </div>
        </div>
    );
}