import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RetailerLayout from '@/components/RetailerLayout';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, AlertCircle, CheckCircle, XCircle, Truck, Clock } from 'lucide-react';

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

const getStatusConfig = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
  if (s === 'cancelled' || s === 'refunded') return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
  if (s === 'shipped' || s === 'out_for_delivery') return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck };
  return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
};

export default function RetailerPurchasesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const token = localStorage.getItem("token");
        if (!token) { router.replace('/login'); return; }

        // Reuse the /api/orders endpoint. 
        // Since we are logged in as a Retailer, this returns orders where we are the 'userId' (Buyer).
        const res = await fetch('/api/orders', {
           headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) { router.replace('/login'); return; }
        if (!res.ok) throw new Error("Failed to load orders");

        const data = await res.json();
        setOrders(data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <RetailerLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </RetailerLayout>
    );
  }

  return (
    <RetailerLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
           <Package className="h-8 w-8" /> Purchase History
        </h1>

        {error && (
           <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100 mb-6">
               <AlertCircle className="h-5 w-5" /> {error}
           </div>
        )}

        {orders.length === 0 && !error ? (
           <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-10 w-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">No purchases yet</h2>
              <p className="text-gray-500 mt-2 mb-8">You haven't stocked any products from wholesalers yet.</p>
              <Link href="/retailer/stock">
                  <Button className="rounded-full px-8 h-12 text-base bg-black hover:bg-gray-800">Browse Wholesale Market</Button>
              </Link>
           </div>
        ) : (
           <div className="space-y-6">
              {orders.map((order) => {
                 const { color, icon: StatusIcon } = getStatusConfig(order.status);
                 
                 return (
                 <Card key={order._id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-5 px-6">
                       <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm flex-1">
                             <div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Date</p>
                                <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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
                          <div className="flex items-start md:items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                             <Badge className={`px-3 py-1 border ${color} hover:${color} flex items-center gap-1.5`}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                <span className="capitalize">{order.status.replace(/_/g, ' ')}</span>
                             </Badge>
                             <Link href={`/retailer/purchases/${order._id}`}>
                                <Button variant="outline" size="sm" className="h-9 rounded-lg">View Details</Button>
                             </Link>
                          </div>
                       </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {order.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <div className="h-20 w-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">
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
                                <p className="text-sm text-gray-500 font-medium">+ {order.items.length - 2} more items</p>
                            </div>
                        )}
                    </CardContent>
                 </Card>
                 );
              })}
           </div>
        )}
      </div>
    </RetailerLayout>
  );
}