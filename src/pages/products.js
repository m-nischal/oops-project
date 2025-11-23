// src/pages/products.js
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import CustomerNavbar from "@/components/CustomerNavbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ChevronRight,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Filter,
  MapPin,
  Info, // Imported Info icon for the message
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// --- CONFIGURATION ---
const CATEGORIES = ["Men", "Women", "Boys", "Girls", "Unisex"];
const STYLES = ["Casual", "Formal", "Party", "Gym"];
const DEBOUNCE_DELAY = 300;

// --- CUSTOM DUAL RANGE SLIDER ---
const DualRangeSlider = ({ min, max, initialMin, initialMax, onChange }) => {
  // FIX: Initialize state directly from props. The component's key now handles re-initialization.
  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(initialMax);
  const minValRef = useRef(initialMin);
  const maxValRef = useRef(initialMax);
  const range = useRef(null);

  // Update ref's when internal state changes (for visual tracking)
  useEffect(() => {
    minValRef.current = minVal;
    maxValRef.current = maxVal;
  }, [minVal, maxVal]);

  const getPercent = useCallback(
    (value) => {
      if (max <= min) return 0;
      return Math.round(((value - min) / (max - min)) * 100);
    },
    [min, max]
  );

  useEffect(() => {
    if (range.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxValRef.current);
      if (!Number.isFinite(minPercent) || !Number.isFinite(maxPercent)) return;

      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, getPercent]);

  useEffect(() => {
    if (range.current) {
      const minPercent = getPercent(minValRef.current);
      const maxPercent = getPercent(maxVal);
      if (!Number.isFinite(minPercent) || !Number.isFinite(maxPercent)) return;

      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, getPercent]);

  // Final value propagation (runs when internal state changes)
  useEffect(() => {
    // Only call onChange if the slider bounds are initialized
    if (max > min) {
      onChange([minVal, maxVal]);
    }
  }, [minVal, maxVal, onChange, max, min]);

  return (
    // FIX: Ensure container has relative positioning for range track to work
    <div className="relative w-full flex items-center justify-center h-10 px-1"> 
      {/* Input 1: Min Value */}
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={(event) => {
          const value = Math.min(Number(event.target.value), maxVal - 1);
          setMinVal(value);
          minValRef.current = value;
        }}
        className="thumb thumb--left"
        style={{ zIndex: minVal > max - 100 ? "5" : "3" }} // Ensure thumb is above the other at edges
      />

      {/* Input 2: Max Value */}
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={(event) => {
          const value = Math.max(Number(event.target.value), minVal + 1);
          setMaxVal(value);
          maxValRef.current = value;
        }}
        className="thumb thumb--right"
      />

      {/* Visual Track Container */}
      <div className="slider relative w-full h-1.5">
        {/* Inactive Track (Grey Background) */}
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-gray-200 rounded-full z-[1]" />

        {/* Active Range (Black Foreground) */}
        <div
          ref={range}
          className="absolute top-0 bottom-0 bg-black rounded-full z-[2]"
        />
      </div>

      <style jsx>{`
        /* FIX: Apply styles to prevent thumb overflow and ensure correct stacking */
        .thumb {
          -webkit-appearance: none;
          -moz-appearance: none;
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          background: transparent;
          z-index: 3;
          margin: 0; /* Override default margin */
        }
        
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          background-color: white;
          border: 2px solid black; 
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          height: 20px;
          width: 20px;
          margin-top: 0px; 
          pointer-events: auto;
          position: relative;
        }

        .thumb::-moz-range-thumb {
          background-color: white;
          border: 2px solid black;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          height: 20px;
          width: 20px;
          pointer-events: auto;
          position: relative;
        }
        
        /* Hide tracks */
        .thumb::-webkit-slider-runnable-track,
        .thumb::-moz-range-track {
          box-shadow: none;
          border: none;
          background: transparent;
        }
      `}</style>
    </div>
  );
};

// --- HELPER COMPONENTS (rest remain the same) ---

const FilterSection = ({
  title,
  children,
  defaultOpen = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`py-5 border-b border-gray-200 last:border-0 ${className}`}>
      <div
        className="flex justify-between items-center cursor-pointer mb-4 group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-bold text-black group-hover:opacity-80 flex items-center">
          {title}
        </h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </div>
      {isOpen && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const Breadcrumbs = ({ path }) => (
  <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
    <Link href="/" className="hover:text-black transition-colors">
      Home
    </Link>
    {path.map((crumb, i) => {
      const label = typeof crumb === "string" ? crumb : crumb.label;
      const href = typeof crumb === "string" ? null : crumb.href;
      const isLast = i === path.length - 1;

      return (
        <React.Fragment key={i}>
          <ChevronRight className="h-4 w-4" />
          {isLast ? (
            <span className="text-black font-medium capitalize">{label}</span>
          ) : href ? (
            <Link
              href={href}
              className="hover:text-black capitalize transition-colors"
            >
              {label}
            </Link>
          ) : (
            <span className="hover:text-black capitalize transition-colors">
              {label}
            </span>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// --- MAIN PAGE COMPONENT ---

export default function ProductsPage() {
  const router = useRouter();
  const { categoryId, q, tag, lat, lng, radius, sort } = router.query;

  // --- State Declarations (Moved to the top to ensure definition before use) ---
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Initialize sortOption based on query/location
  const [sortOption, setSortOption] = useState(
    radius ? "distance" : "most-popular"
  );
  const [page, setPage] = useState(1);
  
  // Price States
  const [priceRange, setPriceRange] = useState([0, 1000]); // Transient slider value
  const [debouncedPriceRange, setDebouncedPriceRange] = useState([0, 1000]); // Value used for actual filtering
  const [sliderBounds, setSliderBounds] = useState({ min: 0, max: 1000 }); // Absolute min/max from API
  
  const [userLocation, setUserLocation] = useState(null);
  // ---------------------------------------------

  // 1. Initial/URL/Location Sync
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLoc = localStorage.getItem("livemart_active_location");
      if (savedLoc) {
        try {
          setUserLocation(JSON.parse(savedLoc));
        } catch (e) {
          console.error("Error parsing location", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    // This effect is now safe because sortOption is already initialized above.
    if (sort) {
      setSortOption(sort);
    } else if (radius) {
      setSortOption("distance");
    } else {
      setSortOption("most-popular");
    }
  }, [router.isReady, sort, radius]);
  
  // 2. Debounce handler for price range filtering
  const handlePriceRangeChange = useCallback((newRange) => {
      // Immediate update for slider smoothness
      setPriceRange(newRange); 
  }, []);

  // Debounce effect for filtering
  useEffect(() => {
      const handler = setTimeout(() => {
          // Only trigger filter once the value settles
          setDebouncedPriceRange(priceRange);
      }, DEBOUNCE_DELAY);

      return () => clearTimeout(handler);
  }, [priceRange]); // Dependency on raw priceRange from slider


  // 3. Filtering and Total calculation (uses debounced range)
  useEffect(() => {
    const filtered = products.filter(
        (p) => p.price >= debouncedPriceRange[0] && p.price <= debouncedPriceRange[1]
    );
    setFilteredProducts(filtered);
    setTotal(filtered.length);
  }, [debouncedPriceRange, products]);


  // --- PARTIAL MATCH DETECTION LOGIC (remains the same) ---
  const isPartialMatch = useMemo(() => {
    if (!q || products.length === 0) return false;
    const terms = q
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
    if (terms.length < 2) return false; 

    const hasExactMatch = products.some((product) => {
      const productText = [
        product.name,
        product.description,
        product.brand,
        product.category,
        ...(product.tags || []),
      ].join(" ").toLowerCase();
      return terms.every((term) => {
        const root = term.replace(/('s|s)$/, "");
        return productText.includes(root);
      });
    });

    return !hasExactMatch;
  }, [q, products]);
  // --------------------------------------------------------

  const handleSortChange = (value) => {
    setSortOption(value);
    const query = { ...router.query, sort: value };
    if (value === "distance" && !query.lat && userLocation) {
      query.lat = userLocation.lat;
      query.lng = userLocation.lng;
    }
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  };

  const handleLocalFilterClick = () => {
    if (userLocation && userLocation.lat && userLocation.lng) {
      router.push(
        `/products?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=50&sort=distance`
      );
    } else {
      alert(
        "Please set your delivery location using the 'Deliver to' button in the top bar first."
      );
    }
  };

  const getLinkWithLocalContext = (baseQuery) => {
    if (radius && lat && lng) {
      return `${baseQuery}&lat=${lat}&lng=${lng}&radius=${radius}`;
    }
    return baseQuery;
  };

  // 4. Data Fetching Effect (Handles Dynamic Max Price)
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryId) params.set("categoryId", categoryId);
        if (q) params.set("q", q);
        if (tag) params.set("tag", tag);
        if (lat) params.set("lat", lat);
        if (lng) params.set("lng", lng);
        if (radius) params.set("radius", radius);
        params.set("limit", 200);
        params.set("page", 1);

        if (sortOption === "price-low-high") params.set("sort", "price_asc");
        else if (sortOption === "price-high-low")
          params.set("sort", "price_desc");
        else if (sortOption === "newest") params.set("sort", "createdAt:desc");
        else if (sortOption === "distance") {
          params.set("sort", "distance");
          const targetLat = lat || userLocation?.lat;
          const targetLng = lng || userLocation?.lng;
          if (targetLat && targetLng) {
            params.set("lat", targetLat);
            params.set("lng", targetLng);
          }
        }

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        const items = data.items || [];

        setProducts(items);

        if (items.length > 0) {
            const prices = items.map((p) => p.price);
            const minP = 0;
            const rawMaxPrice = Math.max(...prices);
            
            // Calculate round-up magnitude (e.g., if max is 1499, round to nearest 100)
            const roundTo = Math.pow(10, Math.floor(Math.log10(rawMaxPrice)) - 1 || 1); 
            const maxP = Math.ceil(rawMaxPrice / roundTo) * roundTo; 

            const newBounds = { min: minP, max: maxP };
            
            // Reset bounds state
            setSliderBounds(newBounds);
            
            // FIX: Always reset filter range to the full bounds when new product data loads due to a core filter change.
            setPriceRange([minP, maxP]);
            setDebouncedPriceRange([minP, maxP]); 

        } else {
            // Reset states for empty results
            setSliderBounds({ min: 0, max: 1000 });
            setPriceRange([0, 1000]);
            setDebouncedPriceRange([0, 1000]);
        }
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setLoading(false);
      }
    }

    if (router.isReady) {
      // This dependency array guarantees auto-refresh when any filter/sort value changes.
      fetchProducts();
    }
  }, [
    router.isReady,
    categoryId,
    q,
    tag,
    lat,
    lng,
    radius,
    sortOption,
    userLocation,
  ]);

  const pageTitle = useMemo(() => {
    if (radius) return "Local Products";
    if (q) return `Results for "${q}"`;
    if (tag) return `${tag.charAt(0).toUpperCase() + tag.slice(1)} Style`;
    return "All Products";
  }, [q, tag, radius]);

  const breadcrumbPath = useMemo(() => {
    const crumbs = [];
    const hasFilter = radius || q || tag || categoryId;
    if (hasFilter) crumbs.push({ label: "All Products", href: "/products" });
    crumbs.push(pageTitle);
    return crumbs;
  }, [q, categoryId, tag, radius, pageTitle]);

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <CustomerNavbar />

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <Breadcrumbs path={breadcrumbPath} />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- LEFT SIDEBAR --- */}
          <aside className="hidden lg:block w-[295px] shrink-0 border border-gray-200 rounded-[20px] px-6 py-6 h-fit self-start sticky top-24">
            <div className="flex justify-between items-center pb-5 border-b border-gray-200">
              <h2 className="text-xl font-bold">Filters</h2>
              <SlidersHorizontal className="h-5 w-5 text-gray-400" />
            </div>

            <div className="py-4 border-b border-gray-200">
              <div
                className={`flex justify-between items-center cursor-pointer group p-2 rounded-lg transition-colors ${
                  radius
                    ? "bg-black text-white"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={handleLocalFilterClick}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-bold">Local Products</span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 ${
                    radius ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
            </div>

            <div className="py-5 border-b border-gray-200">
              <ul className="space-y-3 text-gray-600">
                {CATEGORIES.map((cat) => (
                  <li
                    key={cat}
                    className="flex justify-between items-center cursor-pointer group"
                  >
                    <Link
                      href={getLinkWithLocalContext(`/products?q=${cat}`)}
                      className={`w-full flex justify-between items-center transition-colors ${
                        q === cat ? "text-black font-bold" : "hover:text-black"
                      }`}
                    >
                      {cat}
                      <ChevronRight
                        className={`h-4 w-4 transition-colors ${
                          q === cat
                            ? "text-black"
                            : "text-gray-400 group-hover:text-black"
                        }`}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Filter Section */}
            <FilterSection title="Price">
              <div className="px-1 pt-2">
                <DualRangeSlider
                  // CRITICAL FIX 3: Use key to force re-initialization when bounds change
                  key={`${sliderBounds.min}-${sliderBounds.max}`}
                  min={sliderBounds.min}
                  max={sliderBounds.max}
                  // Pass initial state from the parent filter state
                  initialMin={priceRange[0]}
                  initialMax={priceRange[1]}
                  onChange={handlePriceRangeChange}
                />
                <div className="flex items-center justify-between gap-4 font-bold text-black mt-3">
                    {/* Display the debounced/filtered range */}
                    <div>₹{debouncedPriceRange[0]}</div>
                    <div>₹{debouncedPriceRange[1]}</div>
                </div>
              </div>
            </FilterSection>

            <FilterSection title="Dress Style">
              <ul className="space-y-3 text-gray-600">
                {STYLES.map((style) => (
                  <li
                    key={style}
                    className="flex justify-between items-center cursor-pointer group"
                  >
                    <Link
                      href={getLinkWithLocalContext(`/products?q=${style}`)}
                      className="w-full flex justify-between items-center hover:text-black transition-colors"
                    >
                      {style}{" "}
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            </FilterSection>

            <div className="pt-6">
              <Button
                onClick={() => (window.location.href = "/products")}
                className="w-full rounded-full h-12 text-base font-bold bg-black text-white hover:bg-gray-800 transition-all shadow-md"
              >
                Reset Filters
              </Button>
            </div>
          </aside>

          {/* --- RIGHT CONTENT --- */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h1 className="text-3xl font-bold capitalize tracking-tight">
                {pageTitle}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="hidden md:inline">
                  Showing 1-{filteredProducts.length} of {total} Products
                </span>

                <Button
                  variant="outline"
                  className="lg:hidden rounded-full h-10 w-10 p-0 bg-[#F0F0F0] border-none"
                >
                  <Filter className="h-5 w-5 text-black" />
                </Button>

                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap hidden sm:inline text-gray-500">
                    Sort by:
                  </span>
                  <Select value={sortOption} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px] border-none font-bold text-black bg-transparent focus:ring-0 p-0 h-auto gap-1 justify-end">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      align="end"
                      className="bg-white rounded-xl shadow-lg border border-gray-100"
                    >
                      <SelectItem value="distance">
                        Distance: Nearest First
                      </SelectItem>
                      <SelectItem value="most-popular">Most Popular</SelectItem>
                      <SelectItem value="newest">Newest Arrivals</SelectItem>
                      <SelectItem value="price-low-high">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price-high-low">
                        Price: High to Low
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* PARTIAL MATCH MESSAGE */}
            {isPartialMatch && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    We couldn't find exact matches for <strong>"{q}"</strong>.
                  </p>
                  <p className="text-sm text-yellow-700 mt-0.5">
                    Showing results for similar items instead.
                  </p>
                </div>
              </div>
            )}

            {/* PRODUCT GRID */}
            {loading ? (
              <div className="grid place-items-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-gray-300" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    label={radius ? "LOCAL" : null}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-2xl">
                <p className="text-xl font-bold text-gray-800">
                  No products found.
                </p>
                <p className="text-gray-500 mt-2">
                  Try adjusting your filters or search for something else.
                </p>
              </div>
            )}

            <Separator className="my-12" />

            <div className="flex justify-between items-center pb-10">
              <Button
                variant="outline"
                className="rounded-lg border-gray-200 h-10 px-4 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronRight className="h-4 w-4 rotate-180" /> Previous
              </Button>

              <div className="hidden sm:flex gap-2">
                <button className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-black">
                  1
                </button>
              </div>

              <Button
                variant="outline"
                className="rounded-lg border-gray-200 h-10 px-4 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={true}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}