import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomerNavbar from '@/components/CustomerNavbar';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, ChevronRight, AlertCircle, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

// Helper to get status color and icon
const getStatusConfig = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
  if (s === 'cancelled' || s === 'refunded') return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
  if (s === 'shipped' || s === 'out_for_delivery') return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck };
  return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock }; // processing, ordered, etc.
};

const Breadcrumbs = () => (
  <nav className="flex items-center text-sm text-gray-500 mb-8">
    <Link href="/" className="hover:text-black transition-colors">Home</Link>
    <ChevronRight className="h-4 w-4 mx-2" />
    <Link href="/profile" className="hover:text-black transition-colors">Profile</Link>
    <ChevronRight className="h-4 w-4 mx-2" />
    <span className="font-semibold text-black">Orders</span>
  </nav>
);

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
             router.replace('/login');
             return;
        }

        const res = await fetch('/api/orders', {
           headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            router.replace('/login');
            return;
        }

        if (!res.ok) {
             throw new Error("Failed to load orders");
        }

        const data = await res.json();
        setOrders(data.items || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <>
        <CustomerNavbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <CustomerNavbar />
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Breadcrumbs />
        
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
           <Package className="h-8 w-8" /> Order History
        </h1>

        {error && (
           <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100 mb-6">
               <AlertCircle className="h-5 w-5" /> {error}
           </div>
        )}

        {orders.length === 0 && !error ? (
           <div className="text-center py-24 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Package className="h-10 w-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">No orders yet</h2>
              <p className="text-gray-500 mt-2 mb-8 max-w-xs mx-auto">Looks like you haven't placed any orders yet. Start shopping to fill this up!</p>
              <Link href="/">
                  <Button className="rounded-full px-8 h-12 text-base bg-black hover:bg-gray-800">Start Shopping</Button>
              </Link>
           </div>
        ) : (
           <div className="space-y-6">
              {orders.map((order) => {
                 const { color, icon: StatusIcon } = getStatusConfig(order.status);
                 
                 return (
                 <Card key={order._id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
                    {/* Card Header */}
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-5 px-6">
                       <div className="flex flex-col md:flex-row justify-between gap-4">
                          
                          {/* Metadata Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm flex-1">
                             <div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Order Placed</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                             </div>
                             <div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total</p>
                                <p className="font-medium text-gray-900">{formatPrice(order.total)}</p>
                             </div>
                             <div className="col-span-2 md:col-span-1">
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Order #</p>
                                <p className="font-mono text-gray-700 text-xs bg-white border px-2 py-1 rounded inline-block">{order._id.slice(-8).toUpperCase()}</p>
                             </div>
                          </div>
                          
                          {/* Actions & Status */}
                          <div className="flex items-start md:items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                             <Badge className={`px-3 py-1 border ${color} hover:${color} flex items-center gap-1.5`}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                <span className="capitalize">{order.status.replace(/_/g, ' ')}</span>
                             </Badge>
                             
                             <Link href={`/order/${order._id}`}>
                                <Button variant="outline" size="sm" className="h-9 rounded-lg border-gray-300 text-gray-700 hover:bg-white hover:border-black transition-colors">
                                    View Order
                                </Button>
                             </Link>
                          </div>
                       </div>
                    </CardHeader>
                    
                    {/* Card Content (Products) */}
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {order.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    {/* Image Placeholder */}
                                    <div className="h-20 w-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden">
                                        {/* If you had images in item data, use <img /> here. Falling back to icon. */}
                                        <Package className="h-8 w-8 text-gray-300" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex justify-between items-start gap-4">
                                            <p className="font-bold text-gray-900 text-base line-clamp-1">{item.name}</p>
                                            <p className="font-bold text-black shrink-0">{formatPrice(item.unitPrice)}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Size: <span className="font-medium text-gray-700">{item.sizeLabel}</span></p>
                                        <p className="text-sm text-gray-500">Qty: <span className="font-medium text-gray-700">{item.qty}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {order.items.length > 2 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-500 font-medium">
                                    + {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                                </p>
                            </div>
                        )}
                        
                        {/* Mobile-only 'View Details' link for clarity */}
                        <Link href={`/order/${order._id}`} className="md:hidden mt-6 block">
                             <Button variant="secondary" className="w-full rounded-xl bg-gray-100 text-black hover:bg-gray-200">View Full Details</Button>
                        </Link>
                    </CardContent>
                 </Card>
                 );
              })}
           </div>
        )}
      </main>
    </div>
  );
}