import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Navigation, Box, X, MapPin, Truck, ChevronRight } from 'lucide-react';

export default function DeliveryDetail({ order, onBack, onPickup, onStartDelivery, onDeliver }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(""); 

  const status = (order.status || '').toUpperCase();
  const isPickedUp = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status);
  const isOutForDelivery = ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(status);

  // --- Handle Google Maps Navigation ---
  const handleOpenMap = () => {
    let query = "";

    // Logic: If picked up, navigate to Customer (Dropoff). 
    // If not picked up yet, navigate to Restaurant/Wholesaler (Pickup).
    if (isPickedUp) { 
      // Going to Customer
      if (order.customerLat && order.customerLng) {
        query = `${order.customerLat},${order.customerLng}`;
      } else {
        query = encodeURIComponent(order.customerAddress);
      }
    } else {
      // Going to Pickup Location
      if (order.restaurantLat && order.restaurantLng) {
        query = `${order.restaurantLat},${order.restaurantLng}`;
      } else {
        query = encodeURIComponent(order.restaurantAddress);
      }
    }

    if (!query || query === "undefined,undefined") {
      alert("Location coordinates or address not available for navigation");
      return;
    }

    // Official Google Maps Universal Cross-Platform URL
    // dir_action=navigate triggers turn-by-turn navigation immediately on mobile
    const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}&dir_action=navigate`;
    
    window.open(mapUrl, '_blank');
  };
  // ---------------------------------------

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-6 overflow-x-hidden font-sans">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-black text-white pt-6 pb-12 px-6 rounded-b-[40px] shadow-xl relative z-0">
        <div className="max-w-5xl mx-auto relative flex items-center h-12">
          
          {/* Left: Back Button (Absolute) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
            <button 
              onClick={onBack} 
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
            >
              <ArrowLeft className="size-5" />
            </button>
          </div>
          
          {/* Center: Title & ID (Absolute Centered) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full pointer-events-none">
            <h2 className="font-bold text-lg tracking-tight">Delivery Details</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5 opacity-80">#{order.externalOrderId || order.id}</p>
          </div>
          
          {/* Right: Status Badge (Absolute) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
            <span className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-full tracking-wider uppercase shadow-sm">
              {status.replace(/_/g, ' ')}
            </span>
          </div>

        </div>
      </div>

      {/* 2. CONTENT CONTAINER */}
      {/* Overlapping margin (-mt-6) to blend header and content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-6 relative z-10 space-y-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* LEFT COLUMN: DYNAMIC ACTIVE TASK CARD */}
          {/* Changes content based on status (Pickup -> Dropoff) */}
          <div className="bg-white rounded-[32px] p-6 pt-8 shadow-xl shadow-black/5 border border-white/50 flex flex-col h-full">
            
            {/* Header Row: Icon + Title + Map Button */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                {/* Icon Changes based on Step */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 shadow-md transition-all duration-500 ${isPickedUp ? 'bg-black text-white' : 'bg-blue-600 text-white shadow-blue-200'}`}>
                  {isPickedUp ? <Truck className="size-6" /> : '1'}
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {isPickedUp ? "DELIVER TO" : "PICKUP FROM"}
                  </p>
                  <h3 className="font-black text-gray-900 text-xl leading-tight transition-all duration-300">
                    {isPickedUp ? (order.customerName || "Customer") : order.restaurantName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium line-clamp-2">
                    {isPickedUp ? order.customerAddress : order.restaurantAddress}
                  </p>
                </div>
              </div>

              {/* Navigation Button */}
              <button 
                onClick={handleOpenMap}
                className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 hover:scale-105 transition-all shadow-sm"
                title="Open in Maps"
              >
                <Navigation className="size-5 fill-blue-600/20" />
              </button>
            </div>

            {/* Middle Section: Details */}
            <div className="flex-1">
              {!isPickedUp ? (
                <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ESTIMATED READY</p>
                    <p className="font-bold text-gray-900 text-lg">{order.pickupTime || "Ready Now"}</p>
                  </div>
                  <Box className="text-gray-300 size-8" />
                </div>
              ) : (
                // Delivery Instructions Placeholder or Info
                <div className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-100">
                   <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="size-4 text-green-600" />
                      <p className="text-[10px] text-green-700 uppercase font-bold tracking-wider">PICKUP COMPLETED</p>
                   </div>
                   <p className="text-sm text-green-900 font-medium">Proceed to customer location.</p>
                </div>
              )}
            </div>

            {/* Action Button Footer */}
            <div className="mt-auto">
              {!isPickedUp ? (
                <button 
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                >
                  <CheckCircle className="size-5" />
                  Confirm Pickup
                </button>
              ) : !isOutForDelivery ? (
                <button 
                  onClick={() => onStartDelivery(order.id)}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
                >
                  <Truck className="size-5" />
                  Start Delivery
                </button>
              ) : (
                <button 
                  onClick={() => setShowOtpModal(true)}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                >
                  <span>Complete Delivery</span>
                  <ChevronRight className="size-5" />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER ITEMS (Static) */}
          <div className="bg-white rounded-[32px] p-6 pt-8 shadow-xl shadow-black/5 border border-white/50 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900 text-lg">Order Items</h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{order.items.length} Items</span>
            </div>
            
            <div className="space-y-3 mb-6 flex-1 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-1 group">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-black transition-colors">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <div className="w-full p-5 rounded-2xl bg-gray-50 flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL TO COLLECT</p>
                <p className="font-black text-2xl text-gray-900">${order.total ? Number(order.total).toFixed(2) : '0.00'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Pickup Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-900 tracking-tight">Confirm Pickup</h3>
              <button onClick={() => setShowConfirmModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X className="size-5 text-gray-600" />
              </button>
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-5 mb-8 flex items-center gap-4 border border-blue-100/50">
              <div className="bg-white p-3 rounded-xl shadow-sm text-blue-600">
                <Box className="size-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{order.restaurantName}</p>
                <p className="text-xs text-gray-500 font-medium">{order.items.length} items checked</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="py-3.5 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onPickup(order.id);
                  setShowConfirmModal(false);
                }}
                className="py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xl text-gray-900 tracking-tight">Verification</h3>
              <button onClick={() => setShowOtpModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X className="size-5 text-gray-600" />
              </button>
            </div>

            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Ask the customer for the 4-digit delivery PIN sent to their email.
            </p>

            <div className="mb-8">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="• • • • • •"
                className="w-full text-center text-3xl font-black tracking-[0.5em] border-b-2 border-gray-200 py-4 focus:border-black focus:outline-none text-black placeholder-gray-200 transition-colors font-mono"
                autoFocus
              />
            </div>

            <button 
              onClick={() => onDeliver(otp)}
              disabled={!otp || otp.length < 4}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200 transition-all"
            >
              Verify & Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}