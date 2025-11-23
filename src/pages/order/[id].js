// src/pages/order/[id].js
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import CustomerNavbar from "@/components/CustomerNavbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ChevronRight,
  MapPin,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Store,
  Star,
  Phone,
  Mail,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

// --- HELPERS ---
const formatPrice = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_STEPS = [
  "ordered",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const getStatusIndex = (status) => {
  if (!status) return 0;
  if (status === "cancelled" || status === "refunded") return -1;
  return STATUS_STEPS.indexOf(status.toLowerCase());
};

const getStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "delivered")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 text-sm">
        <CheckCircle className="w-3 h-3 mr-1" /> Delivered
      </Badge>
    );
  if (s === "cancelled")
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1 text-sm">
        <XCircle className="w-3 h-3 mr-1" /> Cancelled
      </Badge>
    );
  if (s === "shipped" || s === "out_for_delivery")
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 text-sm">
        <Truck className="w-3 h-3 mr-1" /> On the way
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1 text-sm">
      <Clock className="w-3 h-3 mr-1" /> {s.replace(/_/g, " ")}
    </Badge>
  );
};

// NEW HELPER: Fetch review content (relying on updated API)
const fetchReviewContent = async (type, targetId) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const res = await fetch(`/api/reviews/check?type=${type}&targetId=${targetId}`, { headers });
    if (res.ok) {
      const data = await res.json();
      return data.review || null;
    }
  } catch (e) {
    console.error(`Failed to fetch ${type} review content:`, e);
  }
  return null;
};


export default function OrderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [retailer, setRetailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NEW STATE: Cancellation UI ---
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  // --- FIX 1: New state for success modal ---
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  // ------------------------------------

  // --- NEW STATE: Review Data Cache ---
  const [productReviewData, setProductReviewData] = useState(null);
  const [retailerReviewData, setRetailerReviewData] = useState(null);
  // ------------------------------------

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewType, setReviewType] = useState("product");
  const [reviewTargetId, setReviewTargetId] = useState(null);
  const [reviewTargetName, setReviewTargetName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Overwrite Logic State
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [showOverwriteAlert, setShowOverwriteAlert] = useState(false);

  // Augment fetchOrderData to get review status/content
  const fetchOrderData = useCallback(
    async (isSilent = false) => {
      if (!id) return;
      if (!isSilent) setLoading(true);
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const res = await fetch(`/api/orders/${id}`, { headers });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Order not found");

        const data = await res.json();
        const orderData = data.order || data;
        setOrder(orderData);

        if (orderData.sellerId) {
          try {
            const userRes = await fetch(`/api/public/user/${orderData.sellerId}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              setRetailer(userData);
            }
          } catch (err) {
            console.error("Retailer fetch failed", err);
          }
        }

        // --- NEW: Fetch Review Content on Load if Delivered ---
        const isDelivered = orderData.status === "delivered";
        const firstItem = orderData.items?.[0];

        if (isDelivered && firstItem) {
            // Fetch both in parallel
            const [productReview, retailerReview] = await Promise.all([
                fetchReviewContent("product", firstItem.productId),
                fetchReviewContent("retailer", orderData.sellerId),
            ]);
            setProductReviewData(productReview);
            setRetailerReviewData(retailerReview);
        } else {
            setProductReviewData(null);
            setRetailerReviewData(null);
        }
        // ----------------------------------------------------

      } catch (e) {
        setError(e.message);
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [id, router]
  );

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);
  
  // --- NEW: Handle Cancellation ---
  const handleConfirmCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    setShowCancelAlert(false);
    
    try {
        const token = localStorage.getItem("token");
        
        // Use PATCH /api/orders/[id] to update status
        const res = await fetch(`/api/orders/${order._id}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status: 'cancelled' }) // API will infer restoreStock: true
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to cancel order.");
        }
        
        // --- FIX 2: Show success modal instead of alert ---
        setShowCancelSuccessModal(true);
        // Re-fetch to update status and potentially clear review buttons
        fetchOrderData(true); 

    } catch (e) {
        setError(e.message);
    } finally {
        setIsCancelling(false);
    }
  };


  // Updated openReviewModal to use the fetched data for pre-population
  const openReviewModal = async (type, id, name) => {
    setReviewType(type);
    setReviewTargetId(id);
    setReviewTargetName(name);
    setReviewRating(5);
    setReviewComment("");
    setHasExistingReview(false);
    
    let existingData = type === 'product' ? productReviewData : retailerReviewData;

    // Use fetched data if available
    if (existingData) {
        setReviewRating(existingData.rating);
        setReviewComment(existingData.comment);
        setHasExistingReview(true); 
    }

    setIsReviewModalOpen(true);
  };

  const performReviewSubmit = async () => {
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        reviewType === "product"
          ? "/api/reviews/product"
          : "/api/reviews/retailer";
      const body = {
        rating: reviewRating,
        comment: reviewComment,
        [reviewType === "product" ? "productId" : "retailerId"]: reviewTargetId,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to submit review");

      alert(
        `${
          reviewType === "product" ? "Product" : "Retailer"
        } review submitted successfully!`
      );
      setIsReviewModalOpen(false);
      setShowOverwriteAlert(false);
      
      // --- CRITICAL: After successful submission, re-fetch and update cache ---
      const freshReview = await fetchReviewContent(reviewType, reviewTargetId);
      if (reviewType === 'product') setProductReviewData(freshReview);
      if (reviewType === 'retailer') setRetailerReviewData(freshReview);
      // -----------------------------------------------------------------

    } catch (e) {
      alert(e.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleInitialSubmit = () => {
    // Determine if review exists based on cached data
    const existing = reviewType === 'product' ? productReviewData : retailerReviewData;
    if (existing) {
      setShowOverwriteAlert(true);
    } else {
      performReviewSubmit();
    }
  };

  if (loading && !order)
    return (
      <>
        <CustomerNavbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  if (error || !order)
    return (
      <>
        <CustomerNavbar />
        <div className="max-w-4xl mx-auto p-10 text-center">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-flex items-center gap-2 mb-6">
            <AlertCircle className="h-5 w-5" /> {error || "Order not found"}
          </div>
          <br />
          <Link href="/orders">
            <Button variant="outline">Return to Order History</Button>
          </Link>
        </div>
      </>
    );

  const currentStepIndex = getStatusIndex(order.status);
  // Determine final status types
  const isCancelledOrRefunded = order.status === "cancelled" || order.status === "refunded";
  const isCancelledOrFinal =
    isCancelledOrRefunded || order.status === "delivered";
  const isDelivered = order.status === "delivered";
  const isShipped = order.status === "shipped" || order.status === "out_for_delivery";
  
  // Determine if cancellation is allowed
  // Allow cancellation if not in a final state and not shipped/out for delivery
  const isCancellable = !isCancelledOrFinal && !isShipped; 
  
  const firstItem = order.items?.[0];

  // --- MODIFIED: Product Review Action Card Component ---
  const ProductReviewActionCard = ({ isDelivered, isCancelled }) => {
    // Note: The review data access logic for `productReviewData` is outside this component and relies on global scope access.
    const isProductReviewed = !!productReviewData; 
    
    if (!firstItem) return null;
    
    const itemTargetId = firstItem.productId;
    const itemTargetName = firstItem.name;
    const reviewText = isProductReviewed ? 'Edit Product Review' : 'Write Product Review';

    return (
      <Card className="border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-start gap-2">
             <Star className="h-5 w-5 text-yellow-500 fill-yellow-400 shrink-0" />
             <span className="leading-tight">{itemTargetName}</span>
          </CardTitle>
          <CardDescription>
             Review your recently received product.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isCancelled ? ( 
             <Button
                variant="destructive"
                size="sm"
                className="h-9 text-sm w-full border-dashed text-red-500 cursor-not-allowed"
                disabled
             >
                Order Cancelled
             </Button>
          ) : isDelivered ? (
             <>
                 <Button
                    variant={isProductReviewed ? "default" : "outline"}
                    size="sm"
                    className="h-9 text-sm w-full"
                    onClick={() => openReviewModal("product", itemTargetId, itemTargetName)}
                 >
                    {reviewText}
                 </Button>
             </>
          ) : (
            <Button
                variant="outline"
                size="sm"
                className="h-9 text-sm w-full border-dashed text-gray-500 cursor-not-allowed"
                disabled
            >
                Review available after delivery
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  // --- MODIFIED: Retailer Review Action Card Component ---
  const RetailerReviewActionCard = ({ isDelivered, isCancelled }) => {
    // Note: The review data access logic for `retailerReviewData` relies on global scope access.
    const isRetailerReviewed = !!retailerReviewData;
    
    if (!retailer) return null;
    
    const retailerTargetId = order.sellerId;
    const retailerTargetName = retailer.name;
    const reviewText = isRetailerReviewed ? 'Edit Seller Review' : 'Rate Seller';
    
    const currentRating = retailer.rating || 0.0;
    const currentReviewCount = retailer.reviewCount || 0;

    return (
        <Card className="border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5 text-gray-700" />
                {retailerTargetName}
              </CardTitle>
              <CardDescription>
                  Sold by this retailer. Rate your experience below.
              </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
              
              {/* RETAILER DETAILS */}
              <div className="space-y-3">
                  <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                          <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.round(currentRating)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                            }`}
                        />
                    ))}
                    <span className="text-xs text-gray-500 font-medium ml-1">
                        {currentRating.toFixed(1)} ({currentReviewCount} reviews)
                    </span>
                </div>
                
                {(retailer.email || retailer.phone) && (
                    <div className="space-y-1">
                        {retailer.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4 text-gray-400" /> <span>{retailer.phone}</span>
                            </div>
                        )}
                        {retailer.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4 text-gray-400" /> <span>{retailer.email}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Separator className="bg-gray-100"/>
            
            {/* REVIEW ACTION BUTTON */}
            {isCancelled ? ( // Check if cancelled
                 <Button
                    variant="destructive"
                    size="sm"
                    className="h-9 text-sm w-full border-dashed text-red-500 cursor-not-allowed"
                    disabled
                 >
                    Order Cancelled
                 </Button>
            ) : isDelivered ? (
                <>
                    <Button
                        variant={isRetailerReviewed ? "default" : "outline"}
                        size="sm"
                        className="h-9 text-sm w-full"
                        onClick={() => openReviewModal("retailer", retailerTargetId, retailerTargetName)}
                    >
                        {reviewText}
                    </Button>
                </>
            ) : (
                <Button 
                    variant="outline"
                    size="sm"
                    className="h-9 text-sm w-full border-dashed text-gray-500 cursor-not-allowed"
                    disabled
                >
                    Review available after delivery
                </Button>
            )}
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <CustomerNavbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href="/orders" className="hover:text-black transition-colors">Orders</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="font-semibold text-black">#{order._id.slice(-6).toUpperCase()}</span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Order Details</h1>
            <p className="text-gray-500 text-sm mt-1">Order ID: <span className="font-mono text-black font-medium">#{order._id}</span> • Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-4">
             {getStatusBadge(order.status)}
             {/* --- NEW: CANCEL BUTTON --- */}
             {isCancellable && (
                 <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCancelAlert(true)}
                    disabled={isCancelling}
                    className="h-9 rounded-lg"
                 >
                    {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Cancel Order
                 </Button>
             )}
             {/* --------------------------- */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Timeline & Items & Shipping Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline Card */}
            {!isCancelledOrFinal && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-8">
                  <div className="relative flex justify-between items-center">
                    <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 -z-0">
                      <div
                        className="h-full bg-black transition-all duration-500"
                        style={{
                          width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%`,
                        }}
                      />
                    </div>
                    {STATUS_STEPS.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      return (
                        <div
                          key={step}
                          className="flex flex-col items-center gap-2 z-10"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                              isCompleted
                                ? "bg-black border-black text-white"
                                : "bg-white border-gray-200 text-gray-300"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <div className="h-2 w-2 bg-gray-200 rounded-full" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isCurrent ? "text-black" : "text-gray-400"
                            }`}
                          >
                            {step.replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items List */}
            <Card className="border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                    <CardTitle className="text-lg">Items in this Order</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {order.items.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex gap-4 p-6 border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors items-center cursor-pointer group"
                            onClick={() => router.push(`/product/${item.productId}`)}
                        >
                            <div className="h-24 w-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                                <Package className="h-8 w-8 text-gray-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-base text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                                    <p className="font-bold text-lg">{formatPrice(item.unitPrice)}</p>
                                </div>
                                <p className="text-sm text-gray-500">Size: <span className="font-medium text-black">{item.sizeLabel}</span> | Qty: <span className="font-medium text-black">{item.qty}</span></p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors md:hidden" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Shipping & Payment Details */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/30">
                <CardTitle className="text-lg">Shipping & Payment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Address Section */}
                  <div className="flex gap-4">
                    <div className="bg-blue-50 p-2.5 rounded-xl h-fit border border-blue-100">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                        Delivery Address
                      </p>
                      <p className="font-bold text-sm text-gray-900">
                        {order.customer?.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {order.customer?.address}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.customer?.phone}
                      </p>
                    </div>
                  </div>

                  {/* Payment Section */}
                  <div className="flex gap-4">
                    <div className="bg-green-50 p-2.5 rounded-xl h-fit border border-green-100">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                        Payment Method
                      </p>
                      <p className="font-bold text-sm text-gray-900">
                        {order.payment?.method || "Cash on Delivery"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.payment?.paidAt ? (
                          <span className="text-green-600 flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Paid on{" "}
                            {new Date(
                              order.payment.paidAt
                            ).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Payment Pending /
                            COD
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Summary & Review Cards */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-medium">
                    {order.shipping > 0 ? formatPrice(order.shipping) : "Free"}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-black text-xl">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* --- REVIEW CARDS --- */}
            <RetailerReviewActionCard isDelivered={isDelivered} isCancelled={isCancelledOrRefunded} />
            <ProductReviewActionCard isDelivered={isDelivered} isCancelled={isCancelledOrRefunded} />
            {/* -------------------- */}
          </div>
        </div>
      </main>
      
      {/* --- CANCEL ORDER CONFIRMATION ALERT --- */}
      <AlertDialog
        open={showCancelAlert}
        onOpenChange={setShowCancelAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Confirm Cancellation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action will restore 
              the product stock and cannot be undone.
              {isShipped && (
                  <p className="mt-2 text-sm font-semibold text-red-700">
                      Note: This order has already shipped. Cancellation may not be possible 
                      and you may still be charged a cancellation fee by the seller.
                  </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelAlert(false)} disabled={isCancelling}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- FIX 3: NEW CANCELLATION SUCCESS DIALOG (POPUP) --- */}
      <Dialog open={showCancelSuccessModal} onOpenChange={setShowCancelSuccessModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-2">
                <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <DialogTitle className="text-2xl">Order Cancelled!</DialogTitle>
            <DialogDescription className="text-gray-600">
              Your order has been successfully cancelled. Stock will be restored shortly.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button onClick={() => setShowCancelSuccessModal(false)} className="w-full bg-black hover:bg-gray-800">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* REVIEW MODAL (Uses reviewRating/reviewComment for pre-population) */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate & Review</DialogTitle>
            <DialogDescription>
              Share your experience with <strong>{reviewTargetName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer transition-all ${
                  star <= reviewRating
                    ? "text-yellow-400 fill-yellow-400 scale-110"
                    : "text-gray-300 hover:text-yellow-200"
                }`}
                onClick={() => setReviewRating(star)}
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Your Comments
            </label>
            <Textarea
              placeholder={
                reviewType === "product"
                  ? "How is the quality? Does it fit well?"
                  : "How was the packaging? Was the delivery fast?"
              }
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInitialSubmit}
              disabled={isSubmittingReview}
              className="bg-black text-white"
            >
              {isSubmittingReview ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              {hasExistingReview ? "Update Review" : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OVERWRITE CONFIRMATION ALERT */}
      <AlertDialog
        open={showOverwriteAlert}
        onOpenChange={setShowOverwriteAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Review?</AlertDialogTitle>
            <AlertDialogDescription>
              You have already reviewed this {reviewType}. Submitting a new
              review will overwrite your previous rating and comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowOverwriteAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performReviewSubmit}
              className="bg-black text-white"
            >
              Yes, Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- MODIFIED: Product Review Action Card Component ---
const ProductReviewActionCard = ({ isDelivered, isCancelled }) => {
  const router = useRouter();
  // Rely on outer component's state to check product details
  const order = router.query.order; // Mock order to access items/productReviewData
  const firstItem = order?.items?.[0];

  if (!firstItem) return null;
  
  // These variables are now assumed to be passed/available in the outer scope
  const isProductReviewed = !!productReviewData;
  const itemTargetId = firstItem.productId;
  const itemTargetName = firstItem.name;
  const reviewText = isProductReviewed ? 'Edit Product Review' : 'Write Product Review';

  return (
    <Card className="border-gray-200 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-start gap-2">
             <Star className="h-5 w-5 text-yellow-500 fill-yellow-400 shrink-0" />
             <span className="leading-tight">{itemTargetName}</span>
        </CardTitle>
        <CardDescription>
             Review your recently received product.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
          {isCancelled ? ( 
             <Button
                variant="destructive"
                size="sm"
                className="h-9 text-sm w-full border-dashed text-red-500 cursor-not-allowed"
                disabled
             >
                Order Cancelled
             </Button>
          ) : isDelivered ? (
             <>
                 <Button
                    variant={isProductReviewed ? "default" : "outline"}
                    size="sm"
                    className="h-9 text-sm w-full"
                    onClick={() => openReviewModal("product", itemTargetId, itemTargetName)}
                 >
                    {reviewText}
                 </Button>
             </>
          ) : (
            <Button
                variant="outline"
                size="sm"
                className="h-9 text-sm w-full border-dashed text-gray-500 cursor-not-allowed"
                disabled
            >
                Review available after delivery
            </Button>
          )}
      </CardContent>
    </Card>
  );
};

// --- MODIFIED: Retailer Review Action Card Component ---
const RetailerReviewActionCard = ({ isDelivered, isCancelled }) => {
  const router = useRouter();
  const isRetailerReviewed = !!retailerReviewData;
  // Assume retailer and order/sellerId are available in outer scope via closures
  const retailerTargetId = order?.sellerId;
  const retailerTargetName = retailer?.name;
  const reviewText = isRetailerReviewed ? 'Edit Seller Review' : 'Rate Seller';
  
  const currentRating = retailer?.rating || 0.0;
  const currentReviewCount = retailer?.reviewCount || 0;

  return (
      <Card className="border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-gray-700" />
              {retailerTargetName}
            </CardTitle>
            <CardDescription>
                Sold by this retailer. Rate your experience below.
            </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
            
            {/* RETAILER DETAILS */}
            <div className="space-y-3">
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(currentRating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                        />
                    ))}
                    <span className="text-xs text-gray-500 font-medium ml-1">
                        {currentRating.toFixed(1)} ({currentReviewCount} reviews)
                    </span>
                </div>
                
                {(retailer?.email || retailer?.phone) && (
                    <div className="space-y-1">
                        {retailer.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4 text-gray-400" /> <span>{retailer.phone}</span>
                            </div>
                        )}
                        {retailer.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4 text-gray-400" /> <span>{retailer.email}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Separator className="bg-gray-100"/>
            
            {/* REVIEW ACTION BUTTON */}
            {isCancelled ? ( // Check if cancelled
                 <Button
                    variant="destructive"
                    size="sm"
                    className="h-9 text-sm w-full border-dashed text-red-500 cursor-not-allowed"
                    disabled
                 >
                    Order Cancelled
                 </Button>
            ) : isDelivered ? (
                <>
                    <Button
                        variant={isRetailerReviewed ? "default" : "outline"}
                        size="sm"
                        className="h-9 text-sm w-full"
                        onClick={() => openReviewModal("retailer", retailerTargetId, retailerTargetName)}
                    >
                        {reviewText}
                    </Button>
                </>
            ) : (
                <Button 
                    variant="outline"
                    size="sm"
                    className="h-9 text-sm w-full border-dashed text-gray-500 cursor-not-allowed"
                    disabled
                >
                    Review available after delivery
                </Button>
            )}
        </CardContent>
      </Card>
  );
};