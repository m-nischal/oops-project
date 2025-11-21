import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Navigation, Box, X, MapPin, Truck } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50/50 pb-10">
      {/* Dark Header */}
      <div className="bg-black text-white pt-6 pb-10 px-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="size-5" />
          </button>
          <div className="text-center">
            <h2 className="font-semibold text-sm">Delivery in Progress</h2>
            <p className="text-xs text-gray-400 mt-0.5 opacity-80">Order #{order.externalOrderId || order.id}</p>
          </div>
          <span className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full tracking-wide">
            {status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-gray-100 h-64 flex flex-col items-center justify-center text-gray-400 border-b border-gray-200 shadow-inner">
        <div className="bg-blue-600 p-4 rounded-full text-white mb-3 shadow-xl shadow-blue-200">
          <Navigation className="size-8" />
        </div>
        <p className="font-bold text-gray-600">Map Navigation</p>
        <p className="text-sm text-gray-400 mt-1">{order.distance || "Calculating..."} away</p>
      </div>

      {/* Content Container */}
      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-0 space-y-6">
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT CARD: Pickup Action */}
          <div className={`flex-1 bg-white rounded-xl p-6 shadow-sm transition-all ${!isPickedUp ? 'border border-blue-500 ring-1 ring-blue-500' : 'border border-gray-200'}`}>
            <div className="flex gap-4 items-start mb-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${!isPickedUp ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-600'}`}>
                {isPickedUp ? <CheckCircle className="size-5" /> : '1'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Pick up Order</h3>
                <p className="text-sm text-gray-500 mt-1">{order.restaurantAddress}</p>
              </div>
            </div>

            {!isPickedUp ? (
              <>
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">READY AT</p>
                  <p className="font-bold text-gray-900 text-lg">{order.pickupTime || "ASAP"}</p>
                  <p className="text-xs text-gray-400 mt-1">Confirm pickup when you receive the order</p>
                </div>
                <button 
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle className="size-5" />
                  Confirm Pickup
                </button>
              </>
            ) : (
               <div className="flex items-center gap-2 text-green-700 font-medium bg-green-50 p-3 rounded-lg justify-center border border-green-100">
                 <CheckCircle className="size-5" /> Pickup Completed
               </div>
            )}
          </div>

          {/* RIGHT CARD: Order Details */}
          <div className="flex-1 bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Order Details</h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{order.restaurantName}</span>
            </div>
            
            <div className="space-y-4 mb-8 flex-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="bg-blue-50 p-2 rounded-md text-blue-600">
                    <Box className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            {/* MODIFIED: Removed Earnings, kept Total full width */}
            <div className="mb-2">
              <div className="w-full p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">TOTAL</p>
                <p className="font-bold text-gray-900">${order.total ? Number(order.total).toFixed(2) : '0.00'}</p>
              </div>
            </div>

            {/* REMOVED: Open in Maps Button */}
          </div>
        </div>

        {/* BOTTOM CARD: Deliver Step */}
        <div className={`bg-white rounded-xl p-6 border shadow-sm transition-all ${isOutForDelivery ? 'border border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 opacity-80'}`}>
          <div className="flex gap-4 items-center">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isOutForDelivery ? 'bg-blue-600 text-white' : isPickedUp ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
             <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Next: Deliver to Customer</h3>
                        <p className="text-gray-500 text-sm mt-1">{order.customerAddress}</p>
                    </div>
                    
                    {/* STEP 2: START DELIVERY (Sends OTP Email) */}
                    {isPickedUp && !isOutForDelivery && (
                      <button 
                        onClick={() => onStartDelivery(order.id)}
                        className="bg-black text-white py-2.5 px-6 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm w-full md:w-auto justify-center"
                      >
                        <Truck className="size-4" />
                        Start Delivery
                      </button>
                    )}

                    {/* STEP 3: COMPLETE DELIVERY (Requires OTP) */}
                    {isOutForDelivery && (
                      <button 
                        onClick={() => setShowOtpModal(true)}
                        className="bg-green-600 text-white py-2.5 px-6 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm w-full md:w-auto justify-center"
                      >
                        <CheckCircle className="size-5" />
                        Complete Delivery
                      </button>
                    )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Confirm Pickup */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">Confirm Pickup</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center gap-4 border border-blue-100">
              <div className="bg-white p-2.5 rounded-lg shadow-sm text-blue-600">
                <Box className="size-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{order.restaurantName}</p>
                <p className="text-sm text-gray-500 font-medium">{order.items.length} items</p>
              </div>
            </div>

            <p className="text-gray-600 text-center mb-8 text-sm">Have you collected all items?</p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onPickup(order.id);
                  setShowConfirmModal(false);
                }}
                className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Verify OTP (Required for Delivery) */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900">Customer Verification</h3>
              <button onClick={() => setShowOtpModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <p className="text-gray-500 text-sm mb-6">
              Ask the customer for the delivery PIN/OTP sent to their email/phone.
            </p>

            <div className="mb-8">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Enter 6-Digit OTP</label>
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full text-center text-3xl font-bold tracking-widest border-b-2 border-gray-200 py-3 focus:border-black focus:outline-none text-gray-800 placeholder-gray-200"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => onDeliver(otp)}
                disabled={!otp || otp.length < 4}
                className="flex-1 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                Verify & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}