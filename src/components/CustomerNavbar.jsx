// src/components/CustomerNavbar.jsx
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Search, ShoppingCart, User, LogOut, Settings, UserCircle, MapPin, LogIn, UserPlus, AlertTriangle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import CustomerAddressModal from "@/components/CustomerAddressModal";
import ManualLocationModal from "@/components/ManualLocationModal";

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
  const [showManualModal, setShowManualModal] = useState(false);

  // --- Checkout Exit Warning State ---
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [nextUrl, setNextUrl] = useState('');
  const [exitMessage, setExitMessage] = useState('');

  // --- NEW: Checkout Guardrail Modal State ---
  const [showCheckoutGuardrail, setShowCheckoutGuardrail] = useState(false); 

  // Helper: Update Cart Count
  const updateCartCount = () => {
    const cart = loadCart();
    // Count is the number of distinct items (cart array length)
    setCartItemCount(cart.length); 
  };

  // Helper: Update Local Storage & Dispatch Event
  const setActiveLocation = (addressObj) => {
    if (!addressObj) return;
    
    // 1. Save minimal location data
    const locData = {
      city: addressObj.city,
      pincode: addressObj.pincode,
      addressLine1: addressObj.addressLine1,
      lat: addressObj.location?.coordinates?.[1],
      lng: addressObj.location?.coordinates?.[0]
    };
    localStorage.setItem("livemart_active_location", JSON.stringify(locData));
    
    // 2. Save full address object
    localStorage.setItem("livemart_active_address_full", JSON.stringify(addressObj));
    
    // 3. Update State & Notify
    setSelectedAddress(addressObj);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("livemart-location-update"));
      window.location.reload(); 
    }
  };

  // --- FIX: Universal Navigation Handler with Exit Check ---
  const handleNavigation = useCallback((e, url, message) => {
    // 1. If not on checkout page, navigate directly and exit.
    if (router.pathname !== '/checkout') {
      router.push(url);
      return; 
    }
    
    // 2. If on checkout page, trigger the warning modal.
    // Check if e exists and has preventDefault (only present on synthetic events from link clicks)
    if (e && typeof e.preventDefault === 'function') { 
        e.preventDefault();
    }
    
    setNextUrl(url);
    setExitMessage(message);
    setShowExitWarning(true);
  }, [router.pathname, router]);
  
  // --- NEW: Confirmed Exit Action ---
  const confirmExit = () => {
      setShowExitWarning(false);
      router.push(nextUrl);
  };
  
  // Check if user is logged in on mount
  useEffect(() => {
    updateCartCount();
    
    const handleStorageChange = (e) => {
        updateCartCount();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("livemart-cart-update", updateCartCount);

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          
          const savedFullAddress = localStorage.getItem("livemart_active_address_full");
          
          if (savedFullAddress) {
            const parsed = JSON.parse(savedFullAddress);
            setSelectedAddress(parsed);
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
    // If on checkout, trigger warning, otherwise logout immediately
    // CRITICAL FIX: Pass null as the event object since it's not a real DOM event
    if (router.pathname === '/checkout') {
        handleNavigation(null, '/login', "Leaving Checkout page. Your progress may be lost.");
        return;
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("token");
      localStorage.removeItem("livemart_active_address_full");
      setUser(null);
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  // --- NEW HANDLER for Manual Location Set ---
  const handleManualLocationSet = (locData) => {
    setShowManualModal(false);
    // Reload handled by ManualLocationModal
  };
  
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

  // --- FIX: Guardrail for 'Deliver to' button when on checkout page ---
  const handleDeliverToClick = () => {
    if (router.pathname === '/checkout') {
        setShowCheckoutGuardrail(true); // Trigger the custom guardrail dialog
        return;
    }

    if (!user) {
      setShowManualModal(true);
    } else {
      setIsAddressModalOpen(true);
    }
  };
  // ------------------------------------------------------------------

  const categories = ["Men", "Women", "Girls", "Boys"];
  const items = ["Shirts", "T-shirts", "Hoodies", "Sweatshirts", "Jeans", "Shorts", "Tracks"];
  
  // Helper to create safe Link/Div elements
  const CheckoutAwareLink = ({ href, children, message = "Leaving Checkout page. Your cart progress may be lost.", ...props }) => {
    const isCheckout = router.pathname === '/checkout';
    const isExternal = href.startsWith('http') || href.startsWith('mailto');
    
    if (isCheckout && !isExternal) {
        return (
            <a 
                onClick={(e) => handleNavigation(e, href, message)} 
                className="cursor-pointer" 
                {...props}
            >
                {children}
            </a>
        );
    }
    return <Link href={href}  {...props}>{children}</Link>;
  };

  return (
    <>
      <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 font-sans">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center gap-8">
          
          {/* 1. Logo */}
          <CheckoutAwareLink href="/" message="Leaving Checkout page. Your progress may be lost." className="text-3xl font-black tracking-tighter uppercase">
            LiveMart
          </CheckoutAwareLink>

          {/* 2. Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-base font-medium text-black/80">
            {/* Shop Dropdown */}
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
                        {/* FIX 4: Added space-y-1 to the inner list container to ensure vertical stacking */}
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 space-y-1">
                          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{category} Collection</div>
                          <div className="h-[1px] bg-gray-100 mx-2 mb-1"></div>
                          {items.map((item) => (
                            <CheckoutAwareLink key={item} href={`/products?q=${category}+${item}`} className="block px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-black transition-colors" message="Leaving Checkout page. Your progress may be lost.">
                                {item}
                            </CheckoutAwareLink>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Direct Links */}
            <CheckoutAwareLink href="/products?tag=local" className="hover:text-black transition-colors">Local Products</CheckoutAwareLink>
            <CheckoutAwareLink href="/products?sort=newest" className="hover:text-black transition-colors">New Arrivals</CheckoutAwareLink>
          </div>

          {/* 3. Search Bar */}
          <div className="flex-1 relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input className="w-full bg-[#F0F0F0] border-none rounded-full pl-12 h-11 text-base focus-visible:ring-1 focus-visible:ring-gray-300 placeholder:text-gray-400" placeholder="Search for products..." />
          </div>

          {/* --- DELIVER TO BUTTON (Location change still possible from checkout) --- */}
          <Button 
            variant="ghost" 
            className="hidden lg:flex items-center gap-2 px-2 hover:bg-gray-100 rounded-lg h-11"
            onClick={handleDeliverToClick} // This reloads the page, which is fine as it autofills checkout later
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
            <CheckoutAwareLink href="/cart" message="Going back to Cart page. Your progress may be lost.">
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
            </CheckoutAwareLink>

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
                        {/* Profile/Settings trigger modal on checkout, otherwise navigate immediately via corrected handleNavigation */}
                        <a onClick={(e) => handleNavigation(e, '/profile', "Leaving Checkout page. Your progress may be lost.")} className="cursor-pointer py-2.5 px-4 flex items-center"><User className="mr-3 h-4 w-4 text-gray-500" /> Profile</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                         <a onClick={(e) => handleNavigation(e, '/settings', "Leaving Checkout page. Your progress may be lost.")} className="cursor-pointer py-2.5 px-4 flex items-center"><Settings className="mr-3 h-4 w-4 text-gray-500" /> Settings</a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer rounded-lg py-2.5 px-4 flex items-center"><LogOut className="mr-3 h-4 w-4" /> Logout</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel className="px-4 py-2 text-sm font-semibold">Welcome Guest</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                      <CheckoutAwareLink href="/login" className="cursor-pointer py-2.5 px-4 flex items-center"><LogIn className="mr-3 h-4 w-4 text-gray-500" /> Login</CheckoutAwareLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                      <CheckoutAwareLink href="/register" className="cursor-pointer py-2.5 px-4 flex items-center"><UserPlus className="mr-3 h-4 w-4 text-gray-500" /> Register</CheckoutAwareLink>
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
      
      {/* --- Checkout Exit Confirmation Dialog --- */}
      <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Checkout?</DialogTitle>
            <DialogDescription>
              {exitMessage} Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitWarning(false)}>
              Stay on Page
            </Button>
            <Button onClick={confirmExit} variant="destructive">
              Yes, Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- Checkout Guardrail Dialog --- */}
      <Dialog open={showCheckoutGuardrail} onOpenChange={setShowCheckoutGuardrail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Action Blocked
            </DialogTitle>
            <DialogDescription>
              To prevent data loss, delivery location changes must be managed using the 
              **'Change Address / Location'** button located on the right side of the checkout page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowCheckoutGuardrail(false)} className="bg-black">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}