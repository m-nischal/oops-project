// src/pages/product/[id].js
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import SizeChartModal from "components/SizeChartModal";
import CustomerNavbar from "@/components/CustomerNavbar"; 
import StarRating from "@/components/StarRating"; 
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPinOff, Info, RefreshCw, MapPin } from "lucide-react";
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
  if (typeof product.totalStock === "number") return product.totalStock;
  if (Array.isArray(product.sizes)) return product.sizes.reduce((acc, it) => acc + (Number(it.stock || 0)), 0);
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
    const productId = product._id;
    
    const estimate = (locData) => {
        setCustomerLocation(locData);
        fetchDeliveryEstimate(productId, locData);
        setLocationError(false);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event("livemart-location-update"));
        }
    };

    const savedLoc = localStorage.getItem("livemart_active_location");
    if (savedLoc && !forcedBrowserLocation) {
        // 1. Use saved location (from Navbar selection or previous successful geolocation)
        estimate(JSON.parse(savedLoc));
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
  }, [fetchDeliveryEstimate]);


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
        if (sizes && sizes.length) {
          const first = sizes[0];
          const label = sizeLabelOf(first);
          setSelectedSize(label);
          setSelectedSizeStock(Number(first.stock || 0));
          setQty(1);
          prevQtyRef.current = 1;
        } else {
          setSelectedSize(null);
          setSelectedSizeStock(totalStockFrom(p));
          setQty(1);
          prevQtyRef.current = 1;
        }

        setSizeImage(sizeChartImageFor(p));
        
        // --- Init Location: Use combined logic ---
        const handleLocationUpdate = () => fetchAndSaveLocation(p);
        
        fetchAndSaveLocation(p); // Initial call for guest/logged-in check
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
  
  // Re-estimate when location changes (unchanged)
  useEffect(() => {
      if (product && customerLocation) {
          fetchDeliveryEstimate(product._id, customerLocation);
      }
  }, [product, customerLocation, fetchDeliveryEstimate]);

  const handleLocateMeClick = () => {
    // When the user explicitly clicks the button, bypass the saved location check 
    // to force a new browser location prompt.
    fetchAndSaveLocation(product, true); 
    setShowLocationHelp(false);
  };
  

  // ... (rest of the component functions remain unchanged) ...
  const handleQtyChange = (e) => {
    let newQty = Number(e.target.value);
    const maxStock = selectedSize ? selectedSizeStock : totalStockFrom(product);

    if (isNaN(newQty)) {
        newQty = 1;
    }
    newQty = Math.floor(Math.max(1, newQty));
    
    if (newQty > maxStock) {
        alert(`Quantity cannot exceed available stock (${maxStock}).`);
        newQty = maxStock;
    }
    
    setQty(newQty);
    prevQtyRef.current = newQty;
  }
  
  function incrementQty() {
    const newQty = Number(qty || 0) + 1;
    const maxStock = selectedSize ? selectedSizeStock : totalStockFrom(product);
    if (newQty > maxStock) {
        alert(`Only ${maxStock} units available.`);
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
    const desiredQty = Number(qty) || 1;
    setAdding(true);
    try {
      const cart = getCart();
      const pid = String(product._id || product._id);
      const existing = cart.find(i => i.productId === pid && i.size === selectedSize);

      if (existing) {
        existing.qty = Math.min(existing.qty + desiredQty, 999);
      } else {
        cart.push({
          productId: pid,
          name: product.name,
          price: product.price,
          size: selectedSize,
          qty: desiredQty,
          image: product.images && product.images[0]
        });
      }

      saveCart(cart);
      try { window.dispatchEvent(new Event("storage")); } catch (e) { /* ignore */ }

      setJustAdded(true);
      setAddedCount(desiredQty);
      setTimeout(() => { setJustAdded(false); }, 3500);
    } catch (err) {
      console.error(err);
      alert("Error adding to cart");
    } finally {
      setAdding(false);
    }
  }
  
  const getDeliveryDate = () => {
    if (!deliveryEstimate || !deliveryEstimate.estimatedDays) return "N/A";
    const date = new Date();
    date.setDate(date.getDate() + deliveryEstimate.estimatedDays);
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
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
  const totalStock = selectedSizeStock; 
  const incrementDisabled = qty >= totalStock;
  const decrementDisabled = qty <= 1;
  const isOutOfStock = totalStock <= 0;
  const chartImageUrl = sizeImage;
  const showChartButton = Boolean(chartImageUrl) && isClothingProduct(product);

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
                    const stock = Number(s.stock || 0);
                    return (
                      <Button
                        key={label}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => { setSelectedSize(label); setQty(1); }}
                        disabled={stock <= 0}
                        className={`font-semibold ${stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''} h-12 w-16`}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                    Stock: {selectedSize ? selectedSizeStock : totalStockFrom(product)} units
                </p>
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

                    {/* Add to Cart Button (unchanged) */}
                    <Button
                        onClick={handleAddToCart}
                        disabled={adding || isOutOfStock || (selectedSize && selectedSizeStock <= 0)}
                        className="flex-1 rounded-full py-6 text-lg bg-black text-white hover:bg-black/80"
                    >
                        {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add to Cart"}
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

                {/* Confirmation UI (unchanged) */}
                {justAdded && (
                    <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-md flex justify-between items-center">
                        <div>
                            <strong>{addedCount}</strong> item{addedCount > 1 ? "s" : ""} added to cart.
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
                            {getDeliveryDate()}
                        </strong> 
                        {deliveryEstimate?.estimatedDays !== null && ` (${deliveryEstimate?.estimatedDays} days)`}
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