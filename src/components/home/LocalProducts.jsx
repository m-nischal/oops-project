import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import CustomerAddressModal from "@/components/CustomerAddressModal";
import ManualLocationModal from "@/components/ManualLocationModal"; // <--- NEW IMPORT
import { Button } from "@/components/ui/button";
import { Loader2, MapPinOff, Info, RefreshCw, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function LocalProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  // Permission States
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  
  // Location State
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [locationLabel, setLocationLabel] = useState("Your Location");
  
  // Modal States
  const [showAddressModal, setShowAddressModal] = useState(false); // For Logged-in Users
  const [showManualModal, setShowManualModal] = useState(false); // <--- NEW: For Guests/No Products

  // --- CORE FETCH LOGIC (Moved to useCallback for stable reference) ---
  const fetchLocalProducts = React.useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?lat=${lat}&lng=${lng}&radius=50&limit=4`);
      const data = await res.json();
      setProducts(data.items || []);
    } catch (error) {
      console.error("Failed to fetch local products", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to update state and trigger fetch
  const updateLocationAndFetch = React.useCallback((lat, lng, city, pincode) => {
    setCoords({ lat, lng });
    setLocationLabel(`${city} ${pincode || ''}`);
    fetchLocalProducts(lat, lng);
    
    // Dispatch event so Navbar updates immediately
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event("livemart-location-update"));
    }
  }, [fetchLocalProducts]);

  // --- LOCATION INITIALIZATION ---
  const initLocation = React.useCallback(async () => {
    setLoading(true);

    // 1. Check LocalStorage FIRST (Source of truth from Navbar)
    const savedLoc = localStorage.getItem("livemart_active_location");
    if (savedLoc) {
      try {
        const { lat, lng, city, pincode } = JSON.parse(savedLoc);
        // Only trigger fetch if coordinates are valid
        if (lat && lng) {
          updateLocationAndFetch(lat, lng, city, pincode);
        }
        
        // Also fetch user if needed just to have the object
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
           const data = await res.json();
           setUser(data.user);
        }
        return;
      } catch (e) {
        console.error("Error parsing saved location", e);
      }
    }

    // 2. If No Storage, Check User Profile
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.role === "CUSTOMER") {
          setUser(data.user);
          
          if (data.user.addresses && data.user.addresses.length > 0) {
             const def = data.user.addresses[0];
             if(def.location?.coordinates) {
                const [lng, lat] = def.location.coordinates;
                
                // Save to storage
                const locData = {
                  city: def.city,
                  pincode: def.pincode,
                  addressLine1: def.addressLine1,
                  lat, lng
                };
                localStorage.setItem("livemart_active_location", JSON.stringify(locData));
                
                updateLocationAndFetch(lat, lng, def.city, def.pincode);
                return;
             }
          } else {
            // Logged in but no address? Ask to add one.
            setShowAddressModal(true);
            setLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      // Not logged in or error
    }

    // 3. Fallback: Browser Geolocation (Guest)
    requestBrowserLocation();
  }, [updateLocationAndFetch]);

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        const locData = { lat: latitude, lng: longitude, city: "Current", pincode: "Location" };
        localStorage.setItem("livemart_active_location", JSON.stringify(locData));
        
        updateLocationAndFetch(latitude, longitude, "Current", "Location");
        setPermissionDenied(false);
      },
      (error) => {
        console.warn("Location access denied:", error);
        setPermissionDenied(true);
        setLoading(false);
      }
    );
  };

  // --- EFFECT: Initial Load + Event Listener ---
  useEffect(() => {
    initLocation();

    // Listen for updates from Navbar
    const handleLocationUpdate = () => {
      const savedLoc = localStorage.getItem("livemart_active_location");
      if (savedLoc) {
        try {
          const { lat, lng, city, pincode } = JSON.parse(savedLoc);
          if (lat && lng) {
            updateLocationAndFetch(lat, lng, city, pincode);
          }
        } catch(e) {
          console.error("Failed to parse location update", e);
        }
      }
    };

    window.addEventListener("livemart-location-update", handleLocationUpdate);
    return () => window.removeEventListener("livemart-location-update", handleLocationUpdate);
  }, [initLocation, updateLocationAndFetch]);

  // Handlers for Modal interaction
  const handleAddressSelect = (address) => {
    setShowAddressModal(false);
    // AddressModal already calls the global location set event upon selection
  };

  const handleAddressAdded = (updatedUser) => {
    setUser(updatedUser);
    // CustomerAddressModal handles setting the new address to localStorage and dispatching update
  };
  
  // --- NEW HANDLER ---
  const handleManualLocationSet = (locData) => {
    // locData is already saved to localStorage inside the modal component
    setShowManualModal(false);
    // The modal also dispatched the 'livemart-location-update' event,
    // which our useEffect listener catches, automatically calling 
    // updateLocationAndFetch and refreshing the products.
  };
  // -------------------

  // --- RENDER ---

  if (loading && !showAddressModal) {
    return (
      <div className="py-20 flex justify-center w-full bg-white">
        <Loader2 className="animate-spin w-8 h-8 text-gray-300" />
      </div>
    );
  }

  // GUEST: Permission Denied State
  if (permissionDenied && !user && !coords) {
    return (
      <section className="w-full py-16 border-b border-gray-100 bg-gray-50">
        <div className="max-w-[1440px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-center uppercase tracking-tighter mb-6">
            Local Products
          </h2>
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <div className="bg-gray-200 p-4 rounded-full">
              <MapPinOff className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-600 max-w-md">
              We need your location to show you nearby products.
            </p>
            
            <Button 
              onClick={() => setShowPermissionHelp(true)}
              className="rounded-full px-8 bg-black text-white hover:bg-gray-800"
            >
              Allow Location
            </Button>
            
            {/* NEW: Manual Location button for guests */}
            <Button 
              onClick={() => setShowManualModal(true)}
              variant="link"
            >
              Or set location manually
            </Button>
            
          </div>
        </div>

        {/* --- PERMISSION HELP MODAL --- (UNCHANGED) */}
        <Dialog open={showPermissionHelp} onOpenChange={setShowPermissionHelp}>
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
                <p>Close this popup and click the button below to refresh.</p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={() => {
                  setShowPermissionHelp(false);
                  window.location.reload(); 
                }} 
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> I've Enabled It, Refresh Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* --- MANUAL LOCATION MODAL --- (For guest setting) */}
        <ManualLocationModal 
            isOpen={showManualModal} 
            onClose={() => setShowManualModal(false)}
            onLocationSet={handleManualLocationSet}
        />
        
      </section>
    );
  }

  return (
    <section className="w-full py-16 border-b border-gray-100">
      <div className="max-w-[1440px] mx-auto px-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 md:mb-14 gap-4">
            <h2 className="text-3xl md:text-5xl font-black text-center md:text-left uppercase tracking-tighter">
            Local Products
            </h2>
            
            {coords && (
                <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                    <MapPin className="w-4 h-4 mr-2 text-black" />
                    Showing items near: <strong className="ml-1 text-black">{locationLabel}</strong>
                </div>
            )}
        </div>

        {/* Address Modal for Logged In Users (unchanged) */}
        {user && (
          <CustomerAddressModal 
            isOpen={showAddressModal} 
            onClose={() => setShowAddressModal(false)}
            addresses={user.addresses || []} 
            onSelect={handleAddressSelect}
            onAddressAdded={handleAddressAdded}
          />
        )}
        
        {/* Manual Location Modal (For when results are empty) */}
        <ManualLocationModal 
            isOpen={showManualModal} 
            onClose={() => setShowManualModal(false)}
            onLocationSet={handleManualLocationSet}
        />


        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} label="LOCAL" />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href={`/products?lat=${coords?.lat}&lng=${coords?.lng}&radius=50`}>
                <Button variant="outline" className="rounded-full px-16 py-6 text-base border-gray-200 hover:bg-gray-50 transition-colors w-full md:w-auto">
                  View All Local
                </Button>
              </Link>
            </div>
          </>
        ) : (
            <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl">
                <p>No products found in this area.</p>
                {/* Check if coords are set, if not, location is probably denied/missing */}
                {coords ? (
                    // NEW: Button to open Manual Modal
                    <Button variant="link" onClick={() => setShowManualModal(true)}>
                        Try a different location
                    </Button>
                ) : (
                    // Fallback button for when location access is denied or initializing
                    <Button variant="link" onClick={() => setShowPermissionHelp(true)}>
                        Need help setting location?
                    </Button>
                )}
            </div>
        )}

      </div>
    </section>
  );
}