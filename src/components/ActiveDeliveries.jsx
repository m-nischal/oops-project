import React from 'react';
import { MapPin, Navigation, ChevronRight } from 'lucide-react';

export default function ActiveDeliveries({ orders, onSelectOrder }) {
  if (!orders || orders.length === 0) {
    return <div className="text-center text-gray-500 py-10">No active deliveries</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {orders.map((order) => {
        // Check for ANY status that implies pickup is completed
const isPickedUp = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'IN_TRANSIT'].includes((order.status || '').toUpperCase());
        
        // Data fallbacks
        const restaurantName = order.restaurantName || order.pickup?.name || "Seller warehouse";
        const restaurantAddress = order.restaurantAddress || order.pickup?.address || "Address not available";
        const customerName = order.customerName || order.dropoff?.name || "Customer";
        const customerAddress = order.customerAddress || order.dropoff?.address || "Address not available";
        // const earnings = order.estimatedEarnings || 0; // Removed

        return (
          <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            
            {/* Header: Restaurant Info */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{restaurantName}</h3>
                <p className="text-gray-500 text-xs mt-1 truncate max-w-[200px]">{restaurantAddress}</p>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full tracking-wide uppercase ${
                isPickedUp ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {isPickedUp ? 'order picked up' : 'Pickup'}
              </span>
            </div>

            {/* PROGRESS VISUALIZER */}
            <div className="relative flex items-center justify-between mb-8 px-4">
              {/* THE LINE: Positioned absolutely centered */}
              <div className="absolute top-[15px] left-10 right-10 h-[3px] bg-gray-200" />
              
              {/* Step 1: Pickup */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isPickedUp ? 'bg-black text-white' : 'bg-black text-white'
                }`}>
                  1
                </div>
                <span className="text-xs font-medium text-gray-900">Pickup</span>
              </div>

              {/* Step 2: Deliver */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isPickedUp ? 'border-black text-black' : 'border-gray-200 text-gray-300'
                }`}>
                  2
                </div>
                <span className={`text-xs font-medium ${isPickedUp ? 'text-gray-900' : 'text-gray-400'}`}>
                  Deliver
                </span>
              </div>
            </div>

            {/* CUSTOMER ADDRESS SECTION */}
            <div className="bg-gray-50 p-4 rounded-xl flex gap-3 mb-6 border border-gray-100">
              <div className="bg-blue-100 p-2 rounded-full h-fit shrink-0">
                <MapPin className="size-5 text-blue-600" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">THEN DELIVER TO</p>
                <p className="font-bold text-gray-900 text-sm truncate">{customerName}</p>
                <p className="text-gray-500 text-xs truncate">{customerAddress}</p>
              </div>
            </div>

            {/* --- REMOVED STATS FOOTER SECTION HERE --- */}

            {/* Action Button */}
            <button 
              onClick={() => onSelectOrder(order)}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors group"
            >
              <Navigation className="size-4" />
              <span>{isPickedUp ? 'Navigate to Customer' : 'Start Delivery'}</span>
              <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform ml-1" />
            </button>
          </div>
        );
      })}
    </div>
  );
}