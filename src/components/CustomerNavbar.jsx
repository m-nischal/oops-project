// src/components/CustomerNavbar.jsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Search, ShoppingCart, User, LogOut, Settings, UserCircle, MapPin, LogIn, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomerAddressModal from "@/components/CustomerAddressModal";
import ManualLocationModal from "@/components/ManualLocationModal"; // <--- NEW IMPORT

// Helper to load cart from localStorage
function loadCart() {
  try { return JSON.parse(localStorage.getItem("livemart_cart") || "[]"); } catch (e) { return []; }
}

export default function CustomerNavbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // --- Cart State (Tracks unique item count) ---
  const [cartItemCount, setCartItemCount] = useState(0); 

  // --- Address & Modal State ---
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false); // <--- NEW STATE

  // Helper: Update Cart Count
  const updateCartCount = () => {
    const cart = loadCart();
    // Count is the number of distinct items (cart array length)
    setCartItemCount(cart.length); 
  };

  // Helper: Update Local Storage & Dispatch Event
  const setActiveLocation = (addressObj) => {
    if (!addressObj) return;
    
    // Extract standard format
    const locData = {
      city: addressObj.city,
      pincode: addressObj.pincode,
      addressLine1: addressObj.addressLine1,
      lat: addressObj.location?.coordinates?.[1],
      lng: addressObj.location?.coordinates?.[0]
    };

    // Save to persistent storage
    localStorage.setItem("livemart_active_location", JSON.stringify(locData));
    
    // Update State
    setSelectedAddress(addressObj);

    // Notify other components (like LocalProducts)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("livemart-location-update"));
      // --- MODIFIED: Force reload after setting saved location ---
      window.location.reload(); 
      // ----------------------------------------------------
    }
  };

  // Check if user is logged in on mount
  useEffect(() => {
    // Initial cart load
    updateCartCount();
    
    // Listen for storage events (cart changes)
    const handleStorageChange = (e) => {
        // Since we modify the cart in the product/cart pages, listening to 'storage' 
        // and manually calling the update handles cross-tab and in-tab updates.
        updateCartCount();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("livemart-cart-update", updateCartCount); // Custom event listener for cart changes

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          
          // --- LOCATION INITIALIZATION LOGIC ---
          const savedLoc = localStorage.getItem("livemart_active_location");
          
          if (savedLoc) {
            const parsed = JSON.parse(savedLoc);
            setSelectedAddress({
              city: parsed.city,
              pincode: parsed.pincode,
              addressLine1: parsed.addressLine1,
              location: { coordinates: [parsed.lng, parsed.lat] }
            });
          } else if (data.user?.addresses?.length > 0) {
            setSelectedAddress(data.user.addresses[0]);
          }
        } else {
          setUser(null);
          const savedLoc = localStorage.getItem("livemart_active_location");
          if (savedLoc) {
             const parsed = JSON.parse(savedLoc);
             setSelectedAddress({
               city: parsed.city || "Current",
               pincode: parsed.pincode || "Location",
               addressLine1: parsed.addressLine1
             });
          }
        }
      } catch (e) {
        setUser(null);
      }
    }
    checkAuth();
    
    return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("livemart-cart-update", updateCartCount);
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("token");
      setUser(null);
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  // --- NEW HANDLER for Manual Location Set ---
  const handleManualLocationSet = (locData) => {
    // locData is already saved to localStorage and reload is handled in ManualLocationModal
    setShowManualModal(false);
  };
  // ----------------------------------------
  
  // --- Handle Address Actions (unchanged for logged-in) ---
  const handleAddressSelect = (address) => {
    setActiveLocation(address);
    setIsAddressModalOpen(false);
  };

  const handleAddressAdded = (updatedUser) => {
    setUser(updatedUser); 
    if (updatedUser.addresses && updatedUser.addresses.length > 0) {
      setActiveLocation(updatedUser.addresses[updatedUser.addresses.length - 1]);
    }
  };

  const handleDeliverToClick = () => {
    if (!user) {
      // MODIFIED: Open manual location modal for guests
      setShowManualModal(true); //
    } else {
      // Logged in users still open the Customer Address modal for saved addresses
      setIsAddressModalOpen(true);
    }
  };

  const categories = ["Men", "Women", "Girls", "Boys"];
  const items = ["Shirts", "T-shirts", "Hoodies", "Sweatshirts", "Jeans", "Shorts", "Tracks"];

  return (
    <>
      <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 font-sans">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center gap-8">
          
          {/* 1. Logo */}
          <Link href="/" className="text-3xl font-black tracking-tighter uppercase">
            LiveMart
          </Link>

          {/* 2. Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-base font-medium text-black/80">
            <div className="relative group h-full flex items-center">
              <span className="cursor-pointer hover:text-black transition-colors py-2">Shop</span>
              <div className="absolute top-full left-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                  {categories.map((category) => (
                    <div key={category} className="relative group/item">
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-black">
                        <span>{category}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                      <div className="absolute top-0 left-full pl-2 w-56 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 ease-in-out">
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{category} Collection</div>
                          <div className="h-[1px] bg-gray-100 mx-2 mb-1"></div>
                          {items.map((item) => (
                            <Link key={item} href={`/products?q=${category}+${item}`} className="block px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-black transition-colors">{item}</Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/products?tag=local" className="hover:text-black transition-colors">Local Products</Link>
            <Link href="/products?sort=newest" className="hover:text-black transition-colors">New Arrivals</Link>
          </div>

          {/* 3. Search Bar */}
          <div className="flex-1 relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input className="w-full bg-[#F0F0F0] border-none rounded-full pl-12 h-11 text-base focus-visible:ring-1 focus-visible:ring-gray-300 placeholder:text-gray-400" placeholder="Search for products..." />
          </div>

          {/* --- DELIVER TO BUTTON --- */}
          <Button 
            variant="ghost" 
            className="hidden lg:flex items-center gap-2 px-2 hover:bg-gray-100 rounded-lg h-11"
            onClick={handleDeliverToClick}
          >
            <MapPin className="h-5 w-5 text-gray-600" />
            <div className="flex flex-col items-start text-left leading-none space-y-0.5">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                Deliver to
              </span>
              <span className="font-bold text-xs text-black max-w-[100px] truncate">
                {selectedAddress ? `${selectedAddress.city} ${selectedAddress.pincode || ''}` : "Select Location"}
              </span>
            </div>
          </Button>

          {/* 4. Icons & Profile Dropdown */}
          <div className="flex items-center gap-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 rounded-full w-10 h-10">
                <ShoppingCart className="h-6 w-6" />
                {/* --- FIX: Cart Count Bubble (Blue color) --- */}
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full">
                    {cartItemCount}
                  </span>
                )}
                {/* ------------------------------------------- */}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-gray-100">
                  {user ? (
                     <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {user.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
                     </div>
                  ) : <UserCircle className="h-6 w-6" />}
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl mt-2">
                {user ? (
                  <>
                    <DropdownMenuLabel className="px-4 py-2 text-sm font-semibold">
                      <div className="flex flex-col">
                        <span>Hello, {user.name}</span>
                        <span className="text-xs text-gray-400 font-normal truncate">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                      <Link href="/profile" className="cursor-pointer py-2.5 px-4 flex items-center"><User className="mr-3 h-4 w-4 text-gray-500" /> Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                      <Link href="/settings" className="cursor-pointer py-2.5 px-4 flex items-center"><Settings className="mr-3 h-4 w-4 text-gray-500" /> Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer rounded-lg py-2.5 px-4 flex items-center"><LogOut className="mr-3 h-4 w-4" /> Logout</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel className="px-4 py-2 text-sm font-semibold">Welcome Guest</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                      <Link href="/login" className="cursor-pointer py-2.5 px-4 flex items-center"><LogIn className="mr-3 h-4 w-4 text-gray-500" /> Login</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                      <Link href="/register" className="cursor-pointer py-2.5 px-4 flex items-center"><UserPlus className="mr-3 h-4 w-4 text-gray-500" /> Register</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* --- Address Modal (for logged-in users) --- */}
      {user && (
        <CustomerAddressModal 
          isOpen={isAddressModalOpen} 
          onClose={() => setIsAddressModalOpen(false)}
          addresses={user.addresses || []}
          onSelect={handleAddressSelect}
          onAddressAdded={handleAddressAdded}
        />
      )}
      
      {/* --- NEW: Manual Location Modal (for guest users) --- */}
      <ManualLocationModal 
        isOpen={showManualModal} 
        onClose={() => setShowManualModal(false)}
        onLocationSet={handleManualLocationSet}
      />
    </>
  );
}