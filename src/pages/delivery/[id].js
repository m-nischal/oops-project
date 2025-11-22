// src/pages/delivery/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Package, Phone, AlertCircle, CheckCircle } from "lucide-react"; 

import DeliveryDetail from "../../components/DeliveryDetail";
import DeliveryLogin from "../../components/DeliveryLogin";

export default function DeliveryDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  // Data State
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Action State
  const [note, setNote] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); 

  // Auth State
  const [authChecked, setAuthChecked] = useState(false);
  const [isDeliveryUser, setIsDeliveryUser] = useState(false);

  // ---------------------------------------------------------
  // HELPER: Safe JSON Parse
  // ---------------------------------------------------------
  async function safeParseJson(res) {
    try {
      const contentType = (res.headers?.get?.("content-type") || "").toLowerCase();
      if (contentType.includes("application/json")) return await res.json();
      const txt = await res.text();
      return { ok: false, error: txt || `HTTP ${res.status}` };
    } catch (e) {
      return { ok: false, error: e?.message || "parse error" };
    }
  }

  // ---------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------
  async function fetchDelivery() {
    // Only set loading true on initial load, not re-fetches
    if (!delivery) setLoading(true); 
    setError("");
    try {
      const res = await fetch(`/api/delivery/${id}`, { credentials: "same-origin" });
      const data = await safeParseJson(res);
      if (!res.ok || !data.ok) throw new Error(data?.error || "Failed to load delivery");
      setDelivery(data.delivery || data);
    } catch (e) {
      console.error("fetchDelivery error:", e);
      setError(e?.message || "Failed to load");
      setDelivery(null);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------------------
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setAuthChecked(false);
        const me = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!me.ok) return router.replace("/delivery/login");

        const meData = await safeParseJson(me);
        if (!meData || !meData.ok || (meData.user?.role || "").toUpperCase() !== "DELIVERY") {
          return router.replace("/");
        }
        
        setIsDeliveryUser(true);
        setAuthChecked(true);
        await fetchDelivery();
      } catch (e) {
        console.error(e);
        router.replace("/delivery/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---------------------------------------------------------
  // ACTION HANDLERS
  // ---------------------------------------------------------
  async function postAction(path, body = {}) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const data = await safeParseJson(res);
      if (!res.ok || !data.ok) throw new Error(data?.error || "Action failed");
      
      // Update local state with the returned delivery object
      setDelivery(data.delivery || data);
      
      // --- FIX: Force a re-fetch to ensure all populated fields (like order total) are up-to-date ---
      await fetchDelivery(); 
      
      return { ok: true, data };
    } catch (e) {
      console.error("postAction error:", e);
      setError(e?.message || "Action failed");
      return { ok: false, error: e };
    } finally {
      setActionLoading(false);
    }
  }

  const handleAccept = async () => {
    await postAction(`/api/delivery/${id}/accept`, { action: "accept", note });
  };

  const handleDecline = async () => {
    const res = await postAction(`/api/delivery/${id}/accept`, { action: "decline", note });
    if (res.ok) router.push("/delivery/assigned");
  };

  // Step 1: Pickup
  const handlePickup = async () => {
    await postAction(`/api/delivery/${id}/status`, { status: "PICKED_UP", note });
  };

  // Step 2: Start Delivery (Triggers Email)
  const handleStartDelivery = async () => {
    await postAction(`/api/delivery/${id}/status`, { status: "OUT_FOR_DELIVERY", note });
  };

  // Step 3: Complete (Verifies OTP)
  const handleDeliver = async () => {
    if (!otp || otp.length < 4) {
      alert("Please enter a valid OTP");
      return;
    }
    
    const res = await postAction(`/api/delivery/${id}/status`, { 
      status: "DELIVERED", 
      otp, 
      note 
    });

    if (res.ok) {
      setShowOtpModal(false);
      setShowSuccessModal(true); 
    }
  };

  // Handle closing the success modal
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push("/delivery/assigned");
  };

  // ---------------------------------------------------------
  // RENDER: LOADING / AUTH / ERROR
  // ---------------------------------------------------------
  if (!authChecked) return <div className="min-h-screen flex items-center justify-center text-gray-500">Checking authentication...</div>;
  if (!isDeliveryUser) return <DeliveryLogin onLogin={fetchDelivery} />;
  // Modified loading check: show loading only if we have NO data yet. 
  // If we have data (e.g. during refresh), show the old data to prevent flicker.
  if (loading && !delivery) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading delivery...</div>;
  
  if (error && !delivery) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4 bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle className="size-5" /> {error}
        </div>
        <button onClick={fetchDelivery} className="px-6 py-2 bg-black text-white rounded-full">Retry</button>
        <button onClick={() => router.back()} className="mt-4 text-gray-500 hover:underline">Go Back</button>
      </div>
    );
  }

  if (!delivery) return null;

  // ---------------------------------------------------------
  // VIEW LOGIC
  // ---------------------------------------------------------
  const isAssigned = (delivery.status || "").toUpperCase() === "ASSIGNED";
  
  const detailProps = {
    id: delivery._id ?? delivery.id,
    restaurantName: delivery.pickup?.name || delivery.merchantName,
    restaurantAddress: delivery.pickup?.address,
    customerName: delivery.dropoff?.name,
    customerAddress: delivery.dropoff?.address,
    customerPhone: delivery.dropoff?.phone,
    items: delivery.items?.map((it) => (typeof it === 'string' ? it : it.name)) || [],
    
    // Ensure total falls back correctly if missing on delivery object
    // We prioritize delivery.total, then orderRef.total
    total: delivery.total || (delivery.orderRef && delivery.orderRef.total) || delivery.amount || 0,
    
    distance: delivery.distance,
    estimatedEarnings: delivery.estimatedEarnings || delivery.deliveryFee || 0,
    pickupTime: delivery.pickupTime,
    status: delivery.status,
    externalOrderId: delivery.externalOrderId
  };

  // RENDER: ACTIVE DELIVERY
  if (!isAssigned) {
    return (
      <>
        <DeliveryDetail 
          order={detailProps}
          onBack={() => router.push("/delivery/assigned")}
          onPickup={handlePickup}
          onStartDelivery={handleStartDelivery} 
          onDeliver={() => setShowOtpModal(true)}
        />

        {/* OTP MODAL */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Complete Delivery</h3>
              <p className="text-gray-500 text-sm mb-6">Ask the customer for the delivery PIN/OTP.</p>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Enter OTP</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="0000"
                  className="w-full text-center text-3xl font-bold tracking-widest border-b-2 border-gray-200 py-2 focus:border-black focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeliver}
                  disabled={actionLoading || !otp}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? "Verifying..." : "Verify & Complete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- SUCCESS POPUP MODAL --- */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-6 backdrop-blur-md">
            <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                Delivery Complete!
              </h2>
              <p className="text-gray-500 mb-8">
                Great job! The order has been successfully verified and marked as delivered.
              </p>

              <button
                onClick={handleSuccessClose}
                className="w-full py-4 rounded-xl bg-black text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // RENDER: NEW REQUEST (Unchanged)
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6 max-w-2xl mx-auto w-full">
        <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-colors">
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-bold text-lg">Request Details</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl shadow-sm p-6 md:p-8 flex-1 flex flex-col">
        <div className="text-center mb-8 border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-bold mb-1">${(detailProps.estimatedEarnings || 0).toFixed(2)}</h2>
          <p className="text-gray-500 text-sm uppercase tracking-wide font-medium">Estimated Earnings</p>
        </div>

        <div className="space-y-8 flex-1">
          <div className="flex gap-4">
            <div className="bg-black text-white p-3 rounded-full h-fit">
              <Package className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">PICKUP FROM</p>
              <h3 className="font-bold text-lg text-gray-900">{detailProps.restaurantName}</h3>
              <p className="text-gray-600">{detailProps.restaurantAddress}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-full h-fit">
              <MapPin className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">DELIVER TO</p>
              <h3 className="font-bold text-lg text-gray-900">{detailProps.customerName}</h3>
              <p className="text-gray-600 mb-2">{detailProps.customerAddress}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={handleDecline}
            disabled={actionLoading}
            className="py-4 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "..." : "Decline"}
          </button>
          <button
            onClick={handleAccept}
            disabled={actionLoading}
            className="py-4 rounded-xl bg-black text-white font-bold hover:bg-gray-900 transition-colors disabled:opacity-50 shadow-lg shadow-gray-200"
          >
            {actionLoading ? "Accepting..." : "Accept Order"}
          </button>
        </div>
      </div>
    </div>
  );
}