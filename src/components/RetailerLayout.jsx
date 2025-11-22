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
  Search,
  Store,
  ShoppingBag,
  Warehouse,
  User, 
  Settings,
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
        // Clear Server Cookie
        await fetch("/api/auth/logout", { method: "POST" });
        // Clear Client Token
        localStorage.removeItem("token"); 
        router.push("/login"); 
    } catch (e) {
        console.error(e);
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
          <Separator className="bg-gray-700" />
          <NavLink href="/retailer/products" icon={Package}>
            MY SHOP (LIVE)
          </NavLink>
          <Separator className="bg-gray-700" />
          <NavLink href="/retailer/inventory" icon={Warehouse}>
            INVENTORY
          </NavLink>
          <Separator className="bg-gray-700" />
          <NavLink href="/retailer/orders" icon={ShoppingCart}>
            ORDER LIST
          </NavLink>
          <Separator className="bg-gray-700" />
          <NavLink href="/retailer/stock" icon={ShoppingBag}>
            WHOLESALER MARKETPLACE
          </NavLink>
        </nav>
      </aside>
      
      {/* Main Content */}
      <div className="flex flex-col ml-[250px]">
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
                  <AvatarFallback>A</AvatarFallback>
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