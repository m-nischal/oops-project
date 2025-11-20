// src/components/WholesalerLayout.jsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bell,
  Search,
  Store,
  User, // <-- ADDED
  Settings, // <--- ADDED: Import the Settings icon
} from "lucide-react";

// Helper NavLink component (no changes)
function NavLink({ href, icon: Icon, children }) {
  const router = useRouter();
  const isActive = router.pathname.startsWith(href);

  return (
    <Link href={href} legacyBehavior>
      <a className="w-full">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className="w-full justify-start text-left"
        >
          <Icon className="mr-2 h-4 w-4" />
          {children}
        </Button>
      </a>
    </Link>
  );
}

export default function WholesalerLayout({ children }) {
  // --- THIS IS THE FIX ---
  const router = useRouter(); // Get the router
  
  const handleLogout = () => {
    localStorage.removeItem("token"); //
    router.push("/login"); //
  };
  // --- END FIX ---

  return (
    <div className="min-h-screen bg-gray-100/50">
      
      {/* --- Sidebar --- */}
      <aside className="fixed top-0 left-0 z-40 flex h-screen w-[250px] flex-col gap-2 border-r bg-gray-900 text-white">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link href="/wholesaler/dashboard" className="flex items-center gap-2 font-semibold">
            <Store className="h-6 w-6" />
            <span className="">Arik Dashboard</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-auto px-4 py-4 space-y-4">
          <NavLink href="/wholesaler/dashboard" icon={LayoutDashboard}>
            DASHBOARD
          </NavLink>
          <NavLink href="/wholesaler/products" icon={Package}>
            ALL PRODUCTS
          </NavLink>
          <NavLink href="/wholesaler/orders" icon={ShoppingCart}>
            ORDER LIST
          </NavLink>
        </nav>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex flex-col ml-[250px]">
        
        {/* --- Top Header Bar --- */}
        <header className="flex h-[60px] items-center gap-4 border-b bg-white px-6 sticky top-0 z-30">
          <div className="flex-1">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/path-to-avatar.png" alt="Admin" />
                  <AvatarFallback>W</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* --- NEW: Profile Link --- */}
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              {/* --- ADDED: Settings Link --- */}
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              {/* --- THIS IS THE FIX --- */}
              <DropdownMenuItem onSelect={handleLogout}>
                Logout
              </DropdownMenuItem>
              {/* --- END FIX --- */}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* --- Page Content --- */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}