import React from 'react';
import { MapPin, Clock, Phone, ChevronRight } from 'lucide-react';

export default function OrderRequests({ orders, onAccept, onDecline }) {
  if (orders.length === 0) {
    return <div className="text-center text-gray-500 py-10">No new requests available</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <p className="text-gray-600 text-sm font-medium">{order.restaurantAddress}</p>
            <div className="flex items-center gap-1 text-gray-600 text-xs font-medium border border-gray-200 rounded-full px-3 py-1 bg-gray-50">
              <Clock className="size-3" />
              {order.pickupTime}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
            <div className="flex gap-3">
              <div className="bg-blue-100 p-2 rounded-full h-fit">
                <MapPin className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">DELIVER TO</p>
                <p className="font-bold text-gray-900">{order.customerName}</p>
                <p className="text-gray-600 text-sm">{order.customerAddress}</p>
              </div>
            </div>
            <div className="mt-3 ml-11 flex items-center gap-2 text-gray-500 text-sm">
              <Phone className="size-3" />
              {order.customerPhone}
            </div>
          </div>

          {/* Items */}
          <div className="mb-6 pl-2">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-3">ORDER ITEMS • {order.items.length}</p>
            <ul className="space-y-2">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 pt-5 border-t border-gray-100">
            {/* <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">DISTANCE</p>
              <p className="font-semibold text-gray-900">{order.distance}</p>
            </div> */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">TOTAL</p>
              <p className="font-semibold text-gray-900">₹{(order.total || 0).toFixed(2)}</p>
            </div>
            {/* <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">EARNINGS</p>
              <p className="font-semibold text-green-600">${order.estimatedEarnings.toFixed(2)}</p>
            </div> */}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button 
              onClick={() => onDecline(order.id)}
              className="flex-1 py-2.5 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
            <button 
              onClick={() => onAccept(order.id)}
              className="flex-1 py-2.5 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-200"
            >
              Accept
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}