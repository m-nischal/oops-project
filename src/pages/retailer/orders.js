import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import RetailerLayout from '../../components/RetailerLayout';
import { useAuthGuard } from '../../hooks/useAuthGuard'; // Added Auth Guard
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
import { AlertTriangle, Loader2, Package, User,DollarSign } from "lucide-react";
import { Button } from '@/components/ui/button';

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

const settableStatuses = [
  "processing", "shipped", "out_for_delivery", "delivered", "cancelled"
];
const finalStatuses = ["delivered", "cancelled", "refunded"];
const ORDERS_PER_PAGE = 10;

export default function RetailerOrdersPage() {
  const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // --- NEW: Order Details Modal State ---
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Analytics Modal State (Existing)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState(null);
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
          `/api/retailer/orders?page=${page}&limit=${ORDERS_PER_PAGE}&sort=createdAt:desc`, 
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

      const res = await fetch(`/api/retailer/orders/${orderId}`, {
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

  // --- NEW: Handle opening order details modal ---
  const handleOrderClick = async (order) => {
    if (!order || !order._id) return;
    setIsDetailsModalOpen(true);
    setSelectedOrderDetails(null); // Clear previous details
    setIsModalLoading(true);
    setError(null);

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/orders/${order._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
             const errData = await res.json();
             throw new Error(errData.error || 'Failed to fetch order details');
        }
        const data = await res.json();
        setSelectedOrderDetails(data);
    } catch (err) {
        console.error(err);
        setError(err.message);
        setSelectedOrderDetails(order); // Fallback to basic data
    } finally {
        setIsModalLoading(false);
    }
  };
  // --- END NEW ---

  // Handle Customer Analytics (Existing logic updated to use new modal state)
  const handleCustomerClick = async (customerEmail) => {
    if (!customerEmail) return;
    setIsAnalyticsModalOpen(true);
    setIsModalLoading(true);
    setSelectedCustomerEmail(customerEmail);
    setAnalyticsData(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(
        `/api/retailer/customer-analytics?customerEmail=${encodeURIComponent(customerEmail)}`,
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
    return <RetailerLayout><div className="p-10">Loading...</div></RetailerLayout>;
  }

  return (
    <RetailerLayout>
      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
          <CardDescription>
            Here are all the orders placed for your products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          
          {error && !isAnalyticsModalOpen && ( // Only show main error if analytics modal isn't open
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
                    <TableHead>Order ID</TableHead> {/* MADE CLICKABLE FOR DETAILS */}
                    <TableHead>Customer</TableHead> {/* MADE CLICKABLE FOR ANALYTICS */}
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
                        <TableCell className="font-medium">
                           {/* --- CLICKABLE ORDER ID --- */}
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-semibold"
                            onClick={() => handleOrderClick(order)}
                          >
                            #{order._id.slice(-6)}
                          </Button>
                        </TableCell>
                        <TableCell>
                           {/* --- CLICKABLE CUSTOMER NAME FOR ANALYTICS --- */}
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm"
                            onClick={() => handleCustomerClick(order.customer?.email)}
                            title={`View lifetime analytics for ${order.customer?.name}`}
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

              {/* --- DEBUG INFO (Remove later if needed) --- */}
              <div className="mt-4 text-xs text-gray-500">
                Showing {orders.length} of {totalOrders} total orders. Page {page} of {totalPages}.
              </div>

              {/* --- PAGINATION CONTROLS --- */}
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
      
      {/* Existing Analytics Modal */}
      <CustomerAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => { setIsAnalyticsModalOpen(false); setError(null); }}
        isLoading={isModalLoading}
        data={analyticsData}
        error={isAnalyticsModalOpen ? error : null}
      />

      {/* --- NEW: Order Details Modal --- */}
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => { setIsDetailsModalOpen(false); setError(null); }}
        isLoading={isModalLoading}
        order={selectedOrderDetails}
        error={isDetailsModalOpen ? error : null}
      />

    </RetailerLayout>
  );
}

// Existing Customer Analytics Modal (Moved outside component for cleanliness)
function CustomerAnalyticsModal({ isOpen, onClose, isLoading, data, error }) {
  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;
  const finalStatuses = ["delivered", "cancelled", "refunded"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customer Analytics</DialogTitle>
          <DialogDescription>
            Order history for {data?.customerName || "this customer"}.
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
                        <Badge variant={finalStatuses.includes(order.status) ? 'default' : 'secondary'}>
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

// --- NEW COMPONENT: Order Details Modal ---
function OrderDetailsModal({ isOpen, onClose, isLoading, order, error }) {
  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;
  const formatDate = (d) => d ? new Date(d).toLocaleString() : 'N/A';
  
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details #{order._id?.slice(-6)}</DialogTitle>
          <DialogDescription>
            Detailed view of the order placed by {order.customer?.name}.
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

        {!isLoading && order && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            
            {/* Customer Info */}
            <Card className="col-span-1 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center"><User className="h-4 w-4 mr-2"/>Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Name:</strong> {order.customer?.name}</p>
                <p><strong>Email:</strong> {order.customer?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {order.customer?.phone || 'N/A'}</p>
                <p><strong>Address:</strong> {order.customer?.address || 'N/A'}</p>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="col-span-1 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center"><DollarSign className="h-4 w-4 mr-2"/>Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Status:</strong> <Badge className="ml-1">{order.status}</Badge></p>
                <p><strong>Placed:</strong> {formatDate(order.createdAt)}</p>
                <p><strong>Subtotal:</strong> {formatPrice(order.subtotal)}</p>
                <p><strong>Total:</strong> <span className="font-bold">{formatPrice(order.total)}</span></p>
              </CardContent>
            </Card>
            
            {/* Delivery/Fulfillment */}
             <Card className="col-span-1 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center"><Package className="h-4 w-4 mr-2"/>Delivery</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>ETA:</strong> {formatDate(order.estimatedDelivery)}</p>
                <p><strong>Shipped At:</strong> {formatDate(order.shippedAt)}</p>
                <p><strong>Delivered At:</strong> {formatDate(order.deliveredAt)}</p>
                <p><strong>Tracking:</strong> {order.fulfillment?.trackingNumber || 'N/A'}</p>
              </CardContent>
            </Card>


            {/* Items Table */}
            <div className="col-span-full">
              <h4 className="font-semibold mb-2">Items Ordered ({order.items?.length || 0})</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.sizeLabel}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right font-semibold">{formatPrice(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Status History */}
            <div className="col-span-full">
                <h4 className="font-semibold mb-2">Status History</h4>
                <ol className="relative border-l border-gray-200 ml-3">
                    {order.statusHistory?.map((history, index) => (
                        <li className="mb-4 ml-4" key={index}>
                            <div className="absolute w-3 h-3 bg-gray-400 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                            <time className="mb-1 text-xs font-normal leading-none text-gray-400">{formatDate(history.at)}</time>
                            <h3 className="text-sm font-semibold text-gray-900 capitalize">{history.status}</h3>
                            <p className="text-xs text-gray-500">{history.note}</p>
                        </li>
                    )).reverse()} {/* Show latest status first */}
                </ol>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}