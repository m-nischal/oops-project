// src/components/DeliveryDetail.jsx
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Navigation, Box, X, MapPin, Truck, ChevronRight } from 'lucide-react';

export default function DeliveryDetail({ order, onBack, onPickup, onStartDelivery, onDeliver }) {
  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false); // For Pickup
  const [showOtpModal, setShowOtpModal] = useState(false);         // For Delivery
  const [otp, setOtp] = useState(""); 

  // Helper to check status
  const status = (order.status || '').toUpperCase();
  const isPickedUp = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status);
  const isOutForDelivery = ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(status);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-10 relative">
      
      {/* Dark Header */}
      <div className="bg-black text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-md relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
          >
            <ArrowLeft className="size-5" />
          </button>
          
          <div className="text-center">
            <h2 className="font-bold text-lg tracking-tight">Delivery Details</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">#{order.externalOrderId || order.id}</p>
          </div>
          
          <span className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-full tracking-wider uppercase">
            {status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Floating Navigation Icon (Decorative, replaces the big map box) */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-white p-4 rounded-full shadow-2xl shadow-blue-900/20 text-blue-600 ring-8 ring-[#F8F9FA]">
          <Navigation className="size-8 fill-blue-100" />
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-5xl mx-auto px-6 mt-8 relative z-0 space-y-6">
        
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* LEFT CARD: Pickup Action */}
          <div className={`flex-1 bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 transition-all ${!isPickedUp ? 'ring-2 ring-blue-500/10' : ''}`}>
            <div className="flex gap-5 items-start mb-8">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 shadow-lg ${!isPickedUp ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-green-100 text-green-600'}`}>
                {isPickedUp ? <CheckCircle className="size-6" /> : '1'}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pickup From</p>
                <h3 className="font-black text-gray-900 text-xl tracking-tight leading-snug">{order.restaurantName}</h3>
                <p className="text-sm text-gray-500 mt-2 font-medium">{order.restaurantAddress}</p>
              </div>
            </div>

            {!isPickedUp ? (
              <>
                <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ESTIMATED READY</p>
                    <p className="font-bold text-gray-900 text-lg">{order.pickupTime || "Ready Now"}</p>
                  </div>
                  <Box className="text-gray-300 size-8" />
                </div>
                <button 
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full bg-black text-white py-4 rounded-full font-bold hover:bg-gray-900 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                >
                  <CheckCircle className="size-5" />
                  Confirm Pickup
                </button>
              </>
            ) : (
               <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 p-4 rounded-2xl justify-center border border-green-100/50">
                 <CheckCircle className="size-5" /> Pickup Completed
               </div>
            )}
          </div>

          {/* RIGHT CARD: Order Summary */}
          <div className="flex-1 bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-900 text-lg">Order Items</h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{order.items.length} Items</span>
            </div>
            
            <div className="space-y-3 mb-8 flex-1 overflow-y-auto max-h-[200px] pr-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2 group">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-black transition-colors leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <div className="w-full p-5 rounded-2xl bg-gray-50 flex justify-between items-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total to Collect</p>
                <p className="font-black text-2xl text-gray-900">${order.total ? Number(order.total).toFixed(2) : '0.00'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CARD: Deliver Step */}
        <div className={`bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 transition-all duration-500 ${isOutForDelivery ? 'ring-2 ring-blue-500/10 opacity-100 transform translate-y-0' : 'opacity-60'}`}>
          <div className="flex gap-5 items-center">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 transition-colors ${isOutForDelivery ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : isPickedUp ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                2
              </div>
             <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Deliver To</p>
                        <h3 className="font-black text-gray-900 text-xl tracking-tight">{order.customerName || "Customer"}</h3>
                        <p className="text-sm text-gray-500 mt-1 font-medium flex items-center gap-1">
                           <MapPin className="size-3" /> {order.customerAddress}
                        </p>
                    </div>
                    
                    {/* STEP 2: START DELIVERY */}
                    {isPickedUp && !isOutForDelivery && (
                      <button 
                        onClick={() => onStartDelivery(order.id)}
                        className="bg-black text-white py-3 px-8 rounded-full font-bold hover:bg-gray-800 transition-all hover:scale-105 flex items-center gap-2 shadow-lg w-full md:w-auto justify-center"
                      >
                        <Truck className="size-4" />
                        Start Delivery
                      </button>
                    )}

                    {/* STEP 3: COMPLETE DELIVERY */}
                    {isOutForDelivery && (
                      <button 
                        onClick={() => setShowOtpModal(true)}
                        className="bg-green-600 text-white py-3 px-8 rounded-full font-bold hover:bg-green-700 transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-green-200 w-full md:w-auto justify-center"
                      >
                        <span>Finish</span>
                        <ChevronRight className="size-4" />
                      </button>
                    )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Confirm Pickup */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-900 tracking-tight">Confirm Pickup</h3>
              <button onClick={() => setShowConfirmModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X className="size-4 text-gray-600" />
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
                className="py-3.5 rounded-full border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onPickup(order.id);
                  setShowConfirmModal(false);
                }}
                className="py-3.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Verify OTP */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xl text-gray-900 tracking-tight">Verification</h3>
              <button onClick={() => setShowOtpModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X className="size-4 text-gray-600" />
              </button>
            </div>

            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Ask the customer for the 4-digit delivery PIN sent to their phone.
            </p>

            <div className="mb-8">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="• • • •"
                className="w-full text-center text-4xl font-black tracking-[0.5em] border-b-2 border-gray-200 py-4 focus:border-black focus:outline-none text-black placeholder-gray-200 transition-colors"
                autoFocus
              />
            </div>

            <button 
              onClick={() => onDeliver(otp)}
              disabled={!otp || otp.length < 4}
              className="w-full py-4 rounded-full bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200 transition-all"
            >
              Verify & Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}