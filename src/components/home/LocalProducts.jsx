// src/components/home/LocalProducts.jsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import CustomerAddressModal from "@/components/CustomerAddressModal";
import { Button } from "@/components/ui/button";
import { Loader2, MapPinOff, Info, RefreshCw } from "lucide-react";
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
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 1. Check User & Location on Mount
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // A. Check if logged in
        const res = await fetch("/api/auth/me", { credentials: "include" });
        
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === "CUSTOMER") {
            setUser(data.user);
            
            // Check Session Storage to see if we already asked this session
            const hasSeenPrompt = sessionStorage.getItem("location_prompt_shown");
            
            if (!hasSeenPrompt) {
              // If not seen, show modal
              setShowAddressModal(true);
            } else {
              // If seen, try to use the last selected address from session or default to first address
              // For simplicity, we'll just pick the first address if it exists to load data immediately
              if (data.user.addresses && data.user.addresses.length > 0) {
                 const def = data.user.addresses[0];
                 if(def.location?.coordinates) {
                    const [lng, lat] = def.location.coordinates;
                    setCoords({ lat, lng });
                    fetchLocalProducts(lat, lng);
                 }
              }
            }
            setLoading(false);
            return; 
          }
        }
        
        // B. If Guest: Check Local Storage first
        const savedLocation = localStorage.getItem("guest_location");
        if (savedLocation) {
          const { lat, lng } = JSON.parse(savedLocation);
          setCoords({ lat, lng });
          fetchLocalProducts(lat, lng);
        } else {
          // C. If no saved location, ask browser
          requestBrowserLocation();
        }

      } catch (e) {
        // Fallback to guest flow
        requestBrowserLocation();
      }
    }
    init();
  }, []);

  // 2. Helper: Request Browser Location (Guest Flow)
  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Save to State
        setCoords({ lat: latitude, lng: longitude });
        
        // Save to Local Storage (Persist for future visits)
        localStorage.setItem("guest_location", JSON.stringify({ lat: latitude, lng: longitude }));
        
        // Fetch Data
        fetchLocalProducts(latitude, longitude);
        setPermissionDenied(false);
      },
      (error) => {
        console.warn("Location access denied:", error);
        setPermissionDenied(true);
        setLoading(false);
      }
    );
  };

  // 3. Fetch Products Logic
  const fetchLocalProducts = async (lat, lng) => {
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
  };

  // 4. Handle Address Selection (Customer Flow)
  const handleAddressSelect = (address) => {
    if (address && address.location && address.location.coordinates) {
      const [lng, lat] = address.location.coordinates;
      setCoords({ lat, lng });
      fetchLocalProducts(lat, lng);
      
      // Close modal and Mark as seen in Session Storage
      setShowAddressModal(false);
      sessionStorage.setItem("location_prompt_shown", "true");
    } else {
      alert("Selected address does not have valid coordinates.");
    }
  };

  const handleAddressAdded = (updatedUser) => {
    setUser(updatedUser);
  };

  // --- RENDER HELPERS ---

  if (loading && !showAddressModal) {
    return (
      <div className="py-20 flex justify-center w-full bg-white">
        <Loader2 className="animate-spin w-8 h-8 text-gray-300" />
      </div>
    );
  }

  // GUEST: Permission Denied State
  if (permissionDenied && !user) {
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
              We can't show you local products because location access was denied.
            </p>
            
            <Button 
              onClick={() => setShowPermissionHelp(true)}
              className="rounded-full px-8 bg-black text-white hover:bg-gray-800"
            >
              Allow Location
            </Button>
          </div>
        </div>

        {/* --- PERMISSION HELP MODAL --- */}
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
      </section>
    );
  }

  // If everything is loaded but no products found
  if (!loading && !showAddressModal && products.length === 0 && coords) {
     return (
      <section className="w-full py-16 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-black text-center uppercase tracking-tighter mb-10">
            Local Products
          </h2>
          <div className="text-center py-10 text-gray-500">
            <p>No local products found within 50km of your location.</p>
            {/* Only show "Change Location" to Guests, Customers use Profile */}
            {!user && (
                <Button 
                variant="link" 
                onClick={() => {
                    localStorage.removeItem("guest_location");
                    window.location.reload();
                }}
                className="text-black underline"
                >
                Change Location
                </Button>
            )}
          </div>
        </div>
        {/* Keep Modal Mounted even if no products found, just in case */}
        {user && (
          <CustomerAddressModal 
            isOpen={showAddressModal} 
            addresses={user.addresses || []} 
            onSelect={handleAddressSelect}
            onAddressAdded={handleAddressAdded}
          />
        )}
      </section>
     );
  }

  return (
    <section className="w-full py-16 border-b border-gray-100">
      <div className="max-w-[1440px] mx-auto px-6">
        
        <h2 className="text-3xl md:text-5xl font-black text-center uppercase tracking-tighter mb-10 md:mb-14">
          Local Products
        </h2>

        {/* Customer Address Modal */}
        {user && (
          <CustomerAddressModal 
            isOpen={showAddressModal} 
            addresses={user.addresses || []} 
            onSelect={handleAddressSelect}
            onAddressAdded={handleAddressAdded}
          />
        )}

        {/* Product Grid */}
        {products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {products.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  label="LOCAL"
                />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href={`/products?lat=${coords?.lat}&lng=${coords?.lng}&radius=50`}>
                <Button variant="outline" className="rounded-full px-16 py-6 text-base border-gray-200 hover:bg-gray-50 transition-colors w-full md:w-auto">
                  View All
                </Button>
              </Link>
            </div>
          </>
        )}

      </div>
    </section>
  );
}