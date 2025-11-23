// src/components/CustomerNavbar.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  UserCircle,
  MapPin,
  LogIn,
  UserPlus,
  AlertTriangle,
  Package,
} from "lucide-react";
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
  try {
    return JSON.parse(localStorage.getItem("livemart_cart") || "[]");
  } catch (e) {
    return [];
  }
}

export default function CustomerNavbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [cartItemCount, setCartItemCount] = useState(0);

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);
  const initialSyncRef = useRef(true);

  // --- NEW STATE: Track focus to control visibility ---
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // ----------------------------------------------------

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);

  const [showExitWarning, setShowExitWarning] = useState(false);
  const [nextUrl, setNextUrl] = useState("");
  const [exitMessage, setExitMessage] = useState("");
  const [showCheckoutGuardrail, setShowCheckoutGuardrail] = useState(false);

  const updateCartCount = () => {
    const cart = loadCart();
    setCartItemCount(cart.length);
  };

  // --- LIVE SEARCH HANDLER (MODIFIED to ONLY update suggestions) ---
  useEffect(() => {
    // Prevent fetching if the query is too short OR if it's the very first sync
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.set("q", searchQuery.trim());
        params.set("limit", 5);

        if (router.query.lat) params.set("lat", router.query.lat);
        if (router.query.lng) params.set("lng", router.query.lng);
        if (router.query.radius) params.set("radius", router.query.radius);

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();

        // CRITICAL: Only update the array. Visibility is controlled by isSearchFocused.
        setSuggestions(data.items || []);
      } catch (error) {
        console.error("Autocomplete error", error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
    // Note: router.query remains a dependency to re-run suggestions when other filters change
  }, [searchQuery, router.query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // Only hide if we lost focus outside of the search bar
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = () => {
    setIsSearchFocused(false);
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set("q", searchQuery.trim());

      if (router.query.radius && router.query.lat && router.query.lng) {
        params.set("lat", router.query.lat);
        params.set("lng", router.query.lng);
        params.set("radius", router.query.radius);
      }

      router.push(`/products?${params.toString()}`);
    }
  };

  const setActiveLocation = (addressObj) => {
    if (!addressObj) return;
    const locData = {
      city: addressObj.city,
      pincode: addressObj.pincode,
      addressLine1: addressObj.addressLine1,
      lat: addressObj.location?.coordinates?.[1],
      lng: addressObj.location?.coordinates?.[0],
    };
    localStorage.setItem("livemart_active_location", JSON.stringify(locData));
    localStorage.setItem(
      "livemart_active_address_full",
      JSON.stringify(addressObj)
    );
    setSelectedAddress(addressObj);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("livemart-location-update"));
      window.location.reload();
    }
  };

  const handleNavigation = useCallback(
    (e, url, message) => {
      if (router.pathname !== "/checkout") {
        router.push(url);
        return;
      }
      if (e && typeof e.preventDefault === "function") {
        e.preventDefault();
      }
      setNextUrl(url);
      setExitMessage(message);
      setShowExitWarning(true);
    },
    [router.pathname, router]
  );

  const confirmExit = () => {
    setShowExitWarning(false);
    router.push(nextUrl);
  };

  const handleLocalProductsClick = (e) => {
    e.preventDefault();
    let lat, lng;
    if (selectedAddress?.location?.coordinates) {
      lng = selectedAddress.location.coordinates[0];
      lat = selectedAddress.location.coordinates[1];
    } else {
      try {
        const saved = JSON.parse(
          localStorage.getItem("livemart_active_location")
        );
        if (saved && saved.lat && saved.lng) {
          lat = saved.lat;
          lng = saved.lng;
        }
      } catch (err) {}
    }

    if (router.pathname === "/checkout" && !lat) {
      setShowCheckoutGuardrail(true);
      return;
    }

    if (lat && lng) {
      const url = `/products?lat=${lat}&lng=${lng}&radius=50`;
      handleNavigation(
        e,
        url,
        "Leaving Checkout to view Local Products. Your progress may be lost."
      );
    } else {
      if (!user) {
        setShowManualModal(true);
      } else {
        setIsAddressModalOpen(true);
      }
    }
  };

  // --- FIX: Logic to only set searchQuery once from URL on initial load ---
  useEffect(() => {
    if (router.isReady && initialSyncRef.current) {
      if (router.query.q) {
        setSearchQuery(router.query.q);
      }
      // IMPORTANT: Set ref to false so subsequent URL changes don't auto-set searchQuery
      initialSyncRef.current = false;
    }
  }, [router.isReady, router.query.q]);

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

          const savedFullAddress = localStorage.getItem(
            "livemart_active_address_full"
          );

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
              addressLine1: parsed.addressLine1,
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
    if (router.pathname === "/checkout") {
      handleNavigation(
        null,
        "/login",
        "Leaving Checkout page. Your progress may be lost."
      );
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

  const handleManualLocationSet = (locData) => {
    setShowManualModal(false);
  };
  const handleAddressSelect = (address) => {
    setActiveLocation(address);
    setIsAddressModalOpen(false);
  };
  const handleAddressAdded = (updatedUser) => {
    setUser(updatedUser);
    if (updatedUser.addresses && updatedUser.addresses.length > 0) {
      setActiveLocation(
        updatedUser.addresses[updatedUser.addresses.length - 1]
      );
    }
  };

  const handleDeliverToClick = () => {
    if (router.pathname === "/checkout") {
      setShowCheckoutGuardrail(true);
      return;
    }
    if (!user) {
      setShowManualModal(true);
    } else {
      setIsAddressModalOpen(true);
    }
  };

  const categories = ["Men", "Women", "Girls", "Boys"];
  const items = [
    "Shirt",
    "T-shirt",
    "Hoodie",
    "Sweatshirt",
    "Jean",
    "Short",
    "Track",
  ];

  const CheckoutAwareLink = ({
    href,
    children,
    message = "Leaving Checkout page. Your cart progress may be lost.",
    ...props
  }) => {
    const isCheckout = router.pathname === "/checkout";
    const isExternal = href.startsWith("http") || href.startsWith("mailto");
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
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  };

  return (
    <>
      <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 font-sans">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center gap-8">
          <CheckoutAwareLink
            href="/"
            message="Leaving Checkout page. Your progress may be lost."
            className="text-3xl font-black tracking-tighter uppercase"
          >
            LiveMart
          </CheckoutAwareLink>

          <div className="hidden md:flex items-center gap-6 text-base font-medium text-black/80">
            <div className="relative group h-full flex items-center">
              <span className="cursor-pointer hover:text-black transition-colors py-2">
                Shop
              </span>
              <div className="absolute top-full left-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                  {categories.map((category) => (
                    <div key={category} className="relative group/item">
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-black">
                        <span>{category}</span>
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                      <div className="absolute top-0 left-full pl-2 w-56 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 ease-in-out">
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 space-y-1">
                          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {category} Collection
                          </div>
                          <div className="h-[1px] bg-gray-100 mx-2 mb-1"></div>
                          {items.map((item) => (
                            <CheckoutAwareLink
                              key={item}
                              href={`/products?q=${category}+${item}`}
                              className="block px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-black transition-colors"
                              message="Leaving Checkout page. Your progress may be lost."
                            >
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

            <a
              onClick={handleLocalProductsClick}
              className="cursor-pointer hover:text-black transition-colors"
            >
              Local Products
            </a>
            <CheckoutAwareLink
              href="/products?sort=newest"
              className="hover:text-black transition-colors"
            >
              New Arrivals
            </CheckoutAwareLink>
          </div>

          <div className="flex-1 relative hidden md:block" ref={searchRef}>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer hover:text-black transition-colors"
              onClick={handleSearchSubmit}
            />
            <Input
              className="w-full bg-[#F0F0F0] border-none rounded-full pl-12 h-11 text-base focus-visible:ring-1 focus-visible:ring-gray-300 placeholder:text-gray-400"
              placeholder={
                router.query.radius
                  ? "Search local products..."
                  : "Search for products..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // --- MODIFIED FOCUS/BLUR HANDLERS ---
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Delay blur to allow time for suggestion click event to register
                setTimeout(() => setIsSearchFocused(false), 150);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            />

            {/* Suggestions Pop-up logic: Requires focused AND results to be visible */}
            {isSearchFocused && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                  Suggestions
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {suggestions.map((product) => (
                    <Link
                      key={product._id}
                      href={`/product/${product._id}`}
                      // CRITICAL: Hide suggestions and clear focus immediately on click
                      onClick={() => {
                        setIsSearchFocused(false); // Hide the popup
                        setSuggestions([]); // Clear suggestions to prevent accidental re-pop
                      }}
                    >
                      <div className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                        <div className="h-12 w-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          <img
                            src={
                              product.images?.[0] || "/images/placeholder.png"
                            }
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {product.brand}
                          </p>
                        </div>
                        <div className="text-sm font-bold text-black">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div
                  className="p-3 text-center border-t border-gray-100 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={handleSearchSubmit}
                >
                  <span className="text-sm font-bold text-blue-600">
                    View all results for "{searchQuery}"
                  </span>
                </div>
              </div>
            )}
          </div>

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
                {selectedAddress
                  ? `${selectedAddress.city} ${selectedAddress.pincode || ""}`
                  : "Select Location"}
              </span>
            </div>
          </Button>

          <div className="flex items-center gap-4">
            <CheckoutAwareLink
              href="/cart"
              message="Going back to Cart page. Your progress may be lost."
            >
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100 rounded-full w-10 h-10"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </CheckoutAwareLink>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-10 h-10 hover:bg-gray-100"
                >
                  {user ? (
                    <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {user.name ? (
                        user.name[0].toUpperCase()
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                  ) : (
                    <UserCircle className="h-6 w-6" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 p-2 rounded-xl shadow-xl mt-2"
              >
                {user ? (
                  <>
                    <DropdownMenuLabel className="px-4 py-2 text-sm font-semibold">
                      <div className="flex flex-col">
                        <span>Hello, {user.name}</span>
                        <span className="text-xs text-gray-400 font-normal truncate">
                          {user.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem
                      asChild
                      className="rounded-lg focus:bg-gray-50"
                    >
                      <a
                        onClick={(e) =>
                          handleNavigation(
                            e,
                            "/profile",
                            "Leaving Checkout page. Your progress may be lost."
                          )
                        }
                        className="cursor-pointer py-2.5 px-4 flex items-center"
                      >
                        <User className="mr-3 h-4 w-4 text-gray-500" /> Profile
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="rounded-lg focus:bg-gray-50"
                    >
                      <a
                        onClick={(e) =>
                          handleNavigation(
                            e,
                            "/orders",
                            "Leaving Checkout page. Your progress may be lost."
                          )
                        }
                        className="cursor-pointer py-2.5 px-4 flex items-center"
                      >
                        <Package className="mr-3 h-4 w-4 text-gray-500" /> Order
                        History
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="rounded-lg focus:bg-gray-50"
                    >
                      <a
                        onClick={(e) =>
                          handleNavigation(
                            e,
                            "/settings",
                            "Leaving Checkout page. Your progress may be lost."
                          )
                        }
                        className="cursor-pointer py-2.5 px-4 flex items-center"
                      >
                        <Settings className="mr-3 h-4 w-4 text-gray-500" />{" "}
                        Settings
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 focus:text-red-600 cursor-pointer rounded-lg py-2.5 px-4 flex items-center"
                    >
                      <LogOut className="mr-3 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel className="px-4 py-2 text-sm font-semibold">
                      Welcome Guest
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem
                      asChild
                      className="rounded-lg focus:bg-gray-50"
                    >
                      <CheckoutAwareLink
                        href="/login"
                        className="cursor-pointer py-2.5 px-4 flex items-center"
                      >
                        <LogIn className="mr-3 h-4 w-4 text-gray-500" /> Login
                      </CheckoutAwareLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="rounded-lg focus:bg-gray-50"
                    >
                      <CheckoutAwareLink
                        href="/register"
                        className="cursor-pointer py-2.5 px-4 flex items-center"
                      >
                        <UserPlus className="mr-3 h-4 w-4 text-gray-500" />{" "}
                        Register
                      </CheckoutAwareLink>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

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
      <Dialog
        open={showCheckoutGuardrail}
        onOpenChange={setShowCheckoutGuardrail}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Action Blocked
            </DialogTitle>
            <DialogDescription>
              To prevent data loss, delivery location changes must be managed
              using the **'Change Address / Location'** button located on the
              right side of the checkout page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowCheckoutGuardrail(false)}
              className="bg-black"
            >
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
