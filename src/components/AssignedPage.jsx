import React, { useState } from 'react';
import { Package, Clock, Search, RefreshCw } from 'lucide-react';
import OrderRequests from './components/OrderRequests';
import ActiveDeliveries from './components/ActiveDeliveries';

// Dummy Data - Replace with your actual API call or data source
const MOCK_ORDERS = [
  {
    id: '1',
    restaurantName: 'Pizza Palace',
    restaurantAddress: '123 Main St, Downtown',
    customerName: 'John Doe',
    customerAddress: '456 Oak Ave, Apt 2B',
    customerPhone: '(555) 123-4567',
    items: ['Large Pepperoni Pizza', 'Caesar Salad', 'Garlic Bread'],
    total: 32.50,
    distance: '2.3 mi',
    estimatedEarnings: 8.50,
    pickupTime: '6:30 PM',
    status: 'pending',
  },
  {
    id: '2',
    restaurantName: 'Burger Joint',
    restaurantAddress: '789 Pine St',
    customerName: 'Sarah Smith',
    customerAddress: '321 Elm St',
    customerPhone: '(555) 987-6543',
    items: ['Cheeseburger', 'Fries'],
    total: 15.00,
    distance: '1.5 mi',
    estimatedEarnings: 5.50,
    pickupTime: '6:45 PM',
    status: 'accepted',
  }
];

export default function AssignedPage() {
  // 1. This state controls the toggle
  const [activeTab, setActiveTab] = useState('requests'); 
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status === 'accepted' || o.status === 'picked-up');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Assigned Deliveries</h1>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search" 
                    className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
            </div>
            <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <RefreshCw className="size-4" />
                Refresh
            </button>
        </div>
      </div>

      {/* 2. THE TOGGLE BAR */}
      <div className="flex gap-2 bg-white p-1.5 rounded-full shadow-sm border border-gray-200 mb-8 max-w-xl">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 px-6 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Clock className="size-4" />
          New Requests
          {pendingOrders.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                activeTab === 'requests' ? 'bg-white text-black' : 'bg-blue-100 text-blue-600'
            }`}>
              {pendingOrders.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 px-6 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'active'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Package className="size-4" />
          Active Deliveries
          {activeOrders.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                activeTab === 'active' ? 'bg-white text-black' : 'bg-blue-100 text-blue-600'
            }`}>
              {activeOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. CONDITIONAL RENDERING (Shows only one component at a time) */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'requests' ? (
          <OrderRequests 
            orders={pendingOrders} 
            onAccept={(id) => console.log('Accept', id)} 
            onDecline={(id) => console.log('Decline', id)} 
          />
        ) : (
          <ActiveDeliveries 
            orders={activeOrders} 
            onSelectOrder={(order) => console.log('Select', order)} 
          />
        )}
      </div>
    </div>
  );
}