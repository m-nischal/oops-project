import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link"; // Added Link
import { 
  Clock, 
  Package, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  LogOut,
  User, // Added Icons
  Settings,
  UserCircle
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added Dropdown components
import { Button } from "@/components/ui/button"; // Added Button

import DeliveryLogin from "../../components/DeliveryLogin";
import OrderRequests from "../../components/OrderRequests"; 
import ActiveDeliveries from "../../components/ActiveDeliveries";
import DeliveryDetail from "../../components/DeliveryDetail";

export default function AssignedPage() {
  const router = useRouter();

  // UI State
  const [activeTab, setActiveTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Data State
  const [deliveries, setDeliveries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  
  // User State for Profile Dropdown
  const [user, setUser] = useState(null);

  // -------------------------------
  // AUTH CHECK
  // -------------------------------
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!meRes.ok) return router.replace("/delivery/login");

        const meData = await meRes.json();
        if (!meData.ok || !meData.user) return router.replace("/delivery/login");
        if ((meData.user.role || "").toUpperCase() !== "DELIVERY")
          return router.replace("/");

        setUser(meData.user); // Store user data
        setAuthChecked(true);
        await fetchDeliveries();
      } catch (err) {
        console.error("Auth error:", err);
        router.replace("/delivery/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------
  // FETCH DELIVERIES
  // -------------------------------
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/delivery?status=PENDING,ASSIGNED,ACCEPTED,PICKED_UP,OUT_FOR_DELIVERY,IN_TRANSIT", {
        method: "GET",
        credentials: "same-origin",
      });

      if (res.status === 401) {
        return router.replace("/delivery/login");
      }

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load deliveries");

      const normalized = (data.deliveries || []).map((d) => ({
        id: d._id ?? d.id,
        ...d,
      }));

      setDeliveries(normalized);
    } catch (err) {
      console.error("Fetch deliveries error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // -------------------------------
  // API POST WRAPPER
  // -------------------------------
  async function apiPost(url, body = {}) {
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({ ok: false, error: "Invalid response" }));
      if (!res.ok || !data.ok) throw new Error(data.error || "Action failed");

      return data.delivery || data;
    } catch (err) {
      console.error("apiPost error:", err);
      throw err;
    }
  }

  // -------------------------------
  // ACTION HANDLERS
  // -------------------------------
  const acceptOrder = async (id) => {
    // optimistic update
    setDeliveries((cur) => cur.map((o) => (o.id === id ? { ...o, status: "ACCEPTED" } : o)));

    try {
      const updated = await apiPost(`/api/delivery/${id}/accept`, { action: "accept" });

      setDeliveries((cur) =>
        cur.map((o) => (o.id === id ? updated : o))
      );
    } catch (err) {
      alert("Accept failed: " + err.message);
      fetchDeliveries();
    }
  };

  const declineOrder = async (id) => {
    const previous = deliveries.slice();
    setDeliveries((cur) => cur.filter((o) => o.id !== id));

    try {
      await apiPost(`/api/delivery/${id}/accept`, { action: "decline" });
    } catch (err) {
      alert("Decline failed");
      setDeliveries(previous);
    }
  };

  const pickupOrder = async (id) => {
    try {
      const updated = await apiPost(`/api/delivery/${id}/status`, {
        status: "PICKED_UP",
      });

      setDeliveries((cur) =>
        cur.map((o) => (o.id === id ? updated : o))
      );
      setSelected(updated);
    } catch (err) {
      alert("Pickup failed: " + err.message);
    }
  };

  const startDelivery = async (id) => {
    try {
      const updated = await apiPost(`/api/delivery/${id}/status`, {
        status: "OUT_FOR_DELIVERY",
      });

      setDeliveries((cur) =>
        cur.map((o) => (o.id === id ? updated : o))
      );
      setSelected(updated);
    } catch (err) {
      alert("Start delivery failed: " + err.message);
    }
  };

  const deliverOrder = async (id, otp) => {
    try {
      await apiPost(`/api/delivery/${id}/status`, {
        status: "DELIVERED",
        otp,
      });
      
      // Remove from active list upon success
      setDeliveries((cur) => cur.filter((o) => o.id !== id));
      setSelected(null);
      
      // Show Success Modal instead of alert
      setShowSuccessModal(true); 
    } catch (err) {
      alert("Delivery failed: " + err.message);
    }
  };

  // -------------------------------
  // FILTER & SEARCH LISTS
  // -------------------------------
  const filteredDeliveries = deliveries.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return `${o.externalOrderId || ''} ${o.dropoff?.name || ''} ${o.pickup?.name || ''}`
      .toLowerCase()
      .includes(q);
  });

  const newRequests = filteredDeliveries.filter(
    (o) => (o.status || "").toUpperCase() === "ASSIGNED" || (o.status || "").toUpperCase() === "PENDING"
  );

  const activeRequests = filteredDeliveries.filter((o) =>
    ["ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY", "IN_TRANSIT"].includes(
      (o.status || "").toUpperCase()
    )
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("token"); // Clear client token
      router.replace("/delivery/login"); // Redirect to login
    } catch (err) {
      console.error("Logout failed", err);
      router.replace("/delivery/login");
    }
  };

  // -------------------------------
  // RENDER: AUTH & LOADING
  // -------------------------------
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Checking authentication...
      </div>
    );
  }

  // -------------------------------
  // RENDER: DETAIL VIEW OVERLAY
  // -------------------------------
  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <DeliveryDetail
            order={{
              id: selected.id,
              restaurantName: selected.pickup?.name,
              restaurantAddress: selected.pickup?.address,
              restaurantLat: selected.pickup?.lat, 
              restaurantLng: selected.pickup?.lng, 
              customerName: selected.dropoff?.name,
              customerAddress: selected.dropoff?.address,
              customerLat: selected.dropoff?.lat,
              customerLng: selected.dropoff?.lng,
              customerPhone: selected.dropoff?.phone,
              items: selected.items ?? [],
              total: selected.total ?? 0,
              distance: selected.distance,
              status: selected.status,
              externalOrderId: selected.externalOrderId,
              estimatedEarnings: selected.estimatedEarnings || 0,
              pickupTime: selected.pickupTime || "ASAP",
            }}  
            onBack={() => setSelected(null)}
            onPickup={() => pickupOrder(selected.id)}
            onStartDelivery={() => startDelivery(selected.id)}
            onDeliver={(otp) => deliverOrder(selected.id, otp)}
            onCancel={() => {
              declineOrder(selected.id);
              setSelected(null);
            }}
          />
        </div>
      </div>
    );
  }

  // -------------------------------
  // RENDER: MAIN DASHBOARD
  // -------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 max-w-5xl mx-auto gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Assigned Deliveries</h2>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              placeholder="Search orders..."
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={fetchDeliveries}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing" : "Refresh"}
          </button>

          {/* --- PROFILE DROPDOWN --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-gray-200 bg-white border border-gray-200">
                {user ? (
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {user.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
                    </div>
                ) : <UserCircle className="h-6 w-6 text-gray-600" />}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl mt-2">
              {user && (
                <>
                  <DropdownMenuLabel className="px-4 py-2 text-sm font-semibold">
                    <div className="flex flex-col">
                      <span>Hello, {user.name}</span>
                      <span className="text-xs text-gray-400 font-normal truncate">{user.email}</span>
                      <span className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">Delivery Partner</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50 cursor-pointer">
                      <Link href="/profile" className="flex items-center py-2.5 px-4">
                        <User className="mr-3 h-4 w-4 text-gray-500" /> Profile
                      </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg focus:bg-gray-50 cursor-pointer">
                       <Link href="/settings" className="flex items-center py-2.5 px-4">
                         <Settings className="mr-3 h-4 w-4 text-gray-500" /> Settings
                       </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer rounded-lg py-2.5 px-4 flex items-center">
                    <LogOut className="mr-3 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* ------------------------- */}

        </div>
      </div>

      {/* TOGGLE TABS */}
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-2 bg-white p-1.5 rounded-full shadow-sm border border-gray-200 mb-8 max-w-xl mx-auto">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-2.5 px-6 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "requests"
                ? "bg-black text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Clock className="size-4" />
            New Requests
            {newRequests.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                  activeTab === "requests" ? "bg-white text-black" : "bg-blue-100 text-blue-600"
              }`}>
                {newRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2.5 px-6 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "active"
                ? "bg-black text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Package className="size-4" />
            Active Deliveries
            {activeRequests.length > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                  activeTab === "active"
                    ? "bg-white text-black"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {activeRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === "requests" ? (
            <OrderRequests
              orders={newRequests}
              onAccept={acceptOrder}
              onDecline={declineOrder}
              onSelect={setSelected}
            />
          ) : (
            <ActiveDeliveries
              orders={activeRequests}
              onSelectOrder={setSelected}
              onStart={pickupOrder}
            />
          )}
        </div>
      </div>

      {/* --- SUCCESS POPUP MODAL --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
              Delivery Complete!
            </h2>
            <p className="text-gray-500 mb-8">
              Great job! The order has been successfully verified and delivered.
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-4 rounded-xl bg-black text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}