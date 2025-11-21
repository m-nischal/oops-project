// src/pages/delivery/index.js
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Clock, Package, RefreshCw } from "lucide-react"; // Added Icons

import DeliveryLogin from "../../components/DeliveryLogin";
import OrderRequest from "../../components/OrderRequests"; // Check if file is named OrderRequest or OrderRequests
import ActiveDeliveries from "../../components/ActiveDeliveries";
import DeliveryDetail from "../../components/DeliveryDetail";

export default function DeliveryPage() {
  const router = useRouter();

  // UI State
  const [activeTab, setActiveTab] = useState("requests"); // Added for Toggle Tabs

  // Data State
  const [deliveries, setDeliveries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isDeliveryUser, setIsDeliveryUser] = useState(false);
  const [error, setError] = useState("");

  // -------------------------------------------------------
  // AUTH CHECK (Kept exactly the same)
  // -------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!meRes.ok) return router.replace("/delivery/login");

        const meData = await meRes.json();
        if (!meData.ok || !meData.user)
          return router.replace("/delivery/login");

        if ((meData.user.role || "").toUpperCase() !== "DELIVERY")
          return router.replace("/");

        setIsDeliveryUser(true);
        setAuthChecked(true);
        await fetchDeliveries();
      } catch (err) {
        console.error("Auth failed:", err);
        router.replace("/delivery/login");
      }
    })();
  }, []);

  // -------------------------------------------------------
  // FETCH DELIVERIES (Kept exactly the same)
  // -------------------------------------------------------
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/delivery?status=PENDING,ASSIGNED,ACCEPTED,PICKED_UP,OUT_FOR_DELIVERY,IN_TRANSIT", {
        credentials: "same-origin",
      });

      if (res.status === 401) return router.replace("/delivery/login");

      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      const formatted = (data.deliveries || []).map((d) => ({
        id: d._id ?? d.id,
        ...d,
      }));

      setDeliveries(formatted);
    } catch (err) {
      console.error("Failed to load deliveries:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------------
  // API WRAPPER (Kept exactly the same)
  // -------------------------------------------------------
  async function apiPost(url, body = {}) {
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({ ok: false, error: "Invalid server response" }));

      if (!res.ok || !data.ok) throw new Error(data.error);
      return data.delivery || data;
    } catch (err) {
      console.error("API error:", err);
      throw err;
    }
  }

  // -------------------------------------------------------
  // ACTION HANDLERS (Kept exactly the same)
  // -------------------------------------------------------
  const acceptOrder = async (id) => {
    try {
      const updated = await apiPost(`/api/delivery/${id}/accept`, {
        action: "accept",
      });

      setDeliveries((list) =>
        list.map((o) => (o.id === id ? updated : o))
      );
      // Optional: Auto switch tab or select order
      // setSelected(updated); 
    } catch (err) {
      alert("Accept failed: " + err.message);
    }
  };

  const declineOrder = async (id) => {
    const backup = deliveries.slice();
    setDeliveries((list) => list.filter((o) => o.id !== id));

    try {
      await apiPost(`/api/delivery/${id}/accept`, { action: "decline" });
    } catch (err) {
      alert("Decline failed: " + err.message);
      setDeliveries(backup);
    }
  };

  const pickupOrder = async (id) => {
    try {
      const updated = await apiPost(`/api/delivery/${id}/status`, {
        status: "PICKED_UP",
      });

      setDeliveries((list) =>
        list.map((o) => (o.id === id ? updated : o))
      );
      setSelected(updated);
    } catch (err) {
      alert("Pickup failed: " + err.message);
    }
  };

  const deliverOrder = async (id, otp) => {
    const backup = deliveries.slice();
    setDeliveries((list) => list.filter((o) => o.id !== id));
    setSelected(null);

    try {
      await apiPost(`/api/delivery/${id}/status`, {
        status: "DELIVERED",
        otp,
      });
    } catch (err) {
      alert("Delivery failed: " + err.message);
      setDeliveries(backup);
    }
  };

  // -------------------------------------------------------
  // FILTER LISTS
  // -------------------------------------------------------
  const newRequests = deliveries.filter(
    (o) => (o.status || "").toUpperCase() === "ASSIGNED"
  );

  const activeDeliveriesList = deliveries.filter((o) =>
    ["ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY", "IN_TRANSIT"].includes(
      (o.status || "").toUpperCase()
    )
  );

  // -------------------------------------------------------
  // RENDER — LOADING / AUTH
  // -------------------------------------------------------
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Checking authentication...
      </div>
    );
  }

  if (!isDeliveryUser) return <DeliveryLogin />;

  // -------------------------------------------------------
  // RENDER — DETAIL VIEW (Full Screen Overlay)
  // -------------------------------------------------------
  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <DeliveryDetail
            order={{
              id: selected.id,
              restaurantName: selected.pickup?.name,
              restaurantAddress: selected.pickup?.address,
              customerName: selected.dropoff?.name,
              customerAddress: selected.dropoff?.address,
              customerPhone: selected.dropoff?.phone,
              items: selected.items || [],
              total: selected.total,
              distance: selected.distance,
              status: selected.status,
              externalOrderId: selected.externalOrderId,
              // Pass estimatedEarnings if available in your backend data
              estimatedEarnings: selected.estimatedEarnings || 0, 
              pickupTime: selected.pickupTime || "ASAP", // Fallback if backend doesn't send time
            }}
            onBack={() => setSelected(null)}
            onPickup={() => pickupOrder(selected.id)}
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

  // -------------------------------------------------------
  // RENDER — MAIN DASHBOARD (Toggle View)
  // -------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
        <button
          onClick={fetchDeliveries}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Toggle Bar */}
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
              <span
                className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                  activeTab === "requests"
                    ? "bg-white text-black"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
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
            {activeDeliveriesList.length > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                  activeTab === "active"
                    ? "bg-white text-black"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {activeDeliveriesList.length}
              </span>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Content Area (Conditionally Rendered) */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === "requests" ? (
            <OrderRequest
              orders={newRequests}
              onAccept={acceptOrder}
              onDecline={declineOrder}
              onSelect={setSelected} 
            />
          ) : (
            <ActiveDeliveries
              orders={activeDeliveriesList}
              onSelectOrder={setSelected} // Note: Changed to match the prop used in ActiveDeliveries component
              onStart={pickupOrder}
            />
          )}
        </div>
      </div>
    </div>
  );
}