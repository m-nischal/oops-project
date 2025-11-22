// src/pages/wholesaler/orders.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import WholesalerLayout from '../../components/WholesalerLayout';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';

// Helper to format currency
const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

// --- MODIFIED: Removed delivery stages from manual selection ---
const settableStatuses = [
  "processing", "shipped", "cancelled"
];

// --- MODIFIED: Added out_for_delivery to final statuses to prevent editing once shipped/picked up ---
const finalStatuses = ["out_for_delivery", "delivered", "cancelled", "refunded"];
const ORDERS_PER_PAGE = 10;

export default function WholesalerOrdersPage() {
  const { isLoading: isAuthLoading } = useAuthGuard("WHOLESALER");
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Analytics Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRetailerEmail, setSelectedRetailerEmail] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);

  useEffect(() => {
    if (isAuthLoading) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authorization token found.");

        const authHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const res = await fetch(
          `/api/wholesaler/orders?page=${page}&limit=${ORDERS_PER_PAGE}&sort=createdAt:desc`, 
          { headers: authHeaders }
        );
        
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || 'Failed to fetch orders');
        }
        const data = await res.json();
        setOrders(data.items);
        setTotalOrders(data.total);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page, isAuthLoading]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(`/api/wholesaler/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update status");
      }
      const { order: updatedOrder } = await res.json();
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? updatedOrder : order
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Open modal and fetch analytics
  const handleRetailerClick = async (retailerEmail) => {
    if (!retailerEmail) return;
    
    setIsModalOpen(true);
    setIsModalLoading(true);
    setSelectedRetailerEmail(retailerEmail);
    setAnalyticsData(null); 

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(
        `/api/wholesaler/retailer-analytics?retailerEmail=${encodeURIComponent(retailerEmail)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch analytics");
      }
      
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsModalLoading(false);
    }
  };

  if (isAuthLoading) {
    return <WholesalerLayout><div className="p-10">Loading...</div></WholesalerLayout>;
  }

  return (
    <WholesalerLayout>
      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
          <CardDescription>
            Here are all the orders placed by retailers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          
          {error && !isModalOpen && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Retailer</TableHead> {/* RENAMED */}
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Update Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length > 0 ? (
                    orders.map(order => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">#{order._id.slice(-6)}</TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => handleRetailerClick(order.customer?.email)}
                          >
                            {order.customer?.name}
                          </Button>
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={order.status === 'delivered' ? 'default' : 'secondary'}
                            className={
                              order.status === 'delivered' ? 'bg-green-600 text-white' :
                              (order.status === 'cancelled' || order.status === 'refunded' ? 'bg-red-600 text-white' : 'bg-gray-500 text-white')
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {updatingStatus === order._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) => handleStatusChange(order._id, newStatus)}
                              disabled={finalStatuses.includes(order.status)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Change status..." />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Always show current status even if locked/hidden from choices */}
                                {!settableStatuses.includes(order.status) && (
                                   <SelectItem value={order.status} disabled>
                                     {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                                   </SelectItem>
                                )}
                                {settableStatuses.map(status => (
                                  <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(order.total)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="6" className="text-center text-muted-foreground">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                      className={page === 1 ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}
                      className={page >= totalPages ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>
      
      <RetailerAnalyticsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLoading={isModalLoading}
        data={analyticsData}
        error={isModalOpen ? error : null}
      />
    </WholesalerLayout>
  );
}

function RetailerAnalyticsModal({ isOpen, onClose, isLoading, data, error }) {
  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Retailer Analytics</DialogTitle>
          <DialogDescription>
            Order history for {data?.retailerName || "this retailer"}.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(data.totalSpent)}</div>
                  <p className="text-xs text-muted-foreground">(from delivered orders)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totalOrders}</div>
                  <p className="text-xs text-muted-foreground"> (all-time)</p>
                </CardContent>
              </Card>
            </div>
            
            <h4 className="font-medium">Recent Order History</h4>
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map(order => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">#{order._id.slice(-6)}</TableCell>
                      <TableCell>
                        <Badge variant={["delivered", "cancelled", "refunded"].includes(order.status) ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(order.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
      </DialogContent>
    </Dialog>
  );
}