// src/components/RetailerLayout.jsx
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  Store,
  ShoppingBag,
  Warehouse,
  User, 
  Settings,
  History,
  Calculator,
  Calendar,
  Star // ADDED: Star icon for reviews
} from "lucide-react";

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

export default function RetailerLayout({ children }) {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
        localStorage.removeItem("token"); 
        router.push("/"); 
    } catch (e) {
        router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100/50">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-40 flex h-screen w-[250px] flex-col gap-2 border-r bg-gray-900 text-white">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link href="/retailer/dashboard" className="flex items-center gap-2 font-semibold">
            <Store className="h-6 w-6" />
            <span className="">Retailer Dashboard</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-auto px-4 py-4 space-y-4">
          <NavLink href="/retailer/dashboard" icon={LayoutDashboard}>
            DASHBOARD
          </NavLink>
          
          <div className="px-2 text-xs font-semibold text-gray-400 tracking-wider mt-2">TOOLS</div>
          
          <NavLink href="/retailer/pos" icon={Calculator}>
            POS / OFFLINE SALE
          </NavLink>
          
          <NavLink href="/retailer/calendar" icon={Calendar}>
            CALENDAR & TASKS
          </NavLink>

          <Separator className="bg-gray-700" />
          
          <div className="px-2 text-xs font-semibold text-gray-400 tracking-wider">MY SHOP</div>
          <NavLink href="/retailer/products" icon={Package}>
            LIVE PRODUCTS
          </NavLink>
          <NavLink href="/retailer/inventory" icon={Warehouse}>
            INVENTORY
          </NavLink>
          <NavLink href="/retailer/orders" icon={ShoppingCart}>
            CUSTOMER ORDERS
          </NavLink>
          
          <Separator className="bg-gray-700" />
          <div className="px-2 text-xs font-semibold text-gray-400 tracking-wider">WHOLESALE MARKET</div>
          <NavLink href="/retailer/stock" icon={ShoppingBag}>
            BROWSE & STOCK
          </NavLink>
          <NavLink href="/retailer/purchases" icon={History}>
            PURCHASE HISTORY
          </NavLink>
        </nav>
      </aside>
      
      {/* Main Content */}
      <div className="flex flex-col ml-[250px]">
        <header className="flex h-[60px] items-center gap-4 border-b bg-white px-6 sticky top-0 z-30 justify-end">
          {/* Removed Search Bar div here */}
          
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/path-to-avatar.png" alt="User" />
                  <AvatarFallback>R</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              {/* --- NEW MENU ITEM: Customer Reviews --- */}
              <DropdownMenuItem asChild>
                <Link href="/retailer/reviews">
                  <Star className="mr-2 h-4 w-4" /> Customer Reviews
                </Link>
              </DropdownMenuItem>
              {/* -------------------------------------- */}
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}