import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Search, ShoppingCart, User, LogOut, Settings, UserCircle, ChevronRight, LogIn, UserPlus } from "lucide-react";
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

export default function CustomerNavbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    }
    checkAuth();
  }, []);

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

  // Data structure for the menu
  const categories = ["Men", "Women", "Girls", "Boys"];
  const items = ["Shirts", "T-shirts", "Hoodies", "Sweatshirts", "Jeans", "Shorts", "Tracks"];

  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 font-sans">
      <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center gap-8">
        
        {/* CHANGED: Logo now links to root "/" */}
        <Link href="/" className="text-3xl font-black tracking-tighter uppercase">
          LiveMart
        </Link>

        {/* 2. Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-base font-medium text-black/80">
          
          {/* SHOP DROPDOWN */}
          <div className="relative group h-full flex items-center">
            <span className="cursor-pointer hover:text-black transition-colors py-2">
              Shop
            </span>

            {/* Main Dropdown */}
            <div className="absolute top-full left-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                {categories.map((category) => (
                  <div key={category} className="relative group/item">
                    <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-black">
                      <span>{category}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    {/* Sub-menu */}
                    <div className="absolute top-0 left-full pl-2 w-56 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 ease-in-out">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {category} Collection
                        </div>
                        <div className="h-[1px] bg-gray-100 mx-2 mb-1"></div>
                        {items.map((item) => (
                          <Link 
                            key={item}
                            href={`/products?q=${category}+${item}`}
                            className="block px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-black transition-colors"
                          >
                            {item}
                          </Link>
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
          <Input 
            className="w-full bg-[#F0F0F0] border-none rounded-full pl-12 h-11 text-base focus-visible:ring-1 focus-visible:ring-gray-300 placeholder:text-gray-400" 
            placeholder="Search for products..." 
          />
        </div>

        {/* 4. Icons & Profile Dropdown */}
        <div className="flex items-center gap-4">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 rounded-full w-10 h-10">
              <ShoppingCart className="h-6 w-6" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-gray-100">
                {user ? (
                   <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {user.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
                   </div>
                ) : (
                   <UserCircle className="h-6 w-6" />
                )}
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
                    <Link href="/profile" className="cursor-pointer py-2.5 px-4 flex items-center">
                      <User className="mr-3 h-4 w-4 text-gray-500" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                    <Link href="/settings" className="cursor-pointer py-2.5 px-4 flex items-center">
                      <Settings className="mr-3 h-4 w-4 text-gray-500" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer rounded-lg py-2.5 px-4 flex items-center">
                    <LogOut className="mr-3 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel className="px-4 py-2 text-sm font-semibold">
                    Welcome Guest
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                    <Link href="/login" className="cursor-pointer py-2.5 px-4 flex items-center">
                      <LogIn className="mr-3 h-4 w-4 text-gray-500" /> Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50">
                    <Link href="/register" className="cursor-pointer py-2.5 px-4 flex items-center">
                      <UserPlus className="mr-3 h-4 w-4 text-gray-500" /> Register
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}